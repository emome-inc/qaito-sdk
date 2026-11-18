import { z } from "zod";

export const getNursingHomeQuerySchema = z.object({
  facilityId: z.string().uuid(),
  date: z.string().date(),
});

export type GetNursingHomeQuery = z.infer<typeof getNursingHomeQuerySchema>;

export const NURSE_VISIT_GAP_NOTICE_DAYS = 80;
export const NURSE_VISIT_GAP_OVERDUE_DAYS = 90;
export type NursingHomeVisit = {
  id: string; clientId: string; clientName: string; serviceDate: string;
  startTime: string | null; endTime: string | null; status: string;
  serviceTypeCode: string; visitKind: string; emergency: boolean;
  providerCount: number; recordId: string | null; recordStatus?: "draft" | "final" | null;
};
export type NursingHomeOncall = { id: string; staffName: string; shiftCode: string; shiftLabel?: string | null; startsAt: string; endsAt: string };
export type NursingHome = {
  viewerName: string;
  /** 今日の訪問。`null` は表示権限が無い（schedule:read が無い）。0 件（`[]`）とは区別する */
  visits: NursingHomeVisit[] | null;
  /** 今夜の当番。`null` は表示権限が無い（staff:read が無い）。当番がいない（`[]`）とは区別する */
  oncall: NursingHomeOncall[] | null;
  /**
   * やることの件数。`null` は表示権限が無い（訪問の予定・実績 = schedule:read が無ければ `missingRecords`、
   * 報告書 = care-plan:read か schedule:read のどちらかが無ければ `missingReports`、
   * 臨床台帳 = clinical-record:read が無ければ `expiringInstructions`、
   * 訪問の予定・実績 = schedule:read が無ければ `nurseVisitGaps`）。0 件とは区別する。
   * `nurseVisitGaps` = 今月リハ職の訪問がある利用者のうち、看護職員の最後の訪問から目安の日数を過ぎた人数。
   */
  todos: { missingRecords: number | null; missingReports: number | null; expiringInstructions: number | null; nurseVisitGaps: number | null };
};
