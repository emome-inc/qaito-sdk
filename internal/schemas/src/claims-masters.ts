import { z } from "zod";
import { nationalMedicationRowSchema } from "./medications";
import { nationalDiseaseModifierRowSchema, nationalDiseaseRowSchema } from "./national-diseases";

/** CHECK: master_kind IN (...) — §3.2.1 / §3.2.2 の 10 種 */
export const masterKinds = [
  "service_code",
  "regional_grade",
  "regional_unit_price",
  "benefit_limit",
  "shogu_rate",
  "prorate",
  "error_code",
  "municipal",
  "insurer",
  "type_limit",
  "medication",
  "disease",
  "disease_modifier",
] as const;
export type MasterKind = (typeof masterKinds)[number];

/** CHECK: status IN ('staged','active','superseded') */
export const masterVersionStatuses = ["staged", "active", "superseded"] as const;
export type MasterVersionStatus = (typeof masterVersionStatuses)[number];

/**
 * 版メタデータ（§5.5.2 admin 取込 Dialog / §5.4.1 codegen CLI 双方の入力骨子）。
 * municipality_code は master_kind='municipal' のときのみ必須（§5.5.1）。
 */
export const masterVersionMetaSchema = z
  .object({
    master_kind: z.enum(masterKinds),
    version_label: z.string().min(1, "版ラベルは必須です"),
    effective_from: z.string().date("effective_from は YYYY-MM-DD 形式です"),
    effective_until: z.string().date().optional().nullable(),
    municipality_code: z
      .string()
      .regex(/^\d{5}$/, "municipality_code は JIS 5桁コードです")
      .optional()
      .nullable(),
    source_url: z.string().url().optional().nullable(),
    source_checksum: z.string().length(64, "sha256 は 64 文字です").optional().nullable(),
  })
  .refine(
    (v) => v.master_kind !== "municipal" || !!v.municipality_code,
    { message: "master_kind='municipal' には municipality_code が必須です", path: ["municipality_code"] },
  );
export type MasterVersionMetaInput = z.infer<typeof masterVersionMetaSchema>;

/** service_codes.unit_basis / municipal_service_codes.unit_basis 共通 CHECK */
export const unitBasisValues = ["per_day", "per_time", "per_month", "per_event"] as const;
export type UnitBasis = (typeof unitBasisValues)[number];

/** service_codes.category / municipal_service_codes.category 共通 CHECK */
export const serviceCodeCategoryValues = ["base", "addition", "subtraction", "rate_fixed"] as const;
export type ServiceCodeCategory = (typeof serviceCodeCategoryValues)[number];

/** service_codes.alt_table — 定超/人欠の別建てフルコード表区分（§5.4.1 ✅確定(W-0)） */
export const altTableValues = ["none", "teicho", "jinketsu", "teicho_jinketsu"] as const;
export type AltTableValue = (typeof altTableValues)[number];

/** service_codes.medical_deduction_class（U3 の判定入力） */
export const medicalDeductionClassValues = ["medical", "welfare", "none"] as const;
export type MedicalDeductionClass = (typeof medicalDeductionClassValues)[number];

/** regional_grades.grade / regional_unit_prices.grade / facility_billing_profiles.region_grade_override 共通 */
export const regionGradeValues = ["1", "2", "3", "4", "5", "6", "7", "other"] as const;
export type RegionGrade = (typeof regionGradeValues)[number];

/** regional_unit_prices.labor_ratio_class（通所介護は '45' 固定だがマスタ行としては 3 値保持） */
export const laborRatioClassValues = ["70", "55", "45"] as const;
export type LaborRatioClass = (typeof laborRatioClassValues)[number];

/** benefit_limits.care_level（§4.3 CareLevel と同型） */
export const careLevelValues = [
  "support1",
  "support2",
  "care1",
  "care2",
  "care3",
  "care4",
  "care5",
] as const;
export type CareLevelValue = (typeof careLevelValues)[number];

