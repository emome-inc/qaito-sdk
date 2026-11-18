import { z } from "zod";
import { serviceCategoryValues } from "./shared-options";
import { partialForUpdate } from "./partial-for-update";

export const recordTypeValues = [
  "service_provision",
  "physical_restraint",
  "complaint",
  "accident",
  "absence",
  "care_conference",
  "nutrition",
  "oral",
  "recreation",
] as const;

export type RecordType = (typeof recordTypeValues)[number];

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  service_provision:  "通常サービス",
  physical_restraint: "身体拘束",
  complaint:          "苦情",
  accident:           "事故",
  absence:            "欠席",
  care_conference:    "サービス担当者会議",
  nutrition:          "栄養管理",
  oral:               "口腔ケア",
  recreation:         "レク",
};

export const bathTypeValues = ["full", "partial", "wiping", "none"] as const;
export type BathType = (typeof bathTypeValues)[number];

export const BATH_TYPE_LABEL: Record<BathType, string> = {
  full:    "全身浴",
  partial: "部分浴（足浴等）",
  wiping:  "清拭",
  none:    "なし",
};

export const bathMethodValues = ["general", "individual", "shower", "machine", "other", "footbath", "cancelled"] as const;
export type BathMethod = (typeof bathMethodValues)[number];

export const BATH_METHOD_LABEL: Record<BathMethod, string> = {
  general:    "一般浴",
  individual: "個浴",
  shower:     "シャワー浴",
  machine:    "機械浴",
  other:      "その他",
  footbath:   "足浴",
  cancelled:  "中止",
};

export const excretionTypeValues = ["toilet", "portable", "diaper", "catheter", "none"] as const;
export type ExcretionType = (typeof excretionTypeValues)[number];

export const EXCRETION_TYPE_LABEL: Record<ExcretionType, string> = {
  toilet:   "トイレ",
  portable: "ポータブルトイレ",
  diaper:   "おむつ",
  catheter: "カテーテル",
  none:     "なし",
};

export const excretionStoolValues = ["yes", "no", "unknown"] as const;
export type ExcretionStool = (typeof excretionStoolValues)[number];

export const createCareRecordSchema = z.object({
  clientId:          z.string().uuid("client_id は UUID 形式です"),
  facilityId:        z.string().uuid().optional().nullable(),
  staffId:           z.string().uuid().optional().nullable(),
  serviceDate:       z.string().date("serviceDate は YYYY-MM-DD 形式です"),

  serviceCategory:   z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode:   z.string().max(2).default("15"),

  recordType:        z.enum(recordTypeValues).default("service_provision"),

  bathType:          z.enum(bathTypeValues).optional().nullable(),
  bathMethod:        z.enum(bathMethodValues).optional().nullable(),
  bathMemo:          z.string().max(500).optional().nullable(),

  mealIntakePct:     z.number().int().min(0).max(100).optional().nullable(),
  mealStaplePct:     z.number().int().min(0).max(100).optional().nullable(),
  mealSidePct:       z.number().int().min(0).max(100).optional().nullable(),
  snackIntakePct:    z.number().int().min(0).max(100).optional().nullable(),
  waterIntakeMl:     z.number().int().min(0).max(5000).optional().nullable(),
  mealMemo:          z.string().max(500).optional().nullable(),

  excretionType:     z.enum(excretionTypeValues).optional().nullable(),
  excretionUrineCount: z.number().int().min(0).max(50).optional().nullable(),
  excretionStool:    z.enum(excretionStoolValues).optional().nullable(),
  excretionMemo:     z.string().max(500).optional().nullable(),

  specialNote:       z.string().max(2000).optional().nullable(),
  treatmentMemo:     z.string().max(2000).optional().nullable(),

  activityName:      z.string().max(200).optional().nullable(),
  activityStart:     z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 形式").optional().nullable(),
  activityEnd:       z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 形式").optional().nullable(),

  extraData:         z.record(z.string(), z.unknown()).default({}),
  templateId:        z.string().uuid().optional().nullable(),
});

export type CreateCareRecordInput = z.infer<typeof createCareRecordSchema>;

export const updateCareRecordSchema = partialForUpdate(
  createCareRecordSchema.omit({ clientId: true }),
);

export type UpdateCareRecordInput = z.infer<typeof updateCareRecordSchema>;

export const listCareRecordsQuerySchema = z.object({
  clientId:        z.string().uuid().optional(),
  facilityId:      z.string().uuid().optional(),
  serviceDate:     z.string().date().optional(),
  dateFrom:        z.string().date().optional(),
  dateTo:          z.string().date().optional(),
  recordType:      z.enum(recordTypeValues).optional(),
  includeDeleted:  z.coerce.boolean().default(false),
  limit:           z.coerce.number().int().min(1).max(200).default(50),
  offset:          z.coerce.number().int().min(0).default(0),
});

export type ListCareRecordsQuery = z.infer<typeof listCareRecordsQuerySchema>;

export const careRecordIdParam = z.object({
  id: z.string().uuid("id は UUID 形式です"),
});

export const softDeleteCareRecordSchema = z.object({
  retentionBaseDate: z.string().date("retentionBaseDate は YYYY-MM-DD 形式です").optional(),
});

export type SoftDeleteCareRecordInput = z.infer<typeof softDeleteCareRecordSchema>;

/** 1 回で入れられる人数の上限（一括登録 `{ rows }` と同じ）。 */
export const MEAL_AMOUNTS_MAX_CLIENTS = 100;

