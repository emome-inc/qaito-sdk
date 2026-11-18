import { VITAL_INPUT_RANGES as R } from "./vitals";
import { z } from "zod";
import type { TranscriptEntry } from "./transcription";
export const NURSING_RECORDING_LIMITS = {
  maxBytes: 200 * 1024 * 1024,
  maxSeconds: 7200,
  retentionDays: 30,
  submittedDays: 7,
} as const;
export function isProvisionalRecordingDuration(r: {
  status: string;
  durationSec: number;
}): boolean {
  return (
    (r.status === "stored" || r.status === "transcribing") &&
    r.durationSec >= NURSING_RECORDING_LIMITS.maxSeconds
  );
}
export const nursingRecordingIdSchema = z
  .object({ id: z.string().uuid() })
  .strict();
export const nursingRecordingVisitSchema = z
  .object({ visitId: z.string().uuid() })
  .strict();
export const registerNursingVisitRecordingFromDriveSchema = z
  .object({
    userFileId: z.string().uuid(),
    visitId: z.string().uuid(),
    durationSec: z
      .number()
      .int()
      .positive()
      .max(NURSING_RECORDING_LIMITS.maxSeconds)
      .optional(),
    consent: z.literal(true),
  })
  .strict();
export type RegisterNursingVisitRecordingFromDriveInput = z.infer<
  typeof registerNursingVisitRecordingFromDriveSchema
>;
/** 録音の一覧の絞り込み（訪問・利用者・事業所）。訪問か利用者のどちらかで引く画面が多いが、どれも任意 */
export const listNursingVisitRecordingsQuerySchema = z
  .object({
    visitId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    facilityId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
export type ListNursingVisitRecordingsQuery = z.infer<
  typeof listNursingVisitRecordingsQuerySchema
>;
const evidence = z.array(z.number().int().nonnegative()).max(100);
export const nursingRecordingFieldSchema = z
  .object({ text: z.string().max(700), evidence })
  .strict();
const numeric = (min: number, max: number, integer = true) => {
  const value = z.number().min(min).max(max);
  return z.object({ value: integer ? value.int() : value, evidence }).strict();
};
export const nursingRecordingVitalSchemas = {
  bodyTemperature: numeric(R.tempCelsius.min, R.tempCelsius.max, false),
  systolicBp: numeric(R.bpSystolic.min, R.bpSystolic.max),
  diastolicBp: numeric(R.bpDiastolic.min, R.bpDiastolic.max),
  pulse: numeric(R.pulse.min, R.pulse.max),
  respirationRate: numeric(R.respiratoryRate.min, R.respiratoryRate.max),
  spo2: numeric(R.spo2.min, R.spo2.max),
  weight: numeric(R.weightKg.min, R.weightKg.max, false),
  bloodGlucose: numeric(R.bloodGlucose.min, R.bloodGlucose.max),
};
export const nursingVisitRecordingDraftSchema = z
  .object({
    soap: z
      .object({
        s: nursingRecordingFieldSchema,
        o: nursingRecordingFieldSchema,
        a: nursingRecordingFieldSchema,
        p: nursingRecordingFieldSchema,
      })
      .strict(),
    care: z
      .object({
        dailyLiving: nursingRecordingFieldSchema,
        excretion: nursingRecordingFieldSchema,
        treatment: nursingRecordingFieldSchema,
        rehab: nursingRecordingFieldSchema,
        guidance: nursingRecordingFieldSchema,
        management: nursingRecordingFieldSchema,
      })
      .strict(),
    comment: nursingRecordingFieldSchema,
    vitals: z
      .object(
        Object.fromEntries(
          Object.entries(nursingRecordingVitalSchemas).map(([k, v]) => [
            k,
            v.optional(),
          ]),
        ) as {
          [K in keyof typeof nursingRecordingVitalSchemas]: z.ZodOptional<
            (typeof nursingRecordingVitalSchemas)[K]
          >;
        },
      )
      .strict(),
    evidenceEntries: z
      .array(
        z.object({
          speaker: z.string().nullable(),
          text: z.string(),
          startSec: z.number().nullable(),
          endSec: z.number().nullable(),
        }),
      )
      .optional(),
    uncertain: z
      .array(
        z
          .object({ field: z.string().max(100), reason: z.string().max(300) })
          .strict(),
      )
      .max(100),
  })
  .strict();
export type NursingVisitRecordingDraft = z.infer<
  typeof nursingVisitRecordingDraftSchema
>;
/**
 * 録音の音声がどこにあるか。`drive` はマイドライブのファイルを指す行、`legacy` は訪問看護のバケットに
 * 直接置いた行（ドライブから登録する前に作った行）。`state` はドライブのファイルの今の状態
 * （`legacy` は常に `available`）。`fileId` は録った本人にだけ返すドライブのファイルの ID で、
 * 再生はドライブの口（本人の行だけ読める）で行う。本人以外・`legacy` は null（再生できない）。
 */
export type NursingVisitRecordingSource = {
  kind: "drive" | "legacy";
  state: "available" | "trashed" | "deleted";
  fileId: string | null;
};
export type NursingVisitRecording = {
  uploaderName?: string | null;
  uploadedByMe?: boolean;
  deletion?: { allowed: true } | { allowed: false; reason: "record_already_submitted" | "recording_not_owner" | "permission" };
  id: string;
  visitId: string;
  clientId: string;
  clientName: string | null;
  /** 訪問日（YYYY-MM-DD）。職員が `schedule:read` を持つときだけ埋まる */
  serviceDate: string | null;
  source: NursingVisitRecordingSource;
  contentType: string;
  sizeBytes: number;
  durationSec: number;
  status:
    | "awaiting_upload"
    | "stored"
    | "transcribing"
    | "drafting"
    | "done"
    | "failed";
  failureReason: string | null;
  draft: NursingVisitRecordingDraft | null;
  createdAt: string;
  updatedAt: string;
  purgedAt: string | null;
};
/** ドライブからの登録の結果。同じファイル・同じ訪問の再登録は既存の行を返す（`created: false`） */
export type NursingVisitRecordingRegistration = {
  id: string;
  visitId: string;
  status: NursingVisitRecording["status"];
  created: boolean;
};
export type NursingVisitRecordings = {
  recordings: NursingVisitRecording[];
  total: number;
};
export type NursingRecordingTranscript = {
  entries: TranscriptEntry[];
};
