import { z } from "zod";

/** 要約の対象の日数（今日を含めて 14 日・JST） */
export const NURSING_SUMMARY_WINDOW_DAYS = 14;

/** 様子の観点。並び順は画面の並び順 */
export const NURSING_SUMMARY_ASPECTS = [
  { key: "vitals", label: "バイタル" },
  { key: "excretion", label: "排泄" },
  { key: "meal", label: "食事" },
  { key: "fluid", label: "水分" },
  { key: "sleep", label: "睡眠" },
  { key: "oncall", label: "臨時対応" },
] as const;
export const nursingSummaryAspectKeys = ["vitals", "excretion", "meal", "fluid", "sleep", "oncall"] as const;
export type NursingSummaryAspectKey = (typeof nursingSummaryAspectKeys)[number];

/** AI の応答の形（崩れていたら保存しない）。記録に書かれていない観点は出さない */
export const nursingClientSummaryContentSchema = z.object({
  aspects: z
    .array(z.object({ key: z.enum(nursingSummaryAspectKeys), text: z.string().trim().min(1).max(200) }))
    .max(nursingSummaryAspectKeys.length),
  todos: z
    .array(z.object({
      text: z.string().trim().min(1).max(120),
      /** 元にした記録書Ⅱ（`nursing_visit_records.id`）。画面のリンク先 */
      recordIds: z.array(z.string().uuid()).max(5),
    }))
    .max(6),
});
export type NursingClientSummaryContent = z.infer<typeof nursingClientSummaryContentSchema>;

export const nursingClientSummaryInputSchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
});
export type NursingClientSummaryInput = z.infer<typeof nursingClientSummaryInputSchema>;

export type NursingClientSummary = {
  clientId: string;
  /** 今の対象の期間（`YYYY-MM-DD`） */
  periodStart: string;
  periodEnd: string;
  /** 今の期間にある元の記録の件数 */
  recordCount: number;
  oncallCount: number;
  /** 保存してある要約。まだ作っていない・元の記録が 0 件なら null */
  content: NursingClientSummaryContent | null;
  generatedAt: string | null;
  /** 保存してある要約より新しい（または減った）元の記録がある → 作り直す */
  stale: boolean;
  /** 誰かが作り直している最中 */
  generating: boolean;
};
