import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { normalizeKanaName } from "./kana";

export const staffStatusOptions = [
  { value: "active", label: "在籍" },
  { value: "inactive", label: "休職中" },
  { value: "retired", label: "退職済み" },
] as const;

export const staffGenderOptions = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "その他" },
] as const;

export const staffEmploymentTypeOptions = [
  { value: "full_time", label: "常勤" },
  { value: "part_time", label: "非常勤" },
] as const;

const workTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻は HH:MM 形式で入力してください");

const employeePrefixSchema = z
  .string()
  .regex(/^[A-Z]{0,2}$/, "プレフィックスは大文字英字 0〜2 文字で入力してください")
  .default("");

export const createStaffSchema = z.object({
  family_name: z.string().min(1, "姓（漢字）は必須です"),
  given_name: z.string().min(1, "名（漢字）は必須です"),
  family_name_kana: z.string().transform(normalizeKanaName).optional(),
  given_name_kana: z.string().transform(normalizeKanaName).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  birth_date: z.string().date().optional(),
  hire_date: z.string().date("入職日は YYYY-MM-DD 形式で入力してください"),
  status: z.enum(["active", "inactive", "retired"]).default("active"),
  employment_type: z.enum(["full_time", "part_time"]).nullable().optional(),
  default_work_start: workTimeSchema.nullable().optional(),
  default_work_end: workTimeSchema.nullable().optional(),
  employee_prefix: employeePrefixSchema,
  phone: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email().optional(),
  personal_email: z.string().email().optional(),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address_line: z.string().optional(),
  has_spouse: z.boolean().default(false),
  dependent_count: z.number().int().min(0).default(0),
  external_payroll_staff_id: z.string().optional(),
  memo: z.string().optional(),
});

export const updateStaffSchema = partialForUpdate(
  createStaffSchema.omit({ employee_prefix: true }),
);

export const STAFF_REQUIRED_FIELDS = [
  { key: "family_name", label: "氏名（姓）" },
  { key: "given_name", label: "氏名（名）" },
  { key: "hire_date", label: "入職日" },
] as const;

export type StaffRequiredFieldKey = (typeof STAFF_REQUIRED_FIELDS)[number]["key"];

const STAFF_REQUIRED_KEYS: ReadonlySet<string> = new Set(STAFF_REQUIRED_FIELDS.map((f) => f.key));

