import { z } from "zod";
import { partialForUpdate } from "../partial-for-update";

const programApiSchema = z.object({
  name: z.string().max(200),
  method: z.string().max(1000).optional(),
  frequency: z.string().max(200).optional(),
  durationMin: z.number().int().min(1).max(999).optional(),
  staff: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
});

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
  programs: z.array(programApiSchema).max(30).optional(),
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
});

/** PATCH /care-plan/training/plans/:id リクエストボディ */
export const updateTrainingPlanApiSchema = partialForUpdate(
  createTrainingPlanApiSchema.omit({ clientId: true }),
);

/** PATCH /care-plan/training/plans/:id/status リクエストボディ */
export const updateTrainingPlanStatusApiSchema = z.object({
  status: z.enum(["draft", "review", "approved", "active", "expired", "revised"]),
});

export type CreateTrainingPlanApi = z.infer<typeof createTrainingPlanApiSchema>;
export type UpdateTrainingPlanApi = z.infer<typeof updateTrainingPlanApiSchema>;
export type UpdateTrainingPlanStatusApi = z.infer<typeof updateTrainingPlanStatusApiSchema>;
