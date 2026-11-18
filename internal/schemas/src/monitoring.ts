import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const createMonitoringSchema = z.object({
  care_plan_id: z.string().uuid("ケアプランIDは必須です"),
  monitoring_date: z.string().date("モニタリング実施日は必須です"),
  client_condition: z.string().max(5000).optional(),
  plan_change_required: z.boolean().default(false),
  plan_change_reason: z.string().max(2000).optional(),
  memo: z.string().max(2000).optional(),
});

export const updateMonitoringSchema = partialForUpdate(
  createMonitoringSchema.omit({ care_plan_id: true }),
);

export type CreateMonitoringInput = z.infer<typeof createMonitoringSchema>;
export type UpdateMonitoringInput = z.infer<typeof updateMonitoringSchema>;
