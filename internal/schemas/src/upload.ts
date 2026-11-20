import { z } from "zod";
import { APP_LOGO_MAX_BYTES, APP_LOGO_MIME } from "./app-branding";
import { LIBRARY_ASSET_ALLOWED_MIME, LIBRARY_ASSET_MAX_BYTES } from "./library";
import { PORTAL_LINK_IMAGE_MAX_BYTES } from "./portal-links";
import { ANNOUNCEMENT_THUMBNAIL_MAX_BYTES, ANNOUNCEMENT_THUMBNAIL_MIME } from "./announcements";
import {
  RECREATION_DOCUMENT_CONTENT_TYPES,
  RECREATION_DOCUMENT_MAX_BYTES,
  RECREATION_IMAGE_CONTENT_TYPES,
  RECREATION_IMAGE_MAX_BYTES,
} from "./recreation";

/** staging の用途。s3_key の prefix になり、許可 MIME・サイズ上限もこれで決まる */
export const UPLOAD_PURPOSES = ["kaipoke_records", "intake_xlsx", "app_logo", "portal_link_image", "library_asset", "direct_debit_result", "kokuhoren_notice", "kyotaku_plan_origin", "clinical_record_source", "face_photo", "own_face_photo", "announcement_thumbnail", "recreation_document", "recreation_image"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const uploadPurposeSchema = z.enum(UPLOAD_PURPOSES);

/**
 * 顔写真（メンバーのアイコンを兼ね、顔認証デバイスの照合の元の写真でもある）の MIME と上限。
 * 画面は丸く切り抜いた 512px の画像を送る。検査は access-control の core が実体に対して行う（3 点セット）
 */
export const FACE_PHOTO_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export const FACE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** 用途ごとの MIME allowlist（③ commit で実体の Content-Type と突合する） */
export const UPLOAD_ALLOWED_MIME: Record<UploadPurpose, readonly string[]> = {
  kaipoke_records: ["application/pdf"],
  intake_xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  app_logo: APP_LOGO_MIME,
  portal_link_image: APP_LOGO_MIME,
  library_asset: LIBRARY_ASSET_ALLOWED_MIME,
  direct_debit_result: ["text/plain"],
  kokuhoren_notice: ["text/plain", "text/csv", "application/pdf"],
  kyotaku_plan_origin: ["application/pdf", "image/jpeg", "image/png"],
  clinical_record_source: ["application/pdf", "image/jpeg", "image/png"],
  face_photo: FACE_PHOTO_MIME,
  own_face_photo: FACE_PHOTO_MIME,
  announcement_thumbnail: ANNOUNCEMENT_THUMBNAIL_MIME,
  recreation_document: RECREATION_DOCUMENT_CONTENT_TYPES,
  recreation_image: RECREATION_IMAGE_CONTENT_TYPES,
};

/**
 * 用途ごとのサイズ上限（bytes）。
 * 既存の同経路の上限（intake の MAX_FILE_BYTES = 20MB）と揃える。
 */
export const UPLOAD_MAX_BYTES: Record<UploadPurpose, number> = {
  kaipoke_records: 20 * 1024 * 1024,
  intake_xlsx: 20 * 1024 * 1024,
  app_logo: APP_LOGO_MAX_BYTES,
  portal_link_image: PORTAL_LINK_IMAGE_MAX_BYTES,
  library_asset: LIBRARY_ASSET_MAX_BYTES,
  direct_debit_result: 10 * 1024 * 1024,
  kokuhoren_notice: 20 * 1024 * 1024,
  kyotaku_plan_origin: 20 * 1024 * 1024,
  clinical_record_source: 18 * 1024 * 1024,
  face_photo: FACE_PHOTO_MAX_BYTES,
  own_face_photo: FACE_PHOTO_MAX_BYTES,
  announcement_thumbnail: ANNOUNCEMENT_THUMBNAIL_MAX_BYTES,
  recreation_document: RECREATION_DOCUMENT_MAX_BYTES,
  recreation_image: RECREATION_IMAGE_MAX_BYTES,
};

export const checksumSha256Schema = z.string().regex(/^[A-Za-z0-9+/]{43}=$/);

export const UPLOAD_PRESIGN_EXPIRES_SEC = 300;

/** 用途 + 宣言サイズ + 宣言 MIME が受理可能か（① issue の事前チェック用・信頼しない） */
export function isAcceptableUpload(
  purpose: UploadPurpose,
  contentType: string,
  sizeBytes: number,
): boolean {
  if (!UPLOAD_ALLOWED_MIME[purpose].includes(contentType)) return false;
  return sizeBytes > 0 && sizeBytes <= UPLOAD_MAX_BYTES[purpose];
}

export const uploadIssueRequestSchema = z.object({
  purpose: uploadPurposeSchema,
  /** 宣言 MIME。実体との一致は ③ commit で検証する */
  content_type: z.string().min(1).max(255),
  /** 宣言サイズ。実サイズとの一致は ③ commit（headObject）で検証する */
  size_bytes: z.number().int().positive(),
  /** 表示・監査用のファイル名。s3_key には使わない（パス注入を構造的に不可能にするため） */
  file_name: z.string().min(1).max(255).optional(),
});
export type UploadIssueRequest = z.infer<typeof uploadIssueRequestSchema>;

export const uploadIssueResponseSchema = z.object({
  /** staging の識別子（サーバ生成 UUID）。以降の API はこれだけを受け取る */
  staged_id: z.string().uuid(),
  upload_url: z.string().min(1),
  /** PUT 時に必ず付ける Content-Type（署名に含まれるため一致必須） */
  content_type: z.string().min(1),
  /** upload_url の有効期限（ISO8601） */
  expires_at: z.string(),
});
export type UploadIssueResponse = z.infer<typeof uploadIssueResponseSchema>;

/**
 * staged_id 経由でアップロード済みの実体を指すリクエスト。
 * かいぽけ parse / commit のように「multipart で受けていた本処理」がこれに置き換わる。
 */
export const stagedUploadRefSchema = z.object({
  staged_id: z.string().uuid(),
  /**
   * 表示・監査用のファイル名（import_jobs.meta 等に記録する）。
   * s3_key には使わない。省略時は各モジュールの既定名。
   */
  file_name: z.string().max(255).optional(),
});
export type StagedUploadRef = z.infer<typeof stagedUploadRefSchema>;
