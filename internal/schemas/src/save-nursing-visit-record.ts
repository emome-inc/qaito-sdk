import { z } from "zod";
import { provideScheduleVisitSchema } from "./schedule-visits";
import { createNursingVisitRecordSchema, updateNursingVisitRecordSchema } from "./nursing-visit-records";
/**
 * 記録書Ⅱとバイタルを 1 回で保存する口の入力。新規作成と更新で口を分ける（形から新規か更新かを推し量らない）。
 *
 * - 新規（`POST /nursing/visit-records/save`）: 記録書Ⅱは新規作成のスキーマだけで読む
 * - 更新（`PATCH /nursing/visit-records/clients/:clientId/:id/save`）: 記録書Ⅱは更新のスキーマだけで読む
 *   （新規作成の既定値〔status: "final" 等〕が入らない）
 *
 * バイタルは `vitalId` があれば更新、無ければ新規作成のスキーマで手順の中で読む。ここでは読まない ──
 * 両方のスキーマを並べて受けると、更新のつもりの入力に新規作成の既定値（通所 15・介護保険・実測）が入る。
 * 知らない項目は弾く（新規の口に `recordId` を付けて送ると、黙って捨てられて新しい記録を作りにいくため）。
 */
const timing = provideScheduleVisitSchema.optional();
const vitalInput = z.record(z.string(), z.unknown()).optional();
export const saveNursingVisitRecordSchema = z
  .object({ clientId: z.string().uuid(), vitalId: z.string().uuid().optional(), record: createNursingVisitRecordSchema, vital: vitalInput, timing })
  .strict();
export const updateSaveNursingVisitRecordSchema = z
  .object({ vitalId: z.string().uuid().optional(), record: updateNursingVisitRecordSchema, vital: vitalInput, timing })
  .strict();
export type SaveNursingVisitRecordInput = z.input<typeof saveNursingVisitRecordSchema>;
export type UpdateSaveNursingVisitRecordInput = z.input<typeof updateSaveNursingVisitRecordSchema>;
