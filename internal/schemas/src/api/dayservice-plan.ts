import { z } from "zod";
import { partialForUpdate } from "../partial-for-update";

/** 達成度（長期/短期目標・サービス提供内容の評価で共用）*/
const achievementSchema = z.enum(["achieved", "partial", "not_achieved"]);

/** プログラム（1日の流れ）サブスキーマ（daily_program jsonb array item） */
const dailyProgramItemApiSchema = z.object({
  time: z.string().max(20),
  content: z.string().max(500),
});

export const dayservicePlanServiceItemApiSchema = z.object({
  periodFrom: z.string().date().optional(),
  periodTo: z.string().date().optional(),
  purposeAndContent: z.string().max(2000).optional(),
  evalImplemented: z.enum(["done", "partial", "not_done"]).optional(),
  evalAchieved: achievementSchema.optional(),
  effectNote: z.string().max(2000).optional(),
});

/** POST /care-plan/dayservice/plans リクエストボディ */
export const createDayservicePlanApiSchema = z.object({
  clientId: z.string().guid(),
  source: z.enum(["internal", "external"]).default("internal"),
  careManagerName: z.string().max(200).optional(),
  careManagerOffice: z.string().max(200).optional(),
  /** 担当のケアマネ（care-office の名簿 `tool.care_managers` の id）。渡すと居宅（所属）と名前・事業所名の文字の写しをサーバーが入れる。作るときに省けば利用者の今の担当 */
  careManagerId: z.string().guid().optional(),
  /** 担当の居宅（care-office の名簿 `tool.care_offices` の id）。ケアマネを渡せばその所属が入る（違う居宅を渡すと 400）。居宅だけでも保存できる */
  careOfficeId: z.string().guid().optional(),
  assessmentId: z.string().guid().optional(),
  certificationId: z.string().guid().optional(),
  baseCarePlanId: z.string().guid().nullable().optional(),
  clientWishes: z.string().max(5000).optional(),
  familyWishes: z.string().max(5000).optional(),
  overallPolicy: z.string().max(5000).optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveUntil: z.string().date().optional(),
  facilityId: z.string().guid().optional(),
  serviceDaysPerWeek: z.number().int().min(0).max(7).optional(),
  serviceStartTime: z.string().max(10).optional(),
  serviceEndTime: z.string().max(10).optional(),
  dailyLifeGoal: z.string().max(5000).optional(),
  functionalGoal: z.string().max(5000).optional(),
  serviceContent: z.string().max(5000).optional(),
  lifeSupportActivity: z.string().max(5000).optional(),
  clientConsentAt: z.string().date().optional(),
  familyConsentAt: z.string().date().optional(),
  programManagerId: z.string().guid().optional(),
  plannerJobType: z.string().max(40).optional(),
  trainerId: z.string().guid().optional(),
  lifeFormCode: z.string().max(8).optional(),
  memo: z.string().max(5000).optional(),
  createdOn: z.string().date().optional(),
  previousCreatedOn: z.string().date().optional(),
  firstCreatedOn: z.string().date().optional(),
  historySummary: z.string().max(5000).optional(),
  clientWish: z.string().max(5000).optional(),
  familyWish: z.string().max(5000).optional(),
  socialParticipation: z.string().max(5000).optional(),
  homeEnvironment: z.string().max(5000).optional(),
  healthCondition: z.string().max(5000).optional(),
  medicalRisk: z.string().max(5000).optional(),
  longGoal: z.string().max(2000).optional(),
  longGoalSetOn: z.string().date().optional(),
  longGoalDueOn: z.string().date().optional(),
  longGoalAchievement: achievementSchema.optional(),
  shortGoal: z.string().max(2000).optional(),
  shortGoalSetOn: z.string().date().optional(),
  shortGoalDueOn: z.string().date().optional(),
  shortGoalAchievement: achievementSchema.optional(),
  pickupEnabled: z.boolean().optional(),
  dropoffEnabled: z.boolean().optional(),
  dailyProgram: z.array(dailyProgramItemApiSchema).max(20).optional(),
  specialNote: z.string().max(2000).optional(),
  outcomeSummary: z.string().max(5000).optional(),
  reevaluatedOn: z.string().date().optional(),
  explainerName: z.string().max(200).optional(),
  explainedOn: z.string().date().optional(),
  services: z.array(dayservicePlanServiceItemApiSchema).max(5).optional(),
});

export const DAYSERVICE_PLAN_CLEARABLE_KEYS = [
  "careManagerName", "careManagerOffice", "clientWishes", "familyWishes", "overallPolicy",
  "effectiveFrom", "effectiveUntil", "serviceStartTime", "serviceEndTime", "dailyLifeGoal", "functionalGoal",
  "serviceContent", "lifeSupportActivity", "clientConsentAt", "familyConsentAt", "programManagerId", "plannerJobType", "memo",
  "createdOn", "previousCreatedOn", "firstCreatedOn", "historySummary", "clientWish", "familyWish",
  "socialParticipation", "homeEnvironment", "healthCondition", "medicalRisk",
  "longGoal", "longGoalSetOn", "longGoalDueOn", "longGoalAchievement",
  "shortGoal", "shortGoalSetOn", "shortGoalDueOn", "shortGoalAchievement",
  "specialNote", "outcomeSummary", "reevaluatedOn", "explainerName", "explainedOn",
  "assessmentId", "serviceDaysPerWeek", "careManagerId", "careOfficeId",
] as const satisfies readonly (keyof typeof createDayservicePlanApiSchema.shape)[];

const clearable = Object.fromEntries(
  DAYSERVICE_PLAN_CLEARABLE_KEYS.map((k) => [k, createDayservicePlanApiSchema.shape[k].unwrap().nullable().optional()]),
) as { [K in (typeof DAYSERVICE_PLAN_CLEARABLE_KEYS)[number]]: z.ZodOptional<z.ZodNullable<ReturnType<(typeof createDayservicePlanApiSchema.shape)[K]["unwrap"]>>> };

/** PATCH /care-plan/dayservice/plans/:id リクエストボディ */
export const updateDayservicePlanApiSchema = partialForUpdate(
  createDayservicePlanApiSchema.omit({ clientId: true }),
).extend(clearable);

/** PATCH /care-plan/dayservice/plans/:id/status リクエストボディ */
export const updateDayservicePlanStatusApiSchema = z.object({
  status: z.enum(["draft", "review", "approved", "active", "expired", "revised"]),
});

export type CreateDayservicePlanApi = z.infer<typeof createDayservicePlanApiSchema>;
export type UpdateDayservicePlanApi = z.infer<typeof updateDayservicePlanApiSchema>;
/** 口に送る形（既定値のある欄は省ける）。SDK の入力の型の元 */
export type CreateDayservicePlanApiInput = z.input<typeof createDayservicePlanApiSchema>;
export type UpdateDayservicePlanApiInput = z.input<typeof updateDayservicePlanApiSchema>;
export type UpdateDayservicePlanStatusApi = z.infer<typeof updateDayservicePlanStatusApiSchema>;
export type DayservicePlanServiceItemApi = z.infer<typeof dayservicePlanServiceItemApiSchema>;
