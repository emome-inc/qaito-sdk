import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const createClientMedicalSchema = z.object({
  medical_institution_id: z.string().guid("医療機関の選択が正しくありません").optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  doctor_name: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().default(false),
  memo: z.string().optional(),
});

export const updateClientMedicalSchema = partialForUpdate(createClientMedicalSchema);
