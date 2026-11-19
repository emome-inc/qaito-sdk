import { z } from "zod";

/** 組み込みの外部アプリの builtin_key（台帳 `BUILTIN_EXTERNAL_APPS` の key と同じ）。 */
export const VISION_APP_KEY = "vision" as const;
/** モジュールの slug（scope の接頭辞）。 */
export const VIDEO_ANALYSIS_MODULE = "video-analysis" as const;

/** セッションの種類（アプリのセクション）。最初は「レクリエーション分析」だけ。 */
export const VIDEO_SESSION_KINDS = ["recreation"] as const;
export type VideoSessionKind = (typeof VIDEO_SESSION_KINDS)[number];

/**
 * セッションの状態。下見（作った直後・カメラの画角を見る・区切りは受けない）→ 記録中（`POST …/start` で入る）→
 * 終えた → 評価シートを作った。
 */
export const VIDEO_SESSION_STATUSES = ["preview", "recording", "ended", "reported"] as const;
export type VideoSessionStatus = (typeof VIDEO_SESSION_STATUSES)[number];

export const VIDEO_LINE_SOURCES = ["pc", "camera", "single"] as const;
export type VideoLineSource = (typeof VIDEO_LINE_SOURCES)[number];

/** 場面の種類（色分け）。good=良い / caution=注意 / staff=職員の関わり / normal=ふつう。迷ったら normal。 */
export const VIDEO_SCENE_TAGS = ["good", "caution", "staff", "normal"] as const;
export type VideoSceneTag = (typeof VIDEO_SCENE_TAGS)[number];

/** 評価シートの観点（この順に 5 つ・付録 A.3）。 */
export const VIDEO_REPORT_ASPECTS = ["参加の様子", "表情・盛り上がり", "安全面", "職員の関わり", "進行・時間配分"] as const;
export type VideoReportAspect = (typeof VIDEO_REPORT_ASPECTS)[number];

export const VIDEO_ENDPOINT_STATUSES = ["stopped", "creating", "in_service", "deleting", "failed", "unconfigured"] as const;
export type VideoEndpointStatus = (typeof VIDEO_ENDPOINT_STATUSES)[number];

export const VIDEO_SEGMENT_MAX_BYTES = 2 * 1024 * 1024;
/** 区切り 1 本の長さの上限（秒）。 */
export const VIDEO_SEGMENT_MAX_SECONDS = 12;
/** 区切りの MIME（mp4 だけ。webm は受けない）。 */
export const VIDEO_SEGMENT_MIME = "video/mp4" as const;
export const VIDEO_SEGMENT_SECONDS_DEFAULT = 6;
export const VIDEO_SEGMENT_SECONDS_MIN = 2;
export const VIDEO_SEGMENT_SECONDS_MAX = 30;

/** レクの名前。 */
export const VIDEO_SESSION_TITLE_MAX = 80;
/** VLM の文 1 件の保存の上限（文字）。VLM は最大 200 トークンで返すが、余裕を持って切る。 */
export const VIDEO_LINE_TEXT_MAX = 2000;
/** 場面の理由（20 字）。 */
export const VIDEO_TAG_REASON_MAX = 20;

/** 評価シートの入力に渡す記録の件数・1 件の文字数の上限（付録 A.3）。 */
export const VIDEO_REPORT_INPUT_MAX_LINES = 600;
export const VIDEO_REPORT_INPUT_LINE_MAX = 600;

export const VIDEO_RETENTION_DAYS_DEFAULT = 90;
export const VIDEO_ENDPOINT_IDLE_MINUTES_DEFAULT = 30;
/** 連続起動の上限（時間・既定）。使われていても、これを超えたら止める。 */
export const VIDEO_ENDPOINT_MAX_UPTIME_HOURS_DEFAULT = 4;

/** 一覧の上限。 */
export const VIDEO_SESSION_LIST_LIMIT_MAX = 200;

