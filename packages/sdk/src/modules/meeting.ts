
import type {
  CreateMeetingInput,
  ListMeetingsParams,
  Meeting,
  MeetingSummary,
  UpdateMeetingInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMeetingNamespace(tx: SdkTransport) {
  return {
    /** 会議 */
    meetings: {
      /** 会議の一覧（新しい順・会議の URL なし）GET /meeting/meetings */
      list: (params?: ListMeetingsParams) =>
        tx.request<MeetingSummary[]>("GET", `/meeting/meetings${buildQueryString(params)}`),
      /** 会議 1 件（会議の URL・参加者つき）GET /meeting/meetings/:id */
      get: (id: string) => tx.request<Meeting>("GET", `/meeting/meetings/${pathParam(id, "id")}`),
      /** 会議を作る（取り込み元は手動のアップロード）POST /meeting/meetings */
      create: (input: CreateMeetingInput) => tx.request<Meeting>("POST", "/meeting/meetings", input),
      /** カレンダーの予定の 1 回から会議を始める（あればそれを返す・何度呼んでも 1 つ）POST /meeting/meetings/from-calendar */
      startFromCalendar: (input: import("@qaito/schemas/meeting").StartMeetingFromCalendarInput) =>
        tx.request<{ meeting: Meeting; created: boolean }>("POST", "/meeting/meetings/from-calendar", input),
      /** 会議を直す（送った項目だけ・作った人か組織の管理者）PATCH /meeting/meetings/:id */
      update: (id: string, input: UpdateMeetingInput) =>
        tx.request<Meeting>("PATCH", `/meeting/meetings/${pathParam(id, "id")}`, input),
      /** 会議を消す（論理削除。中身があれば meeting-recording:delete も要る）PATCH /meeting/meetings/:id/delete */
      delete: (id: string) => tx.request<null>("PATCH", `/meeting/meetings/${pathParam(id, "id")}/delete`),
    },
  };
}
