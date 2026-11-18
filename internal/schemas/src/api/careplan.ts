import { z } from "zod";
import { ocrExtraPartsSchema } from "../ocr-images";
import { recordFacilityIdField } from "./record-facility";

/** 第1表のステータス。遷移規則は持たない（`careplan:write` があれば任意に動かせる既存契約）。 */
export const careplanStatusValues = [
  "draft",
  "review",
  "approved",
  "active",
  "expired",
  "revised",
] as const;

const needApiSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  need: z.string().max(2000).optional(),
  longTermGoal: z.string().max(2000).optional(),
  longTermGoalPeriodStart: z.string().date().optional(),
  longTermGoalPeriodEnd: z.string().date().optional(),
  shortTermGoal: z.string().max(2000).optional(),
  shortTermGoalPeriodStart: z.string().date().optional(),
  shortTermGoalPeriodEnd: z.string().date().optional(),
  serviceContent: z.string().max(2000).optional(),
  serviceType: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
  frequency: z.string().max(200).optional(),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
});

const scheduleApiSchema = z.object({
  /**
   * 曜日。**保存形は 0=日〜6=土**（JS / ISO と同じ）だが、`7`（日曜）も受ける。
   * 画面は月=1..日=7 で送っており、旧 api の `max(6)` では**画面で作った日曜の予定を
   * api から更新できなかった**（保存済みデータにも 7 が入っている）。
   * core が `7 → 0` に正規化して保存し、帳票側（forms.ts）は従来どおり両方を解釈する。
   */
  dayOfWeek: z.number().int().min(0).max(7),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
  serviceContent: z.string().max(2000).optional(),
  serviceType: z.string().max(200).optional(),
  providerName: z.string().max(200).optional(),
  memo: z.string().max(2000).optional(),
});

/**
 * POST /care-plan/plans リクエストボディ。
 *
 * `version` は受け付けない（core が同一 (client, plan_type) の MAX+1 を
 * advisory lock 下で採番する）。`createdByUserId` も受け付けない（Principal から入る）。
 */
export const createCareplanApiSchema = z.object({
  clientId: z.string().guid(),
  facilityId: recordFacilityIdField,
  source: z.enum(["internal", "external"]).default("internal"),
  status: z.enum(careplanStatusValues).default("draft"),
  careManagerName: z.string().max(200).optional(),
  careManagerOffice: z.string().max(200).optional(),
  assessmentId: z.string().guid().optional(),
  certificationId: z.string().guid().optional(),
  clientWishes: z.string().max(5000).optional(),
  familyWishes: z.string().max(5000).optional(),
  overallPolicy: z.string().max(5000).optional(),
  lifeSupportReason: z.string().max(5000).optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveUntil: z.string().date().optional(),
  needs: z.array(needApiSchema).max(50).optional(),
  schedules: z.array(scheduleApiSchema).max(100).optional(),
});

/**
 * PATCH /care-plan/plans/:id リクエストボディ。
 *
 * - `clientId` は不変（別利用者への付け替えは facility 境界・請求の前提を壊す）
 * - `status` は状態変更（PATCH /plans/:id/status）が唯一の口。承認遷移の通知が
 *   そこにしか無いため、更新の口から動かすと通知が黙って飛ばなくなる
 * - `version` はサーバ採番
 * - `null` を渡すと**その列を空にする**（画面の「入力を消して保存」を表現するため）
 */
export const updateCareplanApiSchema = z.object({
  source: z.enum(["internal", "external"]).optional(),
  careManagerName: z.string().max(200).nullish(),
  careManagerOffice: z.string().max(200).nullish(),
  assessmentId: z.string().guid().nullish(),
  certificationId: z.string().guid().nullish(),
  clientWishes: z.string().max(5000).nullish(),
  familyWishes: z.string().max(5000).nullish(),
  overallPolicy: z.string().max(5000).nullish(),
  lifeSupportReason: z.string().max(5000).nullish(),
  effectiveFrom: z.string().date().nullish(),
  effectiveUntil: z.string().date().nullish(),
  needs: z.array(needApiSchema).max(50).optional(),
  schedules: z.array(scheduleApiSchema).max(100).optional(),
});

/** PATCH /care-plan/plans/:id/status リクエストボディ */
export const updateCareplanStatusApiSchema = z.object({
  status: z.enum(careplanStatusValues),
});

export type CreateCareplanApi = z.infer<typeof createCareplanApiSchema>;

export const receiveExternalKyotakuPlanApiSchema = createCareplanApiSchema
  .omit({ clientId: true, source: true, status: true })
  .extend({
    intake: z.enum(["ocr", "manual"]),
    stagedId: z.string().guid().optional(),
    fileName: z.string().trim().min(1).max(255).optional(),
    careOfficeId: z.string().guid().optional(),
    careManagerId: z.string().guid().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.intake === "ocr" && v.stagedId === undefined) {
      ctx.addIssue({ code: "custom", path: ["stagedId"], message: "読み取りのときは元の書類が要ります" });
    }
    if (v.intake === "manual" && (v.stagedId !== undefined || v.fileName !== undefined)) {
      ctx.addIssue({ code: "custom", path: ["stagedId"], message: "手で写したものに元の書類は付けません" });
    }
  });

export type ReceiveExternalKyotakuPlanApi = z.infer<typeof receiveExternalKyotakuPlanApiSchema>;

