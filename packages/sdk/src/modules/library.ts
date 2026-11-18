
import type {
  ConvertLibraryPageFormatInput,
  CopyOfficialLibraryPageInput,
  CreateLibraryPageInput,
  CreateLibrarySpaceInput,
  LibraryAccessChangePreview,
  LibraryActor,
  LibraryAsset,
  LibraryCombinedSpace,
  LibraryHelpPage,
  LibraryOfficialPage,
  LibraryOfficialSpace,
  LibraryOfficialTreeNode,
  LibraryPage,
  LibraryPageAccess,
  LibraryPageRecord,
  LibraryPageVersion,
  LibraryPageVersionDetail,
  LibraryPageVersionRecord,
  LibrarySearchHit,
  LibrarySpace,
  LibrarySpaceMember,
  LibrarySpaceRecord,
  LibraryTreeNode,
  MoveLibraryPageInput,
  PreviewLibraryAccessChangeInput,
  RestoreLibraryPageVersionInput,
  SaveLibraryPageDraftInput,
  SearchLibraryPagesQuery,
  SetLibraryPageAccessModeInput,
  SetLibraryPageGrantsInput,
  SetLibraryPageTemplateInput,
  SetLibrarySpaceMembersInput,
  UpdateLibrarySpaceInput,
  UploadLibraryAssetInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createLibraryNamespace(tx: SdkTransport) {
  return {
    /** 自分の「だれが」（capabilities を評価する材料） */
    me: {
      /** 自分の「だれが」GET /library/me */
      get: () => tx.request<LibraryActor>("GET", "/library/me"),
    },
    /** スペース（公式以外。組織・事業所） */
    spaces: {
      /** 見えるスペースの一覧 GET /library/spaces */
      list: () => tx.request<LibrarySpace[]>("GET", "/library/spaces"),
      /** 公式（先頭）と見える組織・事業所のスペース GET /library/spaces/combined */
      combined: () => tx.request<LibraryCombinedSpace[]>("GET", "/library/spaces/combined"),
      /** スペース 1 件 GET /library/spaces/:id */
      get: (id: string) => tx.request<LibrarySpace>("GET", `/library/spaces/${pathParam(id, "id")}`),
      /** スペースを作る（作った人は full のメンバー）POST /library/spaces */
      create: (input: CreateLibrarySpaceInput) =>
        tx.request<LibrarySpaceRecord>("POST", "/library/spaces", input),
      /** スペースの設定（full）PATCH /library/spaces/:id */
      update: (id: string, input: UpdateLibrarySpaceInput) =>
        tx.request<LibrarySpaceRecord>("PATCH", `/library/spaces/${pathParam(id, "id")}`, input),
      /** スペースの論理削除（full + `library:delete`）PATCH /library/spaces/:id/delete */
      delete: (id: string) =>
        tx.request<{ id: string }>("PATCH", `/library/spaces/${pathParam(id, "id")}/delete`),
      /** スペースのメンバーと役 */
      members: {
        /** メンバーの一覧 GET /library/spaces/:id/members */
        list: (id: string) =>
          tx.request<LibrarySpaceMember[]>("GET", `/library/spaces/${pathParam(id, "id")}/members`),
        /** メンバーを全部置き換える（full。最後の full を外す変更は 409）PUT /library/spaces/:id/members */
        set: (id: string, input: SetLibrarySpaceMembersInput) =>
          tx.request<LibrarySpaceMember[]>("PUT", `/library/spaces/${pathParam(id, "id")}/members`, input),
      },
    },
    /** ページ */
    pages: {
      /** ページの共有・制限・継承に戻す */
      access: {
        /** 共有のダイアログの材料（full）GET /library/pages/:id/access */
        get: (id: string) =>
          tx.request<LibraryPageAccess>("GET", `/library/pages/${pathParam(id, "id")}/access`),
        /** 直接の共有を全部置き換える（full）PUT /library/pages/:id/grants */
        setGrants: (id: string, input: SetLibraryPageGrantsInput) =>
          tx.request<LibraryPageAccess>("PUT", `/library/pages/${pathParam(id, "id")}/grants`, input),
        /** 制限する / 継承に戻す（full）PATCH /library/pages/:id/access */
        setMode: (id: string, input: SetLibraryPageAccessModeInput) =>
          tx.request<LibraryPageAccess>("PATCH", `/library/pages/${pathParam(id, "id")}/access`, input),
        /** 見えるようになる人・見えなくなる人の数（書き込まない）POST /library/pages/:id/access/preview */
        preview: (id: string, input: PreviewLibraryAccessChangeInput) =>
          tx.request<LibraryAccessChangePreview>("POST", `/library/pages/${pathParam(id, "id")}/access/preview`, input),
      },
      /** ページを探す（公開版の題名と本文・見えるページだけ）GET /library/search */
      search: (params: SearchLibraryPagesQuery) =>
        tx.request<LibrarySearchHit[]>("GET", `/library/search${buildQueryString(params)}`),
      /** スペースの木（見えるページだけ）GET /library/spaces/:id/tree */
      tree: (spaceId: string) =>
        tx.request<LibraryTreeNode[]>("GET", `/library/spaces/${pathParam(spaceId, "spaceId")}/tree`),
      /** slug で引く GET /library/spaces/:id/pages/by-slug/:slug */
      getBySlug: (spaceId: string, slug: string) =>
        tx.request<LibraryPage>("GET", `/library/spaces/${pathParam(spaceId, "spaceId")}/pages/by-slug/${pathParam(slug, "slug")}`),
      /** ページ 1 枚 GET /library/pages/:id */
      get: (id: string) => tx.request<LibraryPage>("GET", `/library/pages/${pathParam(id, "id")}`),
      /** ページを作る（下書き）POST /library/pages */
      create: (input: CreateLibraryPageInput) =>
        tx.request<LibraryPageRecord>("POST", "/library/pages", input),
      /** 下書きの保存（楽観ロック）PUT /library/pages/:id/draft */
      saveDraft: (id: string, input: SaveLibraryPageDraftInput) =>
        tx.request<LibraryPageVersionRecord>("PUT", `/library/pages/${pathParam(id, "id")}/draft`, input),
      /** 公開 POST /library/pages/:id/publish */
      publish: (id: string) =>
        tx.request<LibraryPageVersionRecord>("POST", `/library/pages/${pathParam(id, "id")}/publish`),
      /** 公開をやめる POST /library/pages/:id/unpublish */
      unpublish: (id: string) =>
        tx.request<LibraryPageRecord>("POST", `/library/pages/${pathParam(id, "id")}/unpublish`),
      /** テンプレートの印を付ける・外す（edit）PATCH /library/pages/:id/template */
      setTemplate: (id: string, input: SetLibraryPageTemplateInput) =>
        tx.request<LibraryPageRecord>("PATCH", `/library/pages/${pathParam(id, "id")}/template`, input),
      /** 移動・並べ替え（同じスペースの中）PATCH /library/pages/:id/move */
      move: (id: string, input: MoveLibraryPageInput) =>
        tx.request<LibraryPageRecord>("PATCH", `/library/pages/${pathParam(id, "id")}/move`, input),
      /** 論理削除（部分木も・`library:delete`）PATCH /library/pages/:id/delete */
      delete: (id: string) =>
        tx.request<{ id: string; count: number }>("PATCH", `/library/pages/${pathParam(id, "id")}/delete`),
      /** 形式の変換（下書きの版を作る）POST /library/pages/:id/convert */
      convert: (id: string, input: ConvertLibraryPageFormatInput) =>
        tx.request<LibraryPageVersionRecord>("POST", `/library/pages/${pathParam(id, "id")}/convert`, input),
      /** 版（edit 以上） */
      versions: {
        /** 版の一覧 GET /library/pages/:id/versions */
        list: (id: string) =>
          tx.request<LibraryPageVersion[]>("GET", `/library/pages/${pathParam(id, "id")}/versions`),
        /** 版 1 つ（本文つき）GET /library/pages/:id/versions/:version_no */
        get: (id: string, versionNo: number) =>
          tx.request<LibraryPageVersionDetail>("GET", `/library/pages/${pathParam(id, "id")}/versions/${pathParam(versionNo, "versionNo")}`),
        /** 版を新しい下書きにする POST /library/pages/:id/versions/restore */
        restore: (id: string, input: RestoreLibraryPageVersionInput) =>
          tx.request<LibraryPageVersionRecord>("POST", `/library/pages/${pathParam(id, "id")}/versions/restore`, input),
      },
    },
    /** 公式ライブラリ（読むのと複製だけ） */
    official: {
      /** 公式のスペースの一覧 GET /library/official/spaces */
      spaces: () => tx.request<LibraryOfficialSpace[]>("GET", "/library/official/spaces"),
      /** 公式のスペースの木 GET /library/official/spaces/:id/tree */
      tree: (spaceId: string) =>
        tx.request<LibraryOfficialTreeNode[]>("GET", `/library/official/spaces/${pathParam(spaceId, "spaceId")}/tree`),
      /** 公式のページを slug で引く GET /library/official/spaces/:id/pages/by-slug/:slug */
      getBySlug: (spaceId: string, slug: string) =>
        tx.request<LibraryOfficialPage>("GET", `/library/official/spaces/${pathParam(spaceId, "spaceId")}/pages/by-slug/${pathParam(slug, "slug")}`),
      /** 公式のページ 1 枚 GET /library/official/pages/:id */
      get: (id: string) =>
        tx.request<LibraryOfficialPage>("GET", `/library/official/pages/${pathParam(id, "id")}`),
      /** 自組織のスペースへ複製（下書き）POST /library/official/pages/:id/copy */
      copy: (id: string, input: CopyOfficialLibraryPageInput) =>
        tx.request<LibraryPageRecord>("POST", `/library/official/pages/${pathParam(id, "id")}/copy`, input),
    },
    /** 本文に貼る画像（実体は storage のアップロード窓口・用途 library_asset に置いてから取り込む） */
    assets: {
      /** 画像を staging から取り込む（ページで edit）POST /library/pages/:id/assets */
      upload: (pageId: string, input: UploadLibraryAssetInput) =>
        tx.request<LibraryAsset>("POST", `/library/pages/${pathParam(pageId, "pageId")}/assets`, input),
      /** 画像の署名 URL（本文がその画像を使っているときだけ。draft は edit 以上）GET /library/pages/:id/assets/:asset_id/url */
      signedUrl: (pageId: string, assetId: string, opts?: { draft?: boolean }) =>
        tx.request<{ assetId: string; url: string; expiresAt: string }>("GET", `/library/pages/${pathParam(pageId, "pageId")}/assets/${pathParam(assetId, "assetId")}/url${buildQueryString({ draft: opts?.draft ? "true" : undefined })}`),
      /** スペースの画像の一覧（スペースで edit）GET /library/spaces/:id/assets */
      list: (spaceId: string) =>
        tx.request<LibraryAsset[]>("GET", `/library/spaces/${pathParam(spaceId, "spaceId")}/assets`),
      /** 画像を消す（スペースで edit・`library:delete`）PATCH /library/spaces/:id/assets/:asset_id/delete */
      remove: (spaceId: string, assetId: string) =>
        tx.request<{ id: string }>("PATCH", `/library/spaces/${pathParam(spaceId, "spaceId")}/assets/${pathParam(assetId, "assetId")}/delete`),
    },
    /** 「この画面の使い方」 */
    help: {
      /** 「この画面の使い方」のページ（公式の help_key・例 `eecall/call-log`）。URL は web の `/library/h/{key}` GET /library/help?key= */
      get: (key: string) => tx.request<LibraryHelpPage>("GET", `/library/help${buildQueryString({ key })}`),
    },
  };
}
