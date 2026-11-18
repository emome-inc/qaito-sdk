import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { NURSING_VISIT_RECORD_LIMITS, totalChars } from "./nursing-paper-limits";
const content = z.object({
  visitId: z.string().uuid(),
  /** この訪問で測ったバイタルを追加する。既存の接続は維持する。 */
  measuredVitalIds: z.array(z.string().uuid()).max(100).optional(),
  authorStaffId: z.string().uuid().optional().nullable(),
  condition: z.string().trim().max(NURSING_VISIT_RECORD_LIMITS.condition).default(""),
  status: z.enum(["draft", "final"]).default("final"),
  careDailyLiving: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  careExcretion: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  careTreatment: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  careRehab: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  careGuidance: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  careManagement: z.string().max(NURSING_VISIT_RECORD_LIMITS.careTotal).optional().nullable(),
  comment: z.string().max(NURSING_VISIT_RECORD_LIMITS.comment).optional().nullable(),
  gafScore: z.number().int().min(0).max(100).optional().nullable(),
});
const CARE_KEYS = [
  "careDailyLiving",
  "careExcretion",
  "careTreatment",
  "careRehab",
  "careGuidance",
  "careManagement",
] as const;
const hasCare = (v: Record<string, unknown>) =>
  CARE_KEYS.some((k) => typeof v[k] === "string" && (v[k] as string).trim().length > 0);
/** 実施した看護・リハの 6 欄は記録書Ⅱの 1 つの欄に並べて印字する。合計の字数で見る */
function checkCareTotal(v: Partial<Record<(typeof CARE_KEYS)[number], string | null | undefined>>, ctx: z.RefinementCtx) {
  if (totalChars(CARE_KEYS.map((k) => v[k])) > NURSING_VISIT_RECORD_LIMITS.careTotal)
    ctx.addIssue({ code: "custom", path: ["careDailyLiving"], message: `実施した看護・リハの内容は合わせて${NURSING_VISIT_RECORD_LIMITS.careTotal}字以内` });
}
export const createNursingVisitRecordSchema = content.refine(
  (v) => v.status === "draft" || (v.condition.length > 0 && hasCare(v)),
  {
    path: ["careDailyLiving"],
    message: "実施内容を1つ以上入力してください",
  },
).superRefine(checkCareTotal);
/**
 * 更新。`expectedUpdatedAt` は同時更新の検出用（画面が読み込んだ時点の `updatedAt`・ISO 8601）で、必須。
 * 違えば CONFLICT（後から書いた人が先の保存を黙って上書きしない）。
 * ⚠️ 列ではなく条件なので、`providedKeys` の更新対象に含めない（core が除く）。
 */
export const updateNursingVisitRecordSchema = partialForUpdate(
  content.omit({ visitId: true }),
).extend({
  expectedUpdatedAt: z.string().datetime({ offset: true }),
}).superRefine(checkCareTotal);
export const listNursingVisitRecordsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  /** この利用者書類が添付された記録書Ⅱだけ */
  documentId: z.string().uuid().optional(),
});
export const addNursingVisitRecordVitalRefSchema = z.object({
  vitalId: z.string().uuid(),
});
export const addNursingVisitRecordDocumentSchema = z.object({
  documentId: z.string().uuid(),
});
export type CreateNursingVisitRecordInput = z.input<
  typeof createNursingVisitRecordSchema
>;
export type UpdateNursingVisitRecordInput = z.infer<
  typeof updateNursingVisitRecordSchema
>;
export type ListNursingVisitRecordsQuery = z.infer<
  typeof listNursingVisitRecordsQuerySchema
>;
