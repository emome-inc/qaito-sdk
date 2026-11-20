
import type {
  CopyLibraryNodeInput,
  CreateLibraryNodeInput,
  EditLibraryDesignInput,
  GetLibraryNodeQuery,
  GetLibraryTreeQuery,
  LibraryAsset,
  LibraryAssetUploadUrl,
  LibraryAssetUploadUrlInput,
  LibraryAssetUrl,
  LibraryDesignPreview,
  LibraryHelpTarget,
  LibraryMyAccess,
  LibraryNames,
  LibraryNode,
  LibraryNodeSaved,
  LibraryNodeView,
  LibraryOfficialNodeWithBody,
  LibraryOfficialTree,
  LibrarySearchHit,
  LibraryShareCreated,
  LibraryShareUpdated,
  LibraryTree,
  LibraryVisibilityPreview,
  MoveLibraryNodeInput,
  PreviewLibraryDesignInput,
  PublicLink,
  SaveLibraryBodyInput,
  SearchLibraryNodesQuery,
  SetLibraryNamesInput,
  SetLibraryVisibilityInput,
  StepLibraryVersionInput,
  UpdateLibraryNodeInput,
  UploadLibraryAssetInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createLibraryNamespace(tx: SdkTransport) {
  return {
    /** 自分の置き場と書けるか */
    me: {
      /** 自分の置き場（組織・所属する事業所・個人）と書けるか GET /library/me */
      get: () => tx.request<LibraryMyAccess>("GET", "/library/me"),
    },
    /** 置き場の木 */
    tree: {
      /** 置き場の木（入れるノード + 名前だけの非公開）GET /library/tree */
      get: (params: GetLibraryTreeQuery) =>
        tx.request<LibraryTree>("GET", `/library/tree${buildQueryString(params)}`),
    },
    /** 読めるノードを探す（題名と本文・錠つきは出さない）GET /library/search */
    search: (params: SearchLibraryNodesQuery) =>
      tx.request<LibrarySearchHit[]>("GET", `/library/search${buildQueryString(params)}`),
    /** フォルダとページ */
    nodes: {
      /** ノード 1 つ（本文・できること・非公開の根の名前・見せる人の数つき。as で本文を html / text / outline にして返す）GET /library/nodes/:id */
      get: (id: string, params?: GetLibraryNodeQuery) =>
        tx.request<LibraryNodeView>("GET", `/library/nodes/${pathParam(id, "id")}${buildQueryString(params)}`),
      /** フォルダ・ページを作る（組織の置き場には今は作れない）POST /library/nodes */
      create: (input: CreateLibraryNodeInput) => tx.request<LibraryNode>("POST", "/library/nodes", input),
      /** 題名・アイコン・カバー・テンプレートの印 PATCH /library/nodes/:id */
      update: (id: string, input: UpdateLibraryNodeInput) =>
        tx.request<LibraryNode>("PATCH", `/library/nodes/${pathParam(id, "id")}`, input),
      /** 本文の保存（すぐ反映・版が 1 つ増える。baseVersionNo がずれたら 409。design は検査の報告つき）PUT /library/nodes/:id/body */
      saveBody: (id: string, input: SaveLibraryBodyInput) =>
        tx.request<LibraryNodeSaved>("PUT", `/library/nodes/${pathParam(id, "id")}/body`, input),
      /** デザインページの一部を置き換えて保存（oldString がちょうど 1 回だけ現れるときだけ・版が 1 つ増える）PATCH /library/nodes/:id/design */
      editDesign: (id: string, input: EditLibraryDesignInput) =>
        tx.request<LibraryNodeSaved>("PATCH", `/library/nodes/${pathParam(id, "id")}/design`, input),
      /** デザインページの検査だけ（保存しない）POST /library/nodes/:id/design/preview */
      previewDesign: (id: string, input: PreviewLibraryDesignInput) =>
        tx.request<LibraryDesignPreview>("POST", `/library/nodes/${pathParam(id, "id")}/design/preview`, input),
      /** 移動・並べ替え（同じ置き場の中）PATCH /library/nodes/:id/move */
      move: (id: string, input: MoveLibraryNodeInput) =>
        tx.request<LibraryNode>("PATCH", `/library/nodes/${pathParam(id, "id")}/move`, input),
      /** 論理削除（部分木も・中にほかの人の非公開があれば 409）PATCH /library/nodes/:id/delete */
      delete: (id: string) =>
        tx.request<{ id: string }>("PATCH", `/library/nodes/${pathParam(id, "id")}/delete`),
      /** 公開 / 非公開の切り替え */
      visibility: {
        /** 公開 / 非公開の切り替え（公開→非公開は作った人・非公開→公開は持ち主）PUT /library/nodes/:id/visibility */
        set: (id: string, input: SetLibraryVisibilityInput) =>
          tx.request<LibraryNode>("PUT", `/library/nodes/${pathParam(id, "id")}/visibility`, input),
        /** 切り替えの影響（書き込みなし）POST /library/nodes/:id/visibility/preview */
        preview: (id: string, input: SetLibraryVisibilityInput) =>
          tx.request<LibraryVisibilityPreview>("POST", `/library/nodes/${pathParam(id, "id")}/visibility/preview`, input),
      },
      /** 非公開の見せる人（持ち主だけ） */
      names: {
        /** 見せる人（effective = いま所属しているか・持ち主だけ）GET /library/nodes/:id/names */
        get: (id: string) => tx.request<LibraryNames>("GET", `/library/nodes/${pathParam(id, "id")}/names`),
        /** 見せる人を全部置き換える（持ち主だけ）PUT /library/nodes/:id/names */
        set: (id: string, input: SetLibraryNamesInput) =>
          tx.request<LibraryNames>("PUT", `/library/nodes/${pathParam(id, "id")}/names`, input),
      },
      /** ページの版（戻す / 進む） */
      versions: {
        /** 版を 1 つ戻す / 進む（本文と形式だけ・版の行は作らない）POST /library/nodes/:id/versions/step */
        step: (id: string, input: StepLibraryVersionInput) =>
          tx.request<LibraryNodeSaved>("POST", `/library/nodes/${pathParam(id, "id")}/versions/step`, input),
      },
      /** ページに貼る画像（実体は storage のアップロード窓口・用途 library_asset に置いてから取り込む） */
      assets: {
        /** 画像を上げる署名つき URL（DB に書かない）。PUT のあと stagedId を assets.upload に渡す POST /library/nodes/:id/assets/upload-url */
        uploadUrl: (id: string, input: LibraryAssetUploadUrlInput) =>
          tx.request<LibraryAssetUploadUrl>("POST", `/library/nodes/${pathParam(id, "id")}/assets/upload-url`, input),
        /** 画像を staging から取り込む POST /library/nodes/:id/assets */
        upload: (id: string, input: UploadLibraryAssetInput) =>
          tx.request<LibraryAsset>("POST", `/library/nodes/${pathParam(id, "id")}/assets`, input),
        /** ページの画像の一覧 GET /library/nodes/:id/assets */
        list: (id: string) =>
          tx.request<LibraryAsset[]>("GET", `/library/nodes/${pathParam(id, "id")}/assets`),
        /** 画像の短期の署名 URL GET /library/nodes/:id/assets/:asset_id/url */
        url: (id: string, assetId: string) =>
          tx.request<LibraryAssetUrl>("GET", `/library/nodes/${pathParam(id, "id")}/assets/${pathParam(assetId, "assetId")}/url`),
        /** 画像を消す PATCH /library/nodes/:id/assets/:asset_id/delete */
        remove: (id: string, assetId: string) =>
          tx.request<{ id: string }>("PATCH", `/library/nodes/${pathParam(id, "id")}/assets/${pathParam(assetId, "assetId")}/delete`),
      },
      share: {
        /** 外部共有リンクを作る（置き場の対象の人〔事業所は所属の人・組織は全員〕とルート・公開のページ。本文なし・期限なし。URL はこの応答で 1 度だけ）POST /library/nodes/:id/share */
        create: (id: string) =>
          tx.request<LibraryShareCreated>("POST", `/library/nodes/${pathParam(id, "id")}/share`),
        /** 共有を更新（今の内容に置き換える・同じリンク）POST /library/nodes/:id/share/update */
        update: (id: string) =>
          tx.request<LibraryShareUpdated>("POST", `/library/nodes/${pathParam(id, "id")}/share/update`),
        /** 共有を止める（置き場の対象の人とルート）DELETE /library/nodes/:id/share */
        remove: (id: string) =>
          tx.request<{ started: boolean }>("DELETE", `/library/nodes/${pathParam(id, "id")}/share`),
        /** 共有の状態（無ければ null。置き場の対象の人とルートだけ）GET /library/nodes/:id/share */
        get: (id: string) =>
          tx.request<PublicLink | null>("GET", `/library/nodes/${pathParam(id, "id")}/share`),
      },
    },
    /** 見せる人の候補 */
    people: {
      /** 見せる人の候補（置き場の対象で、いま所属している人）GET /library/people */
      list: (params: GetLibraryTreeQuery) =>
        tx.request<{ userId: string; name: string }[]>("GET", `/library/people${buildQueryString(params)}`),
    },
    /** 複製（元はノードか公式・先は書ける置き場。画像も写す）POST /library/copy */
    copy: (input: CopyLibraryNodeInput) => tx.request<LibraryNode>("POST", "/library/copy", input),
    /** 公式ライブラリ（読むだけ。持ってくるのは copy） */
    official: {
      /** 公式の木 GET /library/official/tree */
      tree: () => tx.request<LibraryOfficialTree>("GET", "/library/official/tree"),
      /** 公式のノード 1 つ（本文つき）GET /library/official/nodes/:id */
      get: (id: string) =>
        tx.request<LibraryOfficialNodeWithBody>("GET", `/library/official/nodes/${pathParam(id, "id")}`),
    },
    /** 「この画面の使い方」 */
    help: {
      /** 「この画面の使い方」の URL（新しいタブで開く）GET /library/help?key= */
      get: (key: string) => tx.request<LibraryHelpTarget>("GET", `/library/help${buildQueryString({ key })}`),
    },
  };
}
