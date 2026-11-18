import { z } from "zod";
import { IMAGE_CONTENT_TYPES } from "./image-mime";
import { SUPPORTED_CONTENT_TYPES as GENERATED_DOCUMENT_CONTENT_TYPES } from "./api/chat";
import {
  MEDIA_LOG_AUDIO_CONTENT_TYPES,
  MEDIA_LOG_MAX_BYTES,
  MEDIA_LOG_VIDEO_CONTENT_TYPES,
  mediaTypeForContentType,
} from "./media-log";

/** 自動保存の TTL（日）。チャット生成物・添付はこの日数で自動削除される */
export const STORAGE_AUTO_TTL_DAYS = 30;

/** ゴミ箱に入れてから自動で完全に削除するまでの日数（storage-cleanup が消す） */
export const STORAGE_TRASH_TTL_DAYS = 30;

/** 「最近使ったアイテム」の最大件数 */
export const STORAGE_RECENT_LIMIT = 50;

/**
 * 1 ファイルの既定の最大サイズ: 20MB（写真・書類）。
 *
 * 動画・音声はこれより大きいので、**判定は `storageMaxBytesFor()` を使う**
 * （この定数を直に比較すると 200MB の動画が必ず弾かれる）。
 */
export const STORAGE_MAX_FILE_BYTES = 20 * 1024 * 1024;

export function storageMaxBytesFor(contentType: string): number {
  if ((MEDIA_LOG_VIDEO_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return MEDIA_LOG_MAX_BYTES.video;
  }
  if ((MEDIA_LOG_AUDIO_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return MEDIA_LOG_MAX_BYTES.audio;
  }
  return STORAGE_MAX_FILE_BYTES;
}

/** テキスト直接保存（POST /storage/files、AI ツール用）の最大サイズ: 1MB */
export const STORAGE_TEXT_SAVE_MAX_BYTES = 1 * 1024 * 1024;

/** テキスト読み込み（GET /storage/files/:id/read）の切詰めサイズ: 50KB */
export const STORAGE_READ_MAX_BYTES = 50 * 1024;

export const storageFileSourceValues = [
  "upload",
  "generated_file",
  "generated_image",
  "chat_attachment",
] as const;
export type StorageFileSource = (typeof storageFileSourceValues)[number];

export const storageFileStatusValues = ["pending", "ready"] as const;
export type StorageFileStatus = (typeof storageFileStatusValues)[number];

export const STORAGE_ALLOWED_CONTENT_TYPES = new Set<string>([
  ...IMAGE_CONTENT_TYPES,
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  ...MEDIA_LOG_VIDEO_CONTENT_TYPES,
  ...MEDIA_LOG_AUDIO_CONTENT_TYPES,
]);

/**
 * テキストとして読める Content-Type か（GET /storage/files/:id/read の対象判定）。
 * 非テキストは 415 + download_url 案内を返す。
 */
export function isStorageTextContentType(contentType: string): boolean {
  return contentType.startsWith("text/") || contentType === "application/json";
}

/** POST /storage/folders */
export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  /** 省略 or null = root 直下に作成 */
  parent_id: z.string().uuid().nullable().optional(),
});
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

/**
 * PATCH /storage/folders/:id（リネーム / 移動）
 * parent_id はキー欠落 = 変更なし / null = root へ / uuid = 当該フォルダへ移動、を区別する。
 * 自己・子孫への移動（循環）はアプリ層の再帰 CTE チェックで拒否（深さ上限 10）。
 */
export const updateFolderSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    parent_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.parent_id !== undefined, {
    message: "name または parent_id のいずれかが必要です",
  });
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

/**
 * POST /storage/files/upload-url（2 フェーズアップロードの第 1 フェーズ）
 * 宣言サイズで pending 行を先に INSERT し、presigned PUT URL を返す。
 * 実サイズ・実 MIME は commit 時に HeadObject で検証する。
 *
 * Qaito ドライブへ置く口は**これ 1 本**（画面・SDK・会話の添付・AI の生成物が同じ口を通る）。
 * `source` が `upload` 以外は**自動保存**で、フォルダに属さず `STORAGE_AUTO_TTL_DAYS` で失効する。
 */
export const STORAGE_UPLOAD_SOURCES = ["upload", "chat_attachment", "generated_file", "generated_image"] as const;
export type StorageUploadSource = (typeof STORAGE_UPLOAD_SOURCES)[number];

