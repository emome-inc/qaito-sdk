import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const reasonOptions = [
  { value: "initial", label: "新規（初回アセスメント）" },
  { value: "renewal", label: "更新（定期アセスメント）" },
  { value: "discharge", label: "退院・退所時" },
  { value: "level_change", label: "区分変更申請時" },
  { value: "other", label: "その他" },
] as const;

export const independenceMobilityOptions = [
  { value: "independent", label: "自立" },
  { value: "J1", label: "J1 — 交通機関等を利用して外出する" },
  { value: "J2", label: "J2 — 隣近所へなら外出する" },
  { value: "A1", label: "A1 — 介助なしに外出し日中ベッドから離れている" },
  { value: "A2", label: "A2 — 外出の頻度が少なく日中も寝たり起きたり" },
  { value: "B1", label: "B1 — 車いすに移乗し食事排泄はベッドから離れて行う" },
  { value: "B2", label: "B2 — 介助により車いすに移乗する" },
  { value: "C1", label: "C1 — 自力で寝返りをうつ" },
  { value: "C2", label: "C2 — 自力では寝返りもうてない" },
] as const;

export const independenceDementiaOptions = [
  { value: "independent", label: "自立" },
  { value: "I", label: "Ⅰ — 何らかの認知症を有するがほぼ自立" },
  { value: "IIa", label: "Ⅱa — 家庭外で症状が見られる" },
  { value: "IIb", label: "Ⅱb — 家庭内でも症状が見られる" },
  { value: "IIIa", label: "Ⅲa — 日中を中心に支障をきたす症状" },
  { value: "IIIb", label: "Ⅲb — 夜間を中心に支障をきたす症状" },
  { value: "IV", label: "Ⅳ — 症状が頻繁に見られる" },
  { value: "M", label: "M — 専門医療を必要とする" },
] as const;

export const mobilityMethodOptions = [
  { value: "independent", label: "自立歩行" },
  { value: "assisted_walking", label: "介助歩行" },
  { value: "cane", label: "杖" },
  { value: "walker", label: "歩行器" },
  { value: "wheelchair", label: "車いす" },
  { value: "stretcher", label: "ストレッチャー" },
] as const;

export const adlLevelOptions = [
  { value: "independent", label: "自立" },
  { value: "monitoring", label: "見守り" },
  { value: "partially_assisted", label: "一部介助" },
  { value: "fully_assisted", label: "全介助" },
  { value: "unable", label: "不可" },
] as const;

export const mentalExpressionOptions = [
  { value: "can", label: "できる" },
  { value: "sometimes", label: "時々できる" },
  { value: "cannot", label: "できない" },
] as const;

export const nutritionRiskOptions = [
  { value: "low", label: "低リスク" },
  { value: "medium", label: "中リスク" },
  { value: "high", label: "高リスク" },
] as const;

export const overallEvaluationOptions = [
  { value: "improved", label: "改善" },
  { value: "improving", label: "改善傾向" },
  { value: "maintained", label: "維持" },
  { value: "not_improved", label: "改善が認められない" },
] as const;

export const emotionOptions = [
  "笑顔", "喜び", "活発", "穏やか", "不安", "怒り", "抑うつ", "不穏",
] as const;

export const adlItems = [
  { key: "turning_over", label: "寝返り" },
  { key: "sitting_up", label: "起き上がり" },
  { key: "transfer", label: "移乗" },
  { key: "standing", label: "立位保持" },
  { key: "walking", label: "歩行" },
  { key: "dressing", label: "着衣" },
  { key: "eating", label: "食事" },
  { key: "bathing", label: "入浴" },
  { key: "toileting", label: "排泄動作" },
  { key: "grooming", label: "整容" },
] as const;

export const iadlItems = [
  { key: "cooking", label: "調理" },
  { key: "cleaning", label: "掃除" },
  { key: "laundry", label: "洗濯" },
  { key: "shopping", label: "買物" },
  { key: "money_management", label: "金銭管理" },
  { key: "medication_management", label: "服薬管理" },
  { key: "phone_use", label: "電話利用" },
  { key: "transportation", label: "外出・交通手段" },
  { key: "hobby_activities", label: "趣味活動" },
] as const;

type OptionValue<T extends readonly { readonly value: string }[]> = T[number]["value"];

