import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const createClientFamilySchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  relationship: z.string().optional(),
  birth_date: z.string().date().optional(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  living_together: z.boolean().optional(),
  is_emergency_contact: z.boolean().default(false),
  is_key_person: z.boolean().default(false),
  is_guarantor: z.boolean().default(false),
  memo: z.string().optional(),
});

export const updateClientFamilySchema = partialForUpdate(createClientFamilySchema);
