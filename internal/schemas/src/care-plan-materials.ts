import { z } from "zod";

export const CARE_PLAN_MATERIAL_PURPOSES = ["plan", "evaluation"] as const;
/** 行を指す材料（1 つの行が 1 つの材料） */
export const CARE_PLAN_ROW_MATERIAL_KINDS = [
  "kyotaku_plan",
  "dayservice_plan",
  "plan_evaluation",
  "assessment",
  "interest_check",
  "life_function_check",
  "life_submission",
] as const;
/** 期間で持つ材料（行が多いので行を指さない） */
export const CARE_PLAN_PERIOD_MATERIAL_KINDS = ["care_record", "training_record", "clinical"] as const;
export const CARE_PLAN_MATERIAL_KINDS = [...CARE_PLAN_ROW_MATERIAL_KINDS, ...CARE_PLAN_PERIOD_MATERIAL_KINDS] as const;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 材料 1 つ。行の材料は row_id、期間の材料は period_from / period_to を持つ */
export const carePlanMaterialSelectionSchema = z
  .object({
    kind: z.enum(CARE_PLAN_MATERIAL_KINDS),
    row_id: z.string().uuid().nullable().optional(),
    period_from: day.nullable().optional(),
    period_to: day.nullable().optional(),
  })
  .refine(
    (m) =>
      (CARE_PLAN_ROW_MATERIAL_KINDS as readonly string[]).includes(m.kind)
        ? !!m.row_id && !m.period_from && !m.period_to
        : !m.row_id && !!m.period_from && !!m.period_to && m.period_from <= m.period_to,
    { message: "材料の指定が不正です" },
  );

/** PUT /care-plan/plans/:id/materials — その用途の材料を全部入れ替える（空なら材料なし） */
export const replaceCarePlanMaterialsSchema = z.object({
  purpose: z.enum(CARE_PLAN_MATERIAL_PURPOSES),
  materials: z.array(carePlanMaterialSelectionSchema).max(100),
});
export type ReplaceCarePlanMaterialsInput = z.infer<typeof replaceCarePlanMaterialsSchema>;

/** GET /care-plan/plans/:id/materials?purpose= */
export const carePlanMaterialsQuerySchema = z.object({
  purpose: z.enum(CARE_PLAN_MATERIAL_PURPOSES).default("plan"),
});

/** 材料を選んでから作る計画書の種類（材料を持つ種類だけ） */
export const CARE_PLAN_NEW_PLAN_TYPES = ["tsusho", "kunren"] as const;

export const newCarePlanMaterialsQuerySchema = z.object({
  plan_type: z.enum(CARE_PLAN_NEW_PLAN_TYPES),
  /** 元にするケアプラン（同じ利用者の未削除の行）。省けば今のケアプラン */
  base_care_plan_id: z.string().uuid().optional(),
});
export type NewCarePlanMaterialsQuery = z.infer<typeof newCarePlanMaterialsQuerySchema>;

/** POST /care-plan/clients/:client_id/new-plan — 材料を選んで計画書の下書きを作る（次の版なら確定の最新版を写す） */
export const createClientCarePlanSchema = z.object({
  plan_type: z.enum(CARE_PLAN_NEW_PLAN_TYPES),
  /** 元にするケアプラン。新しい計画書のときだけ使う（次の版は前の版を写すときに今のケアプランへ寄せる） */
  base_care_plan_id: z.string().uuid().optional(),
  materials: z.array(carePlanMaterialSelectionSchema).max(100),
});
export type CreateClientCarePlanInput = z.infer<typeof createClientCarePlanSchema>;