/** `{ value, label }` の選択肢から z.enum を作る（値の SoT は選択肢 1 か所）。 */
function enumOf<T extends readonly { readonly value: string }[]>(options: T) {
  return z.enum(
    options.map((o) => o.value) as unknown as [OptionValue<T>, ...OptionValue<T>[]],
  );
}

const adlLevel = enumOf(adlLevelOptions);

const adlSchema = z.object({
  turning_over: adlLevel.optional(),
  sitting_up: adlLevel.optional(),
  transfer: adlLevel.optional(),
  standing: adlLevel.optional(),
  walking: adlLevel.optional(),
  dressing: adlLevel.optional(),
  eating: adlLevel.optional(),
  bathing: adlLevel.optional(),
  toileting: adlLevel.optional(),
  grooming: adlLevel.optional(),
  notes: z.string().optional(),
});

const iadlSchema = z.object({
  cooking: adlLevel.optional(),
  cleaning: adlLevel.optional(),
  laundry: adlLevel.optional(),
  shopping: adlLevel.optional(),
  money_management: adlLevel.optional(),
  medication_management: adlLevel.optional(),
  phone_use: adlLevel.optional(),
  transportation: adlLevel.optional(),
  hobby_activities: adlLevel.optional(),
  notes: z.string().optional(),
});

const bodyMapSchema = z.object({
  pain_areas: z.array(z.string()).optional(),
  paralysis_areas: z.array(z.string()).optional(),
  skin_issues: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const nutritionSchema = z.object({
  height_cm: z.number().optional(),
  weight_kg: z.number().optional(),
  bmi: z.number().optional(),
  risk: enumOf(nutritionRiskOptions).optional(),
  meal_form: z.string().optional(),
  hydration_notes: z.string().optional(),
  notes: z.string().optional(),
});

export const createAssessmentSchema = z.object({
  assessed_at: z.string().min(1, "実施日は必須です"),
  reason: enumOf(reasonOptions).optional(),
  reason_other: z.string().optional(),

  independence_mobility: enumOf(independenceMobilityOptions).optional(),

  independence_dementia: enumOf(independenceDementiaOptions).optional(),

  mobility_method: enumOf(mobilityMethodOptions).optional(),

  adl: adlSchema.optional(),
  iadl: iadlSchema.optional(),

  cognition_notes: z.string().optional(),
  has_short_term_memory_loss: z.boolean().optional(),
  has_disorientation: z.boolean().optional(),
  communication_notes: z.string().optional(),

  social_participation_notes: z.string().optional(),
  has_social_isolation: z.boolean().optional(),

  excretion_notes: z.string().optional(),
  uses_diaper: z.boolean().optional(),
  uses_portable_toilet: z.boolean().optional(),

  has_wandering: z.boolean().default(false),
  has_violence: z.boolean().default(false),
  has_hallucination: z.boolean().default(false),
  has_delusion: z.boolean().default(false),
  has_sleep_disturbance: z.boolean().default(false),
  has_refusal: z.boolean().default(false),
  bpsd_notes: z.string().optional(),

  care_capacity_notes: z.string().optional(),
  has_family_caregiver: z.boolean().optional(),
  caregiver_health_notes: z.string().optional(),
  caregiver_burden_notes: z.string().optional(),

  living_environment_notes: z.string().optional(),
  has_home_hazard: z.boolean().optional(),
  home_hazard_notes: z.string().optional(),

  has_tube_feeding: z.boolean().default(false),
  has_oxygen_therapy: z.boolean().default(false),
  has_suction: z.boolean().default(false),
  has_tracheostomy: z.boolean().default(false),
  has_urinary_catheter: z.boolean().default(false),
  has_stoma: z.boolean().default(false),
  has_insulin_injection: z.boolean().default(false),
  has_dialysis: z.boolean().default(false),
  special_medical_notes: z.string().optional(),

  mental_expression_will: enumOf(mentalExpressionOptions).optional(),
  mental_expression_emotion: enumOf(mentalExpressionOptions).optional(),
  observed_emotions: z.array(z.string()).optional(),
  mental_notes: z.string().optional(),

  body_map: bodyMapSchema.optional(),

  nutrition: nutritionSchema.optional(),

  overall_evaluation: enumOf(overallEvaluationOptions).optional(),

  summary: z.string().optional(),
  memo: z.string().optional(),
});

export const updateAssessmentSchema = partialForUpdate(createAssessmentSchema);
