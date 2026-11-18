import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const lifeFormCodes = [
  "1-1",
  "1-3",
  "1-4",
  "2",
  "3-3",
  "4-1-1",
  "5",
  "6",
] as const;

export type LifeFormCode = (typeof lifeFormCodes)[number];

export const lifeFormCodeLabels: Record<LifeFormCode, string> = {
  "1-1": "入退所情報（様式1-1）",
  "1-3": "ADL情報（様式1-3）",
  "1-4": "利用者情報（様式1-4）",
  "2": "科学的介護推進体制加算（様式2）",
  "3-3": "口腔・栄養スクリーニング加算（様式3-3）",
  "4-1-1": "褥瘡マネジメント加算（様式4-1-1）",
  "5": "排せつ支援加算（様式5）",
  "6": "リハビリテーションマネジメント加算（様式6）",
};

export const lifeFormCodeOptions = lifeFormCodes.map((c) => ({
  value: c,
  label: lifeFormCodeLabels[c],
}));

export const lifeSubmissionTypes = [
  "initial",
  "periodic",
  "change",
  "cancel",
] as const;

export type LifeSubmissionType = (typeof lifeSubmissionTypes)[number];

export const lifeSubmissionTypeLabels: Record<LifeSubmissionType, string> = {
  initial: "初回",
  periodic: "定期",
  change: "変更",
  cancel: "取消",
};

export const lifeSubmissionTypeOptions = lifeSubmissionTypes.map((t) => ({
  value: t,
  label: lifeSubmissionTypeLabels[t],
}));

export const lifeSubmissionStatuses = [
  "draft",
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export type LifeSubmissionStatus = (typeof lifeSubmissionStatuses)[number];

export const lifeSubmissionStatusLabels: Record<LifeSubmissionStatus, string> = {
  draft: "下書き",
  pending: "提出済み（確認中）",
  accepted: "受理済み",
  rejected: "差し戻し",
  cancelled: "取消済み",
};

export const lifeSubmissionStatusOptions = lifeSubmissionStatuses.map((s) => ({
  value: s,
  label: lifeSubmissionStatusLabels[s],
}));

export const assessmentScoreTypes = [
  "barthel",
  "fim",
  "mmse",
  "mna",
  "life_adl",
  "life_iadl",
  "life_nutrition",
  "dbd13",
  "vitality_index",
] as const;

export type AssessmentScoreType = (typeof assessmentScoreTypes)[number];

export const assessmentScoreTypeLabels: Record<AssessmentScoreType, string> = {
  barthel: "Barthel Index",
  fim: "FIM（機能的自立度評価表）",
  mmse: "MMSE（認知機能検査）",
  mna: "MNA（栄養評価）",
  life_adl: "LIFE ADL",
  life_iadl: "LIFE IADL",
  life_nutrition: "LIFE 栄養",
  dbd13: "DBD13（認知症行動障害尺度）",
  vitality_index: "Vitality Index（意欲評価）",
};

export const assessmentScoreTypeOptions = assessmentScoreTypes.map((t) => ({
  value: t,
  label: assessmentScoreTypeLabels[t],
}));

const barthelFeedingScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);

const barthelTransferScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
  z.literal(15),
]);

const barthelGroomingScore = z.union([z.literal(0), z.literal(5)]);
const barthelToiletUseScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);
const barthelBathingScore = z.union([z.literal(0), z.literal(5)]);
const barthelWalkingScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
  z.literal(15),
]);
const barthelStairClimbingScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);
const barthelDressingScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);
const barthelBowelControlScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);
const barthelBladderControlScore = z.union([
  z.literal(0),
  z.literal(5),
  z.literal(10),
]);

export const barthelInputSchema = z.object({
  barthel_feeding: barthelFeedingScore.nullable().optional(),
  barthel_transfer: barthelTransferScore.nullable().optional(),
  barthel_grooming: barthelGroomingScore.nullable().optional(),
  barthel_toilet_use: barthelToiletUseScore.nullable().optional(),
  barthel_bathing: barthelBathingScore.nullable().optional(),
  barthel_walking: barthelWalkingScore.nullable().optional(),
  barthel_stair_climbing: barthelStairClimbingScore.nullable().optional(),
  barthel_dressing: barthelDressingScore.nullable().optional(),
  barthel_bowel_control: barthelBowelControlScore.nullable().optional(),
  barthel_bladder_control: barthelBladderControlScore.nullable().optional(),
  mobility_method: z
    .enum(["independent", "assisted_walking", "cane", "walker", "wheelchair", "stretcher"])
    .optional(),
});

