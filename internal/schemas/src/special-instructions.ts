import { z } from "zod";
import { firstDayOfMonth, lastDayOfMonth } from "./year-month";

export const specialInstructionPeriodSchema = z.object({ from: z.string().date(), until: z.string().date() });
export type SpecialInstructionPeriod = z.infer<typeof specialInstructionPeriodSchema>;
export const nursingReportWarningsSchema = z.object({ pendingSpecialInstructions: z.array(specialInstructionPeriodSchema) });
export type NursingReportWarnings = z.infer<typeof nursingReportWarningsSchema>;

/** 通知用。保険の判定に使う受領済み指示書の条件とは分ける。 */
export function pendingSpecialInstructionPeriods(
  instructions: readonly { instructionType: string; documentStatus: string; validFrom: string | null; validUntil: string | null }[],
  month: string,
): SpecialInstructionPeriod[] {
  const from = firstDayOfMonth(month), until = lastDayOfMonth(month);
  return instructions.filter(d => d.documentStatus === "requested" &&
    ["tokubetsu", "seishinka_tokubetsu", "tenteki"].includes(d.instructionType) &&
    d.validFrom !== null && d.validFrom <= until && (d.validUntil === null || d.validUntil >= from))
    .map(d => ({ from: d.validFrom! < from ? from : d.validFrom!, until: d.validUntil === null || d.validUntil > until ? until : d.validUntil }))
    .sort((a, b) => a.from.localeCompare(b.from) || a.until.localeCompare(b.until));
}
