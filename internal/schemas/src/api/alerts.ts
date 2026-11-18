import { z } from "zod";

/** アラート種別 ON/OFF 更新 body（PUT /alerts/settings/:kind）。 */
export const updateAlertSettingSchema = z.object({
  enabled: z.boolean(),
});
