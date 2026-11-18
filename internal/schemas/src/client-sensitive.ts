import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

/**
 * 障害手帳の種別
 * DB には英語コード値を格納。日本語ラベルはアプリ層の責務。
 */
export const disabilityCertificateTypeOptions = [
  { value: "physical", label: "身体障害者手帳" },
  { value: "intellectual", label: "療育手帳" },
  { value: "mental", label: "精神障害者保健福祉手帳" },
] as const;

export const disabilityCertificateTypeValues = [
  "physical",
  "intellectual",
  "mental",
] as const;

export const createClientSensitiveSchema = z.object({
  has_disability_certificate: z.boolean().default(false),
  disability_type: z
    .enum(disabilityCertificateTypeValues)
    .optional()
    .nullable(),
  disability_details: z.string().optional(),
});

export const updateClientSensitiveSchema = partialForUpdate(createClientSensitiveSchema);

export const clientSensitiveClientIdParam = z.object({ client_id: z.string().uuid() });
