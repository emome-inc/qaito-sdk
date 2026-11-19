import { z } from "zod";
import { partialForUpdate } from "../partial-for-update";
import { kunrenSheetFieldsShape, trainingPlanProgramSchema, TRAINING_PROGRAMS_MAX } from "../training-plan-details";

const programApiSchema = trainingPlanProgramSchema;

const participantApiSchema = z.object({
  occupation: z.string().max(100),
  name: z.string().max(200).optional(),
  role: z.string().max(500).optional(),
});

/**
 * POST /care-plan/training/plans リクエストボディ
 * care_plans（plan_type='kunren'）+ kunrenplan_details をアトミックに作成する。
 */
export const createTrainingPlanApiSchema = z.object({
  clientId: z.string().uuid(),
  source: z.enum(["internal", "external"]).default("internal"),
  careManagerName: z.string().max(200).optional(),
  careManagerOffice: z.string().max(200).optional(),
  /** 担当の居宅（care-office の名簿 `tool.care_offices` の id・0656）。ケアマネと一緒にサーバーが確かめて文字の写しも入れる */
  careOfficeId: z.string().guid().optional(),
  /** 担当のケアマネ（care-office の名簿 `tool.care_managers` の id）。作るときに居宅もケアマネも省けば利用者の今の担当 */
  careManagerId: z.string().guid().optional(),
  assessmentId: z.string().uuid().optional(),
  certificationId: z.string().uuid().optional(),
  baseCarePlanId: z.string().uuid().nullable().optional(),
  clientWishes: z.string().max(5000).optional(),
  familyWishes: z.string().max(5000).optional(),
  overallPolicy: z.string().max(5000).optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveUntil: z.string().date().optional(),
  facilityId: z.string().uuid().optional(),
  trainerId: z.string().uuid().optional(),
  assessmentDate: z.string().date().optional(),
  reviewDate: z.string().date().optional(),
  goalBodyFunction: z.string().max(2000).optional(),
  goalActivity: z.string().max(2000).optional(),
  goalParticipation: z.string().max(2000).optional(),
  programs: z.array(programApiSchema).max(TRAINING_PROGRAMS_MAX).optional(),
  multidisciplinaryParticipants: z.array(participantApiSchema).max(20).optional(),
  clientConsentAt: z.string().date().optional(),
  familyConsentAt: z.string().date().optional(),
  clientGoal: z.string().max(2000).optional(),
  lifeFormCode: z.string().max(8).optional(),
  lifeLinked: z.boolean().optional(),
  memo: z.string().max(5000).optional(),
  healthConditionNote: z.string().max(5000).optional(),
  trainingCaution: z.string().max(2000).optional(),
  longGoalAchievement: z.enum(["achieved", "partial", "not_achieved"]).optional(),
  shortGoalAchievement: z.enum(["achieved", "partial", "not_achieved"]).optional(),
  ...kunrenSheetFieldsShape,
});

export const TRAINING_PLAN_CLEARABLE_KEYS = [
  "careManagerName", "careManagerOffice", "clientWishes", "familyWishes", "overallPolicy",
  "effectiveFrom", "effectiveUntil", "assessmentId", "trainerId", "assessmentDate", "reviewDate",
  "goalBodyFunction", "goalActivity", "goalParticipation", "clientConsentAt", "familyConsentAt", "clientGoal", "memo",
  "healthConditionNote", "trainingCaution", "longGoalAchievement", "shortGoalAchievement",
  "createdOn", "plannerStaffId", "plannerJobType", "clientWish", "familyWish", "socialParticipation", "homeEnvironment",
  "diseaseName", "onsetOn", "lastAdmittedOn", "lastDischargedOn", "complicationsOther",
  "longGoalBodyFunction", "longGoalActivity", "longGoalParticipation", "selfPractice", "specialNote",
  "outcomeChange", "issuesAndFactors", "explainedOn", "explainerName", "careOfficeId", "careManagerId",
] as const satisfies readonly (keyof typeof createTrainingPlanApiSchema.shape)[];

const clearable = Object.fromEntries(
  TRAINING_PLAN_CLEARABLE_KEYS.map((k) => [k, createTrainingPlanApiSchema.shape[k].unwrap().nullable().optional()]),
) as { [K in (typeof TRAINING_PLAN_CLEARABLE_KEYS)[number]]: z.ZodOptional<z.ZodNullable<ReturnType<(typeof createTrainingPlanApiSchema.shape)[K]["unwrap"]>>> };

/** PATCH /care-plan/training/plans/:id リクエストボディ */
export const updateTrainingPlanApiSchema = partialForUpdate(
  createTrainingPlanApiSchema.omit({ clientId: true }),
).extend(clearable);

/** PATCH /care-plan/training/plans/:id/status リクエストボディ */
export const updateTrainingPlanStatusApiSchema = z.object({
  status: z.enum(["draft", "review", "approved", "active", "expired", "revised"]),
});

export type CreateTrainingPlanApi = z.infer<typeof createTrainingPlanApiSchema>;
export type UpdateTrainingPlanApi = z.infer<typeof updateTrainingPlanApiSchema>;
/** 口に送る形（既定値のある欄は省ける）。SDK の入力の型の元 */
export type CreateTrainingPlanApiInput = z.input<typeof createTrainingPlanApiSchema>;
export type UpdateTrainingPlanApiInput = z.input<typeof updateTrainingPlanApiSchema>;
export type UpdateTrainingPlanStatusApi = z.infer<typeof updateTrainingPlanStatusApiSchema>;
