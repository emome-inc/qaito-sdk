import { z } from "zod";

/** 保険の種類（`schedule_visits.insurance_result` / `insurance_override` の値域）。 */
export const VISIT_INSURANCE_VALUES = ["kaigo", "iryo"] as const;
export type VisitInsurance = (typeof VISIT_INSURANCE_VALUES)[number];

/** 手の直しの理由の上限（DB の CHECK と同じ）。 */
export const VISIT_INSURANCE_OVERRIDE_REASON_MAX = 500;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

/** `GET /schedule/clients/:clientId/visit-insurance?facilityId&month` のクエリ（clientId はパス）。 */
export const getClientVisitInsuranceQuerySchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
  month: monthSchema,
});
export type GetClientVisitInsuranceQuery = z.infer<typeof getClientVisitInsuranceQuerySchema>;

/**
 * `PUT /schedule/visits/:visitId/insurance-override` の body。
 * `insurance: null` = 自動に戻す（手の直しを消す・理由は要らない）。
 */
export const setVisitInsuranceOverrideApiSchema = z
  .object({
    insurance: z.enum(VISIT_INSURANCE_VALUES).nullable(),
    reason: z.string().trim().max(VISIT_INSURANCE_OVERRIDE_REASON_MAX).nullish(),
  })
  .refine((v) => v.insurance === null || (typeof v.reason === "string" && v.reason.length > 0), {
    path: ["reason"],
  });
export type SetVisitInsuranceOverrideInput = z.infer<typeof setVisitInsuranceOverrideApiSchema>;

/** `GET /schedule/iryo-confirmations?facilityId&month` のクエリ。 */
export const listIryoVisitConfirmationsQuerySchema = z.object({
  facilityId: z.string().uuid(),
  month: monthSchema,
});
export type ListIryoVisitConfirmationsQuery = z.infer<typeof listIryoVisitConfirmationsQuerySchema>;

/** `POST /schedule/iryo-confirmations` の body。 */
export const confirmIryoVisitMonthApiSchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
  month: monthSchema,
});
export type ConfirmIryoVisitMonthInput = z.infer<typeof confirmIryoVisitMonthApiSchema>;
