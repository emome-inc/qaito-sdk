import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const mealTagStapleTypeOptions = [
  { value: "regular", label: "普通食" },
  { value: "soft", label: "軟食" },
  { value: "minced", label: "刻み食" },
  { value: "blended", label: "ミキサー食" },
  { value: "porridge", label: "粥" },
  { value: "other", label: "その他" },
] as const;

export const mealTagStapleTypeValues = [
  "regular",
  "soft",
  "minced",
  "blended",
  "porridge",
  "other",
] as const;

export const createClientDietarySchema = z.object({
  staple_amount: z.string().optional(),
  side_amount: z.string().optional(),
  fluid_ml: z.number().int().min(0).optional().nullable(),
  snack_note: z.string().optional(),

  needs_breakfast_support: z.boolean().default(false),
  needs_dinner_support: z.boolean().default(false),

  meal_tag_staple_type: z.enum(mealTagStapleTypeValues).optional().nullable(),
  meal_tag_staple_amount: z.string().optional(),
  meal_tag_side_amount: z.string().optional(),
  meal_tag_side_size: z.string().optional(),
  meal_tag_note: z.string().optional(),

  food_restrictions: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateClientDietarySchema = partialForUpdate(createClientDietarySchema);

export const clientDietaryClientIdParam = z.object({ client_id: z.string().uuid() });
