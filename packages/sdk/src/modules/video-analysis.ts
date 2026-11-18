
import type {
  CameraControlInput,
  CameraFrameInput,
  CameraRosterEntry,
  CameraSignalInput,
  CameraStandbyInput,
  CameraStateReportInput,
  CreateVideoSegmentInput,
  CreateVideoSessionInput,
  IssueVideoStillsInput,
  IssueVideoStillsResult,
  ListVideoCamerasParams,
  ListVideoSessionsParams,
  UpdateVideoSessionInput,
  VideoAnalysisPermissionContext,
  VideoCost,
  VideoEndpointState,
  VideoReport,
  VideoSession,
  VideoSessionDetail,
  VideoSessionLine,
  VideoSessionListItem,
  VideoStill,
  VideoStillList,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createVideoAnalysisNamespace(tx: SdkTransport) {
  return {
    /** 画面の出し分けの材料（書けるか・消せるか・エンドポイントを止められるか）GET /video-analysis/permission-context */
    permissionContext: () =>
      tx.request<VideoAnalysisPermissionContext>("GET", "/video-analysis/permission-context"),
    /** セッション（1 回のレクの記録）・文・評価シート */
    sessions: {
      /** セッション（1 回のレクの記録）の一覧（新しい順。?facilityId= ほか。場面の色分けの帯・件数・総合の点つき）GET /video-analysis/sessions */
      list: (params?: ListVideoSessionsParams) =>
        tx.request<VideoSessionListItem[]>("GET", `/video-analysis/sessions${buildQueryString(params)}`),
      /** セッション 1 件（文の並び・最新の評価シート・次に送る区切りの枠つき）GET /video-analysis/sessions/:id */
      get: (id: string) =>
        tx.request<VideoSessionDetail>("GET", `/video-analysis/sessions/${pathParam(id, "id")}`),
      /** 下見を作る（事業所・名前・区切りの秒。参加者の同意の確認が必須）POST /video-analysis/sessions */
      create: (input: CreateVideoSessionInput) =>
        tx.request<VideoSession>("POST", "/video-analysis/sessions", input),
      /** レクの名前を付け替える（題名は省略して作ると日時で付く）PATCH /video-analysis/sessions/:id */
      update: (id: string, input: UpdateVideoSessionInput) =>
        tx.request<VideoSession>("PATCH", `/video-analysis/sessions/${pathParam(id, "id")}`, input),
      /** 記録を始める（下見 → 記録中・1 回だけ）POST /video-analysis/sessions/:id/start */
      start: (id: string) =>
        tx.request<VideoSession>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/start`),
      /** 記録を終える（記録した本人か管理者）POST /video-analysis/sessions/:id/end */
      end: (id: string) =>
        tx.request<VideoSession>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/end`),
      /** 区切り 1 本を送って文にする（映像は保存しない。区切りの番号 seq は端末が送る連番で、詳細の nextSeq から +1 ずつ。同じ番号は 1 行に畳まれる）POST /video-analysis/sessions/:id/segments */
      createSegment: (id: string, input: CreateVideoSegmentInput) =>
        tx.request<VideoSessionLine>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/segments`, input),
      /** 評価シートを作る・作り直す（記録の文から。版が増える）POST /video-analysis/sessions/:id/report */
      report: (id: string) =>
        tx.request<VideoReport>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/report`),
      /** 最新の評価シート（まだ無ければ null）GET /video-analysis/sessions/:id/report */
      getReport: (id: string) =>
        tx.request<VideoReport | null>("GET", `/video-analysis/sessions/${pathParam(id, "id")}/report`),
      /** セッションを消す（文と評価シートも物理的に消える）DELETE /video-analysis/sessions/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/video-analysis/sessions/${pathParam(id, "id")}`),
      /** ハイライトの静止画の上げる先をもらう（評価シートの後・どの区切りを残すかはサーバーが選ぶ。画像は送らず、候補の番号と大きさだけ。返る URL へブラウザが直接 PUT する）POST /video-analysis/sessions/:id/stills/issue */
      issueStills: (id: string, input: IssueVideoStillsInput) =>
        tx.request<IssueVideoStillsResult>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/stills/issue`, input),
      /** 静止画の上げ終わり（サーバーが実体の大きさと JPEG であることを確かめて ready にする。本文なし）POST /video-analysis/sessions/:id/stills/:stillId/commit */
      commitStill: (id: string, stillId: string) =>
        tx.request<VideoStill>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/stills/${pathParam(stillId, "stillId")}/commit`),
      /** 見られる静止画（短い期限の署名付き URL つき。保持の 90 日を過ぎたものは返らない）GET /video-analysis/sessions/:id/stills */
      listStills: (id: string) =>
        tx.request<VideoStillList>("GET", `/video-analysis/sessions/${pathParam(id, "id")}/stills`),
      /** 静止画を 1 枚消す（行を消してから実体も消す。本文なし）DELETE /video-analysis/sessions/:id/stills/:stillId */
      deleteStill: (id: string, stillId: string) =>
        tx.request<null>("DELETE", `/video-analysis/sessions/${pathParam(id, "id")}/stills/${pathParam(stillId, "stillId")}`),
    },
    /** 推論エンドポイント（GPU。環境で 1 つを全組織で共有） */
    endpoint: {
      /** 推論エンドポイント（GPU）の状態と自動停止の予定 GET /video-analysis/endpoint */
      get: () => tx.request<VideoEndpointState>("GET", "/video-analysis/endpoint"),
      /** エンドポイントを起こす（約 5 分。月の上限に達していれば理由つきで断る）POST /video-analysis/endpoint/start */
      start: () => tx.request<VideoEndpointState>("POST", "/video-analysis/endpoint/start"),
      /** エンドポイントを止める（管理者か、起こした直後の本人）POST /video-analysis/endpoint/stop */
      stop: () => tx.request<VideoEndpointState>("POST", "/video-analysis/endpoint/stop"),
    },
    /** 費用の目安 */
    cost: {
      /** 費用の目安（起動してからの時間・自組織の今月の利用・QT と月の上限の位置）GET /video-analysis/cost */
      get: () => tx.request<VideoCost>("GET", "/video-analysis/cost"),
    },
    /** カメラ端末（iPad）と操作端末（PC）。待機の名簿・指示・合図・静止画（どれも保存しない） */
    camera: {
      /** カメラ端末（iPad）を待機の名簿に載せる・生存を更新する（30 秒で消える短命の登録）PUT /video-analysis/camera/standby */
      standby: (input: CameraStandbyInput) =>
        tx.request<CameraRosterEntry>("PUT", "/video-analysis/camera/standby", input),
      /** 待機を解除する（名簿から外す。業務データの削除ではないので POST）POST /video-analysis/camera/standby/release */
      release: (input: { cameraId: string }) =>
        tx.request<null>("POST", "/video-analysis/camera/standby/release", input),
      /** 事業所の待機中のカメラの名簿（?facilityId= 必須）GET /video-analysis/camera/list */
      list: (params: ListVideoCamerasParams) =>
        tx.request<CameraRosterEntry[]>("GET", `/video-analysis/camera/list${buildQueryString(params)}`),
      /** PC からカメラへの指示（開始・停止・レンズ・経路・記録・下見。監査に残る） POST /video-analysis/sessions/:id/camera/control */
      control: (id: string, input: CameraControlInput) =>
        tx.request<null>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/camera/control`, input),
      /** WebRTC の合図（offer / answer / ice）を相手の端末へ渡す（保存しない） POST /video-analysis/sessions/:id/camera/signal */
      signal: (id: string, input: CameraSignalInput) =>
        tx.request<null>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/camera/signal`, input),
      /** 端末が自分の状態を相手へ知らせる（ID と種類だけ） POST /video-analysis/sessions/:id/camera/state */
      state: (id: string, input: CameraStateReportInput) =>
        tx.request<null>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/camera/state`, input),
      /** 経路 2 の静止画 1 枚を PC へ渡す（保存しない） POST /video-analysis/sessions/:id/camera/frame */
      frame: (id: string, input: CameraFrameInput) =>
        tx.request<null>("POST", `/video-analysis/sessions/${pathParam(id, "id")}/camera/frame`, input),
    },
  };
}
