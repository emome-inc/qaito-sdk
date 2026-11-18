import { z } from "zod";

export const listNursingVisitRecordStatusesQuerySchema = z.object({
  facilityId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  from: z.string().date(),
  to: z.string().date(),
  staffId: z.string().uuid().optional(),
  status: z.enum(["all", "missing", "draft", "recorded", "unprovided"]).default("all"),
});

export type ListNursingVisitRecordStatusesQuery = z.infer<typeof listNursingVisitRecordStatusesQuerySchema>;

export type NursingVisitRecordStatus = {
  recordingStatus?: "stored" | "transcribing" | "drafting" | "done" | "failed" | null;
  visitId: string;
  recordId: string | null;
  clientId: string;
  clientName: string;
  serviceDate: string;
  plannedStartTime: string | null;
  actualStartTime: string | null;
  plannedEndTime?: string | null;
  actualEndTime?: string | null;
  plannedEndsNextDay?: boolean;
  actualEndsNextDay?: boolean;
  staffId: string | null;
  staffName: string | null;
  qualification: string | null;
  /** 実績の開始時刻が入っているか。 */
  hasActual?: boolean;
  status: "missing" | "draft" | "recorded" | "unprovided";
};
