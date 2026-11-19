import { z } from "zod";

export const nursingServiceCategories = ["kaigo_hoken", "iryo_hoken"] as const;
export type NursingServiceCategory = (typeof nursingServiceCategories)[number];

export const nursingServiceCategoryLabels: Record<NursingServiceCategory, string> = {
  kaigo_hoken: "介護保険（訪問看護13/介護予防63）",
  iryo_hoken: "医療保険（訪問看護）",
};

export const nursingPtJointTypes = ["none", "joint1", "joint2"] as const;
export type NursingPtJointType = (typeof nursingPtJointTypes)[number];

export const nursingPtJointTypeLabels: Record<NursingPtJointType, string> = {
  none: "なし（看護職員のみ）",
  joint1: "PT/OT/ST 共同作成（区分1）",
  joint2: "PT/OT/ST 共同作成（区分2）",
};

export const nursingPlanStatuses = ["draft", "active"] as const;
export type NursingPlanStatus = (typeof nursingPlanStatuses)[number];
export const nursingPlanStatusLabels: Record<NursingPlanStatus, string> = {
  draft: "下書き",
  active: "提出済み",
};
/** 旧データの確認中は下書き、承認済み・期限切れ・改定済みは提出済みとして扱う。 */
export function normalizeNursingPlanStatus(status: string): NursingPlanStatus {
  return ["approved", "active", "expired", "revised"].includes(status) ? "active" : "draft";
}

export const nursingReportStatuses = ["draft", "issued"] as const;
export type NursingReportStatus = (typeof nursingReportStatuses)[number];

export const nursingReportStatusLabels: Record<NursingReportStatus, string> = {
  draft: "下書き",
  issued: "発行済（凍結）",
};

/**
 * AI が文案を作る欄（1 回の呼び出しでまとめて返させる）。値は `nursing_plan_reports` の列名（camelCase）。
 * 衛生材料等の使用量・種類・量の変更・情報提供は AI にしない（記録に無い数・事実を作らせない）。
 */
export const NURSING_REPORT_AI_FIELDS = ["conditionProgress", "nursingContent", "homeCareStatus", "memo"] as const;

export type NursingReportAiFieldKey = (typeof NURSING_REPORT_AI_FIELDS)[number];

export const nursingReportAiFieldLabels: Record<NursingReportAiFieldKey, string> = {
  conditionProgress: "病状の経過",
  nursingContent: "看護・リハビリテーションの内容",
  homeCareStatus: "家庭での介護の状況",
  memo: "特記すべき事項",
};

/**
 * AI に頼む本文の文字数。保存の上限は病状410字・看護/家庭220字・特記100字。
 * 病状は月内バイタル行をプログラムで先頭に追加するので、その実際の長さを差し引いて動的に予算を減らす。
 * 目安を超えて返った文は捨てず、看護師が編集し、保存時の上限とプレビューのはみ出し検知で確認する。
 */
export const NURSING_REPORT_AI_TARGET_CHARS: Record<NursingReportAiFieldKey, number> = {
  conditionProgress: 300,
  nursingContent: 200,
  homeCareStatus: 200,
  memo: 100,
};

/** 欄ごとの文の数の上限。字数を数えるのが苦手な AI に、字数と一緒に渡す（1 文およそ 50 字）。 */
export const NURSING_REPORT_AI_MAX_SENTENCES: Record<NursingReportAiFieldKey, number> = {
  conditionProgress: 6,
  nursingContent: 4,
  homeCareStatus: 4,
  memo: 2,
};

/** AI が「書くことが無い」と空で返してよい欄（記録に手がかりが無いことがある）。 */
export const NURSING_REPORT_AI_MAY_BE_EMPTY: ReadonlySet<NursingReportAiFieldKey> = new Set(["homeCareStatus", "memo"]);

/** 欄の由来。AI の文案のまま = `ai`・看護師が書き換えた欄 = `manual`。`extra_data.aiFields` に持つ。 */
export const nursingReportAiFieldSourceSchema = z.enum(["ai", "manual"]);
export type NursingReportAiFieldSource = z.infer<typeof nursingReportAiFieldSourceSchema>;
export type NursingReportAiFields = Partial<Record<NursingReportAiFieldKey, NursingReportAiFieldSource>>;

/**
 * AI の応答の形。4 欄とも文字列（特記すべき事項だけは空でよい）。**ここでは上限を見ない**
 * （上限を超えた欄だけを捨てて残りは使うため、欄ごとに `interpretNursingReportAiResponse` が見る）。
 */
export const nursingReportAiContentSchema = z.object({
  conditionProgress: z.string(),
  nursingContent: z.string(),
  homeCareStatus: z.string(),
  memo: z.string(),
});
export type NursingReportAiContent = z.infer<typeof nursingReportAiContentSchema>;

/** 1 行 = 1 看護問題（問題点 → 解決策 → 評価）。様式1 の中核。 */
export const nursingProblemRowSchema = z.object({
  problem: z.string().max(2000),
  solution: z.string().max(2000).optional(),
  evaluation: z.string().max(2000).optional(),
});
export type NursingProblemRow = z.infer<typeof nursingProblemRowSchema>;

