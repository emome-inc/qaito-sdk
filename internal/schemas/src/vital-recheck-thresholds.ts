import { z } from "zod";
import { VITAL_INPUT_RANGES } from "./vitals";

const R = VITAL_INPUT_RANGES;

/** 利用者ごとに変えられる基準の項目（全体の基準 `VITAL_RECHECK_THRESHOLDS` と同じキー）。 */
export const VITAL_RECHECK_THRESHOLD_KEYS = [
  "tempCelsiusHigh",
  "bpSystolicHigh",
  "bpSystolicLow",
  "bpDiastolicHigh",
  "pulseHigh",
  "pulseLow",
  "spo2Low",
] as const;

export type VitalRecheckThresholdKey = (typeof VITAL_RECHECK_THRESHOLD_KEYS)[number];

const intIn = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional();

/** 小数の体温（文字列でも数値でも受ける・空は null）。 */
const tempIn = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" || v === null ? null : Number(v)))
  .pipe(z.number().min(R.tempCelsius.min).max(R.tempCelsius.max).nullable())
  .nullable()
  .optional();

export const upsertVitalRecheckThresholdsSchema = z
  .object({
    tempCelsiusHigh: tempIn,
    bpSystolicHigh: intIn(R.bpSystolic.min, R.bpSystolic.max),
    bpSystolicLow: intIn(R.bpSystolic.min, R.bpSystolic.max),
    bpDiastolicHigh: intIn(R.bpDiastolic.min, R.bpDiastolic.max),
    pulseHigh: intIn(R.pulse.min, R.pulse.max),
    pulseLow: intIn(R.pulse.min, R.pulse.max),
    spo2Low: intIn(R.spo2.min, R.spo2.max),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (v) => v.bpSystolicHigh == null || v.bpSystolicLow == null || v.bpSystolicLow < v.bpSystolicHigh,
    { message: "血圧（上）の下限は上限より小さくしてください", path: ["bpSystolicLow"] },
  )
  .refine((v) => v.pulseHigh == null || v.pulseLow == null || v.pulseLow < v.pulseHigh, {
    message: "脈拍の下限は上限より小さくしてください",
    path: ["pulseLow"],
  });

export type UpsertVitalRecheckThresholdsInput = z.infer<typeof upsertVitalRecheckThresholdsSchema>;

/** 利用者ごとの基準 1 行（口が返す形・camel）。値の無い項目は null（= 全体の基準）。 */
export type VitalRecheckThresholdsView = {
  clientId: string;
  tempCelsiusHigh: number | null;
  bpSystolicHigh: number | null;
  bpSystolicLow: number | null;
  bpDiastolicHigh: number | null;
  pulseHigh: number | null;
  pulseLow: number | null;
  spo2Low: number | null;
  note: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

/** 判定にかけるバイタル 1 件（測っていない項目は省略）。 */
export const vitalRecheckJudgementItemSchema = z.object({
  clientId: z.string().uuid(),
  tempCelsius: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .pipe(z.number().nullable())
    .nullable()
    .optional(),
  bpSystolic: z.number().nullable().optional(),
  bpDiastolic: z.number().nullable().optional(),
  pulse: z.number().nullable().optional(),
  spo2: z.number().nullable().optional(),
});

/** まとめて判定する（実績表・バイタルボードは名簿ぶんを 1 回で）。 */
export const judgeVitalRecheckSchema = z.object({
  items: z.array(vitalRecheckJudgementItemSchema).min(1).max(200),
});

export type JudgeVitalRecheckInput = z.infer<typeof judgeVitalRecheckSchema>;

export type VitalRecheckJudgement = {
  clientId: string;
  individual: boolean;
  abnormal: boolean;
  reasons: string[];
  items: VitalRecheckItem[];
};

/** 再検査の判定の項目（`items` の値） */
export const VITAL_RECHECK_ITEMS = ["tempCelsius", "bpSystolic", "bpDiastolic", "pulse", "spo2"] as const;
export type VitalRecheckItem = (typeof VITAL_RECHECK_ITEMS)[number];
