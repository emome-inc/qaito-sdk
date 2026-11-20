
import type {
  AddRecreationFavoriteInput,
  AddRecreationItemFileInput,
  AddRecreationNewsImageInput,
  AddRecreationPlaylistItemInput,
  CastRecreationVoteInput,
  CreateRecreationCategoryInput,
  CreateRecreationItemInput,
  CreateRecreationNewsInput,
  CreateRecreationOfficialPlaylistInput,
  CreateRecreationPlaylistInput,
  GetRecreationHomeParams,
  ListRecreationAdminItemsParams,
  ListRecreationAdminNewsParams,
  ListRecreationAdminOfficialPlaylistsParams,
  ListRecreationCategoriesParams,
  ListRecreationFavoritesParams,
  ListRecreationHistoryParams,
  ListRecreationInquiriesParams,
  ListRecreationKitsParams,
  ListRecreationNewsParams,
  ListRecreationPlaylistsParams,
  ListRecreationPrintsParams,
  ListRecreationStreamVideosParams,
  ListRecreationVideosParams,
  RecordRecreationFileOpenInput,
  RecreationAdminItem,
  RecreationAdminItemRow,
  RecreationAdminNews,
  RecreationAdminOfficialPlaylist,
  RecreationCategory,
  RecreationFavorite,
  RecreationFileOpenReceipt,
  RecreationFileOpenUrl,
  RecreationFilters,
  RecreationHistoryClearResult,
  RecreationHistoryItem,
  RecreationHome,
  RecreationInquiry,
  RecreationKit,
  RecreationKitDetail,
  RecreationNews,
  RecreationNewsDetail,
  RecreationPermissionContext,
  RecreationPlayReceipt,
  RecreationPlayback,
  RecreationPlaylist,
  RecreationPlaylistDetail,
  RecreationPlaylistItem,
  RecreationPrint,
  RecreationPrintDetail,
  RecreationProgress,
  RecreationRelatedVideo,
  RecreationStreamVideoList,
  RecreationType,
  RecreationVideo,
  RecreationVideoDetail,
  RecreationVote,
  ReorderRecreationPlaylistItemsInput,
  SaveRecreationProgressInput,
  StartRecreationPlayInput,
  SubmitRecreationInquiryInput,
  UpdateRecreationCategoryInput,
  UpdateRecreationInquiryInput,
  UpdateRecreationItemInput,
  UpdateRecreationNewsInput,
  UpdateRecreationOfficialPlaylistInput,
  UpdateRecreationPlaylistInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createRecreationNamespace(tx: SdkTransport) {
  return {
    /** 画面の出し分けの材料（本人の userId・組織の管理者か・write / delete を持つか・入稿ができるか）GET /recreation/permission-context */
    permissionContext: () => tx.request<RecreationPermissionContext>("GET", "/recreation/permission-context"),
    /** ホーム（続きから見る・新着・人気・お気に入り〔動画〕・カテゴリごとの新着・公式プレイリストの 6 区画。区画ごとに `{ items, has_more }`。?limit= は区画ごとの本数）GET /recreation/home */
    home: (params?: GetRecreationHomeParams) =>
      tx.request<RecreationHome>("GET", `/recreation/home${buildQueryString(params)}`),
    /** 絞り込みの選択肢（見せる項目が使っているカテゴリ・タグ・作者〔動画だけ〕。要介護度・支援内容・難易度・季節・所要時間は定数 `RECREATION_*` から作る）GET /recreation/filters?type= */
    filters: (type: RecreationType) =>
      tx.request<RecreationFilters>("GET", `/recreation/filters${buildQueryString({ type })}`),
    /** 動画（映像レク）の一覧・1 本・関連・再生の URL */
    videos: {
      /** 一覧と検索（?q= / categoryId・tag・careLevel・supportType・season・difficulty・duration・creator / ?sort=new|popular|title / ?limit= / ?offset=）GET /recreation/videos */
      list: (params?: ListRecreationVideosParams) =>
        tx.request<RecreationVideo[]>("GET", `/recreation/videos${buildQueryString(params)}`),
      /** 動画 1 本（概要・本人の投票と再生位置を含む。見せない動画は 404）GET /recreation/videos/:id */
      get: (id: string) =>
        tx.request<RecreationVideoDetail>("GET", `/recreation/videos/${pathParam(id, "id")}`),
      /** 関連動画（固定 12 本・点数つき）GET /recreation/videos/:id/related */
      related: (id: string) =>
        tx.request<RecreationRelatedVideo[]>("GET", `/recreation/videos/${pathParam(id, "id")}/related`),
      /** 再生の URL（HLS は必ず・MP4 は作ってある動画だけ。期限の前に取り直す。見せない動画は 404・Stream に接続していなければ 409 MEDIA_NOT_READY・AI と委任の呼び出しは 403）GET /recreation/videos/:id/playback */
      playback: (id: string) =>
        tx.request<RecreationPlayback>("GET", `/recreation/videos/${pathParam(id, "id")}/playback`),
    },
    /** プリント（一覧・1 本・添付を開く URL・開いた記録） */
    prints: {
      /** 一覧と検索（?q= / categoryId・tag・careLevel・supportType・season・difficulty / ?sort=new|popular|title / ?limit= / ?offset=）GET /recreation/prints */
      list: (params?: ListRecreationPrintsParams) =>
        tx.request<RecreationPrint[]>("GET", `/recreation/prints${buildQueryString(params)}`),
      /** プリント 1 本（概要・添付ごとの署名つき URL。画面はこの 1 回で開くまで済ませる。AI と委任の呼び出しには URL の無い形）GET /recreation/prints/:id */
      get: (id: string) =>
        tx.request<RecreationPrintDetail>("GET", `/recreation/prints/${pathParam(id, "id")}`),
      /** 添付 1 件を開く署名つき URL（inline。SDK・外部アプリ向けの単発の口。見せないプリント・無い添付は 404・AI と委任の呼び出しは 403）GET /recreation/prints/:id/files/:fileId/open-url */
      fileOpenUrl: (id: string, fileId: string) =>
        tx.request<RecreationFileOpenUrl>("GET", `/recreation/prints/${pathParam(id, "id")}/files/${pathParam(fileId, "fileId")}/open-url`),
      /** ファイルを開いた記録（open の記録を 1 行。人気の数に入る）POST /recreation/file-opens */
      recordOpen: (input: RecordRecreationFileOpenInput) =>
        tx.request<RecreationFileOpenReceipt>("POST", "/recreation/file-opens", input),
    },
    /** 対面レクのキット */
    kits: {
      /** キットの一覧（?q= / categoryId・tag・careLevel・supportType・season・difficulty・featured / ?sort=featured|new|title / ?limit= / ?offset=）GET /recreation/kits */
      list: (params?: ListRecreationKitsParams) =>
        tx.request<RecreationKit[]>("GET", `/recreation/kits${buildQueryString(params)}`),
      /** キット 1 本（概要・内容・進め方・対象・予算・画像の URL）GET /recreation/kits/:id */
      get: (id: string) => tx.request<RecreationKitDetail>("GET", `/recreation/kits/${pathParam(id, "id")}`),
    },
    /** お知らせ（公開分だけ・新しい順） */
    news: {
      /** お知らせの一覧（本文は持たない。?limit= / ?offset=）GET /recreation/news */
      list: (params?: ListRecreationNewsParams) =>
        tx.request<RecreationNews[]>("GET", `/recreation/news${buildQueryString(params)}`),
      /** お知らせ 1 件（`bodyHtml` は無害化済みの HTML。本文の画像は `bodyImageUrls` の順に下へ並べる）GET /recreation/news/:id */
      get: (id: string) => tx.request<RecreationNewsDetail>("GET", `/recreation/news/${pathParam(id, "id")}`),
    },
    /** プレイリスト（公式とマイを 1 つの型で見せる。書き込みはマイだけ） */
    playlists: {
      /** 一覧（?kind=official|mine。省くと公式〔公開分〕とマイ〔本人の分〕の両方。?grouping= を付けると公式だけ）GET /recreation/playlists */
      list: (params?: ListRecreationPlaylistsParams) =>
        tx.request<RecreationPlaylist[]>("GET", `/recreation/playlists${buildQueryString(params)}`),
      /** 1 本（項目つき。公式を先に引き、無ければ本人のマイ。他人のマイは 404〔組織の管理者には 403〕）GET /recreation/playlists/:id */
      get: (id: string) =>
        tx.request<RecreationPlaylistDetail>("GET", `/recreation/playlists/${pathParam(id, "id")}`),
      /** マイプレイリストを作る（持ち主は本人）POST /recreation/playlists */
      create: (input: CreateRecreationPlaylistInput) =>
        tx.request<RecreationPlaylist>("POST", "/recreation/playlists", input),
      /** マイの名前・説明・並びを直す（送ったキーだけ。持ち主だけ）PATCH /recreation/playlists/:id */
      update: (id: string, input: UpdateRecreationPlaylistInput) =>
        tx.request<RecreationPlaylist>("PATCH", `/recreation/playlists/${pathParam(id, "id")}`, input),
      /** マイを消す（本人は `recreation:write`・他人のマイは組織の管理者だけで `recreation:delete`。公式は消せない）DELETE /recreation/playlists/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/recreation/playlists/${pathParam(id, "id")}`),
      /** 末尾に足す（既にあればその項目を返す）POST /recreation/playlists/:id/items */
      addItem: (id: string, input: AddRecreationPlaylistItemInput) =>
        tx.request<RecreationPlaylistItem>("POST", `/recreation/playlists/${pathParam(id, "id")}/items`, input),
      /** 並びを丸ごと入れ直す（渡した `recreationIds` の順が新しい並び）PUT /recreation/playlists/:id/items */
      reorderItems: (id: string, input: ReorderRecreationPlaylistItemsInput) =>
        tx.request<RecreationPlaylistDetail>("PUT", `/recreation/playlists/${pathParam(id, "id")}/items`, input),
      /** 項目を外す（持ち主だけ・`recreation:write`）DELETE /recreation/playlists/:id/items/:recreationId */
      removeItem: (id: string, recreationId: string) =>
        tx.request<null>("DELETE", `/recreation/playlists/${pathParam(id, "id")}/items/${pathParam(recreationId, "recreationId")}`),
    },
    /** 本人のお気に入り（動画・プリント・キット） */
    favorites: {
      /** 本人のお気に入り（見せる項目だけ・足した新しい順。?type= で種類を絞る・?limit= / ?offset=）GET /recreation/favorites */
      list: (params?: ListRecreationFavoritesParams) =>
        tx.request<RecreationFavorite[]>("GET", `/recreation/favorites${buildQueryString(params)}`),
      /** お気に入りに足す（どの種類の見せる項目も受ける。既にあればそのまま返す）POST /recreation/favorites */
      add: (input: AddRecreationFavoriteInput) =>
        tx.request<RecreationFavorite>("POST", "/recreation/favorites", input),
      /** お気に入りを外す（本人の片付けなので HTTP DELETE でも `recreation:write`）DELETE /recreation/favorites/:recreationId */
      remove: (recreationId: string) =>
        tx.request<null>("DELETE", `/recreation/favorites/${pathParam(recreationId, "recreationId")}`),
    },
    /** 再生位置と再生の記録（プレイヤーの内部。人ごとの枠 playback） */
    progress: {
      /** 本人の再生位置（無ければ 404。画面は先頭から始める）GET /recreation/progress/:recreationId */
      get: (recreationId: string) =>
        tx.request<RecreationProgress>("GET", `/recreation/progress/${pathParam(recreationId, "recreationId")}`),
      /** 再生位置の保存と再生の記録の積み増し（定期・一時停止・離脱時。`playId` は startPlay の戻り。人ごとの枠 playback・10 回/分）PUT /recreation/progress/:recreationId */
      save: (recreationId: string, input: SaveRecreationProgressInput) =>
        tx.request<RecreationProgress>("PUT", `/recreation/progress/${pathParam(recreationId, "recreationId")}`, input),
      /** 再生の開始（play の記録を 1 行作る。`sourceKind` は実際の流し方。返る `playId` を progress.save に渡す。人ごとの枠 playback）POST /recreation/plays */
      startPlay: (input: StartRecreationPlayInput) =>
        tx.request<RecreationPlayReceipt>("POST", "/recreation/plays", input),
    },
    /** 本人の履歴（見た動画と開いたプリント。項目ごとに最新の 1 行） */
    history: {
      /** 本人の履歴（項目ごとに最新の 1 行・新しい順。見せなくなった項目は `item: null`。?type= / ?limit= / ?offset=）GET /recreation/history */
      list: (params?: ListRecreationHistoryParams) =>
        tx.request<RecreationHistoryItem[]>("GET", `/recreation/history${buildQueryString(params)}`),
      /** 本人の記録と再生位置を全部消す（取り消せない。消した数を返す。`recreation:write`）DELETE /recreation/history */
      clear: () => tx.request<RecreationHistoryClearResult>("DELETE", "/recreation/history"),
      /** 1 項目ぶんの記録と再生位置を消す（消した数を返す。`recreation:write`）DELETE /recreation/history/:recreationId */
      remove: (recreationId: string) =>
        tx.request<RecreationHistoryClearResult>("DELETE", `/recreation/history/${pathParam(recreationId, "recreationId")}`),
    },
    /** 良い・悪いの投票 */
    votes: {
      /** 本人の投票と組織の中の数 GET /recreation/votes/:recreationId */
      get: (recreationId: string) =>
        tx.request<RecreationVote>("GET", `/recreation/votes/${pathParam(recreationId, "recreationId")}`),
      /** good / bad を入れる（入れ直しは上書き）PUT /recreation/votes/:recreationId */
      cast: (recreationId: string, input: CastRecreationVoteInput) =>
        tx.request<RecreationVote>("PUT", `/recreation/votes/${pathParam(recreationId, "recreationId")}`, input),
      /** 投票を取り消す（取り消したあとの数を返す。`recreation:write`）DELETE /recreation/votes/:recreationId */
      clear: (recreationId: string) =>
        tx.request<RecreationVote>("DELETE", `/recreation/votes/${pathParam(recreationId, "recreationId")}`),
    },
    /** 対面レクのキットの問い合わせ（組織に届く書き込み） */
    inquiries: {
      /** 問い合わせを送る（`recreation:write` を持つ人なら誰でも。キットは必須で、公開を終えたキットは 400。組織の管理者が Console で見る）POST /recreation/inquiries */
      submit: (input: SubmitRecreationInquiryInput) =>
        tx.request<RecreationInquiry>("POST", "/recreation/inquiries", input),
      /** 問い合わせの一覧（組織の管理者は組織の全部・ほかは本人が送った分だけ。?status=open|closed / ?limit= / ?offset=）GET /recreation/inquiries */
      list: (params?: ListRecreationInquiriesParams) =>
        tx.request<RecreationInquiry[]>("GET", `/recreation/inquiries${buildQueryString(params)}`),
      /** 問い合わせ 1 件（送った本人か組織の管理者。見えない行は 404）GET /recreation/inquiries/:id */
      get: (id: string) =>
        tx.request<RecreationInquiry>("GET", `/recreation/inquiries/${pathParam(id, "id")}`),
      /** 対応済みにする / 未対応に戻す（組織の管理者だけ）PATCH /recreation/inquiries/:id */
      update: (id: string, input: UpdateRecreationInquiryInput) =>
        tx.request<RecreationInquiry>("PATCH", `/recreation/inquiries/${pathParam(id, "id")}`, input),
    },
    admin: {
      /** Cloudflare Stream の動画（登録の候補と、登録済みの項目との突き合わせ） */
      streamVideos: {
        /** Stream の動画と登録済みの項目の突き合わせ（?q= / ?state=unregistered|registered|missing|all。Stream に未接続なら `connected: false` で空）GET /recreation/admin/stream-videos */
        list: (params?: ListRecreationStreamVideosParams) =>
          tx.request<RecreationStreamVideoList>("GET", `/recreation/admin/stream-videos${buildQueryString(params)}`),
      },
      /** 項目（動画・プリント・キット）の入稿 */
      items: {
        /** 入稿の一覧（下書き・予約・公開・削除済み。?type= / ?state=〔省くと削除済みのほか〕/ ?q= / ?limit= / ?offset=）GET /recreation/admin/items */
        list: (params?: ListRecreationAdminItemsParams) =>
          tx.request<RecreationAdminItemRow[]>("GET", `/recreation/admin/items${buildQueryString(params)}`),
        /** 入稿の詳細（ファイルの署名つき URL・入っている公式プレイリスト・編集の欄の平文）GET /recreation/admin/items/:id */
        get: (id: string) =>
          tx.request<RecreationAdminItem>("GET", `/recreation/admin/items/${pathParam(id, "id")}`),
        /** 項目を作る（`type` で形が分かれる。動画は Stream の 1 本を登録し、未接続・無い・準備前・登録済みは 409）POST /recreation/admin/items */
        create: (input: CreateRecreationItemInput) =>
          tx.request<RecreationAdminItem>("POST", "/recreation/admin/items", input),
        /** 項目を直す（送ったキーだけ。種類に合わない `video`・`kit` は 400）PATCH /recreation/admin/items/:id */
        update: (id: string, input: UpdateRecreationItemInput) =>
          tx.request<RecreationAdminItem>("PATCH", `/recreation/admin/items/${pathParam(id, "id")}`, input),
        /** 項目を論理削除する（利用者の画面から消える。restore で戻せる。`recreation:delete`）DELETE /recreation/admin/items/:id */
        delete: (id: string) => tx.request<null>("DELETE", `/recreation/admin/items/${pathParam(id, "id")}`),
        /** 論理削除を元に戻す POST /recreation/admin/items/:id/restore */
        restore: (id: string) =>
          tx.request<RecreationAdminItem>("POST", `/recreation/admin/items/${pathParam(id, "id")}/restore`),
        /** ファイルを足す（staging に上げた `stagedId` を渡す。キーはサーバーが作る。種類に合わない役割は 400）POST /recreation/admin/items/:id/files */
        addFile: (id: string, input: AddRecreationItemFileInput) =>
          tx.request<RecreationAdminItem>("POST", `/recreation/admin/items/${pathParam(id, "id")}/files`, input),
        /** ファイルを外す（行とバケットの実体。`recreation:delete`）DELETE /recreation/admin/items/:id/files/:fileId */
        deleteFile: (id: string, fileId: string) =>
          tx.request<null>("DELETE", `/recreation/admin/items/${pathParam(id, "id")}/files/${pathParam(fileId, "fileId")}`),
        /** Stream と突き合わせる（動画の長さと MP4 の有無を読み直す）POST /recreation/admin/items/:id/stream-refresh */
        refreshStream: (id: string) =>
          tx.request<RecreationAdminItem>("POST", `/recreation/admin/items/${pathParam(id, "id")}/stream-refresh`),
      },
      /** カテゴリ（種類ごと） */
      categories: {
        /** カテゴリの一覧（使っている項目の数つき。?type=）GET /recreation/admin/categories */
        list: (params?: ListRecreationCategoriesParams) =>
          tx.request<RecreationCategory[]>("GET", `/recreation/admin/categories${buildQueryString(params)}`),
        /** カテゴリを作る（名前が種類の中で重なると 409）POST /recreation/admin/categories */
        create: (input: CreateRecreationCategoryInput) =>
          tx.request<RecreationCategory>("POST", "/recreation/admin/categories", input),
        /** 名前・並びを直す（種類は変えない）PATCH /recreation/admin/categories/:id */
        update: (id: string, input: UpdateRecreationCategoryInput) =>
          tx.request<RecreationCategory>("PATCH", `/recreation/admin/categories/${pathParam(id, "id")}`, input),
        /** カテゴリを消す（使っている項目があれば 409。`recreation:delete`）DELETE /recreation/admin/categories/:id */
        delete: (id: string) =>
          tx.request<null>("DELETE", `/recreation/admin/categories/${pathParam(id, "id")}`),
      },
      /** お知らせの入稿 */
      news: {
        /** お知らせの一覧（下書き・予約も。?state=〔省くと削除済みのほか〕/ ?limit= / ?offset=）GET /recreation/admin/news */
        list: (params?: ListRecreationAdminNewsParams) =>
          tx.request<RecreationAdminNews[]>("GET", `/recreation/admin/news${buildQueryString(params)}`),
        /** お知らせを作る（本文は平文。サーバーが HTML に直して無害化する。画像は addImage で足す）POST /recreation/admin/news */
        create: (input: CreateRecreationNewsInput) =>
          tx.request<RecreationAdminNews>("POST", "/recreation/admin/news", input),
        /** お知らせを直す（送ったキーだけ。`coverImage: null` で表紙を外す・`bodyImageOrder` で本文の画像を並べ直す）PATCH /recreation/admin/news/:id */
        update: (id: string, input: UpdateRecreationNewsInput) =>
          tx.request<RecreationAdminNews>("PATCH", `/recreation/admin/news/${pathParam(id, "id")}`, input),
        /** お知らせを論理削除する（`recreation:delete`）DELETE /recreation/admin/news/:id */
        delete: (id: string) => tx.request<null>("DELETE", `/recreation/admin/news/${pathParam(id, "id")}`),
        /** 画像を足す（`slot: cover` は表紙を置き換え・`slot: body` は本文の下の末尾。本文の画像が上限なら 400）POST /recreation/admin/news/:id/images */
        addImage: (id: string, input: AddRecreationNewsImageInput) =>
          tx.request<RecreationAdminNews>("POST", `/recreation/admin/news/${pathParam(id, "id")}/images`, input),
      },
      /** 公式プレイリストの入稿 */
      officialPlaylists: {
        /** 公式プレイリストの一覧（下書きも。削除済みは出さない。?grouping=）GET /recreation/admin/official-playlists */
        list: (params?: ListRecreationAdminOfficialPlaylistsParams) =>
          tx.request<RecreationAdminOfficialPlaylist[]>("GET", `/recreation/admin/official-playlists${buildQueryString(params)}`),
        /** 公式プレイリストを作る（`recreationIds` の順が項目の並び）POST /recreation/admin/official-playlists */
        create: (input: CreateRecreationOfficialPlaylistInput) =>
          tx.request<RecreationAdminOfficialPlaylist>("POST", "/recreation/admin/official-playlists", input),
        /** 公式プレイリストを直す（送ったキーだけ。`recreationIds` を送ると項目を丸ごと置き換える）PATCH /recreation/admin/official-playlists/:id */
        update: (id: string, input: UpdateRecreationOfficialPlaylistInput) =>
          tx.request<RecreationAdminOfficialPlaylist>("PATCH", `/recreation/admin/official-playlists/${pathParam(id, "id")}`, input),
        /** 公式プレイリストを論理削除する（`recreation:delete`）DELETE /recreation/admin/official-playlists/:id */
        delete: (id: string) =>
          tx.request<null>("DELETE", `/recreation/admin/official-playlists/${pathParam(id, "id")}`),
      },
    },
  };
}
