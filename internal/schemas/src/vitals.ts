import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { serviceCategoryValues } from "./shared-options";

export const VITAL_INPUT_RANGES = {
  tempCelsius: { min: 34, max: 42 },
  bpSystolic: { min: 50, max: 250 },
  bpDiastolic: { min: 30, max: 150 },
  pulse: { min: 20, max: 250 },
  /** SpO2（%）。90% 未満が再検の基準（`care-record/pure/vital-abnormal.ts`）。 */
  spo2: { min: 50, max: 100 },
  weightKg: { min: 10, max: 200 },
  bloodGlucose: { min: 20, max: 600 },
  respiratoryRate: { min: 1, max: 100 },
} as const;

/** 血糖値を測った時。DB の CHECK（`client.vitals.blood_glucose_timing`）と同じ 4 値。 */
export const bloodGlucoseTimingValues = ["fasting", "before_meal", "after_meal", "random"] as const;
export type BloodGlucoseTiming = (typeof bloodGlucoseTimingValues)[number];
/** DB の text 列（CHECK で 4 値に絞ってある）を型に絞る。想定外の値は null。 */
export function toBloodGlucoseTiming(v: unknown): BloodGlucoseTiming | null {
  return bloodGlucoseTimingValues.find((t) => t === v) ?? null;
}

const R = VITAL_INPUT_RANGES;

export const vitalSourceValues = ["measured", "transcribed", "device"] as const;
export type VitalSource = (typeof vitalSourceValues)[number];
/** 人が入れられる出どころ。 */
export const humanVitalSourceValues = ["measured", "transcribed"] as const;
/** DB の text 列を型に絞る。想定外の値は measured（列の既定値）。 */
export function toVitalSource(v: unknown): VitalSource {
  return vitalSourceValues.find((s) => s === v) ?? "measured";
}
/** 機器の計測の重複の歯止め（`client.vitals.external_id`）。腕時計は `MAC:BpiTimestamp`。 */
export const vitalExternalIdSchema = z.string().min(1).max(100);

export const createVitalSchema = z.object({
  clientId: z.string().uuid("clientId は UUID 形式です"),
  facilityId: z.string().uuid("facilityId は UUID 形式です").optional().nullable(),
  staffId: z.string().uuid("staffId は UUID 形式です").optional().nullable(),
  source: z.enum(humanVitalSourceValues).default("measured"),
  sourceNote: z.string().max(500).optional().nullable(),
  serviceDate: z.string().date("serviceDate は YYYY-MM-DD 形式です"),
  recordedAt: z.string().datetime({ offset: true }).optional(),

  serviceCategory: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode: z.string().max(2, "serviceTypeCode は 2 文字以内です").default("15"),

  bpSystolic: z.number().int().min(R.bpSystolic.min).max(R.bpSystolic.max).optional().nullable(),
  bpDiastolic: z.number().int().min(R.bpDiastolic.min).max(R.bpDiastolic.max).optional().nullable(),
  pulse: z.number().int().min(R.pulse.min).max(R.pulse.max).optional().nullable(),
  respiratoryRate: z.number().int().min(R.respiratoryRate.min).max(R.respiratoryRate.max).optional().nullable(),
  tempCelsius: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .pipe(z.number().min(R.tempCelsius.min).max(R.tempCelsius.max).nullable())
    .optional()
    .nullable(),
  spo2: z.number().int().min(R.spo2.min).max(R.spo2.max).optional().nullable(),
  weightKg: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" || v === null ? null : Number(v)))
    .pipe(z.number().min(R.weightKg.min).max(R.weightKg.max).nullable())
    .optional()
    .nullable(),
  bloodGlucose: z.number().int().min(R.bloodGlucose.min).max(R.bloodGlucose.max).optional().nullable(),
  bloodGlucoseTiming: z.enum(bloodGlucoseTimingValues).optional().nullable(),

  memo: z.string().max(2000).optional().nullable(),
});

export type CreateVitalInput = z.infer<typeof createVitalSchema>;

export const createDeviceVitalSchema = createVitalSchema.extend({
  source: z.literal("device"),
  externalId: vitalExternalIdSchema,
});
export type CreateDeviceVitalInput = z.infer<typeof createDeviceVitalSchema>;

export const updateVitalSchema = partialForUpdate(
  createVitalSchema.omit({ clientId: true }),
);

export type UpdateVitalInput = z.infer<typeof updateVitalSchema>;

export const vitalIdParam = z.object({
  clientId: z.string().uuid("clientId は UUID 形式です"),
  id: z.string().uuid("id は UUID 形式です"),
});

export const listVitalsQuery = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(365).optional(),
});

export type ListVitalsQuery = z.infer<typeof listVitalsQuery>;

/** 月ごとの体重の推移の期間（既定 12 か月・今月まで）。 */
export const WEIGHT_TREND_DEFAULT_MONTHS = 12;
export const WEIGHT_TREND_MAX_MONTHS = 24;
export const clientWeightTrendQuery = z.object({
  months: z.coerce.number().int().min(1).max(WEIGHT_TREND_MAX_MONTHS).optional(),
  /** 終わりの月（YYYY-MM・省略 = 今月） */
  to: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "to は YYYY-MM 形式です").optional(),
});
export type ClientWeightTrendQuery = z.infer<typeof clientWeightTrendQuery>;

export const listVitalsAcrossClientsQuery = z.object({
  clientId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  /** 単日で絞る（YYYY-MM-DD） */
  serviceDate: z.string().date().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  /** この体温以上だけ返す（発熱者の抽出。例: 37.5） */
  minTemperature: z.coerce.number().min(30).max(45).optional(),
  /** この体温以下だけ返す */
  maxTemperature: z.coerce.number().min(30).max(45).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListVitalsAcrossClientsQuery = z.infer<typeof listVitalsAcrossClientsQuery>;
