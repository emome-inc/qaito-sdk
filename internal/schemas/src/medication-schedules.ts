import { z } from "zod";

/** 時間範囲の時刻（JST・`HH:mm`。DB の `time` が返す `HH:mm:ss` も受ける）。 */
export const MEDICATION_WINDOW_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** 時刻を `HH:mm` にそろえる（`time` 列の `HH:mm:ss` を落とす）。 */
export function toWindowTime(value: string): string {
  return value.slice(0, 5);
}

/** 時間範囲の時刻 1 つ（`HH:mm` にそろえて返す）。 */
export const medicationWindowTimeSchema = z
  .string()
  .regex(MEDICATION_WINDOW_TIME_RE, "時刻は HH:MM 形式です")
  .transform(toWindowTime);

/** 開始 < 終了（日をまたがない）。どちらも `HH:mm` にそろえた値で比べる。 */
export function isMedicationWindowOrdered(start: string, end: string): boolean {
  return toWindowTime(start) < toWindowTime(end);
}

/** 窓の表示（「09:30〜10:30」）。 */
export function formatMedicationWindow(start: string, end: string): string {
  return `${toWindowTime(start)}〜${toWindowTime(end)}`;
}

/**
 * 取込（xlsx・OCR）が書く旧来の服薬の区分。服薬入力・ボードは見ない（時間範囲を見る）。
 * master-design §3.2 の CHECK 制約と一致させる
 */
export const medicationTimingOptions = [
  { value: "morning", label: "朝" },
  { value: "noon", label: "昼" },
  { value: "before_leaving", label: "出発前" },
  { value: "before_meal", label: "食前" },
  { value: "after_meal", label: "食後" },
  { value: "before_sleep", label: "就寝前" },
  { value: "as_needed", label: "頓服" },
  { value: "other", label: "その他" },
] as const;

export const medicationTimingValues = [
  "morning",
  "noon",
  "before_leaving",
  "before_meal",
  "after_meal",
  "before_sleep",
  "as_needed",
  "other",
] as const;

/**
 * 用法
 * master-design §3.2 の CHECK 制約と一致させる
 */
export const medicationMethodOptions = [
  { value: "oral", label: "経口" },
  { value: "with_water", label: "水なし" },
  { value: "injection", label: "注射" },
  { value: "topical", label: "外用" },
  { value: "other", label: "その他" },
] as const;

export const medicationMethodValues = [
  "oral",
  "with_water",
  "injection",
  "topical",
  "other",
] as const;

/**
 * 取込（xlsx・OCR）の 1 行。薬マスタと時間範囲は持たない（取込では決められない）ので、
 * 入った行はカルテの服薬管理に「時間範囲が未設定」と出て、看護職員が薬と時間範囲を入れる。
 */
export const importMedicationScheduleSchema = z.object({
  timing: z.enum(medicationTimingValues),
  method: z.enum(medicationMethodValues).default("oral"),
  frequency_note: z.string().optional(),
  note: z.string().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export const medicationScheduleIdParam = z.object({
  client_id: z.string().uuid(),
  schedule_id: z.string().uuid(),
});