/** 従業員フォームでそのキーが必須か。 */
export function isStaffRequiredField(key: string): boolean {
  return STAFF_REQUIRED_KEYS.has(key);
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/**
 * 未入力の必須項目の**項目名**を返す（値は返さない）。
 * - create: キーが無い・空のものを未入力とする
 * - update: 部分更新なので、送られてきて空のものだけを未入力とする
 */
export function missingStaffRequiredFields(
  input: Record<string, unknown>,
  mode: "create" | "update",
): string[] {
  return STAFF_REQUIRED_FIELDS.filter(({ key }) => {
    if (mode === "update" && !(key in input)) return false;
    return isBlank(input[key]);
  }).map((f) => f.label);
}

export const createQualificationSchema = z.object({
  qualification_name: z.string().min(1, "資格名は必須です"),
  certificate_number: z.string().optional(),
  acquired_date: z.string().date().optional(),
  expiry_date: z.string().date().optional(),
  issuing_body: z.string().optional(),
  memo: z.string().optional(),
});

export const updateQualificationSchema = createQualificationSchema.partial();

export const createAssignmentSchema = z.object({
  facility_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  is_primary: z.boolean().optional(),
  role: z.string().optional(),
  started_at: z.string().date("開始日は YYYY-MM-DD 形式で入力してください"),
  ended_at: z.string().date().optional().nullable(),
  memo: z.string().optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const staffFamilyRelationOptions = [
  { value: "spouse", label: "配偶者" },
  { value: "child", label: "子" },
  { value: "parent", label: "親" },
  { value: "sibling", label: "兄弟・姉妹" },
  { value: "other", label: "その他" },
] as const;

export const createFamilyMemberSchema = z.object({
  relation: z.enum(["spouse", "child", "parent", "sibling", "other"]),
  name: z.string().min(1, "氏名は必須です"),
  name_kana: z.string().transform(normalizeKanaName).optional(),
  birth_date: z.string().date().optional(),
  is_dependent: z.boolean().default(false),
  memo: z.string().optional(),
});

export const updateFamilyMemberSchema = partialForUpdate(createFamilyMemberSchema);

export const createEmergencyContactSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  name_kana: z.string().transform(normalizeKanaName).optional(),
  relation: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  is_primary: z.boolean().default(false),
  memo: z.string().optional(),
});

export const updateEmergencyContactSchema = partialForUpdate(createEmergencyContactSchema);

export const employeeCategoryOptions = [
  { value: "seishain", label: "正社員" },
  { value: "muki_koyo", label: "無期雇用" },
  { value: "yuki_koyo", label: "有期雇用" },
] as const;

export const socialInsuranceCategoryOptions = [
  { value: "seishain", label: "正社員" },
  { value: "tanjikan_seishain", label: "短時間正社員" },
  { value: "muki_keiyaku", label: "無期契約" },
  { value: "yuki_keiyaku", label: "有期契約" },
] as const;

export const employmentRuleCategoryOptions = [
  { value: "seishain", label: "正社員" },
  { value: "tanjikan_seishain", label: "短時間正社員" },
  { value: "muki_koyo", label: "無期雇用" },
  { value: "yuki_koyo", label: "有期雇用" },
] as const;

export const createEmploymentSchema = z.object({
  employee_category: z.enum(["seishain", "muki_koyo", "yuki_koyo"]),
  social_insurance_category: z
    .enum(["seishain", "tanjikan_seishain", "muki_keiyaku", "yuki_keiyaku"])
    .optional()
    .nullable(),
  employment_rule_category: z
    .enum(["seishain", "tanjikan_seishain", "muki_koyo", "yuki_koyo"])
    .optional()
    .nullable(),
  weekly_work_days: z.number().min(0).max(7).optional().nullable(),
  daily_work_hours: z.number().min(0).max(24).optional().nullable(),
  weekly_work_hours: z.number().min(0).max(168).optional().nullable(),
  commute_method: z.string().optional().nullable(),
  commute_distance_km: z.number().min(0).optional().nullable(),
  job_title: z.string().optional().nullable(),
  health_check_target: z.boolean().default(true),
});

export const updateEmploymentSchema = partialForUpdate(createEmploymentSchema);

export const taxTableTypeOptions = [
  { value: "ko", label: "甲" },
  { value: "otsu", label: "乙" },
] as const;

export const createInsuranceSchema = z.object({
  health_insurance_number: z.string().optional().nullable(),
  tax_table_type: z.enum(["ko", "otsu"]).optional().nullable(),
  employment_insurance_start_date: z.string().date().optional().nullable(),
  employment_insurance_number: z.string().optional().nullable(),
  has_employment_insurance: z.boolean().default(false),
  has_social_insurance: z.boolean().default(false),
});

export const updateInsuranceSchema = partialForUpdate(createInsuranceSchema);

export const createAllowancesSchema = z.object({
  has_qualification_allowance: z.boolean().default(false),
  family_allowance_amount: z.number().int().min(0).optional().nullable(),
});

export const updateAllowancesSchema = partialForUpdate(createAllowancesSchema);

export const createSubsidySchema = z.object({
  subsidy_name: z.string().min(1, "助成金名は必須です"),
  application_period: z.string().optional(),
  memo: z.string().optional(),
});

export const updateSubsidySchema = createSubsidySchema.partial();

export const disabilityCategoryOptions = [
  { value: "1", label: "1 級" },
  { value: "2", label: "2 級" },
  { value: "3", label: "3 級" },
  { value: "other", label: "その他" },
] as const;

export const singleParentCategoryOptions = [
  { value: "mother", label: "母子" },
  { value: "father", label: "父子" },
  { value: "other", label: "その他" },
] as const;

export const createSpecialStatusSchema = z.object({
  disability_category: z.enum(["1", "2", "3", "other"]).optional().nullable(),
  single_parent_category: z.enum(["mother", "father", "other"]).optional().nullable(),
});

export const updateSpecialStatusSchema = createSpecialStatusSchema.partial();

export const healthCheckResultCategoryOptions = [
  { value: "A", label: "A（異常なし）" },
  { value: "B", label: "B（要経過観察）" },
  { value: "C", label: "C（要検査）" },
  { value: "D", label: "D（要治療）" },
  { value: "E", label: "E（治療中）" },
] as const;

export const createHealthCheckSchema = z.object({
  exam_date: z.string().date("受診日は YYYY-MM-DD 形式で入力してください"),
  exam_type: z.string().min(1, "健診種別は必須です"),
  facility_name: z.string().optional(),
  result_category: z.enum(["A", "B", "C", "D", "E"]).optional().nullable(),
  next_exam_date: z.string().date().optional().nullable(),
  finding_memo: z.string().optional(),
});

export const updateHealthCheckSchema = createHealthCheckSchema.partial();

export const staffIdParam = z.object({ id: z.string().uuid() });
export const qualificationIdParam = z.object({
  id: z.string().uuid(),
  qualification_id: z.string().uuid(),
});
export const assignmentIdParam = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
});
export const familyIdParam = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
});
export const contactIdParam = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
});
export const subsidyIdParam = z.object({
  id: z.string().uuid(),
  subsidy_id: z.string().uuid(),
});
export const healthCheckIdParam = z.object({
  id: z.string().uuid(),
  health_check_id: z.string().uuid(),
});
