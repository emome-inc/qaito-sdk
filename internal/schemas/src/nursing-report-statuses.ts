import { z } from "zod";

/** 報告書の提出の目安（対象月の翌月のこの日まで） */
export const NURSING_REPORT_DUE_DAY = 10;

/**
 * 報告書を開いたときの既定の対象月。提出の目安（翌月 10 日）までは前月、11 日からは今月。
 * `today` は JST の YYYY-MM-DD（`jstToday()`）。
 */
export function nursingReportDefaultMonth(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  if (d > NURSING_REPORT_DUE_DAY) return today.slice(0, 7);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export const listNursingReportStatusesQuerySchema = z.object({ facilityId: z.string().uuid(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
export type ListNursingReportStatusesQuery = z.infer<typeof listNursingReportStatusesQuerySchema>;

/** 段階。未作成 → 下書き → 確認済み → 発行済み → 完了（送付まで済み）。 */
export type NursingReportStage = "missing" | "draft" | "reviewed" | "issued" | "done";

/** 次の 1 手。下書きを作る / 確認する / 発行する / 送る。 */
export type NursingReportStep = "draft" | "review" | "issue" | "send";

/**
 * 止める確認事項の種類（設計 §2）。
 *   - `visit_records_unfinished` … 実績のある訪問に提出済みの記録書Ⅱが無い（`dates` = 該当の訪問日）。下書きを作る手を止める
 *   - `doctor_missing` … 主治医が未設定。発行を止める
 *   - `care_manager_missing` … ケアマネが未設定。発行を止める
 *   - `instruction_out_of_period` … 指示書の期間外の訪問がある（`dates` = 該当の訪問日）。発行を止める
 *   - `clinical_unreadable` … clinical-record の read が無く、記録・主治医・指示書を確かめられない。発行を止める
 */
export type NursingReportBlockerKind =
  | "visit_records_unfinished"
  | "doctor_missing"
  | "care_manager_missing"
  | "instruction_out_of_period"
  | "clinical_unreadable";

export type NursingReportBlocker = {
  kind: NursingReportBlockerKind;
  /** 止める手順 */
  blocks: "draft" | "issue";
  /** 該当の訪問日（YYYY-MM-DD・昇順） */
  dates?: string[];
  /** 該当の件数（dates があるときはその数） */
  count?: number;
};

export type NursingReportStatusRow = {
  clientId: string;
  clientName: string;
  visitDays: number;
  reportId: string | null;
  status: "missing" | "draft" | "issued";
  stage: NursingReportStage;
  /** 完了なら null */
  nextStep: NursingReportStep | null;
  /** 次の 1 手が止まっているか（止まる確認事項が `nextStep` を止めているか） */
  blocked: boolean;
  blockers: NursingReportBlocker[];
  hasCareManager: boolean;
  reviewedAt: string | null;
  doctorSentAt: string | null;
  careManagerSentAt: string | null;
  /** 今の版の番号（未作成は 1） */
  revision: number;
};

/** 訂正前の版の写し（送った版。読むだけ）。 */
export type NursingReportRevision = {
  revision: number;
  issuedAt: string | null;
  doctorSentAt: string | null;
  careManagerSentAt: string | null;
  supersededAt: string;
  /** 発行したときの中身すべて（各欄・day_marks・主治医・ケアマネ・extra_data） */
  snapshot: Record<string, unknown>;
};

/** `POST .../reports/:id/sent` の宛先。 */
export const nursingReportRecipients = ["doctor", "care_manager"] as const;
export type NursingReportRecipient = (typeof nursingReportRecipients)[number];
