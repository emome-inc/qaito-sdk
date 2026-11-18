import { z } from "zod";
import { ocrExtraPartsSchema } from "./ocr-images";
import type { InstructionFormData } from "./clinical-record";

export const clinicalDocumentKinds = ["nursing_instruction", "special_instruction", "discharge_guidance"] as const;
export type ClinicalDocumentKind = (typeof clinicalDocumentKinds)[number];

export const clinicalDocumentOcrSchema = z.object({
  document_type: z.enum(clinicalDocumentKinds).optional(),
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  base64_content: z.string().min(1),
  extra_parts: ocrExtraPartsSchema.optional(),
});

export type ClinicalDocumentOcrInput = z.input<typeof clinicalDocumentOcrSchema>;
export type ClinicalDocumentOcrResult = {
  kind: ClinicalDocumentKind | "unknown" | "other";
  fields: Record<string, string | null>;
  missing: string[];
  /** 指示書の様式の欄（様式16・18）。読めた欄だけ。○の選択には要確認の印（`ocr`）が付く */
  form?: InstructionFormData;
};

export const clinicalSourceStagedIdsSchema = z.array(z.uuid()).max(4)
  .refine((ids) => new Set(ids).size === ids.length);
