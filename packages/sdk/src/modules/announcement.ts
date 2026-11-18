
import type {
  Announcement,
  CreateAnnouncementInput,
  PublishedAnnouncement,
  UpdateAnnouncementInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createAnnouncementNamespace(tx: SdkTransport) {
  return {
    /** お知らせ（全件は予約・期限切れを含む。掲示中だけは `published`） */
    announcements: {
      /** 全件（予約・期限切れ含む）GET /announcement/announcements */
      list: () => tx.request<Announcement[]>("GET", "/announcement/announcements"),
      /** 掲示中（ピン留めが先・scope 不要）GET /announcement/announcements/published */
      published: () => tx.request<PublishedAnnouncement[]>("GET", "/announcement/announcements/published"),
      /** 1 件 GET /announcement/announcements/:id */
      get: (id: string) =>
        tx.request<Announcement>("GET", `/announcement/announcements/${pathParam(id, "id")}`),
      /** 作成 POST /announcement/announcements */
      create: (input: CreateAnnouncementInput) =>
        tx.request<Announcement>("POST", "/announcement/announcements", input),
      /** 部分更新 PATCH /announcement/announcements/:id */
      update: (id: string, input: UpdateAnnouncementInput) =>
        tx.request<Announcement>("PATCH", `/announcement/announcements/${pathParam(id, "id")}`, input),
      /** 削除（`announcement:delete`）DELETE /announcement/announcements/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/announcement/announcements/${pathParam(id, "id")}`),
    },
  };
}
