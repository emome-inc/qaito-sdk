import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

/** 目標領域（機能訓練 3 領域: LIFE 対応） */
export const goalDomainOptions = [
  { value: "body_function", label: "身体機能" },
  { value: "activity",      label: "活動" },
  { value: "participation", label: "参加" },
] as const;
export type GoalDomain = (typeof goalDomainOptions)[number]["value"];

/** 達成度 */
export const achievementOptions = [
  { value: "achieved",        label: "達成" },
  { value: "partial",         label: "一部達成" },
  { value: "not_achieved",    label: "未達成" },
  { value: "not_implemented", label: "未実施" },
] as const;
export type Achievement = (typeof achievementOptions)[number]["value"];

export function isTrainingPerformed(achievement: string | null | undefined): boolean {
  return achievement !== "not_implemented";
}

/** 達成度の表示名（未知の値・空は null）。一覧の補足に出すときに使う。 */
export function achievementLabelOf(achievement: string | null | undefined): string | null {
  return achievementOptions.find((o) => o.value === achievement)?.label ?? null;
}

export const vitalSnapshotSchema = z.object({
  bp_systolic:   z.number().int().min(0).max(300).nullable().optional(),
  bp_diastolic:  z.number().int().min(0).max(200).nullable().optional(),
  pulse:         z.number().int().min(0).max(300).nullable().optional(),
  temp_celsius:  z.number().min(30).max(45).nullable().optional(),
  spo2:          z.number().int().min(0).max(100).nullable().optional(),
  weight_kg:     z.number().min(0).max(999).nullable().optional(),
  memo:          z.string().max(500).optional(),
}).strict();

export type VitalSnapshot = z.infer<typeof vitalSnapshotSchema>;

export const createTrainingRecordSchema = z.object({
  clientId:        z.string().uuid(),
  facilityId:      z.string().uuid().optional(),
  trainerId:       z.string().uuid().optional(),
  carePlanId:      z.string().uuid().optional(),
  serviceDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で入力してください"),
  serviceCategory: z.string().default("kaigo_hoken"),
  serviceTypeCode: z.string().max(2).default("15"),
  goalDomain:      z.enum(["body_function", "activity", "participation"]).optional(),
  programName:     z.string().max(200).default(""),
  trainingMethod:  z.string().max(200).optional(),
  durationMin:     z.number().int().min(1).max(480).optional(),
  unitCount:       z.number().int().min(0).max(999).optional(),
  achievement:     z.enum(["achieved", "partial", "not_achieved", "not_implemented"]).optional(),
  achievementNote: z.string().max(1000).optional(),
  vitalBefore:     vitalSnapshotSchema.optional(),
  vitalAfter:      vitalSnapshotSchema.optional(),
  lifeFormCode:    z.string().max(8).optional(),
  lifeLinked:      z.boolean().optional(),
  memo:            z.string().max(2000).optional(),
  templateId:      z.string().uuid().optional(),
  extraData:       z.record(z.string(), z.unknown()).optional(),
  exerciseMenuId:  z.string().uuid().optional(),
});

export type CreateTrainingRecordInput = z.infer<typeof createTrainingRecordSchema>;

export const updateTrainingRecordSchema = partialForUpdate(
  createTrainingRecordSchema.omit({ clientId: true }),
);

export type UpdateTrainingRecordInput = z.infer<typeof updateTrainingRecordSchema>;

export const trainingRecordIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** ボードから作る運動の種目名 */
export const BOARD_EXERCISE_PROGRAMS = { hand: "手の運動", foot: "足の運動", both: "手足の運動" } as const;

export type BoardExerciseKind = "hand" | "foot" | "both" | "cancelled" | "other";

export function boardExerciseKind(r: { programName: string | null; achievement: string | null }): BoardExerciseKind {
  if (!isTrainingPerformed(r.achievement)) return "cancelled";
  if (r.programName === BOARD_EXERCISE_PROGRAMS.hand) return "hand";
  if (r.programName === BOARD_EXERCISE_PROGRAMS.foot) return "foot";
  if (r.programName === BOARD_EXERCISE_PROGRAMS.both) return "both";
  return "other";
}