export const uploadUrlRequestSchema = z.object({
  file_name: z.string().min(1).max(500),
  content_type: z
    .string()
    .refine((ct) => STORAGE_ALLOWED_CONTENT_TYPES.has(ct), {
      message: "許可されていないファイル形式です",
    }),
  size_bytes: z.number().int().positive(),
  /** 省略 or null = root */
  folder_id: z.string().uuid().nullable().optional(),
  /** 出どころ。省略 = `upload`（利用者が置いたもの）。それ以外は自動保存 */
  source: z.enum(STORAGE_UPLOAD_SOURCES).optional(),
  /** 会話の添付なら、どの会話・どの発言に付いたか（`source: "chat_attachment"` のときだけ） */
  chat_session_id: z.string().uuid().optional(),
  chat_message_id: z.string().uuid().optional(),
}).refine((v) => v.size_bytes <= storageMaxBytesFor(v.content_type), {
  message: "ファイルサイズが上限を超えています",
  path: ["size_bytes"],
}).refine((v) => (v.source ?? "upload") === "upload" || v.folder_id == null, {
  message: "自動保存はフォルダに置けません",
  path: ["folder_id"],
}).refine(
  (v) => v.source === "chat_attachment" || (v.chat_session_id === undefined && v.chat_message_id === undefined),
  { message: "会話の紐付けは会話の添付だけに付けられます", path: ["chat_session_id"] },
);
export type UploadUrlRequestInput = z.infer<typeof uploadUrlRequestSchema>;

/**
 * 生成物の保存（QaitoChat の Agent Runner の heavy レーン → `POST /chat/files/store`）の入力。
 * 本文（バイト列）は multipart の別の欄で受け、ここでは形だけを見る。
 *
 * - `job_id` はツール呼び出しの id（`toolu_…` 等）。同じ id の再実行は同じ行・同じ S3 キーに上書きする
 * - 受ける形式はファイル生成（`chat_generate_file`）が作るものだけ（HTML は作らない・持ち出さない）
 */
export const storeGeneratedFileSchema = z.object({
  job_id: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_.:-]+$/),
  file_name: z.string().trim().min(1).max(500),
  content_type: z.enum(GENERATED_DOCUMENT_CONTENT_TYPES),
});
export type StoreGeneratedFileInput = z.infer<typeof storeGeneratedFileSchema>;

/**
 * POST /storage/files（サーバ側直接保存、AI ツール用）
 * テキスト系のみ・1MB 上限。バイト長の厳密検証はサーバ側（Buffer.byteLength）で行う。
 */
export const saveFileSchema = z.object({
  file_name: z.string().min(1).max(500),
  content_type: z
    .string()
    .refine(
      (ct) => STORAGE_ALLOWED_CONTENT_TYPES.has(ct) && isStorageTextContentType(ct),
      { message: "テキスト形式のみ保存できます" },
    ),
  content_text: z.string().min(1).max(STORAGE_TEXT_SAVE_MAX_BYTES),
  /** 省略 or null = root */
  folder_id: z.string().uuid().nullable().optional(),
});
export type SaveFileInput = z.infer<typeof saveFileSchema>;

/**
 * PATCH /storage/files/:id（リネーム / 移動）
 * folder_id はキー欠落 = 変更なし / null = root へ / uuid = 当該フォルダへ移動、を区別する。
 * 移動は expires_at クリア（恒久化）。恒久 → 自動保存方向は禁止。
 */
export const updateFileSchema = z
  .object({
    file_name: z.string().min(1).max(500).optional(),
    folder_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.file_name !== undefined || v.folder_id !== undefined, {
    message: "file_name または folder_id のいずれかが必要です",
  });
export type UpdateFileInput = z.infer<typeof updateFileSchema>;

/**
 * GET /storage/files のクエリ
 * folder_id 省略 = root、auto=true = 自動保存ビュー（expires_at IS NOT NULL）。
 */
export const storageFileKindValues = ["photo", "video", "media", "file"] as const;
export type StorageFileKind = (typeof storageFileKindValues)[number];

/** ファイル 1 つの種別（写真・動画・音声・書類）。撮影・保存の時点で決まる値ではなく、実体の MIME から毎回導く */
export type StorageContentKind = "photo" | "video" | "audio" | "document";

export function storageKindOfContentType(contentType: string): StorageContentKind {
  return mediaTypeForContentType(contentType) ?? "document";
}

/** 種別の絞り込み（`StorageFileKind`）に当てはまる MIME の集合（`file` は「写真と動画のどちらでもない」なので null） */
export function contentTypesForKind(kind: StorageFileKind): readonly string[] | null {
  if (kind === "photo") return IMAGE_CONTENT_TYPES;
  if (kind === "video") return MEDIA_LOG_VIDEO_CONTENT_TYPES;
  if (kind === "media") return [...IMAGE_CONTENT_TYPES, ...MEDIA_LOG_VIDEO_CONTENT_TYPES];
  return null;
}

export const listFilesQuerySchema = z.object({
  folder_id: z.string().uuid().optional(),
  auto: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  /** ファイル名部分一致検索 */
  q: z.string().max(255).optional(),
  /** 省略時は種別で絞らない（写真もファイルも出る） */
  kind: z.enum(storageFileKindValues).optional(),
  /**
   * true = 最近使ったアイテム（フォルダ・自動保存を横断し、開いた・ダウンロードした・
   * 追加した・更新したの新しい順に最大 `STORAGE_RECENT_LIMIT` 件）。
   * 他の見方（folder_id / auto / q / kind）より優先する。
   */
  recent: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
export type ListFilesQueryInput = z.infer<typeof listFilesQuerySchema>;
