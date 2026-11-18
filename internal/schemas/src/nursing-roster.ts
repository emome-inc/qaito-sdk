/**
 * nursing-roster — 訪問看護アプリの利用者一覧（名簿）の契約。
 *
 * 参照: 訪問看護（nursing・schedule の実装）
 *   主軸は利用者（client:read）。利用者ごとに「段階」と「次にやること」を 1 つ返す。
 *   段階・次にやることの導出は `@qaito/modules/nursing/pure` の `deriveNursingNextAction`
 *   （純関数。core が事実を集めて呼ぶ）。
 */
import { z } from "zod";
import type { ServiceDayTimes } from "./client-service-plans";

/** GET /nursing/roster の query */
export const listNursingRosterQuerySchema = z.object({
  /** 事業所コンテキスト（認可とは別軸の絞り込み）。省略で所属の全事業所 */
  contextFacilityId: z.string().uuid().optional(),
});
export type ListNursingRosterQuery = z.infer<typeof listNursingRosterQuerySchema>;

export const nursingRosterStages = ["preparing", "visiting", "paused", "ended"] as const;
export type NursingRosterStage = (typeof nursingRosterStages)[number];
export const nursingRosterStageLabels: Record<NursingRosterStage, string> = {
  preparing: "準備中",
  visiting: "訪問中",
  paused: "休止中",
  ended: "終了",
};

export const nursingNextActionKinds = [
  "none",
  "confirm_resume",
  "receive_instruction",
  "write_visit_records",
  "create_report",
  "issue_report",
  "create_intake",
  "finalize_intake",
  "create_plan",
  "finalize_plan",
  "renew_plan",
  "add_schedule",
  "request_instruction_renewal",
  "next_visit",
] as const;
export type NursingNextActionKind = (typeof nursingNextActionKinds)[number];

export type NursingNextAction = {
  kind: NursingNextActionKind;
  /** write_visit_records の件数 */
  count?: number;
  /** create_report / issue_report の対象月（YYYY-MM） */
  month?: string;
  /** request_instruction_renewal の期限・next_visit の訪問日（YYYY-MM-DD） */
  date?: string;
};

/** 次回訪問（今日以降で最初の訪問看護の予定） */
export type NursingRosterNextVisit = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  staffNames: string[];
};

/** 保険の区分（直近の訪問の判定 → 無ければ最新の計画書の区分。どちらも無ければ null） */
export const nursingRosterInsurances = ["kaigo_13", "kaigo_63", "iryo"] as const;
export type NursingRosterInsurance = (typeof nursingRosterInsurances)[number];
export const nursingRosterInsuranceLabels: Record<NursingRosterInsurance, string> = {
  kaigo_13: "介護保険",
  kaigo_63: "介護予防",
  iryo: "医療",
};

export type NursingRosterCareManager = {
  id: string;
  name: string;
  phone: string | null;
  officeId: string | null;
  officeName: string | null;
  officePhone: string | null;
};

export type NursingRosterDoctor = {
  doctorName: string | null;
  institutionId: string | null;
  institutionName: string | null;
  institutionPhone: string | null;
  /** 全国の共有の医療機関（マスタ管理に詳細ページが無い） */
  institutionShared: boolean;
  department: string | null;
};

export type NursingRosterPattern = {
  id: string; weekday: number; startTime: string; endTime: string | null;
  effectiveFrom: string; effectiveUntil: string | null;
  /** 月の第何週か（1〜5。毎週は 1〜5 全部） */
  monthWeeks: number[];
};

/**
 * 段階と次にやることを決めるための事実。**null = その情報を読む権限が無い**（判定から外す）。
 * core が 1 回のクエリで集め、`deriveNursingNextAction` に渡す。
 */
export type NursingRosterFacts = {
  /** `client.clients.status`（pending / active / suspended / hospitalized / withdrawn / trial） */
  clientStatus: string | null;
  /** 指示書: 今日時点で有効なものがあるか・一番先の期限（clinical-record:read） */
  instruction: { hasValid: boolean; latestValidUntil: string | null } | null;
  /** 記録書Ⅱが未入力・下書きの実施済み訪問の件数（過去 1 年。schedule:read） */
  missingVisitRecords: number | null;
  /** 前月以前（直近 3 か月）で、実施済みの訪問があるのに報告書が未作成・下書きの月（古い順。care-plan + schedule:read） */
  pendingReports: { month: string; status: "missing" | "draft" }[] | null;
  /** 記録書Ⅰ（care-plan:read） */
  intake: "none" | "draft" | "final" | null;
  /** 計画書（care-plan:read）。旧確認中は draft、approved / active / expired / revised は提出済み（active）にまとめる */
  plan: "none" | "draft" | "review" | "active" | "expired" | null;
  /** 今後の予定があるか（契約の曜日・訪問パターン・予定のどれか。client / schedule:read） */
  hasUpcoming: boolean | null;
  planFollowup?: { pending: boolean } | null;
  /** 次回訪問（schedule:read） */
  nextVisit: NursingRosterNextVisit | null;
};

