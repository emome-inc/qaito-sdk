/**
 * 個別機能訓練計画書（kunrenplan_details）Zod スキーマ
 *
 * テーブル: client.kunrenplan_details
 * 3 領域目標（身体機能・活動・参加）、訓練プログラム jsonb、LIFE 連動
 */
import { z } from "zod";

/** 訓練項目の文字数の上限（前の name + method・note からの写しが入る大きさ） */
export const TRAINING_PROGRAM_CONTENT_MAX = 1500;
export const TRAINING_PROGRAM_CAUTION_MAX = 1500;

/**
 * 合併症（別紙様式3-3 の Ⅰ 健康状態・経過の □ の並び・原本の文字のまま）。値は英字の短い名前（LIFE の項目のコードが決まったら合わせる）
 */
export const KUNREN_COMPLICATIONS = [
  { value: "cerebrovascular", label: "脳血管疾患" },
  { value: "fracture", label: "骨折" },
  { value: "aspiration_pneumonia", label: "誤嚥性肺炎" },
  { value: "congestive_heart_failure", label: "うっ血性心不全" },
  { value: "urinary_tract_infection", label: "尿路感染症" },
  { value: "diabetes", label: "糖尿病" },
  { value: "hypertension", label: "高血圧症" },
  { value: "osteoporosis", label: "骨粗しょう症" },
  { value: "rheumatoid_arthritis", label: "関節リウマチ" },
  { value: "cancer", label: "がん" },
  { value: "depression", label: "うつ病" },
  { value: "dementia", label: "認知症" },
  { value: "pressure_ulcer", label: "褥瘡" },
  { value: "neurological", label: "神経疾患" },
  { value: "musculoskeletal", label: "運動器疾患" },
  { value: "respiratory", label: "呼吸器疾患" },
  { value: "circulatory", label: "循環器疾患" },
  { value: "digestive", label: "消化器疾患" },
  { value: "renal", label: "腎疾患" },
  { value: "endocrine", label: "内分泌疾患" },
  { value: "skin", label: "皮膚疾患" },
  { value: "psychiatric", label: "精神疾患" },
  { value: "other", label: "その他" },
] as const;
export type KunrenComplication = (typeof KUNREN_COMPLICATIONS)[number]["value"];
export const kunrenComplicationSchema = z.enum(KUNREN_COMPLICATIONS.map((c) => c.value) as [KunrenComplication, ...KunrenComplication[]]);

export const kunrenSheetFieldsShape = {
  /** 作成日 */
  createdOn: z.string().date().optional(),
  /** 計画作成者（職員 ID） */
  plannerStaffId: z.string().uuid().optional(),
  /** 職種 */
  plannerJobType: z.string().max(40).optional(),
  clientWish: z.string().max(5000).optional(),
  familyWish: z.string().max(5000).optional(),
  socialParticipation: z.string().max(5000).optional(),
  homeEnvironment: z.string().max(5000).optional(),
  /** 病名 */
  diseaseName: z.string().max(500).optional(),
  /** 発症日・受傷日 */
  onsetOn: z.string().date().optional(),
  /** 直近の入院日 */
  lastAdmittedOn: z.string().date().optional(),
  /** 直近の退院日 */
  lastDischargedOn: z.string().date().optional(),
  /** 合併症（コード・重複は口が除く） */
  complications: z.array(kunrenComplicationSchema).max(KUNREN_COMPLICATIONS.length).optional(),
  /** 合併症の「その他」 */
  complicationsOther: z.string().max(500).optional(),
  longGoalBodyFunction: z.string().max(2000).optional(),
  longGoalActivity: z.string().max(2000).optional(),
  longGoalParticipation: z.string().max(2000).optional(),
  /** 利用者本人・家族等がサービス利用時間以外に実施すること */
  selfPractice: z.string().max(5000).optional(),
  /** 特記事項 */
  specialNote: z.string().max(5000).optional(),
  /** Ⅲ 個別機能訓練の実施による変化（評価の欄） */
  outcomeChange: z.string().max(5000).optional(),
  /** Ⅲ 個別機能訓練実施における課題とその要因（評価の欄） */
  issuesAndFactors: z.string().max(5000).optional(),
  /** 説明日 */
  explainedOn: z.string().date().optional(),
  /** 説明者 */
  explainerName: z.string().max(200).optional(),
} as const;

export const trainingPlanProgramSchema = z
  .object({
    /** プログラム内容（何を目的に（〜のために）〜する） */
    content: z.string().max(TRAINING_PROGRAM_CONTENT_MAX).optional(),
    /** 留意点 */
    caution: z.string().max(TRAINING_PROGRAM_CAUTION_MAX).optional(),
    /** 頻度（週 N 回） */
    timesPerWeek: z.number().int().min(1).max(7).optional(),
    /** 時間（分/回） */
    minutesPerTime: z.number().int().min(1).max(600).optional(),
    /** 主な実施者（職種・名前の文字） */
    mainStaff: z.string().max(200).optional(),
    /** 運動メニュー（facility.dayservice_exercise_menus の id・重複なし） */
    menuIds: z.array(z.string().uuid()).max(10).optional(),
    /** 訓練項目名（前の鍵） */
    name: z.string().max(200).optional(),
    /** 具体的な方法・手技（前の鍵） */
    method: z.string().max(1000).optional(),
    /** 頻度（前の鍵・例 "週3回"） */
    frequency: z.string().max(200).optional(),
    /** 実施時間（分・前の鍵） */
    durationMin: z.number().int().min(1).max(999).optional(),
    /** 担当者・職種（前の鍵） */
    staff: z.string().max(200).optional(),
    /** 備考（前の鍵） */
    note: z.string().max(1000).optional(),
  })
  .refine((p) => (p.content ?? p.name ?? "").trim() !== "", { message: "プログラム内容を入れてください" })
  .refine((p) => !p.menuIds || new Set(p.menuIds).size === p.menuIds.length, { message: "同じ運動メニューが 2 回あります" });

export type TrainingPlanProgram = z.infer<typeof trainingPlanProgramSchema>;

export const TRAINING_PROGRAMS_MAX = 4;

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
  programs: z.array(trainingPlanProgramSchema).max(TRAINING_PROGRAMS_MAX).optional(),
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
  ...kunrenSheetFieldsShape,
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
