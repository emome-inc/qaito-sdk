import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const createClientTransportSchema = z.object({
  has_wheelchair: z.boolean().default(false),
  seat_assignment: z.string().optional(),
  pre_arrival_notice: z.string().optional(),
  pickup_latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  pickup_longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  transport_assistance_note: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientTransportSchema = partialForUpdate(createClientTransportSchema);

export const createClientTransportRestrictionSchema = z.object({
  staff_id: z.string().uuid("スタッフを選択してください"),
  reason: z.string().optional(),
});

export const updateClientTransportRestrictionSchema =
  createClientTransportRestrictionSchema.partial();

export const clientTransportClientIdParam = z.object({ client_id: z.string().uuid() });
export const clientTransportRestrictionIdParam = z.object({
  client_id: z.string().uuid(),
  restriction_id: z.string().uuid(),
});