export type NursingRosterRow = {
  id: string;
  client_number: string | null;
  family_name: string;
  given_name: string;
  family_name_kana: string;
  given_name_kana: string;
  status: string | null;
  gender: string | null;
  birth_date_v2: string | null;
  phone: string | null;
  mobile: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  /** 顔写真の版（アイコン用）。写真なし・`client:read` が無い人は null。 */
  face_photo_version: string | null;
  /** 訪問看護（13・63）の今の契約の利用曜日・提供時間（client）。訪問看護の契約が無ければ null */
  service_schedule: { days: number[] | null; startTime: string | null; endTime: string | null; dayTimes: ServiceDayTimes | null } | null;
  /** サービス開始日 = 訪問看護の今の契約の適用開始日（YYYY-MM-DD）。契約が無ければ null */
  service_start_date: string | null;
  /** 訪問パターン（schedule:read が無ければ空） */
  visit_patterns: NursingRosterPattern[];
  /** `care-plan:read` が無ければ null（列が空）。 */
  plan_count: number | null;
  /** 計画書・記録書Ⅰの対応状況。nullは閲覧権限なし。 */
  plan_followup?: { pending: boolean; status: "ready" | "not_due" | "missing" | "draft" | "review" | "overdue" | "contract_check" | "resume_check"; month: string | null } | null;
  document_status?: { plan: NursingRosterFacts["plan"]; intake: NursingRosterFacts["intake"] };
  /** 自モジュールの read が無ければ null（列が空）。 */
  has_clinical: boolean | null;
  /** `care-record:read` が無ければ null（列が空）。 */
  last_vital_date: string | null;

  stage: NursingRosterStage;
  next_action: NursingNextAction;
  /** 未対応の件数（記録書Ⅱの件数 + 報告書の月数 + 記録書Ⅰ・計画書・予定なしは 1） */
  pending_count: number;
  /** 判定に使う事実のどれかを読めなかった（セルに「一部の情報は表示権限がありません」） */
  partial_info: boolean;
  next_visit: NursingRosterNextVisit | null;
  /** 直近 3 回の実施済みの訪問看護（新しい順）。`schedule:read` が無ければ null */
  recent_visits: NursingRosterNextVisit[] | null;
  insurance: NursingRosterInsurance | null;
  /** 看護職員（看護師・准看護師）の最後の実施済みの訪問日（YYYY-MM-DD）。実施済みの看護の訪問が無い・`schedule:read` が無ければ null */
  last_nurse_visit_date: string | null;
  /** 今月（予定を含む）リハ職（PT・OT・ST）の訪問があるか。`schedule:read` が無ければ null。看護の訪問の空きの札の対象かどうか（判定は `nurseVisitGap`） */
  has_rehab_visit_in_month: boolean | null;
  /** `care-office:read` が無ければ null。担当が未設定なら `{ ... }` ではなく null（`can_care_office` で区別） */
  care_manager: NursingRosterCareManager | null;
  /** 主治医（`client_medical` の is_primary）。未登録なら null */
  doctor: NursingRosterDoctor | null;
};

export type NursingRoster = {
  clients: NursingRosterRow[];
  canClient: boolean;
  canPlan: boolean;
  canClinical: boolean;
  canVital: boolean;
  canSchedule: boolean;
  canCareOffice: boolean;
};

/** 次にやることの文（画面・ツールの表示用。`next_visit` は日時を呼ぶ側が足す） */
export function nursingNextActionLabel(action: NursingNextAction): string {
  const month = action.month ? `${Number(action.month.slice(5, 7))} 月の` : "";
  const until = action.date ? `${Number(action.date.slice(5, 7))}/${Number(action.date.slice(8, 10))}` : "";
  switch (action.kind) {
    case "none": return "";
    case "confirm_resume": return "再開を確認";
    case "receive_instruction": return "指示書を受け取る";
    case "write_visit_records": return `記録書Ⅱを書く ${action.count ?? 0} 件`;
    case "create_report": return `${month}報告書を作る`;
    case "issue_report": return `${month}報告書を発行する`;
    case "create_intake": return "記録書Ⅰを作る";
    case "finalize_intake": return "記録書Ⅰを確定する";
    case "create_plan": return "計画書を作る";
    case "finalize_plan": return "計画書を提出する";
    case "renew_plan": return "計画書を更新する";
    case "add_schedule": return "訪問予定を入れる";
    case "request_instruction_renewal": return `指示書の更新を依頼（${until} まで）`;
    case "next_visit": return "次回";
  }
}
