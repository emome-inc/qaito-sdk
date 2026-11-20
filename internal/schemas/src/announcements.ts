import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

/** 件名の最大文字数。 */
export const ANNOUNCEMENT_TITLE_MAX = 200;
/** 本文の最大文字数。 */
export const ANNOUNCEMENT_BODY_MAX = 5000;

const isoDateTime = z.iso.datetime({ offset: true, message: "日時の形式が正しくありません" });

/** サムネイルの指定（連携サイトの画像 `portalLinkImageInputSchema` と同じ形）。 */
function announcementThumbnailInputSchema() {
  return z.union([z.null(), z.object({ stagedId: z.string().uuid() })]);
}

/** お知らせの項目（前後関係の検査を含まない素の形。作成・部分更新の両方の元）。 */
const announcementFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "件名は必須です")
    .max(ANNOUNCEMENT_TITLE_MAX, `件名は ${ANNOUNCEMENT_TITLE_MAX} 文字以内で入力してください`),
  body: z
    .string()
    .max(ANNOUNCEMENT_BODY_MAX, `本文は ${ANNOUNCEMENT_BODY_MAX} 文字以内で入力してください`)
    .refine((s) => s.trim().length > 0, "本文は必須です"),
  /** ピン留め（掲示中の一覧で先頭に出す） */
  pinned: z.boolean().default(false),
  /** 掲示の開始（省略 = 今） */
  publishFrom: isoDateTime.optional(),
  /** 掲示の終了（null = 期限なし） */
  publishUntil: isoDateTime.nullable().optional(),
  /** サムネイル。省く = 変えない / null = 外す / `{ stagedId }` = 新しくアップロードしたもの（用途 `announcement_thumbnail`） */
  thumbnail: announcementThumbnailInputSchema().optional(),
});

/**
 * お知らせの作成・更新。
 *
 * - `publishFrom` 省略 = 今から掲示（DB の既定 `now()`）
 * - `publishUntil` 省略 / null = 期限なし。指定するなら `publishFrom`（省略時は今）より後
 *
 * 更新は core が「既存の行 + 送られてきたキー」を合わせてから、このスキーマで検証する
 * （部分更新でも期間の前後関係を必ず検査するため）。
 */
export const announcementInputSchema = announcementFieldsSchema.superRefine((v, ctx) => {
  if (v.publishUntil == null) return;
  const from = v.publishFrom ? Date.parse(v.publishFrom) : Date.now();
  if (!(Date.parse(v.publishUntil) > from)) {
    ctx.addIssue({
      code: "custom",
      path: ["publishUntil"],
      message: "掲示の終了は開始より後にしてください",
    });
  }
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

/**
 * お知らせの部分更新（送ったキーだけ）。core は**これで送られた値の形を確かめてから**、
 * 既存の行と合わせて `announcementInputSchema`（期間の前後関係を含む）で検証する。
 * `.default()` は剥がしてある（送っていない `pinned` を false に戻さない）。
 */
export const announcementPatchSchema = partialForUpdate(announcementFieldsSchema);
export type AnnouncementPatch = z.infer<typeof announcementPatchSchema>;

/** システムからのお知らせの種類。release = リリースノート（リポジトリの文書から入る）/ notice = 運営が手で書く */
export const systemAnnouncementKindValues = ["release", "notice"] as const;
export type SystemAnnouncementKind = (typeof systemAnnouncementKindValues)[number];

/** システムからのお知らせの本文（Markdown）の最大文字数。DB の CHECK と同じ。 */
export const SYSTEM_ANNOUNCEMENT_BODY_MAX = 50_000;

/** Qaito の版（ルートの package.json・`0.3.0` の形）。 */
export const QAITO_VERSION_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;

const systemAnnouncementFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "件名は必須です")
    .max(ANNOUNCEMENT_TITLE_MAX, `件名は ${ANNOUNCEMENT_TITLE_MAX} 文字以内で入力してください`),
  body: z
    .string()
    .max(SYSTEM_ANNOUNCEMENT_BODY_MAX, `本文は ${SYSTEM_ANNOUNCEMENT_BODY_MAX} 文字以内で入力してください`)
    .refine((s) => s.trim().length > 0, "本文は必須です"),
  /** 掲示の開始（省略 = 今） */
  publishFrom: isoDateTime.optional(),
  thumbnail: announcementThumbnailInputSchema().optional(),
});

/**
 * システムからのお知らせの作成（Platform Admin の画面）。書けるのは notice だけ
 * （release はリリースノートの文書から reference-data の migration で入る・画面では読むだけ）。
 */
export const systemAnnouncementInputSchema = systemAnnouncementFieldsSchema;
export type SystemAnnouncementInput = z.infer<typeof systemAnnouncementInputSchema>;

/** システムからのお知らせの部分更新（送ったキーだけ）。 */
export const systemAnnouncementPatchSchema = partialForUpdate(systemAnnouncementFieldsSchema);
export type SystemAnnouncementPatch = z.infer<typeof systemAnnouncementPatchSchema>;

export const releaseNoteFrontMatterSchema = z
  .object({
    version: z.string().regex(QAITO_VERSION_RE),
    date: z.iso.date().optional(),
    title: z.string().trim().min(1).max(60),
    sdk: z.string().regex(QAITO_VERSION_RE),
    bfUi: z.string().regex(QAITO_VERSION_RE),
    /** 絵の題材（英語の句・`gen-release-note-thumbnails` が読む）。お知らせの行には入れない */
    thumbnail: z.string().trim().min(1).max(300).optional(),
  })
  .strict();
export type ReleaseNoteFrontMatter = z.infer<typeof releaseNoteFrontMatterSchema>;

/** サムネイルの形式（SVG は受けない）。 */
export const ANNOUNCEMENT_THUMBNAIL_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
/** サムネイルの上限（スマホの写真をそのまま選べるよう、顔写真と同じ 5MB）。 */
export const ANNOUNCEMENT_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const ANNOUNCEMENT_THUMBNAIL_URL_TTL_SEC = 900;