export const receiveLinkedKyotakuPlanApiSchema = createCareplanApiSchema
  .omit({ clientId: true, source: true, status: true })
  .extend({
    linkFileId: z.string().guid(),
    careOfficeId: z.string().guid().optional(),
  });
export type ReceiveLinkedKyotakuPlanApi = z.infer<typeof receiveLinkedKyotakuPlanApiSchema>;
export type UpdateCareplanApi = z.infer<typeof updateCareplanApiSchema>;
export type UpdateCareplanStatusApi = z.infer<typeof updateCareplanStatusApiSchema>;

const conferenceAttendeeApiSchema = z.object({
  name: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  affiliation: z.string().max(200).optional(),
});

/** POST /care-plan/plans/:id/conferences リクエストボディ */
export const createCareplanConferenceApiSchema = z.object({
  facilityId: recordFacilityIdField,
  heldOn: z.string().date(),
  location: z.string().max(500).optional(),
  attendees: z.array(conferenceAttendeeApiSchema).max(20).optional(),
  agendaItems: z.string().max(5000).optional(),
  conclusion: z.string().max(5000).optional(),
  remainingIssues: z.string().max(5000).optional(),
  memo: z.string().max(5000).optional(),
});

/** PATCH /care-plan/plans/:id/conferences/:conferenceId リクエストボディ（null = 空にする） */
export const updateCareplanConferenceApiSchema = z.object({
  heldOn: z.string().date().optional(),
  location: z.string().max(500).nullish(),
  attendees: z.array(conferenceAttendeeApiSchema).max(20).nullish(),
  agendaItems: z.string().max(5000).nullish(),
  conclusion: z.string().max(5000).nullish(),
  remainingIssues: z.string().max(5000).nullish(),
  memo: z.string().max(5000).nullish(),
});

export type CreateCareplanConferenceApi = z.infer<typeof createCareplanConferenceApiSchema>;
export type UpdateCareplanConferenceApi = z.infer<typeof updateCareplanConferenceApiSchema>;

/** POST /care-plan/plans/:id/progress-notes リクエストボディ */
export const createCareplanProgressNoteApiSchema = z.object({
  facilityId: recordFacilityIdField,
  recordedOn: z.string().date(),
  itemLabel: z.string().max(200).optional(),
  content: z.string().max(5000),
});

/** PATCH /care-plan/plans/:id/progress-notes/:noteId リクエストボディ */
export const updateCareplanProgressNoteApiSchema = z.object({
  recordedOn: z.string().date().optional(),
  itemLabel: z.string().max(200).nullish(),
  content: z.string().max(5000).optional(),
});

export type CreateCareplanProgressNoteApi = z.infer<typeof createCareplanProgressNoteApiSchema>;
export type UpdateCareplanProgressNoteApi = z.infer<typeof updateCareplanProgressNoteApiSchema>;

/** POST /care-plan/plans/:id/needs リクエストボディ（第2表の 1 行）。`sortOrder` を省けば末尾 */
export const createCareplanNeedApiSchema = needApiSchema;
/** 日付の欄を消すときの空文字（更新だけ） */
const dateOrEmpty = z.union([z.string().date(), z.literal("")]);
/** PATCH /care-plan/plans/:id/needs/:needId リクエストボディ（渡したキーだけ。空文字で消す） */
export const updateCareplanNeedApiSchema = needApiSchema
  .extend({
    longTermGoalPeriodStart: dateOrEmpty,
    longTermGoalPeriodEnd: dateOrEmpty,
    shortTermGoalPeriodStart: dateOrEmpty,
    shortTermGoalPeriodEnd: dateOrEmpty,
    periodStart: dateOrEmpty,
    periodEnd: dateOrEmpty,
  })
  .partial();
/** POST /care-plan/plans/:id/schedules リクエストボディ（第3表の 1 行） */
export const createCareplanScheduleApiSchema = scheduleApiSchema;
/** PATCH /care-plan/plans/:id/schedules/:scheduleId リクエストボディ（渡したキーだけ。空文字で消す） */
export const updateCareplanScheduleApiSchema = scheduleApiSchema.partial();

export type CreateCareplanNeedApi = z.infer<typeof createCareplanNeedApiSchema>;
export type UpdateCareplanNeedApi = z.infer<typeof updateCareplanNeedApiSchema>;
export type CreateCareplanScheduleApi = z.infer<typeof createCareplanScheduleApiSchema>;
export type UpdateCareplanScheduleApi = z.infer<typeof updateCareplanScheduleApiSchema>;

/** OCR で受け付ける MIME タイプ（利用者台帳・アセスメントの OCR と同一セット） */
export const CAREPLAN_OCR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

/** POST /care-plan/ocr/analyze リクエストボディ（居宅サービス計画書の画像 / PDF を読み取る） */
export const careplanOcrAnalyzeApiSchema = z.object({
  base64_content: z.string().min(1),
  mime_type: z.enum(CAREPLAN_OCR_MIME_TYPES),
  /** 写真を上から帯に分けた続き（`../ocr-images`） */
  extra_parts: ocrExtraPartsSchema.optional(),
});

/** POST /care-plan/plans/generate-draft リクエストボディ（利用者情報・アセスメントから素案を作る） */
export const generateCareplanDraftApiSchema = z.object({
  client_id: z.string().uuid(),
  assessment_id: z.string().uuid().optional(),
});

export type CareplanOcrAnalyzeApi = z.infer<typeof careplanOcrAnalyzeApiSchema>;
export type GenerateCareplanDraftApi = z.infer<typeof generateCareplanDraftApiSchema>;