export const nursingDayMarkSymbols = ["maru", "hishi", "sankaku", "batsu", "nijumaru", "shikaku"] as const;
export type NursingDayMarkSymbol = (typeof nursingDayMarkSymbols)[number];

export const nursingDayMarkLabels: Record<NursingDayMarkSymbol, string> = {
  maru: "○ 看護職員",
  hishi: "◇ PT等",
  sankaku: "△ 特別指示",
  batsu: "× 緊急",
  nijumaru: "◎ 1日2回以上",
  shikaku: "□ 長時間",
};

/** dayMarks の Zod（日付キー → 記号値。緩め検証・キー数は Zod では強制しない）*/
export const nursingDayMarksSchema = z.record(z.string(), z.enum(nursingDayMarkSymbols));
export type NursingDayMarks = z.infer<typeof nursingDayMarksSchema>;

/** 計画書の `print_details.plannedStaffTypes` の値。看護職員（看護師・准看護師・保健師）と、リハ職 3 種 */
export const nursingPlannedStaffTypes = ["nurse", "pt", "ot", "st"] as const;
export type NursingPlannedStaffType = (typeof nursingPlannedStaffTypes)[number];
/** 計画書の「訪問予定の職種」の初期値を読むクエリ（`GET /care-plan/nursing/visit-staff-types`）。期間はその計画書の期間 */
export type NursingPlanVisitStaffTypesQuery = { clientId: string; from: string; until: string };
/** その期間の予定・実績の担当の職種（看護師・准看護師は nurse にまとめる） */
export type NursingPlanVisitStaffTypes = { staffTypes: NursingPlannedStaffType[] };
export const nursingPlannedStaffTypeLabels: Record<NursingPlannedStaffType, string> = {
  nurse: "看護職員",
  pt: "理学療法士（PT）",
  ot: "作業療法士（OT）",
  st: "言語聴覚士（ST）",
};

/** 訪問の担当の資格（`schedule_visit_providers.qualification`）→ 計画書の職種。看護職員以外・リハ職以外は null */
export function nursingPlannedStaffTypeOf(qualification: string): NursingPlannedStaffType | null {
  if (qualification === "nurse" || qualification === "associate_nurse") return "nurse";
  return qualification === "pt" || qualification === "ot" || qualification === "st" ? qualification : null;
}

/** 別添の作成者の職種 */
export const nursingRehabOccupations = ["pt", "ot", "st"] as const;
export type NursingRehabOccupation = (typeof nursingRehabOccupations)[number];
export const nursingRehabOccupationLabels: Record<NursingRehabOccupation, string> = { pt: "PT", ot: "OT", st: "ST" };

/**
 * 評価（Barthel Index）10 項目。保存するのは選んだ選択肢（`value`）で、点は**この表から計算する**（合計は保存しない）。
 * 点の並びは様式の選択肢のとおり（移乗・歩行は 15/10/5/0・整容と入浴は 5/0/0・ほかは 10/5/0）。満点 100。
 */
export const NURSING_BARTHEL_ITEMS = [
  { key: "eating", label: "食事", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "transfer", label: "移乗", options: [{ value: "independent", label: "自立", points: 15 }, { value: "supervised", label: "監視・一部介助", points: 10 }, { value: "sitOnly", label: "座れるが移れない", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "grooming", label: "整容", options: [{ value: "independent", label: "自立", points: 5 }, { value: "partial", label: "一部介助", points: 0 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "toilet", label: "トイレ動作", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "bathing", label: "入浴", options: [{ value: "independent", label: "自立", points: 5 }, { value: "partial", label: "一部介助", points: 0 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "walking", label: "歩行", options: [{ value: "independent", label: "自立", points: 15 }, { value: "walker", label: "歩行器等", points: 10 }, { value: "wheelchair", label: "車椅子操作", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "stairs", label: "階段昇降", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "dressing", label: "着替え", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "bowel", label: "排便管理", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
  { key: "bladder", label: "排尿管理", options: [{ value: "independent", label: "自立", points: 10 }, { value: "partial", label: "一部介助", points: 5 }, { value: "full", label: "全介助", points: 0 }] },
] as const;
export type NursingBarthelKey = (typeof NURSING_BARTHEL_ITEMS)[number]["key"];
export const NURSING_BARTHEL_FULL_SCORE = 100;

/** 選んだ項目の点の合計（未選択の項目は 0 点として数える）。表に無い値は無視する */
export function nursingBarthelTotal(selected: Partial<Record<string, string | undefined>>): number {
  let total = 0;
  for (const item of NURSING_BARTHEL_ITEMS) {
    total += item.options.find((o) => o.value === selected[item.key])?.points ?? 0;
  }
  return total;
}

/** 別添の文の欄の上限（原本が無いので紙の欄の制限ではなく、保存の安全のための上限） */
export const NURSING_REPORT_REHAB_TEXT_MAX = 1000;
export const NURSING_REPORT_REHAB_CONTENT_MAX = 1500;
