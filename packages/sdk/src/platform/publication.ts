
import type {
  ListPublicLinksQuery,
  PublicLink,
  RevokePublicLinkResult,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

/**
 * 外部公開 — 組織の一覧・取り消し。作る・更新・期限は使い手（ライブラリ）の口にある。
 * URL（token）は作った直後に 1 度だけ見せるもので、ここからは返らない。casing = camelCase。
 */
export function createPublicationNamespace(tx: SdkTransport) {
  return {
    /** 公開リンク */
    links: {
      /** 一覧（既定は有効なものだけ・`includeEnded: "1"` で終わったものも）GET /publication/links */
      list: (params?: ListPublicLinksQuery) =>
        tx.request<PublicLink[]>("GET", `/publication/links${buildQueryString(params)}`),
      /** 取り消し POST /publication/links/:id/revoke */
      revoke: (id: string) =>
        tx.request<RevokePublicLinkResult>("POST", `/publication/links/${pathParam(id, "id")}/revoke`),
    },
  };
}
