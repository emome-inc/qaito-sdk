/**
 * 個別機能訓練計画書（kunrenplan_details）Zod スキーマ
 *
 * テーブル: client.kunrenplan_details
 * 3 領域目標（身体機能・活動・参加）、訓練プログラム jsonb、LIFE 連動
 */
import { z } from "zod";

export const trainingPlanProgramSchema = z.object({
  /** 訓練項目名 */
  name: z.string().max(200),
  /** 具体的な方法・手技 */
  method: z.string().max(1000).optional(),
  /** 頻度（例: "週3回"） */
  frequency: z.string().max(200).optional(),
  /** 実施時間（分） */
  durationMin: z.number().int().min(1).max(999).optional(),
  /** 担当者・職種 */
  staff: z.string().max(200).optional(),
  /** 備考 */
  note: z.string().max(1000).optional(),
});

export type TrainingPlanProgram = z.infer<typeof trainingPlanProgramSchema>;

export const trainingPlanParticipantSchema = z.object({
  /** 職種 */
  occupation: z.string().max(100),
  /** 氏名または組織名 */
  name: z.string().max(200).optional(),
  /** 役割・関与内容 */
  role: z.string().max(500).optional(),
});

export type TrainingPlanParticipant = z.infer<typeof trainingPlanParticipantSchema>;

export const createTrainingPlanDetailsSchema = z.object({
  /** 利用者 ID（必須） */
  clientId: z.string().uuid(),
  /** ケアプラン ID（必須） */
  carePlanId: z.string().uuid(),
  /** 事業所 ID（任意） */
  facilityId: z.string().uuid().optional(),
  /** 担当訓練士 ID（任意） */
  trainerId: z.string().uuid().optional(),
  /** アセスメント実施日 */
  assessmentDate: z.string().date().optional(),
  /** 次回見直し日 */
  reviewDate: z.string().date().optional(),
  /** 目標: 身体機能領域 */
  goalBodyFunction: z.string().max(2000).optional(),
  /** 目標: 活動領域 */
  goalActivity: z.string().max(2000).optional(),
  /** 目標: 参加領域 */
  goalParticipation: z.string().max(2000).optional(),
  /** 訓練プログラム一覧（jsonb） */
  programs: z.array(trainingPlanProgramSchema).max(30).optional(),
  /** 多職種参加者一覧（jsonb） */
  multidisciplinaryParticipants: z.array(trainingPlanParticipantSchema).max(20).optional(),
  /** 本人同意日 */
  clientConsentAt: z.string().date().optional(),
  /** 家族同意日 */
  familyConsentAt: z.string().date().optional(),
  /** 本人目標・意向 */
  clientGoal: z.string().max(2000).optional(),
  /** LIFE 様式コード（例: "06"） */
  lifeFormCode: z.string().max(8).optional(),
  /** LIFE 連携済みフラグ */
  lifeLinked: z.boolean().optional(),
  /** 備考 */
  memo: z.string().max(5000).optional(),
  /** 健康状態・経過（病名/発症日/入院日/治療経過/合併症） */
  healthConditionNote: z.string().max(5000).optional(),
  /** 機能訓練実施上の留意事項 */
  trainingCaution: z.string().max(2000).optional(),
  /** 前回作成した長期目標に係る目標達成度 */
  longGoalAchievement: z.enum(["achieved", "partial", "not_achieved"]).optional(),
  /** 前回作成した短期目標に対する目標達成度 */
  shortGoalAchievement: z.enum(["achieved", "partial", "not_achieved"]).optional(),
});

export type CreateTrainingPlanDetails = z.infer<typeof createTrainingPlanDetailsSchema>;

export const updateTrainingPlanDetailsSchema = createTrainingPlanDetailsSchema
  .omit({ clientId: true, carePlanId: true })
  .partial();

export type UpdateTrainingPlanDetails = z.infer<typeof updateTrainingPlanDetailsSchema>;

export const trainingPlanDetailsIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type TrainingPlanDetailsIdParam = z.infer<typeof trainingPlanDetailsIdParamSchema>;