/** 残す枚数（記録の前に決める・下見のあいだだけ変えられる）。0 = 残さない。 */
export const VIDEO_STILL_COUNT_DEFAULT = 3;
export const VIDEO_STILL_COUNT_MIN = 0;
export const VIDEO_STILL_COUNT_MAX = 6;
/** 1 枚の長辺（px）の上限と、実バイトの上限（commit で headObject の実サイズを比べる）。 */
export const VIDEO_STILL_MAX_EDGE = 1280;
export const VIDEO_STILL_MAX_BYTES = 300 * 1024;
/** MIME（JPEG だけ・先頭の印は FF D8 FF）。 */
export const VIDEO_STILL_MIME = "image/jpeg" as const;
/** 操作端末がメモリに持つこまの上限（溢れたら時間の間隔が均等になるよう間引く）。issue の候補の上限も同じ。 */
export const VIDEO_STILL_RING_MAX = 60;
/** 見えている期間（commit から・日）。過ぎた行は一覧が返さない。バケットのライフサイクル（100 日）より短くする。 */
export const VIDEO_STILL_RETENTION_DAYS = 90;
export const VIDEO_STILL_EXCLUDED_TAGS: readonly VideoSceneTag[] = ["caution"];
export const VIDEO_STILL_TAG_PRIORITY: readonly VideoSceneTag[] = ["good", "staff", "normal"];
/** presigned の期限（秒）。PUT は上げる間だけ・GET は画面に出す間だけ。 */
export const VIDEO_STILL_PUT_EXPIRES_SEC = 300;
export const VIDEO_STILL_GET_EXPIRES_SEC = 300;
/** issue から commit されないまま、これより古い pending は次の issue で消す（分）。 */
export const VIDEO_STILL_PENDING_STALE_MINUTES = 60;

/** base64 にした長さの上限（パディング込み）。 */
const base64Max = (bytes: number) => Math.ceil(bytes / 3) * 4;
/** base64 の文字だけ（改行・data: の頭は付けない）。 */
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

export const VIDEO_VLM_PARAMS = {
  fps: 2,
  maxNewTokens: 200,
  maxNumFrames: 64,
  doSample: false,
} as const;

export const VIDEO_VLM_MODEL = "sagemaker.woven-vision-engine" as const;

const uuid = z.string().uuid();
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD で入力してください");

export const createVideoSessionSchema = z.object({
  facilityId: uuid,
  kind: z.enum(VIDEO_SESSION_KINDS).default("recreation"),
  /** 省略・空白だけのときは、サーバーが「レク 11月17日 14:03」（JST）の形で付ける */
  title: z
    .string()
    .trim()
    .max(VIDEO_SESSION_TITLE_MAX)
    .optional()
    .transform((v) => (v ? v : undefined)),
  segmentSeconds: z
    .number()
    .int()
    .min(VIDEO_SEGMENT_SECONDS_MIN)
    .max(VIDEO_SEGMENT_SECONDS_MAX)
    .default(VIDEO_SEGMENT_SECONDS_DEFAULT),
  stillCount: z.number().int().min(VIDEO_STILL_COUNT_MIN).max(VIDEO_STILL_COUNT_MAX).default(VIDEO_STILL_COUNT_DEFAULT),
  /** 「利用者・ご家族への説明と同意」「個室・入浴・排泄を映さない」を確かめた（監査に ID と時刻だけ残す）。 */
  consentConfirmed: z.literal(true, { message: "撮影の前の確認にチェックを入れてください" }),
});
export type CreateVideoSessionInput = z.input<typeof createVideoSessionSchema>;

/**
 * 題名・静止画の枚数の付け替え（`PATCH /video-analysis/sessions/:id`）。どちらか 1 つは要る。
 * `stillCount` を変えられるのは下見（`preview`）のあいだだけ（記録を始めたら変えない・core が断る）。
 */
export const updateVideoSessionSchema = z
  .object({
    title: z.string().trim().min(1, "レクの名前を入力してください").max(VIDEO_SESSION_TITLE_MAX).optional(),
    stillCount: z.number().int().min(VIDEO_STILL_COUNT_MIN).max(VIDEO_STILL_COUNT_MAX).optional(),
  })
  .refine((v) => v.title !== undefined || v.stillCount !== undefined, { message: "変える項目がありません" });