export type BarthelInput = z.infer<typeof barthelInputSchema>;

export const createLifeSubmissionSchema = z.object({
  client_id: z.string().uuid("利用者IDが不正です"),
  care_plan_id: z.string().uuid("ケアプランIDが不正です").optional(),
  facility_id: z.string().uuid("事業所IDが不正です").optional(),
  life_form_code: z.enum(lifeFormCodes, {
    error: "LIFE様式コードが不正です",
  }),
  submission_type: z.enum(lifeSubmissionTypes, {
    error: "提出種別が不正です",
  }),
  status: z.enum(lifeSubmissionStatuses).default("draft"),
  submitted_data: z.record(z.string(), z.unknown()).optional().default({}),
  submission_period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "提出対象月は YYYY-MM 形式で入力してください").optional(),
  submitted_at: z.string().optional(),
  memo: z.string().max(2000).optional(),
});

export const updateLifeSubmissionSchema = partialForUpdate(
  createLifeSubmissionSchema.omit({ client_id: true, life_form_code: true }),
);

export const listLifeSubmissionsQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  life_form_code: z.enum(lifeFormCodes).optional(),
  submission_type: z.enum(lifeSubmissionTypes).optional(),
  status: z.enum(lifeSubmissionStatuses).optional(),
  period_from: z.string().optional(),
  period_to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateLifeSubmissionInput = z.infer<typeof createLifeSubmissionSchema>;
export type UpdateLifeSubmissionInput = z.infer<typeof updateLifeSubmissionSchema>;
export type ListLifeSubmissionsQuery = z.infer<typeof listLifeSubmissionsQuerySchema>;

export const lifeForm13DataSchema = z.object({
  evaluation_date: z.string().optional(),
  eating: z.number().int().min(0).max(6).optional(),
  transfer: z.number().int().min(0).max(6).optional(),
  grooming: z.number().int().min(0).max(6).optional(),
  toilet: z.number().int().min(0).max(6).optional(),
  bathing: z.number().int().min(0).max(6).optional(),
  walking: z.number().int().min(0).max(6).optional(),
  stair_climbing: z.number().int().min(0).max(6).optional(),
  dressing: z.number().int().min(0).max(6).optional(),
  bowel_control: z.number().int().min(0).max(6).optional(),
  bladder_control: z.number().int().min(0).max(6).optional(),
}).passthrough();

export const lifeFormDataSchemas: Partial<Record<LifeFormCode, z.ZodSchema>> = {
  "1-3": lifeForm13DataSchema,
};

export const createAssessmentScoreSchema = z.object({
  client_id: z.string().uuid("利用者IDが不正です"),
  assessment_id: z.string().uuid("アセスメントIDが不正です").optional(),
  care_plan_id: z.string().uuid("ケアプランIDが不正です").optional(),
  score_type: z.enum(assessmentScoreTypes, {
    error: "スコア種別が不正です",
  }),
  score_date: z.string().min(1, "評価日は必須です"),
  total_score: z.coerce.number().optional(),
  sub_scores: z.record(z.string(), z.unknown()).optional().default({}),
  life_form_code: z.enum(lifeFormCodes).optional(),
  scorer_id: z.string().uuid("評価者IDが不正です").optional(),
  memo: z.string().max(2000).optional(),
});

export const updateAssessmentScoreSchema = partialForUpdate(
  createAssessmentScoreSchema.omit({ client_id: true, score_type: true }),
);

export const listAssessmentScoresQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  score_type: z.enum(assessmentScoreTypes).optional(),
  life_form_code: z.enum(lifeFormCodes).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateAssessmentScoreInput = z.infer<typeof createAssessmentScoreSchema>;
export type UpdateAssessmentScoreInput = z.infer<typeof updateAssessmentScoreSchema>;
export type ListAssessmentScoresQuery = z.infer<typeof listAssessmentScoresQuerySchema>;