/**
 * 何人かに同じ食事量（主食・副食）を入れる。その日の `service_provision` 行があれば更新し、
 * 無ければ作る（実績入力・食事ボードと同じ行・同じ列）。
 *
 * **主食・副食とも null = 消す（未入力に戻す）**。消すときは行が無い人には何もしない
 * （空の行を作らない）。片方だけ null は「その片方を消す」。
 */
export const setMealAmountsSchema = z.object({
  facilityId:    z.string().uuid("facilityId は UUID 形式です"),
  serviceDate:   z.string().date("serviceDate は YYYY-MM-DD 形式です"),
  clientIds:     z.array(z.string().uuid("clientIds は UUID 形式です")).min(1).max(MEAL_AMOUNTS_MAX_CLIENTS),
  mealStaplePct: z.number().int().min(0).max(100).nullable(),
  mealSidePct:   z.number().int().min(0).max(100).nullable(),
});

export type SetMealAmountsInput = z.infer<typeof setMealAmountsSchema>;

export const recordTemplateKindValues = ["care_record", "training_record"] as const;
export type RecordTemplateKind = (typeof recordTemplateKindValues)[number];

export const RECORD_TEMPLATE_KIND_LABEL: Record<RecordTemplateKind, string> = {
  care_record:     "介護記録",
  training_record: "機能訓練記録",
};

export const recordTemplateTypeValues = [
  ...recordTemplateKindValues,
  ...recordTypeValues,
  "contact_note",
] as const;

export const createRecordTemplateSchema = z.object({
  serviceTypeCode: z.string().max(2).optional().nullable(),
  recordType:      z.enum(recordTemplateTypeValues),
  templateName:    z.string().min(1).max(200),
  templateDef:     z.record(z.string(), z.unknown()).default({}),
  isDefault:       z.boolean().default(false),
  lifeFormCode:    z.string().max(8).optional().nullable(),
});

export type CreateRecordTemplateInput = z.infer<typeof createRecordTemplateSchema>;

export const updateRecordTemplateSchema = partialForUpdate(createRecordTemplateSchema);
export type UpdateRecordTemplateInput = z.infer<typeof updateRecordTemplateSchema>;

export const saveRecordTemplateSchema = z.object({
  templateName: z.string().trim().min(1, "テンプレート名を入力してください").max(200),
  isDefault:    z.boolean().default(false),
  values:       z.record(z.string(), z.string()).default({}),
});

export type SaveRecordTemplateInput = z.infer<typeof saveRecordTemplateSchema>;

export const nutritionPractitionerRoleValues = ["kanri_eiyoshi", "eiyoshi", "other"] as const;
export const nutritionContentCategoryValues = [
  "nutrition_counseling",
  "meal_form_adjustment",
  "monitoring",
  "other",
] as const;
export const nutritionRiskLevelValues = ["low", "medium", "high"] as const;

export const nutritionRecordExtraSchema = z.object({
  kind: z.literal("nutrition"),
  practitioner_role: z.enum(nutritionPractitionerRoleValues),
  content_category: z.enum(nutritionContentCategoryValues),
  plan_exists: z.boolean(),
  risk_level: z.enum(nutritionRiskLevelValues).optional(),
  risk_status: z.string().max(1000).optional(),
  dietary_status: z.string().max(1000).optional(),
  issues: z.string().max(2000).optional(),
  overall_evaluation: z.string().max(2000).optional(),
});
export type NutritionRecordExtra = z.infer<typeof nutritionRecordExtraSchema>;

export const oralPractitionerRoleValues = [
  "shika_eiseishi",
  "gengo_chokakushi",
  "kango",
  "other",
] as const;
export const oralContentCategoryValues = [
  "oral_care_guidance",
  "swallowing_training",
  "oral_cleaning",
  "monitoring",
  "other",
] as const;

export const oralRecordExtraSchema = z.object({
  kind: z.literal("oral"),
  practitioner_role: z.enum(oralPractitionerRoleValues),
  content_category: z.enum(oralContentCategoryValues),
  plan_exists: z.boolean(),
  overall_evaluation: z.string().max(2000).optional(),
});
export type OralRecordExtra = z.infer<typeof oralRecordExtraSchema>;

export const additionRecordExtraSchema = z.discriminatedUnion("kind", [
  nutritionRecordExtraSchema,
  oralRecordExtraSchema,
]);
export type AdditionRecordExtra = z.infer<typeof additionRecordExtraSchema>;

/** その日のレクの枠（午前・午後・イベント） */
export const dayRecreationSlots = ["morning", "afternoon", "event"] as const;
export type DayRecreationSlot = (typeof dayRecreationSlots)[number];

export const DAY_RECREATION_NAME_MAX = 100;

const dayRecreationName = z.string().trim().max(DAY_RECREATION_NAME_MAX).nullable().optional();

/** GET /care-record/day-recreations?facility_id=&service_date= */
export const dayRecreationsQuerySchema = z.object({
  facility_id: z.string().uuid(),
  service_date: z.string().date(),
});

/**
 * PUT /care-record/day-recreations（出席の全員に入れる）。渡した枠だけを入れ直す。
 * 空（"" / null）はその枠の行を外す。出席 = その日の予定がキャンセル・欠席でない人
 */
export const setDayRecreationsSchema = z.object({
  facility_id: z.string().uuid(),
  service_date: z.string().date(),
  morning: dayRecreationName,
  afternoon: dayRecreationName,
  event: dayRecreationName,
});
export type SetDayRecreationsInput = z.infer<typeof setDayRecreationsSchema>;
