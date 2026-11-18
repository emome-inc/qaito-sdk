import { z } from "zod";
import { partialForUpdate } from "../partial-for-update";

/** 達成度（長期/短期目標・サービス提供内容の評価で共用）*/
const achievementSchema = z.enum(["achieved", "partial", "not_achieved"]);

/** プログラム（1日の流れ）サブスキーマ（daily_program jsonb array item） */
const dailyProgramItemApiSchema = z.object({
  time: z.string().max(20),
  content: z.string().max(500),
});

/**
 * サービス提供内容 ①〜⑤ サブスキーマ（tsushoplan_services 1 行・forms-module.md §5.1.1）
 * sortOrder は API では配列インデックス（1-5）で決まるため受け取らない。
 */
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

/** PATCH /care-plan/dayservice/plans/:id リクエストボディ */
export const updateDayservicePlanApiSchema = partialForUpdate(
  createDayservicePlanApiSchema.omit({ clientId: true }),
);

/** PATCH /care-plan/dayservice/plans/:id/status リクエストボディ */
export const updateDayservicePlanStatusApiSchema = z.object({
  status: z.enum(["draft", "review", "approved", "active", "expired", "revised"]),
});

export type CreateDayservicePlanApi = z.infer<typeof createDayservicePlanApiSchema>;
export type UpdateDayservicePlanApi = z.infer<typeof updateDayservicePlanApiSchema>;
export type UpdateDayservicePlanStatusApi = z.infer<typeof updateDayservicePlanStatusApiSchema>;
export type DayservicePlanServiceItemApi = z.infer<typeof dayservicePlanServiceItemApiSchema>;
