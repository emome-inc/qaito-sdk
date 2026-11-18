import { z } from "zod";

const memo = z.string().trim().max(5000).default("");
const short = z.string().trim().max(200).default("");
export const serviceConferenceSchema = z.object({
  facilityId: z.string().uuid(),
  heldOn: z.string().date(),
  meetingNumber: z.number().int().min(1).max(999),
  status: z.enum(["draft", "saved"]),
  expectedUpdatedAt: z.string().datetime().optional(),
  contents: z.object({
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).default(""),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).default(""),
    location: short,
    attendees: z.array(z.object({ affiliation: short, role: short, name: short })).max(30).default([]),
    agenda: memo,
    discussion: memo,
    conclusion: memo,
    remainingIssues: memo,
    nextMeeting: short,
    followUp: memo,
    reviewPlan: z.boolean().default(false),
  }).strict(),
}).strict();

export type ServiceConferenceInput = z.output<typeof serviceConferenceSchema>;
export type ServiceConference = Omit<ServiceConferenceInput, "expectedUpdatedAt"> & {
  id: string;
  facilityName: string | null;
  serviceTypeCode: string;
  updatedAt: string;
  updatedByName: string | null;
  editable: boolean;
};

export const serviceConferenceAudioInputSchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
  fileId: z.string().uuid(),
  consent: z.literal(true),
}).strict();

/** 受け付けた会議の音声を読む（受け付けた本人だけ）。 */
export const serviceConferenceAudioReadSchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
  id: z.string().uuid(),
}).strict();

export const serviceConferenceAudioDraftSchema = serviceConferenceSchema.shape.contents
  .pick({ attendees: true, agenda: true, discussion: true, conclusion: true, remainingIssues: true, nextMeeting: true, followUp: true });
export type ServiceConferenceAudioDraft = z.output<typeof serviceConferenceAudioDraftSchema>;
export type ServiceConferenceAudioJob = {
  id: string;
  status: "queued" | "transcribing" | "done" | "failed";
  draft: ServiceConferenceAudioDraft | null;
};