/**
 * 処遇改善加算の区分（facility_billing_profiles.shogu_kaizen_tier）。令和 8 年 6 月以降の 6 区分
 * （I1 = Ⅰイ・I2 = Ⅰロ・II1 = Ⅱイ・II2 = Ⅱロ・Ⅲ・Ⅳ。国のサービスコード名の「Ⅰ１」「Ⅰ２」と同じ並び）と、
 * 区分の無いサービス（訪問看護・訪問リハ・居宅介護支援・介護予防支援）で算定することを表す `single`。
 * 出典: 介護保険最新情報 Vol.1479（老発0313第6号）別紙1 表1-2〜1-5。
 */
export const shoguKaizenTierValues = ["I1", "I2", "II1", "II2", "III", "IV", "single"] as const;
export type ShoguKaizenTier = (typeof shoguKaizenTierValues)[number];

/**
 * 率のマスタ（shogu_kaizen_rates.tier）の区分。上の区分に、令和 8 年 4・5 月（表1-1・4 区分）の Ⅰ・Ⅱ を足したもの
 * （Ⅲ・Ⅳ は 4・5 月も 6 月以降も同じ名前）。
 */
export const shoguKaizenRateTierValues = [...shoguKaizenTierValues, "I", "II"] as const;
export type ShoguKaizenRateTier = (typeof shoguKaizenRateTierValues)[number];

export const SHOGU_TIER_BEFORE_R0806: Readonly<Record<ShoguKaizenTier, ShoguKaizenRateTier>> = {
  I1: "I",
  I2: "I",
  II1: "II",
  II2: "II",
  III: "III",
  IV: "IV",
  single: "single",
};

/** prorate_rules.boundary */
export const prorateBoundaryValues = ["start", "end"] as const;

/** error_codes.category */
export const errorCodeCategoryValues = ["returned", "held", "assessed"] as const;

/**
 * codegen 正規化後の行スキーマ（§5.4.2 ①行スキーマ検証で確定した形）。
 *
 * ⚠️ 無償 xlsx（WAM NET）には limit_target / medical_deduction_class / rate_permille の
 * 3 列が存在しない（§0.3 #8・§5.4.1 ⚠️#1 残件）。Phase A は別途投入までこれらを
 * nullable/optional として受け付ける（DB 側 NOT NULL 充足は投入パイプライン側の責務・本スキーマの範囲外）。
 */
export const serviceCodeCsvRowSchema = z.object({
  service_type_code: z.string().length(2, "service_type_code は 2 文字です"),
  item_code: z.string().length(4, "item_code は 4 文字です"),
  name: z.string().min(1, "name は必須です"),
  short_name: z.string().optional().nullable(),
  unit_value: z.number().int().optional().nullable(),
  benefit_mgmt_unit_value: z.number().int().optional().nullable(),
  unit_basis: z.enum(unitBasisValues),
  category: z.enum(serviceCodeCategoryValues),
  alt_table: z.enum(altTableValues).default("none"),
  limit_target: z.boolean().optional().nullable(),
  medical_deduction_class: z.enum(medicalDeductionClassValues).optional().nullable(),
  rate_permille: z.number().int().optional().nullable(),
  fixed_unit_value: z.number().int().optional().nullable(),
  attrs: z.record(z.string(), z.unknown()).optional(),
});
export type ServiceCodeCsvRow = z.infer<typeof serviceCodeCsvRowSchema>;

export const regionalGradeCsvRowSchema = z.object({
  municipality_code: z.string().regex(/^\d{5}$/, "municipality_code は JIS 5桁コードです"),
  municipality_name: z.string().min(1),
  grade: z.enum(regionGradeValues),
});
export type RegionalGradeCsvRow = z.infer<typeof regionalGradeCsvRowSchema>;

export const regionalUnitPriceCsvRowSchema = z.object({
  grade: z.enum(regionGradeValues),
  labor_ratio_class: z.enum(laborRatioClassValues),
  price_hundredths: z.number().int().positive(),
});
export type RegionalUnitPriceCsvRow = z.infer<typeof regionalUnitPriceCsvRowSchema>;

