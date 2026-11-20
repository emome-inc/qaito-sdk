
import type {
  Announcement,
  CreateAnnouncementInput,
  ListPublishedAnnouncementsParams,
  PublishedAnnouncement,
  PublishedAnnouncementDetail,
  UpdateAnnouncementInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createAnnouncementNamespace(tx: SdkTransport) {
  return {
    /** お知らせ（全件は予約・期限切れを含む。掲示中だけは `published`） */
    announcements: {
      /** 全件（予約・期限切れ含む）GET /announcement/announcements */
      list: () => tx.request<Announcement[]>("GET", "/announcement/announcements"),
      /** 掲示中（組織 + システム・組織のピン留めが先・その下は新しい順・scope 不要）GET /announcement/announcements/published?limit= */
      published: (params?: ListPublishedAnnouncementsParams) =>
        tx.request<PublishedAnnouncement[]>("GET", `/announcement/announcements/published${buildQueryString(params)}`),
      /** 掲示中の 1 件（組織かシステム・システムの分は bodyBlocks も・scope 不要）GET /announcement/announcements/published/:id */
      publishedGet: (id: string) =>
        tx.request<PublishedAnnouncementDetail>("GET", `/announcement/announcements/published/${pathParam(id, "id")}`),
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
