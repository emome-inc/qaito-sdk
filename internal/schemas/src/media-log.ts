import { z } from "zod";
import { IMAGE_CONTENT_TYPES } from "./image-mime";

export const mediaLogTypeValues = ["photo", "video", "audio"] as const;
export type MediaLogType = (typeof mediaLogTypeValues)[number];

export const mediaLogStatusValues = ["pending", "ready"] as const;
export type MediaLogStatus = (typeof mediaLogStatusValues)[number];

/** 写真: 20MB（storage の STORAGE_MAX_FILE_BYTES と同値） */
export const MEDIA_LOG_MAX_PHOTO_BYTES = 20 * 1024 * 1024;

/** 動画: 200MB */
export const MEDIA_LOG_MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export const MEDIA_LOG_MAX_AUDIO_BYTES = 200 * 1024 * 1024;

/** 種別ごとのサイズ上限（bytes） */
export const MEDIA_LOG_MAX_BYTES: Record<MediaLogType, number> = {
  photo: MEDIA_LOG_MAX_PHOTO_BYTES,
  video: MEDIA_LOG_MAX_VIDEO_BYTES,
  audio: MEDIA_LOG_MAX_AUDIO_BYTES,
};

/** 動画撮影の上限: 5 分 */
export const MEDIA_LOG_MAX_VIDEO_SECONDS = 300;
/** 録音の上限: 30 分 */
export const MEDIA_LOG_MAX_AUDIO_SECONDS = 1800;

/** 種別ごとの撮影・録音上限（秒）。photo は尺を持たない */
export const MEDIA_LOG_MAX_SECONDS: Record<MediaLogType, number | null> = {
  photo: null,
  video: MEDIA_LOG_MAX_VIDEO_SECONDS,
  audio: MEDIA_LOG_MAX_AUDIO_SECONDS,
};

export const MEDIA_LOG_PHOTO_CONTENT_TYPES = IMAGE_CONTENT_TYPES;
export const MEDIA_LOG_VIDEO_CONTENT_TYPES = ["video/webm", "video/mp4"] as const;
export const MEDIA_LOG_AUDIO_CONTENT_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"] as const;

/** 種別 → 許可 MIME */
export const MEDIA_LOG_ALLOWED_CONTENT_TYPES: Record<MediaLogType, readonly string[]> = {
  photo: MEDIA_LOG_PHOTO_CONTENT_TYPES,
  video: MEDIA_LOG_VIDEO_CONTENT_TYPES,
  audio: MEDIA_LOG_AUDIO_CONTENT_TYPES,
};

/** 全種別の許可 MIME（合併集合） */
export const MEDIA_LOG_ALL_CONTENT_TYPES = new Set<string>([
  ...MEDIA_LOG_PHOTO_CONTENT_TYPES,
  ...MEDIA_LOG_VIDEO_CONTENT_TYPES,
  ...MEDIA_LOG_AUDIO_CONTENT_TYPES,
]);

/** content_type が media_type に対して許可されているか */
export function isAllowedMediaContentType(
  mediaType: MediaLogType,
  contentType: string,
): boolean {
  return MEDIA_LOG_ALLOWED_CONTENT_TYPES[mediaType].includes(contentType);
}

/**
 * Content-Type から種別を導く（allowlist に無ければ `null`）。
 *
 * Qaito ドライブのファイルを日常の記録へ共有するとき、**種別は実体の MIME から決まる**
 * （ドライブ側に `media_type` 列は無い）。写真・動画・音声のどれでも共有できるので、
 * 判定を 1 か所に置く（呼び出し側で `startsWith("image/")` のような別解を書かせない）。
 */
export function mediaTypeForContentType(contentType: string): MediaLogType | null {
  for (const t of mediaLogTypeValues) {
    if (MEDIA_LOG_ALLOWED_CONTENT_TYPES[t].includes(contentType)) return t;
  }
  return null;
}

const uuidField = z.string().uuid();
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で指定してください");

export const shareUserFileSchema = z.object({
  /** 共有する個人ファイル（`shared.user_files`）。写真・動画・音声以外は口が断る */
  userFileId: uuidField,
  /** 共有先の事業所（stamp・必須）。画面は設定事業所コンテキストを渡す */
  facilityId: uuidField,
  /** 利用者への紐付けは任意（あとから updateMediaLog でも付けられる） */
  clientId: uuidField.nullable().optional(),
  /** 記録日。省略時はサーバが当日（JST）を入れる */
  recordedOn: dateField.optional(),
  caption: z.string().max(2000).nullable().optional(),
});

export type ShareUserFileInput = z.infer<typeof shareUserFileSchema>;

/**
 * 利用者の写真として記録する（POST /media/logs/client-photo）。
 *
 * 共有 + その日の 1 枚（選択済）を 1 つの手順にしたもの（`functions/client-photo.ts`）。
 * 業務の中で利用者を撮ったとき（フロアボード・連絡帳）はどの面からでもこの手順になる。
 * 共有と違い**利用者は必須**（その日の 1 枚は利用者 × 日付の性質のため）。
 */
export const recordClientPhotoSchema = shareUserFileSchema.extend({
  clientId: uuidField,
  /**
   * その日の 1 枚（選択済）にするか。既定 true（撮った直後にボードへ出る）。
   * 連絡帳で「ドライブの写真を選ぶ」だけのときは false（選んだことと良い 1 枚は別の話）。
   */
  dailyPick: z.boolean().optional(),
});

export type RecordClientPhotoInput = z.infer<typeof recordClientPhotoSchema>;

/** PATCH /media/logs/:id（caption・利用者紐付け・記録日の変更） */
export const mediaLogUpdateSchema = z
  .object({
    caption: z.string().max(2000).nullable().optional(),
    /** null = 紐付け解除（事業所の記録に戻す） */
    clientId: uuidField.nullable().optional(),
    recordedOn: dateField.optional(),
  })
  .refine(
    (v) => v.caption !== undefined || v.clientId !== undefined || v.recordedOn !== undefined,
    { message: "変更する項目がありません" },
  );
export type MediaLogUpdateInput = z.infer<typeof mediaLogUpdateSchema>;

export const mediaLogDailyPickSchema = z.object({
  /** true = その日の 1 枚にする（同じ利用者・同じ日の前の 1 枚は外れる）/ false = 解除 */
  picked: z.boolean(),
});
export type MediaLogDailyPickInput = z.infer<typeof mediaLogDailyPickSchema>;

/** メモで探す語の長さの上限 */
export const MEDIA_LOG_SEARCH_MAX = 100;

/** メモで探す語を ILIKE の型にする（% _ \ を逃がす・ESCAPE '\' で使う） */
export function mediaLogCaptionLike(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

/** GET /media/logs のクエリ（status='ready' のみが対象） */
export const mediaLogListQuerySchema = z.object({
  mediaType: z.enum(mediaLogTypeValues).optional(),
  clientId: uuidField.optional(),
  facilityId: uuidField.optional(),
  from: dateField.optional(),
  to: dateField.optional(),
  /** ひとことメモ（caption）の部分一致。前後の空白は落とし、空は条件なし */
  q: z
    .string()
    .trim()
    .max(MEDIA_LOG_SEARCH_MAX)
    .optional()
    .transform((v) => (v ? v : undefined)),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type MediaLogListQueryInput = z.infer<typeof mediaLogListQuerySchema>;

/** GET /media/logs/:id 等のパスパラメータ */
export const mediaLogIdParamSchema = z.object({ id: uuidField });