export const benefitLimitCsvRowSchema = z.object({
  care_level: z.enum(careLevelValues),
  limit_units: z.number().int().nonnegative(),
});
export type BenefitLimitCsvRow = z.infer<typeof benefitLimitCsvRowSchema>;

export const shoguKaizenRateCsvRowSchema = z.object({
  service_type_code: z.string().length(2),
  tier: z.enum(shoguKaizenRateTierValues),
  rate_permille: z.number().int().nonnegative(),
});
export type ShoguKaizenRateCsvRow = z.infer<typeof shoguKaizenRateCsvRowSchema>;

export const prorateRuleCsvRowSchema = z.object({
  service_type_code: z.string().length(2),
  boundary: z.enum(prorateBoundaryValues),
  event_kind: z.string().min(1),
  basis_rule: z.string().min(1),
});
export type ProrateRuleCsvRow = z.infer<typeof prorateRuleCsvRowSchema>;

export const errorCodeCsvRowSchema = z.object({
  code: z.string().length(4, "code は 4桁英数字です"),
  title: z.string().min(1),
  cause: z.string().optional().nullable(),
  action_template: z.string().optional().nullable(),
  category: z.enum(errorCodeCategoryValues),
});
export type ErrorCodeCsvRow = z.infer<typeof errorCodeCsvRowSchema>;

export const municipalServiceCodeCsvRowSchema = z.object({
  municipality_code: z.string().regex(/^\d{5}$/, "municipality_code は JIS 5桁コードです"),
  service_type_code: z.string().length(2),
  item_code: z.string().length(4),
  name: z.string().min(1),
  unit_value: z.number().int(),
  unit_basis: z.enum(unitBasisValues),
  category: z.enum(serviceCodeCategoryValues),
  limit_target: z.boolean(),
  attrs: z.record(z.string(), z.unknown()).optional(),
});
export type MunicipalServiceCodeCsvRow = z.infer<typeof municipalServiceCodeCsvRowSchema>;

export const insurerCsvRowSchema = z.object({
  insurer_number: z.string().regex(/^\d{6}$/, "insurer_number は 6桁です"),
  name: z.string().min(1),
  municipality_code: z.string().regex(/^\d{5}$/).optional().nullable(),
  kago_deadline_normal_day: z.number().int().min(1).max(31).optional().nullable(),
  kago_deadline_same_month_day: z.number().int().min(1).max(31).optional().nullable(),
  scale_filing_deadline: z.string().optional().nullable(),
  submission_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsurerCsvRow = z.infer<typeof insurerCsvRowSchema>;

export const typeLimitCsvRowSchema = z.object({
  insurer_number: z.string().regex(/^\d{6}$/, "insurer_number は 6桁です"),
  service_type_code: z.string().length(2),
  limit_units: z.number().int().nonnegative(),
});
export type TypeLimitCsvRow = z.infer<typeof typeLimitCsvRowSchema>;

/**
 * NOTE: municipal_service_codes は master_kind='municipal' と同一分類（§5.5.1）。
 * insurers / type_limits は Phase B/C 実データ投入のため、行スキーマは先行予約のみ。
 */
export const masterRowSchemaByKind = {
  service_code: serviceCodeCsvRowSchema,
  regional_grade: regionalGradeCsvRowSchema,
  regional_unit_price: regionalUnitPriceCsvRowSchema,
  benefit_limit: benefitLimitCsvRowSchema,
  shogu_rate: shoguKaizenRateCsvRowSchema,
  prorate: prorateRuleCsvRowSchema,
  error_code: errorCodeCsvRowSchema,
  municipal: municipalServiceCodeCsvRowSchema,
  insurer: insurerCsvRowSchema,
  type_limit: typeLimitCsvRowSchema,
  medication: nationalMedicationRowSchema,
  disease: nationalDiseaseRowSchema,
  disease_modifier: nationalDiseaseModifierRowSchema,
} as const satisfies Record<MasterKind, z.ZodType>;
