
import type {
  CareplanLinkFile,
  LinkUpplanRowInput,
  ListCareplanLinkFilesQuery,
  PendingUpplanRow,
  UpplanLinkSummary,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createCareplanLinkNamespace(tx: SdkTransport) {
  return {
    files: {
      /** GET /careplan-link/files — 連携ファイル一覧 */
      list: (params?: ListCareplanLinkFilesQuery) =>
        tx.request<CareplanLinkFile[]>("GET", `/careplan-link/files${buildQueryString(params)}`),
      /** GET /careplan-link/files/:id */
      get: (id: string) => tx.request<CareplanLinkFile>("GET", `/careplan-link/files/${pathParam(id, "id")}`),
      /** POST /careplan-link/files/:id/link — 受けた計画（UPPLAN）の行を利用者に当てて、当たった行を利用者のケアプランにする */
      link: (id: string) =>
        tx.request<UpplanLinkSummary>("POST", `/careplan-link/files/${pathParam(id, "id")}/link`, {}),
      /** POST /careplan-link/files/:id/rows/:rowNo/link — 結び付け待ちの行を選んだ利用者に結び付ける */
      linkRow: (id: string, rowNo: number, input: LinkUpplanRowInput) =>
        tx.request<UpplanLinkSummary & { planId: string }>("POST", `/careplan-link/files/${pathParam(id, "id")}/rows/${pathParam(rowNo, "rowNo")}/link`, input),
    },
    upplan: {
      /** GET /careplan-link/upplan/pending — 結び付け待ちの行（被保険者番号は下 4 桁だけ） */
      pending: () => tx.request<PendingUpplanRow[]>("GET", "/careplan-link/upplan/pending"),
    },
    /** POST /careplan-link/export — CSV 出力（将来予約・現状 501） */
    export: (input?: Record<string, unknown>) =>
      tx.request<Record<string, unknown>>("POST", "/careplan-link/export", input ?? {}),
    /** POST /careplan-link/import — CSV 取込（将来予約・現状 501） */
    import: (input?: Record<string, unknown>) =>
      tx.request<Record<string, unknown>>("POST", "/careplan-link/import", input ?? {}),
  };
}
