
import type {
  Calendar,
  CalendarAttendee,
  CalendarEvent,
  CalendarFreeTime,
  CalendarGoogleConnectStart,
  CalendarGoogleEvent,
  CalendarGoogleStatus,
  CalendarGoogleSyncResult,
  CalendarOccurrenceTarget,
  CalendarOverlays,
  CalendarPerson,
  CalendarReminder,
  CalendarShare,
  CalendarShareCandidates,
  CompleteCalendarGoogleConnectInput,
  CreateCalendarEventInput,
  FindCalendarFreeTimeParams,
  ListCalendarEventsParams,
  ListCalendarGoogleEventsParams,
  ListCalendarOverlaysParams,
  RespondToCalendarInviteInput,
  SetCalendarAttendeesInput,
  SetCalendarRemindersInput,
  SetCalendarShareInput,
  UpdateCalendarEventInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createCalendarNamespace(tx: SdkTransport) {
  return {
    /** カレンダー（自分の個人のカレンダーと共有されたもの。個人のカレンダーは最初の予定の作成で作られる） */
    calendars: {
      /** 自分のカレンダーの一覧 GET /calendar/calendars */
      list: () => tx.request<Calendar[]>("GET", "/calendar/calendars"),
    },
    /** カレンダーの共有（人 × 見る / 編集。変えるのは持ち主だけ） */
    shares: {
      /** 共有の一覧 GET /calendar/calendars/:id/shares */
      list: (id: string) =>
        tx.request<CalendarShare[]>("GET", `/calendar/calendars/${pathParam(id, "id")}/shares`),
      /** 人への共有を足す・変える（持ち主）PUT /calendar/calendars/:id/shares */
      set: (id: string, input: SetCalendarShareInput) =>
        tx.request<CalendarShare>("PUT", `/calendar/calendars/${pathParam(id, "id")}/shares`, input),
      /** 共有を外す（持ち主・`calendar:delete`）DELETE /calendar/calendars/:id/shares/:shareId */
      remove: (id: string, shareId: string) =>
        tx.request<null>("DELETE", `/calendar/calendars/${pathParam(id, "id")}/shares/${pathParam(shareId, "shareId")}`),
      /** 共有の候補（同じ組織の人。持ち主）GET /calendar/calendars/:id/share-candidates */
      candidates: (id: string) =>
        tx.request<CalendarShareCandidates>("GET", `/calendar/calendars/${pathParam(id, "id")}/share-candidates`),
    },
    /** 予定（時刻あり = startsAt / endsAt・終日 = startDate / endDate〔含む日〕） */
    events: {
      /** 期間の予定（JST の日付・両端を含む・92 日まで）GET /calendar/events?from=&to= */
      list: (params: ListCalendarEventsParams) =>
        tx.request<CalendarEvent[]>("GET", `/calendar/events${buildQueryString(params)}`),
      /** 1 件 GET /calendar/events/:id */
      get: (id: string) => tx.request<CalendarEvent>("GET", `/calendar/events/${pathParam(id, "id")}`),
      /** 作成 POST /calendar/events */
      create: (input: CreateCalendarEventInput) =>
        tx.request<CalendarEvent>("POST", "/calendar/events", input),
      /** 部分更新 PATCH /calendar/events/:id */
      update: (id: string, input: UpdateCalendarEventInput) =>
        tx.request<CalendarEvent>("PATCH", `/calendar/events/${pathParam(id, "id")}`, input),
      /** 削除（`calendar:delete`。繰り返しの予定は target で この回だけ / これ以降 / すべて）DELETE /calendar/events/:id */
      delete: (id: string, target?: CalendarOccurrenceTarget) =>
        tx.request<null>("DELETE", `/calendar/events/${pathParam(id, "id")}${buildQueryString(target ?? {})}`),
    },
    /** 予定の参加者と出欠（参加者は同じ組織の職員だけ・出欠は本人だけ） */
    attendees: {
      /** 参加者の一覧（招かれた人も読める）GET /calendar/events/:id/attendees */
      list: (id: string) =>
        tx.request<CalendarAttendee[]>("GET", `/calendar/events/${pathParam(id, "id")}/attendees`),
      /** 参加者を置き換える（作った人か edit 以上）PUT /calendar/events/:id/attendees */
      set: (id: string, input: SetCalendarAttendeesInput) =>
        tx.request<CalendarAttendee[]>("PUT", `/calendar/events/${pathParam(id, "id")}/attendees`, input),
      /** 自分の出欠を返す（本人が参加者）POST /calendar/events/:id/respond */
      respond: (id: string, input: RespondToCalendarInviteInput) =>
        tx.request<CalendarAttendee>("POST", `/calendar/events/${pathParam(id, "id")}/respond`, input),
    },
    /** 自分のリマインダー（何分前・回ごとに 1 回知らせる） */
    reminders: {
      /** 自分のリマインダー GET /calendar/events/:id/reminders */
      list: (id: string) =>
        tx.request<CalendarReminder[]>("GET", `/calendar/events/${pathParam(id, "id")}/reminders`),
      /** 自分のリマインダーを置き換える PUT /calendar/events/:id/reminders */
      set: (id: string, input: SetCalendarRemindersInput) =>
        tx.request<CalendarReminder[]>("PUT", `/calendar/events/${pathParam(id, "id")}/reminders`, input),
    },
    /** 空き時間（いつ埋まっているかだけ・中身は返さない） */
    freeTime: {
      /** 空き時間（いつ埋まっているかだけ）GET /calendar/free-time */
      find: (params: FindCalendarFreeTimeParams) =>
        tx.request<CalendarFreeTime>("GET", `/calendar/free-time${buildQueryString({ ...params, userIds: params.userIds.join(",") })}`),
    },
    /** 予定に招ける・空き時間を探せる職員 */
    people: {
      /** 予定に招ける・空き時間を探せる職員 GET /calendar/people */
      list: () => tx.request<CalendarPerson[]>("GET", "/calendar/people"),
    },
    /** 重ね表示（自分のシフト・利用予定の件数。読むだけ・読めないものは available = false） */
    overlays: {
      /** 自分のシフトと利用予定の件数（読むだけ）GET /calendar/overlays */
      list: (params: ListCalendarOverlaysParams) =>
        tx.request<CalendarOverlays>("GET", `/calendar/overlays${buildQueryString(params)}`),
    },
    /** 本人の Google カレンダーの連携（読み取りだけ・資格情報が無い環境は available = false / 503） */
    google: {
      /** 本人の Google カレンダーの連携の状態 GET /calendar/google */
      status: () => tx.request<CalendarGoogleStatus>("GET", "/calendar/google"),
      /** 同期した Google の予定（読むだけ）GET /calendar/google/events */
      events: (params: ListCalendarGoogleEventsParams) =>
        tx.request<CalendarGoogleEvent[]>("GET", `/calendar/google/events${buildQueryString(params)}`),
      /** Google の同意の画面の URL（戻り先は Qaito の Web。人がブラウザで開く）POST /calendar/google/connect */
      connect: () => tx.request<CalendarGoogleConnectStart>("POST", "/calendar/google/connect"),
      /** 同意の画面からの戻り（state と code）POST /calendar/google/connect/complete */
      completeConnect: (input: CompleteCalendarGoogleConnectInput) =>
        tx.request<CalendarGoogleStatus>("POST", "/calendar/google/connect/complete", input),
      /** 本人の連携を今すぐ取り直す POST /calendar/google/sync */
      sync: () => tx.request<CalendarGoogleSyncResult>("POST", "/calendar/google/sync"),
      /** 本人の連携を解く（Google 側も取り消し・同期した予定を消す）POST /calendar/google/disconnect */
      disconnect: () => tx.request<CalendarGoogleStatus>("POST", "/calendar/google/disconnect"),
    },
  };
}
