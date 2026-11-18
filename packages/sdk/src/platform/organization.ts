
import type {
  CreatePortalLinkInput,
  OrganizationSaveCount,
  PortalLink,
  PortalLinkLists,
  ReorderPortalLinksInput,
  SaveSavedFilterInput,
  SaveShelfOrderInput,
  SavedFilter,
  SavedFilterSurface,
  ShelfOrderSettings,
  UpdatePortalLinkInput,
  UpdateSavedFilterInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createOrganizationNamespace(tx: SdkTransport) {
  return {
    /** ホームのリンク（区画 = よく使う機能 shortcut / 連携サイト site） */
    portalLinks: {
      /** 区画ごとの一覧（並び順）GET /organization/portal-links */
      list: () => tx.request<PortalLinkLists>("GET", "/organization/portal-links"),
      /** 登録（区画の末尾・1 区画 30 件まで）POST /organization/portal-links */
      create: (input: CreatePortalLinkInput) =>
        tx.request<PortalLink>("POST", "/organization/portal-links", input),
      /** 更新（区画は変えない）PATCH /organization/portal-links/:id */
      update: (id: string, input: UpdatePortalLinkInput) =>
        tx.request<PortalLink>("PATCH", `/organization/portal-links/${pathParam(id, "id")}`, input),
      /** 削除（アップロードした画像も消す）DELETE /organization/portal-links/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/organization/portal-links/${pathParam(id, "id")}`),
      /** 並べ替え（その区画の全件を上から順に）PUT /organization/portal-links/order */
      reorder: (input: ReorderPortalLinksInput) =>
        tx.request<OrganizationSaveCount>("PUT", "/organization/portal-links/order", input),
    },
    /** 棚の並び順 */
    shelfOrder: {
      /** いまの並び順 GET /organization/shelf-order */
      get: () => tx.request<ShelfOrderSettings>("GET", "/organization/shelf-order"),
      /** 丸ごと差し替え（空で既定の順）PUT /organization/shelf-order */
      save: (input: SaveShelfOrderInput) =>
        tx.request<OrganizationSaveCount>("PUT", "/organization/shelf-order", input),
    },
    /** 本人の保存した絞り込み（訪問カレンダーの職員の組み合わせ等・portal 柱・本人の行だけ） */
    savedFilters: {
      /** 本人の保存した絞り込み（並び順）GET /organization/saved-filters?surface= */
      list: (params: { surface: SavedFilterSurface }) =>
        tx.request<SavedFilter[]>("GET", `/organization/saved-filters${buildQueryString(params)}`),
      /** 保存（同じ名前なら中身を差し替え・1 画面 20 件まで）POST /organization/saved-filters */
      save: (input: SaveSavedFilterInput) =>
        tx.request<SavedFilter>("POST", "/organization/saved-filters", input),
      /** 名前・中身を変える PATCH /organization/saved-filters/:id */
      update: (id: string, input: UpdateSavedFilterInput) =>
        tx.request<SavedFilter>("PATCH", `/organization/saved-filters/${pathParam(id, "id")}`, input),
      /** 消す DELETE /organization/saved-filters/:id */
      delete: (id: string) =>
        tx.request<{ id: string }>("DELETE", `/organization/saved-filters/${pathParam(id, "id")}`),
    },
  };
}
