import { z } from "zod";

export const createMedicalInstitutionSchema = z.object({
  name: z.string().min(1, "医療機関名は必須です"),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  medical_department: z.array(z.string()).optional(),
  memo: z.string().optional(),
});

export const updateMedicalInstitutionSchema = createMedicalInstitutionSchema.partial();