export type UpdateVideoSessionInput = z.input<typeof updateVideoSessionSchema>;

/** セッションの一覧。 */
export const listVideoSessionsQuerySchema = z.object({
  facilityId: uuid.optional(),
  kind: z.enum(VIDEO_SESSION_KINDS).optional(),
  status: z.enum(VIDEO_SESSION_STATUSES).optional(),
  /** 記録を始めた日（JST）の範囲。両端を含む */
  from: ymd.optional(),
  to: ymd.optional(),
  /** レクの名前の一部。空は絞らない */
  q: z
    .string()
    .trim()
    .max(VIDEO_SESSION_TITLE_MAX)
    .optional()
    .transform((v) => (v ? v : undefined)),
  limit: z.coerce.number().int().min(1).max(VIDEO_SESSION_LIST_LIMIT_MAX).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type ListVideoSessionsQuery = z.output<typeof listVideoSessionsQuerySchema>;

/** 区切りの番号の上限と、サーバーの `nextSeq` から先へ飛んでよい最大（欠番は許容）。 */
export const VIDEO_SEGMENT_SEQ_MAX = 100000;
export const VIDEO_SEGMENT_SEQ_AHEAD_MAX = 20;
/** `capturedAgoMs` の上限（5 分）。それより前に撮り始めた区切りは送らないので、範囲の外として弾く */
export const VIDEO_SEGMENT_CAPTURED_AGO_MAX_MS = 300_000;

export const createVideoSegmentSchema = z.object({
  seq: z.number().int().min(0).max(VIDEO_SEGMENT_SEQ_MAX),
  source: z.enum(VIDEO_LINE_SOURCES),
  durationSec: z.number().positive().max(VIDEO_SEGMENT_MAX_SECONDS),
  mime: z.literal(VIDEO_SEGMENT_MIME),
  videoBase64: z.string().min(1).max(base64Max(VIDEO_SEGMENT_MAX_BYTES)).regex(BASE64_PATTERN),
  capturedAgoMs: z.number().int().min(0).max(VIDEO_SEGMENT_CAPTURED_AGO_MAX_MS).optional(),
});
export type CreateVideoSegmentInput = z.input<typeof createVideoSegmentSchema>;

export const issueVideoStillsSchema = z.object({
  candidates: z
    .array(
      z.object({
        seq: z.number().int().min(0).max(VIDEO_SEGMENT_SEQ_MAX),
        byteSize: z.number().int().min(1).max(VIDEO_STILL_MAX_BYTES),
      }),
    )
    .min(1)
    .max(VIDEO_STILL_RING_MAX)
    .refine((a) => new Set(a.map((c) => c.seq)).size === a.length, { message: "同じ番号が重なっています" }),
});
export type IssueVideoStillsInput = z.input<typeof issueVideoStillsSchema>;

/** 場面の色分けの出力（tool `tag_scene`）。失敗は normal に倒す。 */
export const videoSceneTagSchema = z.object({
  tag: z.enum(VIDEO_SCENE_TAGS),
  reason: z.string().trim().max(VIDEO_TAG_REASON_MAX).default(""),
});
export type VideoSceneTagResult = z.output<typeof videoSceneTagSchema>;

const scoreSchema = z.number().int().min(1).max(5);
/** 1 つの項目の根拠の記録の行の番号（`seq`）。多すぎる引用は要らないので 20 件まで */
export const VIDEO_REPORT_EVIDENCE_MAX = 20;
const videoEvidenceSeqsSchema = z.array(z.number().int().min(0).max(100000)).max(VIDEO_REPORT_EVIDENCE_MAX);
const reportText = (max: number) => z.string().trim().min(1).max(max);

/**
 * 評価シート（tool `write_recreation_report`・`video_session_reports.body`）。
 * 件数は付録 A.3 の指示（good 2〜4 / issues 0〜4 / improvements 2〜4 / highlights 3〜5）に対し、
 * **上は厳しく・下は 1 件まで緩める**（モデルが少なめに返しただけで評価シート全体を捨てないため）。
 */
export const videoReportBodySchema = z.object({
  summary: reportText(600),
  overall: z.object({ score: scoreSchema, comment: reportText(300) }),
  aspects: z
    .array(z.object({ name: z.enum(VIDEO_REPORT_ASPECTS), score: scoreSchema, comment: reportText(300) }))
    .length(VIDEO_REPORT_ASPECTS.length),
  good: z.array(reportText(200)).min(1).max(4),
  issues: z.array(reportText(200)).max(4),
  improvements: z.array(z.object({ what: reportText(120), how: reportText(300) })).min(1).max(4),
  highlights: z
    .array(z.object({ time: z.string().trim().max(20), text: reportText(300), tag: z.enum(VIDEO_SCENE_TAGS) }))
    .min(1)
    .max(5),
  limits: reportText(300),
  /** その回の 1 行の講評（40 字ほどを狙う・上は 80 字まで許す。この項目より前の評価シートには無い） */
  headline: reportText(80).optional(),
  /** おおよその参加人数（AI が分析ログから出す目安。読み取れなければ null・この項目より前の評価シートには無い） */
  participantsApprox: z.number().int().min(0).max(200).nullable().optional(),
  /** よく出た言葉（記録の文に多く出た語・8 語まで・人名や施設名は出さない・この項目より前の評価シートには無い） */
  keywords: z.array(z.string().trim().min(1).max(12)).max(8).optional(),
  /**
   * 根拠にした記録（記録の行の番号 `seq` の並び）。観点（aspects と同じ順）・良かったところ（good と同じ順）・
   * 気になったところ（issues と同じ順）ごと。サーバーが入力に実在する番号だけに絞って保存する（この項目より前の評価シートには無い）
   */
  evidence: z
    .object({
      aspects: z.array(videoEvidenceSeqsSchema).length(VIDEO_REPORT_ASPECTS.length),
      good: z.array(videoEvidenceSeqsSchema).max(4),
      issues: z.array(videoEvidenceSeqsSchema).max(4),
    })
    .optional(),
});
export type VideoReportBody = z.output<typeof videoReportBodySchema>;

export const VIDEO_REPORT_ASPECT_COMMENT_MAX = 16;

/**
 * 評価シートを**保存するとき**の形（tool の出力を受けて保存する前・`core` の INSERT の前に通す）。
 * `videoReportBodySchema` より厳しく、観点のひとことを `VIDEO_REPORT_ASPECT_COMMENT_MAX` 字までにする。
 * **読むとき（保存済みの行の表示）は `videoReportBodySchema` のまま**（この上限より前の評価シートを読めなくしない）。
 */
export const videoReportBodyWriteSchema = videoReportBodySchema.extend({
  aspects: z
    .array(
      z.object({
        name: z.enum(VIDEO_REPORT_ASPECTS),
        score: scoreSchema,
        comment: reportText(VIDEO_REPORT_ASPECT_COMMENT_MAX),
      }),
    )
    .length(VIDEO_REPORT_ASPECTS.length),
});

/**
 * 評価シートの tool の**出力**（モデルが返す形・保存の前）。根拠は入力の**行の番号**（`1.` `2.` …）で引かせ、
 * サーバーが記録の行の番号（`seq`）に置き換えて `evidence` に入れる。good / issues は文だけの形も受ける（引用が無い扱い）
 */
const reportRowRefsSchema = z.array(z.number().int()).max(VIDEO_REPORT_EVIDENCE_MAX).default([]);
const reportCitedTextSchema = z.union([
  reportText(200).transform((text) => ({ text, evidence: [] as number[] })),
  z.object({ text: reportText(200), evidence: reportRowRefsSchema }),
]);
export const videoReportToolOutputSchema = videoReportBodyWriteSchema.omit({ evidence: true }).extend({
  aspects: z
    .array(
      z.object({
        name: z.enum(VIDEO_REPORT_ASPECTS),
        score: scoreSchema,
        comment: reportText(VIDEO_REPORT_ASPECT_COMMENT_MAX),
        evidence: reportRowRefsSchema,
      }),
    )
    .length(VIDEO_REPORT_ASPECTS.length),
  good: z.array(reportCitedTextSchema).min(1).max(4),
  issues: z.array(reportCitedTextSchema).max(4),
});
export type VideoReportToolOutput = z.output<typeof videoReportToolOutputSchema>;

/**
 * レク（その回）の総合評価（画面の呼び名・文字は S〜D のランク）。人の評価ではなく、その回の評価シートの点から決める。規則はここ 1 か所
 * （評価の画面・一覧のカード・api の一覧の口が同じ関数を呼ぶ）。
 * 材料は総合の点と 5 観点の点の平均（小数 1 桁）。注意の場面はランクに入れない（別に見せる）。
 */
export const VIDEO_RANKS = ["S", "A", "B", "C", "D"] as const;
export type VideoRank = (typeof VIDEO_RANKS)[number];

const VIDEO_RANK_THRESHOLDS: readonly (readonly [number, VideoRank])[] = [
  [4.5, "S"],
  [4.0, "A"],
  [3.0, "B"],
  [2.0, "C"],
];

/** 平均の点からランク（4.5 以上 S / 4.0 以上 A / 3.0 以上 B / 2.0 以上 C / 未満 D） */
export function rankOf(score: number): VideoRank {
  for (const [min, rank] of VIDEO_RANK_THRESHOLDS) if (score >= min) return rank;
  return "D";
}

/** 評価シートからランクを決める材料（総合と 5 観点の平均・小数 1 桁） */
export function rankScore(body: Pick<VideoReportBody, "overall" | "aspects">): number {
  const all = [body.overall.score, ...body.aspects.map((a) => a.score)];
  return Math.round((all.reduce((s, n) => s + n, 0) / all.length) * 10) / 10;
}

export const cameraIdSchema = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

export const CAMERA_SIGNAL_MAX_BYTES = 16 * 1024;
export const CAMERA_FRAME_MAX_BYTES = 150 * 1024;
export const CAMERA_STANDBY_TTL_SEC = 30;
export const CAMERA_STANDBY_HEARTBEAT_SEC = 10;
/** iPad で人が「待機を始める」を押してから、遠隔の起動を受ける時間（秒）。過ぎたら押し直すまで起こせない */
export const CAMERA_STANDBY_CONFIRM_TTL_SEC = 4 * 60 * 60;
/** 1 人が名簿に載せられるカメラの数 */
export const CAMERA_STANDBY_MAX_PER_USER = 5;

export const CAMERA_LENSES = ["back", "back-ultrawide", "front"] as const;
export type CameraLens = (typeof CAMERA_LENSES)[number];

/** PUT /video-analysis/camera/standby — 待機の名簿に載せる・延ばす */
export const cameraStandbySchema = z.object({
  cameraId: cameraIdSchema,
  facilityId: z.string().uuid(),
  /** 端末の名前（「iPad（レク室）」など・職員が付ける。利用者の名前は書かない） */
  label: z.string().trim().min(1).max(40),
  /** この端末で選べるレンズ（列挙できたものだけ） */
  lenses: z.array(z.enum(CAMERA_LENSES)).max(3).default([]),
  /** 人が iPad で「待機を始める」を押した最初の登録は true（確認の期限を `CAMERA_STANDBY_CONFIRM_TTL_SEC` 延ばす）。10 秒ごとの合図は false */
  confirm: z.boolean().default(false),
});
export type CameraStandbyInput = z.infer<typeof cameraStandbySchema>;

/** POST /video-analysis/camera/standby/release（`:delete` の scope を要らなくするため DELETE にしない） */
export const cameraUnstandbySchema = z.object({ cameraId: cameraIdSchema });

/** GET /video-analysis/camera/list?facilityId= */
export const cameraListQuerySchema = z.object({ facilityId: z.string().uuid() });

/** 名簿の 1 行（応答）。端末の名前・状態・ID だけ */
export type CameraRosterEntry = {
  cameraId: string;
  facilityId: string;
  label: string;
  lenses: CameraLens[];
  state: "standby" | "busy";
  /** 今つながっているセッション（busy のとき） */
  sessionId: string | null;
  lastSeenAt: string;
  /** 人が押した待機の確認の期限（ISO）。過ぎたら遠隔の起動を受けない */
  standbyUntil: string;
};

/** POST /video-analysis/sessions/:id/camera/signal — WebRTC の合図を相手に渡す（保存しない） */
export const cameraSignalSchema = z.object({
  cameraId: cameraIdSchema,
  to: z.enum(["camera", "operator"]),
  kind: z.enum(["offer", "answer", "ice"]),
  /** RTCSessionDescriptionInit か RTCIceCandidateInit。中身は見ずに大きさだけ上限で止める */
  payload: z
    .record(z.string(), z.unknown())
    .refine((v) => JSON.stringify(v).length <= CAMERA_SIGNAL_MAX_BYTES, { message: "合図が大きすぎます" }),
});
export type CameraSignalInput = z.infer<typeof cameraSignalSchema>;

/** POST /video-analysis/sessions/:id/camera/control — PC からカメラへの指示（監査に残す） */
export const cameraControlSchema = z.object({
  cameraId: cameraIdSchema,
  action: z.enum(["start", "stop", "lens", "route", "record", "preview"]),
  lens: z.enum(CAMERA_LENSES).optional(),
  route: z.enum(["direct", "relay"]).optional(),
});
export type CameraControlInput = z.infer<typeof cameraControlSchema>;

/** POST /video-analysis/sessions/:id/camera/frame — 経路 2 の静止画 1 枚（保存しない） */
export const cameraFrameSchema = z.object({
  cameraId: cameraIdSchema,
  mime: z.literal("image/jpeg"),
  /** 実バイトの上限は手順が base64 を戻してから測る（宣言の大きさは信用しない） */
  dataBase64: z.string().min(1).max(base64Max(CAMERA_FRAME_MAX_BYTES)).regex(BASE64_PATTERN),
});
export type CameraFrameInput = z.infer<typeof cameraFrameSchema>;

export const CAMERA_STATES = ["standby", "connecting", "streaming", "disconnected"] as const;
export type CameraState = (typeof CAMERA_STATES)[number];

/** iPad が起動を断った理由。hidden = 画面が裏にある / camera_denied = カメラの許可が無い / camera_unavailable = カメラが使えない / standby_expired = 待機の確認の期限切れ */
export const CAMERA_STATE_REASONS = ["hidden", "camera_denied", "camera_unavailable", "standby_expired"] as const;
export type CameraStateReason = (typeof CAMERA_STATE_REASONS)[number];

/** POST /video-analysis/sessions/:id/camera/state — 端末が自分の状態を相手へ知らせる（ID と種類だけ・保存しない） */
export const cameraStateReportSchema = z.object({
  cameraId: cameraIdSchema,
  from: z.enum(["camera", "operator"]),
  state: z.enum(CAMERA_STATES),
  route: z.enum(["direct", "relay"]).optional(),
  /** iPad が起動を断った理由（PC へ返す） */
  reason: z.enum(CAMERA_STATE_REASONS).optional(),
});
export type CameraStateReportInput = z.infer<typeof cameraStateReportSchema>;

/** SSE で両端末に流すイベント（`camera/events`）。合図の中身以外は ID と状態だけ */
export type CameraEvent =
  | { type: "signal"; cameraId: string; to: "camera" | "operator"; kind: "offer" | "answer" | "ice"; payload: Record<string, unknown> }
  | { type: "control"; cameraId: string; sessionId: string; action: "start" | "stop" | "lens" | "route" | "record" | "preview"; lens?: CameraLens; route?: "direct" | "relay"; byUserId: string }
  | { type: "state"; cameraId: string; sessionId: string | null; state: CameraState; route?: "direct" | "relay"; reason?: CameraStateReason }
  | { type: "line"; sessionId: string; seq: number; offsetSec: number; text: string }
  | { type: "frame"; cameraId: string; sessionId: string; at: string; mime: "image/jpeg"; dataBase64: string };

/** 経路 2 の静止画を送る間隔（秒）。 */
export const CAMERA_FRAME_INTERVAL_SEC = 3;
export const CAMERA_DIRECT_CONNECT_TIMEOUT_MS = 8000;
export const CAMERA_DIRECT_DROP_TIMEOUT_MS = 5000;
export const CAMERA_DIRECT_NO_DATA_TIMEOUT_MS = 15000;

/** セッション（`tool.video_sessions`）。 */
export type VideoSession = {
  id: string;
  facilityId: string;
  kind: VideoSessionKind;
  title: string;
  status: VideoSessionStatus;
  startedAt: string;
  /** 記録を始めた時刻（下見のあいだは null）。区切りの番号と経過秒の起点 */
  recordingStartedAt: string | null;
  endedAt: string | null;
  /** 記録した職員（ユーザーの物理削除で null） */
  recordedByUserId: string | null;
  /** 記録した職員の表示名（いなければ null） */
  recordedByName: string | null;
  /** セッションの事業所の名前（読めなければ null） */
  facilityName: string | null;
  stillCount: number;
  /** いま見られる静止画の枚数（ready かつ期限内。URL は載せない・`GET …/stills` で取る） */
  stillsReady: number;
  segmentSeconds: number;
  segmentCount: number;
  /** 推論にかかった時間の合計（ミリ秒）。費用の目安の元 */
  inferMsTotal: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

/** 記録の行（`tool.video_session_lines`）。 */
/** 一覧の帯に並べる場面の色の最大本数（サーバーが等間隔に間引く）。 */
export const VIDEO_TAG_STRIP_MAX = 120;

/**
 * 一覧（`GET /video-analysis/sessions`）の 1 行。詳細（`GET /sessions/:id`）の `VideoSession` は別。
 * `tagStrip` は seq の順の場面の色（最大 `VIDEO_TAG_STRIP_MAX` 本に間引く）・`tagCounts` は全件の数・
 * `overallScore` は最新の評価シートの総合の点（無ければ null）。
 * `rankScore` は最新の評価シートの `rankScore()`（総合と 5 観点の平均。無い・形が壊れていれば null）。
 * ランク（S〜D）は画面が `rankOf(rankScore)` で出す（規則を変えてもデータを直さなくてよい）。
 */
export type VideoSessionListItem = VideoSession & {
  tagStrip: VideoSceneTag[];
  tagCounts: Record<VideoSceneTag, number>;
  overallScore: number | null;
  rankScore: number | null;
};

export type VideoSessionLine = {
  id: string;
  sessionId: string;
  seq: number;
  offsetSec: number;
  source: VideoLineSource;
  text: string;
  tag: VideoSceneTag;
  tagReason: string;
  inferMs: number;
  createdAt: string;
};

/** 評価シート（`tool.video_session_reports`）。作り直しは新しい version。 */
export type VideoReport = {
  id: string;
  sessionId: string;
  version: number;
  body: VideoReportBody;
  modelId: string;
  createdAt: string;
};

/** セッションの詳細（文の並び・最新の評価シート・次に送る区切りの枠）。 */
export type VideoSessionDetail = {
  session: VideoSession;
  lines: VideoSessionLine[];
  latestReport: VideoReport | null;
  /** 担当の端末が替わったとき、新しい担当はこの枠から送る */
  /** 保存済みの最大の seq + 1（無ければ 0）。端末はここから数える（`createVideoSegmentSchema` の取り決め） */
  nextSeq: number;
};

/** 静止画の上げる先 1 枚（`POST …/stills/issue` の応答の 1 件）。`uploadUrl` へ `headers` を付けて PUT する。 */
export type VideoStillUpload = {
  stillId: string;
  seq: number;
  /** 並び（0〜・記録の時刻の順） */
  position: number;
  uploadUrl: string;
  method: "PUT";
  /** Content-Type・Content-Length・If-None-Match: * など。そのまま付ける */
  headers: Record<string, string>;
  expiresAt: string;
};
/** `POST …/stills/issue` の応答。選べる場面が無ければ `uploads` は空。 */
export type IssueVideoStillsResult = { uploads: VideoStillUpload[] };

/** 見られる静止画 1 枚（`GET …/stills`）。`url` は短い期限の presigned GET（`<img>` に直接）。 */
export type VideoStill = {
  id: string;
  seq: number;
  position: number;
  /** 記録の行の経過秒と場面（行が無ければ null） */
  offsetSec: number | null;
  tag: VideoSceneTag | null;
  byteSize: number;
  createdAt: string;
  url: string;
  urlExpiresAt: string;
};
/** `GET …/stills` の応答（ready かつ `expires_at` を過ぎていないものだけ・position の順）。 */
export type VideoStillList = { stillCount: number; stills: VideoStill[] };

/** エンドポイントの状態（`GET /video-analysis/endpoint`）。 */
export type VideoEndpointState = {
  status: VideoEndpointStatus;
  instanceType: string | null;
  /** 起動を始めた時刻（止まっているときは null） */
  startedAt: string | null;
  /** 最後に推論に使われた時刻（全組織・ID は持たない） */
  lastUsedAt: string | null;
  /** 自動停止まで（分・autoStopAt まで）。起動していないときは null */
  idleStopInMinutes: number | null;
  /** 自動停止の予定時刻（未使用による停止と連続起動の上限の早いほう）。起動していないときは null */
  autoStopAt: string | null;
  autoStopReason: "idle" | "max_uptime" | null;
  /** 起動を断る理由（組織の月の QT の上限に達した） */
  startBlockedReason: "monthly_cap" | null;
  /** status が failed のときだけ。capacity = GPU の空き不足（AWS 側）/ other = それ以外。failed でなければ null */
  failureKind: "capacity" | "other" | null;
};

export type VideoCost = {
  /** 起動してからの分（起動していないときは null） */
  sinceStartMinutes: number | null;
  /** 今月の自組織の記録 */
  thisMonth: { sessions: number; recordedMinutes: number; lines: number; gpuSeconds: number };
  /** 今月の QT と月の上限に対する位置（読めないときは null） */
  billing: VideoBillingView | null;
};

/** 今月の QT と月の上限（利用課金）。 */
export type VideoBillingView = {
  /** `YYYY-MM`（JST） */
  month: string;
  /** 上限に対する位置。100 = 上限に達した */
  capLevel: 0 | 80 | 100;
  capQt: number | null;
  /** 今月の組織の QT（管理者でなければ null・上限の位置 capLevel だけを返す） */
  monthQt: number | null;
  /** 今月の映像分析の QT（取れなければ null） */
  videoQt: number | null;
};

/** 画面の出し分け（`GET /video-analysis/permission-context`）。 */
export type VideoAnalysisPermissionContext = {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isOrgAdmin: boolean;
  canStopEndpoint: boolean;
};

/** 合図・指示・静止画を流す channel（保存しない pub/sub）。 */
export const videoSignalChannel = (orgId: string, sessionId: string) => `vision:sig:${orgId}:${sessionId}`;
/** 最後に推論に使われた時刻（自動停止の判定・環境で 1 つ）。 */
export const videoLastUsedKey = (env: string) => `vision:last-used:${env}`;

export const VIDEO_AUDIT_ACTIONS = [
  "video-analysis.record.start",
  "video-analysis.record.end",
  "video-analysis.consent.confirm",
  "video-analysis.camera.start",
  "video-analysis.camera.stop",
  "video-analysis.lens.switch",
  "video-analysis.endpoint.start",
  "video-analysis.endpoint.stop",
  "video-analysis.session.delete",
  "video-analysis.camera.record",
  "video-analysis.camera.preview",
  "video-analysis.stills.upload",
  "video-analysis.stills.view",
  "video-analysis.stills.delete",
] as const;
export type VideoAuditAction = (typeof VIDEO_AUDIT_ACTIONS)[number];
