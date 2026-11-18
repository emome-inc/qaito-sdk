import { z } from "zod";

export { careLevelOptions } from "./shared-options";
import { serviceCategoryValues } from "./shared-options";
import { partialForUpdate } from "./partial-for-update";

export const careLevelSchema = z.enum([
  "support_1", "support_2",
  "care_1", "care_2", "care_3", "care_4", "care_5",
]);

export const dementiaLevelValues = ["01", "02", "03", "04", "05", "06", "07", "08"] as const;
export const dementiaLevelOptions = [
  { value: "01", label: "自立" },
  { value: "02", label: "Ⅰ" },
  { value: "03", label: "Ⅱa" },
  { value: "04", label: "Ⅱb" },
  { value: "05", label: "Ⅲa" },
  { value: "06", label: "Ⅲb" },
  { value: "07", label: "Ⅳ" },
  { value: "08", label: "M" },
] as const;
export const physicalDisabilityLevelValues = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;
export const physicalDisabilityLevelOptions = [
  { value: "01", label: "自立" },
  { value: "02", label: "J1" },
  { value: "03", label: "J2" },
  { value: "04", label: "A1" },
  { value: "05", label: "A2" },
  { value: "06", label: "B1" },
  { value: "07", label: "B2" },
  { value: "08", label: "C1" },
  { value: "09", label: "C2" },
] as const;

export const certificationStatusValues = ["certified", "applying", "renewal_applying", "change_applying"] as const;
export type CertificationStatus = (typeof certificationStatusValues)[number];
export const certificationStatusOptions = [
  { value: "certified", label: "認定済" },
  { value: "applying", label: "申請中" },
  { value: "renewal_applying", label: "更新申請中" },
  { value: "change_applying", label: "区分変更申請中" },
] as const;

export const createCareCertificationSchema = z.object({
  service_category: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  service_type_code: z
    .string()
    .max(2, "サービス種別コードは 2 文字以内です")
    .optional()
    .nullable(),

  care_level: careLevelSchema,
  certified_date: z.string().date().optional(),
  valid_from: z.string().date().optional(),
  valid_until: z.string().date().optional(),
  certification_status: z.enum(certificationStatusValues).optional(),

  support_limit_amount: z.number().int().min(0).optional(),

  memo: z.string().optional(),
});

export const updateCareCertificationSchema = partialForUpdate(createCareCertificationSchema);

export const careCertificationIdParam = z.object({
  client_id: z.string().uuid(),
  certification_id: z.string().uuid(),
});
