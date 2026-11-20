import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

/** 種類（`recreations.type`）。動画・プリント・対面レクのキット */
export const RECREATION_TYPES = ["video", "print", "kit"] as const;
export type RecreationType = (typeof RECREATION_TYPES)[number];

/**
 * 公開の状態（`recreations.publish_status`・`recreation_news`・`recreation_official_playlists`）。
 * 公開予約は状態に持たない。`published` で `published_at` が未来のものが予約で、時刻が来たら切り替えのジョブ無しで見えるようになる。
 * 見せる条件は `publish_status = 'published' AND published_at <= now() AND deleted_at IS NULL`。
 */
export const RECREATION_PUBLISH_STATUSES = ["draft", "published"] as const;
export type RecreationPublishStatus = (typeof RECREATION_PUBLISH_STATUSES)[number];

/** 入稿の一覧に出す状態。行の値から `recreationAdminStateOf` で決める（表には持たない） */
export const RECREATION_ADMIN_STATES = ["draft", "scheduled", "published", "deleted"] as const;
export type RecreationAdminState = (typeof RECREATION_ADMIN_STATES)[number];

/** 要介護度（`recreations.care_levels text[]`）。自立から要介護 5 の順 */
export const RECREATION_CARE_LEVELS = [
  "independent",
  "support_1",
  "support_2",
  "care_1",
  "care_2",
  "care_3",
  "care_4",
  "care_5",
] as const;
export type RecreationCareLevel = (typeof RECREATION_CARE_LEVELS)[number];

/** 支援内容（`recreations.support_types text[]`） */
export const RECREATION_SUPPORT_TYPES = [
  "joint_rom_training",
  "muscle_strengthening",
  "endurance_training",
  "balance_training",
  "upper_limb_training",
  "pain_relief",
  "basic_movement_training",
  "gait_training",
  "adl_training",
  "swallowing_training",
  "speech_hearing_training",
  "higher_brain_function",
  "cognitive_activation",
  "recreation",
] as const;
export type RecreationSupportType = (typeof RECREATION_SUPPORT_TYPES)[number];

/** 難易度（`recreations.difficulty`。1 つだけ持つ）。易しい順 */
export const RECREATION_DIFFICULTIES = ["easy", "slightly_easy", "normal", "slightly_difficult", "difficult"] as const;
export type RecreationDifficulty = (typeof RECREATION_DIFFICULTIES)[number];

/** 季節（`recreations.seasons text[]`） */
export const RECREATION_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type RecreationSeason = (typeof RECREATION_SEASONS)[number];

/** 所要時間の区分。動画の長さ（`recreation_videos.duration_sec`）から `durationClassOf` で決める（表には持たない） */
export const RECREATION_DURATION_CLASSES = ["lt5", "5to10", "10to15", "15to30", "30to60", "gte60"] as const;
export type RecreationDurationClass = (typeof RECREATION_DURATION_CLASSES)[number];

/** 区分ごとの秒の範囲。`minSec` 以上 `maxSec` 未満（`maxSec` が null なら上限なし）。絞り込みの SQL もこの範囲で引く */
export const RECREATION_DURATION_CLASS_RANGES: {
  readonly [C in RecreationDurationClass]: { readonly minSec: number; readonly maxSec: number | null };
} = {
  lt5: { minSec: 0, maxSec: 300 },
  "5to10": { minSec: 300, maxSec: 600 },
  "10to15": { minSec: 600, maxSec: 900 },
  "15to30": { minSec: 900, maxSec: 1800 },
  "30to60": { minSec: 1800, maxSec: 3600 },
  gte60: { minSec: 3600, maxSec: null },
};

/**
 * 動画の長さ（秒）から所要時間の区分を決める。
 * 負の値と NaN は DB の CHECK（`duration_sec >= 0`）で起きないが、来たときは長さが分からない動画として「5分未満」に寄せる。
 */
export function durationClassOf(sec: number): RecreationDurationClass {
  for (const c of RECREATION_DURATION_CLASSES) {
    const { minSec, maxSec } = RECREATION_DURATION_CLASS_RANGES[c];
    if (sec >= minSec && (maxSec === null || sec < maxSec)) return c;
  }
  return "lt5";
}

/** 問い合わせの種別（`recreation_inquiries.type`）。お申込み・お見積もり・お問い合わせ */
export const RECREATION_INQUIRY_TYPES = ["apply", "estimate", "question"] as const;
export type RecreationInquiryType = (typeof RECREATION_INQUIRY_TYPES)[number];

/** 問い合わせの平均要介護度（`recreation_inquiries.care_level`）。要介護度に「混在」と「不明」を足す */
export const RECREATION_INQUIRY_CARE_LEVELS = [...RECREATION_CARE_LEVELS, "mixed", "unknown"] as const;
export type RecreationInquiryCareLevel = (typeof RECREATION_INQUIRY_CARE_LEVELS)[number];

/** 問い合わせの対応の状態（`recreation_inquiries.status`）。対応済みにするのは組織の管理者（Console） */
export const RECREATION_INQUIRY_STATUSES = ["open", "closed"] as const;
export type RecreationInquiryStatus = (typeof RECREATION_INQUIRY_STATUSES)[number];

/** ファイルの役割（`recreation_files.role`） */
export const RECREATION_FILE_ROLES = ["attachment", "thumbnail", "preview", "main", "flyer", "sub"] as const;
export type RecreationFileRole = (typeof RECREATION_FILE_ROLES)[number];

/**
 * 種類ごとに付けてよい役割。動画は専用のサムネイルだけ（無ければ Stream のサムネイル）、プリントは添付の PDF と
 * サムネイル・見本の画像、キットはメイン・チラシ・サブの画像。合わない役割は core が 400 にする。
 */
export const RECREATION_FILE_ROLES_BY_TYPE = {
  video: ["thumbnail"],
  print: ["attachment", "thumbnail", "preview"],
  kit: ["main", "flyer", "sub"],
} as const satisfies { readonly [T in RecreationType]: readonly RecreationFileRole[] };
export type RecreationFileRoleOf<T extends RecreationType> = (typeof RECREATION_FILE_ROLES_BY_TYPE)[T][number];

/** その種類の項目に付けてよい役割か */
export function isRecreationFileRoleOf<T extends RecreationType>(
  type: T,
  role: RecreationFileRole,
): role is RecreationFileRoleOf<T> {
  return (RECREATION_FILE_ROLES_BY_TYPE[type] as readonly RecreationFileRole[]).includes(role);
}

/** PDF の Content-Type（プリントの添付） */
export const RECREATION_DOCUMENT_CONTENT_TYPES = ["application/pdf"] as const;
/** 画像の Content-Type（サムネイル・見本・キット・お知らせ）。inline で安全に配れるものだけ（SVG は入れない） */
export const RECREATION_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** ファイルの Content-Type（`recreation_files.content_type` の CHECK と同じ 4 つ） */
export const RECREATION_FILE_CONTENT_TYPES = [...RECREATION_DOCUMENT_CONTENT_TYPES, ...RECREATION_IMAGE_CONTENT_TYPES] as const;
export type RecreationDocumentContentType = (typeof RECREATION_DOCUMENT_CONTENT_TYPES)[number];
export type RecreationImageContentType = (typeof RECREATION_IMAGE_CONTENT_TYPES)[number];
export type RecreationFileContentType = (typeof RECREATION_FILE_CONTENT_TYPES)[number];

/** PDF の上限 64 MiB（シニアカレッジのプリントの最大は 50,138,927 バイト） */
export const RECREATION_DOCUMENT_MAX_BYTES = 64 * 1024 * 1024;
/** 画像の上限 10MB */
export const RECREATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/**
 * 入稿のアップロードの用途（`@qaito/schemas/upload` の `UPLOAD_PURPOSES` に同じ名前で載る）。
 * ここで upload.ts を import しないのは、upload.ts がこのファイルの MIME と上限を読むため（循環を作らない）。
 */
export const RECREATION_UPLOAD_PURPOSES = ["recreation_document", "recreation_image"] as const;
export type RecreationUploadPurpose = (typeof RECREATION_UPLOAD_PURPOSES)[number];

/** 役割ごとのアップロードの用途。添付は PDF、ほかは画像 */
export const RECREATION_FILE_UPLOAD_PURPOSES: { readonly [R in RecreationFileRole]: RecreationUploadPurpose } = {
  attachment: "recreation_document",
  thumbnail: "recreation_image",
  preview: "recreation_image",
  main: "recreation_image",
  flyer: "recreation_image",
  sub: "recreation_image",
};

/** S3 のキーの拡張子 */
export const RECREATION_FILE_EXTENSIONS: { readonly [C in RecreationFileContentType]: "pdf" | "jpg" | "png" | "webp" } = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 項目のファイルの S3 のキーの形（`recreations/{recreation_id}/{file_id}.{pdf|jpg|png|webp}`） */
export const RECREATION_FILE_KEY_RE =
  /^recreations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png|webp)$/;
/** お知らせの画像の S3 のキーの形（`news/{news_id}/{uuid}.{jpg|png|webp}`） */
export const RECREATION_NEWS_IMAGE_KEY_RE =
  /^news\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const KEY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** S3 のキーの長さの上限（S3 の決まり。入力で受けたキーを今のキーと比べるときの上限にだけ使う） */
const S3_KEY_MAX_LENGTH = 1024;

function keyId(id: string): string {
  const v = id.toLowerCase();
  if (!KEY_ID_RE.test(v)) throw new Error("recreation: S3 のキーに埋める ID は UUID の形にしてください");
  return v;
}

export function recreationFileKey(recreationId: string, fileId: string, contentType: RecreationFileContentType): string {
  return `recreations/${keyId(recreationId)}/${keyId(fileId)}.${RECREATION_FILE_EXTENSIONS[contentType]}`;
}

/** お知らせの画像の S3 のキー（表紙の `image_key` と本文の `body_image_keys` の両方） */
export function recreationNewsImageKey(newsId: string, imageId: string, contentType: RecreationImageContentType): string {
  return `news/${keyId(newsId)}/${keyId(imageId)}.${RECREATION_FILE_EXTENSIONS[contentType]}`;
}

/** お知らせの画像の置き場所。表紙（`image_key`・1 枚）と本文の下に並べる画像（`body_image_keys`） */
export const RECREATION_NEWS_IMAGE_SLOTS = ["cover", "body"] as const;
export type RecreationNewsImageSlot = (typeof RECREATION_NEWS_IMAGE_SLOTS)[number];

/** 公式プレイリストのまとまり（`recreation_official_playlists.grouping`）。季節・カテゴリ・特集 */
export const RECREATION_OFFICIAL_GROUPINGS = ["season", "category", "feature"] as const;
export type RecreationOfficialGrouping = (typeof RECREATION_OFFICIAL_GROUPINGS)[number];

/** プレイリストの種類。公式（共通の表）とマイ（組織の表・本人のもの）を 1 つの型と口で見せる */
export const RECREATION_PLAYLIST_KINDS = ["official", "mine"] as const;
export type RecreationPlaylistKind = (typeof RECREATION_PLAYLIST_KINDS)[number];

/** 投票（`recreation_votes.value`） */
export const RECREATION_VOTE_VALUES = ["good", "bad"] as const;
export type RecreationVoteValue = (typeof RECREATION_VOTE_VALUES)[number];

/** 閲覧の記録の種類（`recreation_activity_logs.action`）。動画の再生・最後まで見た・プリントのファイルを開いた */
export const RECREATION_ACTIVITY_ACTIONS = ["play", "complete", "open"] as const;
export type RecreationActivityAction = (typeof RECREATION_ACTIVITY_ACTIONS)[number];

/** 実際に流した方式（計測の `sourceKind`）。MP4・端末の HLS（Safari）・hls.js（MSE） */
export const RECREATION_SOURCE_KINDS = ["mp4", "hls-native", "hls-mse"] as const;
export type RecreationSourceKind = (typeof RECREATION_SOURCE_KINDS)[number];

/** 端末の種類（UA の生の文字列は送らない） */
export const RECREATION_DEVICE_HINTS = ["ipad", "iphone", "android", "windows", "mac", "other"] as const;
export type RecreationDeviceHint = (typeof RECREATION_DEVICE_HINTS)[number];

export const RECREATION_PLAYBACK_PROVIDERS = ["stream", "stream-unsigned", "dev"] as const;
export type RecreationPlaybackProvider = (typeof RECREATION_PLAYBACK_PROVIDERS)[number];

/** Stream の動画の uid（`recreation_videos.stream_uid` の CHECK と同じ） */
export const RECREATION_STREAM_UID_RE = /^[0-9a-f]{32}$/;

/** Stream の `status.state` の値（Stream の API の列挙。知らない値が来ても、そのまま文字で持つ） */
export const RECREATION_STREAM_STATES = [
  "pendingupload",
  "downloading",
  "queued",
  "inprogress",
  "ready",
  "error",
  "live-inprogress",
] as const;
export type RecreationStreamState = (typeof RECREATION_STREAM_STATES)[number];

/** 入稿の Stream の一覧の絞り込み。未登録・登録済み・Stream から消えた・すべて */
export const RECREATION_STREAM_LIST_STATES = ["unregistered", "registered", "missing", "all"] as const;
export type RecreationStreamListState = (typeof RECREATION_STREAM_LIST_STATES)[number];

/** 動画の一覧の並び（新着 / 組織の再生の数 / 題名） */
export const RECREATION_VIDEO_SORTS = ["new", "popular", "title"] as const;
export type RecreationVideoSort = (typeof RECREATION_VIDEO_SORTS)[number];

/** プリントの一覧の並び（新着 / 組織でファイルを開いた数 / 題名） */
export const RECREATION_PRINT_SORTS = ["new", "popular", "title"] as const;
export type RecreationPrintSort = (typeof RECREATION_PRINT_SORTS)[number];

/** キットの一覧の並び（おすすめ〔`featured` が先・`display_order` 順〕/ 新着 / 題名） */
export const RECREATION_KIT_SORTS = ["featured", "new", "title"] as const;
export type RecreationKitSort = (typeof RECREATION_KIT_SORTS)[number];

/** 関連動画は固定 12 本（`limit` を受けない） */
export const RECREATION_RELATED_LIMIT = 12;
/** 一覧の口の `limit`（1〜100・既定 24） */
export const RECREATION_LIST_LIMIT_MAX = 100;
export const RECREATION_LIST_LIMIT_DEFAULT = 24;
/** ホームの区画の `limit`（1〜24・既定 12） */
export const RECREATION_HOME_LIMIT_MAX = 24;
export const RECREATION_HOME_LIMIT_DEFAULT = 12;

/** 題名（項目・お知らせ。DB の CHECK: 1〜200 字） */
export const RECREATION_TITLE_MAX_LENGTH = 200;
/** プレイリストの名前（公式・マイ。DB の CHECK: 1〜100 字） */
export const RECREATION_NAME_MAX_LENGTH = 100;
/** プレイリストの説明（公式・マイ。DB の CHECK: 500 字まで） */
export const RECREATION_DESCRIPTION_MAX_LENGTH = 500;
/** カテゴリの名前（DB の CHECK: 1〜50 字） */
export const RECREATION_CATEGORY_NAME_MAX_LENGTH = 50;
/** 動画の作者（クリエーター。DB の CHECK: 100 字まで） */
export const RECREATION_CREATOR_MAX_LENGTH = 100;
/** キットのキャッチコピー（DB の CHECK: 200 字まで） */
export const RECREATION_CATCHCOPY_MAX_LENGTH = 200;
/** ファイル名（DB の CHECK: 255 字まで。開くときの Content-Disposition に使う） */
export const RECREATION_FILE_NAME_MAX_LENGTH = 255;
/** タグの数（DB の CHECK: `cardinality(tags) <= 20`） */
export const RECREATION_TAGS_MAX = 20;
/** タグ 1 つの長さ */
export const RECREATION_TAG_MAX_LENGTH = 50;
/** 概要（入稿で受ける平文。core が段落の HTML に直して無害化する） */
export const RECREATION_SUMMARY_MAX_LENGTH = 10_000;
/** お知らせの本文（入稿で受ける平文） */
export const RECREATION_NEWS_BODY_MAX_LENGTH = 20_000;
/** お知らせの本文の下に並べる画像の枚数 */
export const RECREATION_NEWS_BODY_IMAGES_MAX = 20;
/** お知らせのリンク（`https://` だけ） */
export const RECREATION_URL_MAX_LENGTH = 2048;
/** キットの対象・予算 */
export const RECREATION_SHORT_TEXT_MAX_LENGTH = 200;
/** 絵文字（ZWJ でつないだ絵文字も入る長さ） */
export const RECREATION_EMOJI_MAX_LENGTH = 32;
/** キットの内容・進め方の 1 行と行の数 */
export const RECREATION_KIT_LIST_ITEM_MAX_LENGTH = 500;
export const RECREATION_KIT_LIST_MAX_ITEMS = 50;
/** 検索語の上限 */
export const RECREATION_SEARCH_MAX_LENGTH = 100;
/** `MediaError.code` などの文字の上限 */
export const RECREATION_ERROR_CODE_MAX_LENGTH = 32;
/** 1 回の並び替え（プレイリストの項目・公式プレイリストの項目）で受ける数 */
export const RECREATION_REORDER_MAX_ITEMS = 500;
export const RECREATION_MY_PLAYLISTS_MAX = 50;
export const RECREATION_PLAYLIST_ITEMS_MAX = 200;
export const RECREATION_FAVORITES_MAX = 1000;
/** 1 つの項目を入れる公式プレイリストの数（入稿で項目の側から選ぶとき） */
export const RECREATION_OFFICIAL_PLAYLISTS_PER_ITEM_MAX = 50;

/** 問い合わせの欄の上限（DB の CHECK と同じ） */
export const RECREATION_INQUIRY_CONTACT_NAME_MAX_LENGTH = 100;
export const RECREATION_INQUIRY_TEL_MAX_LENGTH = 30;
export const RECREATION_INQUIRY_EMAIL_MAX_LENGTH = 254;
export const RECREATION_INQUIRY_HEADCOUNT_MAX_LENGTH = 50;
export const RECREATION_INQUIRY_MESSAGE_MAX_LENGTH = 2000;

/** `recreationAdminStateOf` に渡す行の値（型付きの select は `Date`、rawQuery は文字で来るので両方を受ける） */
export type RecreationAdminStateSource = {
  readonly publishStatus: RecreationPublishStatus;
  readonly publishedAt: string | Date | null;
  readonly deletedAt: string | Date | null;
};

/**
 * 入稿の一覧に出す状態を、見せる条件と同じ規則で決める。
 * 論理削除したもの = deleted / 下書き = draft / 公開で公開日時が未来 = scheduled / それ以外の公開 = published。
 * 公開なのに公開日時が無い行は DB の CHECK で起きないが、来たときは見せない側（draft）に寄せる。
 */
export function recreationAdminStateOf(row: RecreationAdminStateSource, now: Date = new Date()): RecreationAdminState {
  if (row.deletedAt !== null) return "deleted";
  if (row.publishStatus !== "published" || row.publishedAt === null) return "draft";
  const at = row.publishedAt instanceof Date ? row.publishedAt.getTime() : Date.parse(row.publishedAt);
  return at > now.getTime() ? "scheduled" : "published";
}

const uuid = z.string().uuid();
/** Postgres の integer の上限（これを超えると DB のエラーになるので、入口で 400 にする） */
const PG_INT_MAX = 2_147_483_647;
const nonNegativeInt = z.number().int().min(0).max(PG_INT_MAX);
const orderField = nonNegativeInt;
const isoDateTime = z.iso.datetime({ offset: true });
const titleField = z.string().trim().min(1).max(RECREATION_TITLE_MAX_LENGTH);
const nameField = z.string().trim().min(1).max(RECREATION_NAME_MAX_LENGTH);
const tagField = z.string().trim().min(1).max(RECREATION_TAG_MAX_LENGTH);

/** 重なりの無い配列（重なると 400） */
function distinctArray<T extends z.ZodType>(item: T, max: number) {
  return z
    .array(item)
    .max(max)
    .refine((xs) => new Set(xs).size === xs.length, { message: "同じ値が重なっています" });
}

/**
 * クエリの 1 つの値。素の GET フォームは空の欄を `?tag=` で送るので、空の文字は「指定なし」として扱う
 * （既定値のある値は既定値になる）。
 */
const fromQuery = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === "" ? undefined : v), schema);

const queryLimit = fromQuery(
  z.coerce.number().int().min(1).max(RECREATION_LIST_LIMIT_MAX).default(RECREATION_LIST_LIMIT_DEFAULT),
);
const queryOffset = fromQuery(z.coerce.number().int().min(0).max(PG_INT_MAX).default(0));
/** クエリの真偽（`?featured=true`）。SDK からは boolean で来る */
const queryBoolean = z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]);

/**
 * 入稿の任意の文字の欄。前後の空白を落とし、空の欄（フォームは "" で送る）は null にする。
 * 省いた（undefined）ときは「変えない」（更新）か「無し」（作成）。
 */
const adminText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

/** 制御文字（U+0000〜U+001F・U+007F）を含まないか */
function hasNoControlChars(v: string): boolean {
  for (let i = 0; i < v.length; i += 1) {
    const c = v.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return false;
  }
  return true;
}

/** ファイル名（開くときの Content-Disposition に使う。制御文字は受けない） */
const fileNameField = z
  .string()
  .trim()
  .min(1)
  .max(RECREATION_FILE_NAME_MAX_LENGTH)
  .refine(hasNoControlChars, { message: "ファイル名に使えない文字が入っています" });

/** お知らせのリンク。`https://` だけ（DB の CHECK: `url ~ '^https://'`） */
const httpsUrlField = z
  .url({ protocol: /^https$/ })
  .max(RECREATION_URL_MAX_LENGTH)
  .regex(/^https:\/\//);

/** 任意のリンクの欄。前後の空白を落とし、空の欄は null（リンクなし）にする */
const optionalHttpsUrl = z
  .string()
  .trim()
  .pipe(z.union([z.literal("").transform(() => null), httpsUrlField]))
  .nullable()
  .optional();

/** `GET /recreation/home`。区画ごとの本数 */
export const getRecreationHomeQuerySchema = z.object({
  limit: fromQuery(
    z.coerce.number().int().min(1).max(RECREATION_HOME_LIMIT_MAX).default(RECREATION_HOME_LIMIT_DEFAULT),
  ),
});
export type GetRecreationHomeQuery = z.output<typeof getRecreationHomeQuerySchema>;
export type GetRecreationHomeParams = Partial<GetRecreationHomeQuery>;

/** `GET /recreation/filters?type=`。絞り込みの選択肢（カテゴリ・タグ・作者）を種類ごとに */
export const getRecreationFiltersQuerySchema = z.object({
  type: z.enum(RECREATION_TYPES),
});
export type GetRecreationFiltersQuery = z.output<typeof getRecreationFiltersQuerySchema>;

/**
 * 一覧の共通の絞り込み（親の表 `recreations` の列）。`q` は題名と `title_search` の部分一致、
 * `careLevel`・`supportType`・`season` は配列の列に含むもの、`difficulty` は一致。
 */
const recreationListFilterShape = {
  q: fromQuery(z.string().trim().max(RECREATION_SEARCH_MAX_LENGTH).optional()),
  categoryId: fromQuery(uuid.optional()),
  tag: fromQuery(tagField.optional()),
  careLevel: fromQuery(z.enum(RECREATION_CARE_LEVELS).optional()),
  supportType: fromQuery(z.enum(RECREATION_SUPPORT_TYPES).optional()),
  season: fromQuery(z.enum(RECREATION_SEASONS).optional()),
  difficulty: fromQuery(z.enum(RECREATION_DIFFICULTIES).optional()),
  limit: queryLimit,
  offset: queryOffset,
};

/** `GET /recreation/videos`。共通の絞り込みに、所要時間の区分（秒の範囲で引く）と作者（一致）を足す */
export const listRecreationVideosQuerySchema = z.object({
  ...recreationListFilterShape,
  duration: fromQuery(z.enum(RECREATION_DURATION_CLASSES).optional()),
  creator: fromQuery(z.string().trim().min(1).max(RECREATION_CREATOR_MAX_LENGTH).optional()),
  sort: fromQuery(z.enum(RECREATION_VIDEO_SORTS).default("new")),
});
export type ListRecreationVideosQuery = z.output<typeof listRecreationVideosQuerySchema>;
export type ListRecreationVideosParams = Partial<ListRecreationVideosQuery>;

/** `GET /recreation/prints` */
export const listRecreationPrintsQuerySchema = z.object({
  ...recreationListFilterShape,
  sort: fromQuery(z.enum(RECREATION_PRINT_SORTS).default("new")),
});
export type ListRecreationPrintsQuery = z.output<typeof listRecreationPrintsQuerySchema>;
export type ListRecreationPrintsParams = Partial<ListRecreationPrintsQuery>;

/** `GET /recreation/kits`。共通の絞り込みに、おすすめだけ（`featured`）を足す */
export const listRecreationKitsQuerySchema = z.object({
  ...recreationListFilterShape,
  featured: fromQuery(queryBoolean.optional()),
  sort: fromQuery(z.enum(RECREATION_KIT_SORTS).default("featured")),
});
export type ListRecreationKitsQuery = z.output<typeof listRecreationKitsQuerySchema>;
export type ListRecreationKitsParams = Partial<ListRecreationKitsQuery>;

/** `GET /recreation/news`（公開分だけ。新しい順） */
export const listRecreationNewsQuerySchema = z.object({
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationNewsQuery = z.output<typeof listRecreationNewsQuerySchema>;
export type ListRecreationNewsParams = Partial<ListRecreationNewsQuery>;

/** `GET /recreation/history?type=`。本人の履歴（項目ごとに最新の 1 行・新しい順。動画とプリントが混ざる） */
export const listRecreationHistoryQuerySchema = z.object({
  type: fromQuery(z.enum(RECREATION_TYPES).optional()),
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationHistoryQuery = z.output<typeof listRecreationHistoryQuerySchema>;
export type ListRecreationHistoryParams = Partial<ListRecreationHistoryQuery>;

/** `GET /recreation/favorites?type=`。本人のお気に入り（見せる項目だけ・足した新しい順） */
export const listRecreationFavoritesQuerySchema = z.object({
  type: fromQuery(z.enum(RECREATION_TYPES).optional()),
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationFavoritesQuery = z.output<typeof listRecreationFavoritesQuerySchema>;
export type ListRecreationFavoritesParams = Partial<ListRecreationFavoritesQuery>;

/**
 * `GET /recreation/playlists?kind=&grouping=`。`kind` を省くと公式（公開分）とマイ（本人の分）の両方。
 * `grouping` は公式だけが持つので、付けたときは公式だけを返す。
 */
export const listRecreationPlaylistsQuerySchema = z.object({
  kind: fromQuery(z.enum(RECREATION_PLAYLIST_KINDS).optional()),
  grouping: fromQuery(z.enum(RECREATION_OFFICIAL_GROUPINGS).optional()),
});
export type ListRecreationPlaylistsQuery = z.output<typeof listRecreationPlaylistsQuerySchema>;
export type ListRecreationPlaylistsParams = Partial<ListRecreationPlaylistsQuery>;

/** `GET /recreation/inquiries`。組織の管理者は組織の全部、それ以外は本人が送った分だけ（絞るのは core） */
export const listRecreationInquiriesQuerySchema = z.object({
  status: fromQuery(z.enum(RECREATION_INQUIRY_STATUSES).optional()),
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationInquiriesQuery = z.output<typeof listRecreationInquiriesQuerySchema>;
export type ListRecreationInquiriesParams = Partial<ListRecreationInquiriesQuery>;

/** `POST /recreation/favorites`（既にあればそのまま返す） */
export const addRecreationFavoriteSchema = z.object({
  recreationId: uuid,
});
export type AddRecreationFavoriteInput = z.input<typeof addRecreationFavoriteSchema>;

/** `POST /recreation/playlists`（マイプレイリスト。持ち主は本人） */
export const createRecreationPlaylistSchema = z.object({
  name: nameField,
  description: z.string().trim().max(RECREATION_DESCRIPTION_MAX_LENGTH).nullable().optional(),
  position: orderField.default(0),
});
export type CreateRecreationPlaylistInput = z.input<typeof createRecreationPlaylistSchema>;

/** `PATCH /recreation/playlists/:id`（送ったキーだけを変える） */
export const updateRecreationPlaylistSchema = partialForUpdate(createRecreationPlaylistSchema);
export type UpdateRecreationPlaylistInput = z.input<typeof updateRecreationPlaylistSchema>;

/** `POST /recreation/playlists/:id/items`（末尾に足す。既にあればそのまま返す） */
export const addRecreationPlaylistItemSchema = z.object({
  recreationId: uuid,
});
export type AddRecreationPlaylistItemInput = z.input<typeof addRecreationPlaylistItemSchema>;

/** `PUT /recreation/playlists/:id/items`。並びを丸ごと入れ直す（渡した順が新しい並び） */
export const reorderRecreationPlaylistItemsSchema = z.object({
  recreationIds: distinctArray(uuid, RECREATION_REORDER_MAX_ITEMS),
});
export type ReorderRecreationPlaylistItemsInput = z.input<typeof reorderRecreationPlaylistItemsSchema>;

/**
 * `POST /recreation/plays`。再生の開始（`recreation_activity_logs` の play の行を 1 つ作る）。
 * 返る `playId` を再生位置の保存に渡すと、同じ行の `metrics` に積み増す。
 */
export const startRecreationPlaySchema = z.object({
  recreationId: uuid,
  /** 実際に選んだ流し方（MP4 が失敗して HLS に切り替えたときは HLS の方式で次の再生を始める） */
  sourceKind: z.enum(RECREATION_SOURCE_KINDS),
  deviceHint: z.enum(RECREATION_DEVICE_HINTS).nullable().optional(),
  ttffMs: nonNegativeInt.nullable().optional(),
});
export type StartRecreationPlayInput = z.input<typeof startRecreationPlaySchema>;

/**
 * `PUT /recreation/progress/:recreationId`。再生位置の保存と計測の積み増し。
 * `watchedDeltaSec` は前の送信からの「再生していた実時間」。最後まで見たか（90%）はサーバーが決める。
 */
export const saveRecreationProgressSchema = z.object({
  /** `POST /recreation/plays` が返した再生。無ければ再生位置だけを保存する */
  playId: uuid.nullable().optional(),
  seconds: nonNegativeInt,
  watchedDeltaSec: nonNegativeInt.default(0),
  stallCountDelta: nonNegativeInt.default(0),
  stallMsDelta: nonNegativeInt.default(0),
  errorCode: z.string().trim().max(RECREATION_ERROR_CODE_MAX_LENGTH).nullable().optional(),
  ended: z.boolean().default(false),
});
export type SaveRecreationProgressInput = z.input<typeof saveRecreationProgressSchema>;

/** `PUT /recreation/votes/:recreationId`（入れ直しは上書き） */
export const castRecreationVoteSchema = z.object({
  value: z.enum(RECREATION_VOTE_VALUES),
});
export type CastRecreationVoteInput = z.input<typeof castRecreationVoteSchema>;

/** `POST /recreation/file-opens`。プリントのファイルを開いた記録（open の行を 1 つ作る） */
export const recordRecreationFileOpenSchema = z.object({
  recreationId: uuid,
  fileId: uuid,
});
export type RecordRecreationFileOpenInput = z.input<typeof recordRecreationFileOpenSchema>;

/**
 * `POST /recreation/inquiries`。対面レクのキットの問い合わせ。キットは必須（`kit_title` に送った時点のキット名を写すため）。
 * 担当者名・電話・メールは職員の連絡先なので、ログと監査の metadata に出さない。組織名・住所は受けない。
 */
export const submitRecreationInquirySchema = z.object({
  kitId: uuid,
  type: z.enum(RECREATION_INQUIRY_TYPES),
  contactName: z.string().trim().min(1).max(RECREATION_INQUIRY_CONTACT_NAME_MAX_LENGTH),
  tel: z.string().trim().min(1).max(RECREATION_INQUIRY_TEL_MAX_LENGTH),
  email: z.string().trim().min(1).max(RECREATION_INQUIRY_EMAIL_MAX_LENGTH).email(),
  headcount: z.string().trim().max(RECREATION_INQUIRY_HEADCOUNT_MAX_LENGTH).nullable().optional(),
  careLevel: z.enum(RECREATION_INQUIRY_CARE_LEVELS).nullable().optional(),
  message: z.string().trim().max(RECREATION_INQUIRY_MESSAGE_MAX_LENGTH).nullable().optional(),
});
export type SubmitRecreationInquiryInput = z.input<typeof submitRecreationInquirySchema>;

/** `PATCH /recreation/inquiries/:id`。対応済みにする / 未対応に戻す（組織の管理者だけ） */
export const updateRecreationInquirySchema = z.object({
  status: z.enum(RECREATION_INQUIRY_STATUSES),
});
export type UpdateRecreationInquiryInput = z.input<typeof updateRecreationInquirySchema>;

/** `GET /recreation/admin/stream-videos?q=&state=`。Stream の一覧と登録済みの動画の突き合わせ */
export const listRecreationStreamVideosQuerySchema = z.object({
  /**
   * 部分一致（大文字小文字を問わない）。Stream の動画は Stream の名前（`meta.name`）・作者（`meta.creator`）・uid と、
   * 登録した項目の題名で絞り、Stream から消えた動画は題名と uid で絞る
   */
  q: fromQuery(z.string().trim().max(RECREATION_SEARCH_MAX_LENGTH).optional()),
  state: fromQuery(z.enum(RECREATION_STREAM_LIST_STATES).default("all")),
});
export type ListRecreationStreamVideosQuery = z.output<typeof listRecreationStreamVideosQuerySchema>;
export type ListRecreationStreamVideosParams = Partial<ListRecreationStreamVideosQuery>;

/** `GET /recreation/admin/items?type=&state=&q=&limit=&offset=`。`state` を省くと削除済みのほかを全部（新しく更新した順） */
export const listRecreationAdminItemsQuerySchema = z.object({
  type: fromQuery(z.enum(RECREATION_TYPES).optional()),
  state: fromQuery(z.enum(RECREATION_ADMIN_STATES).optional()),
  q: fromQuery(z.string().trim().max(RECREATION_SEARCH_MAX_LENGTH).optional()),
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationAdminItemsQuery = z.output<typeof listRecreationAdminItemsQuerySchema>;
export type ListRecreationAdminItemsParams = Partial<ListRecreationAdminItemsQuery>;

/**
 * 項目の共通の欄（親の表 `recreations`）。
 * - `summary` は平文（空の行で段落）。core が段落の HTML に直し、`sanitizeSummaryHtml` を通して `summary_html` に入れる
 * - `publishStatus` を published にして `publishedAt` を省くと、core が今の時刻を入れる。未来の時刻は公開予約
 * - `officialPlaylistIds` を渡すと、この項目が入る公式プレイリストをこの一覧に合わせる（足すものは末尾・外すものは抜く）
 */
const recreationItemShape = {
  title: titleField,
  summary: adminText(RECREATION_SUMMARY_MAX_LENGTH),
  categoryId: uuid.nullable().optional(),
  tags: distinctArray(tagField, RECREATION_TAGS_MAX).default([]),
  careLevels: distinctArray(z.enum(RECREATION_CARE_LEVELS), RECREATION_CARE_LEVELS.length).default([]),
  supportTypes: distinctArray(z.enum(RECREATION_SUPPORT_TYPES), RECREATION_SUPPORT_TYPES.length).default([]),
  seasons: distinctArray(z.enum(RECREATION_SEASONS), RECREATION_SEASONS.length).default([]),
  difficulty: z.enum(RECREATION_DIFFICULTIES).nullable().optional(),
  publishStatus: z.enum(RECREATION_PUBLISH_STATUSES).default("draft"),
  publishedAt: isoDateTime.nullable().optional(),
  featured: z.boolean().default(false),
  displayOrder: orderField.default(0),
  officialPlaylistIds: distinctArray(uuid, RECREATION_OFFICIAL_PLAYLISTS_PER_ITEM_MAX).optional(),
};

/** 動画の欄（作成）。`creator` を省くと Stream の `meta.creator` を使い、null で空にする。`thumbnailTimeSec` を省くと Stream の既定のコマ */
const recreationVideoFieldsSchema = z.object({
  streamUid: z.string().regex(RECREATION_STREAM_UID_RE),
  thumbnailTimeSec: nonNegativeInt.nullable().optional(),
  creator: adminText(RECREATION_CREATOR_MAX_LENGTH),
});

/** 動画の欄（更新）。uid は変えない（別の動画にするなら新しく登録する） */
const recreationVideoUpdateFieldsSchema = partialForUpdate(recreationVideoFieldsSchema.omit({ streamUid: true }));

/** キットの欄（`recreation_kits`） */
const recreationKitFieldsSchema = z.object({
  catchcopy: adminText(RECREATION_CATCHCOPY_MAX_LENGTH),
  kitContents: z
    .array(z.string().trim().min(1).max(RECREATION_KIT_LIST_ITEM_MAX_LENGTH))
    .max(RECREATION_KIT_LIST_MAX_ITEMS)
    .default([]),
  howTo: z
    .array(z.string().trim().min(1).max(RECREATION_KIT_LIST_ITEM_MAX_LENGTH))
    .max(RECREATION_KIT_LIST_MAX_ITEMS)
    .default([]),
  target: adminText(RECREATION_SHORT_TEXT_MAX_LENGTH),
  budget: adminText(RECREATION_SHORT_TEXT_MAX_LENGTH),
  emoji: adminText(RECREATION_EMOJI_MAX_LENGTH),
});

/**
 * `POST /recreation/admin/items`。項目の作成（`type` で形が分かれる）。
 * 動画は Stream の 1 本を読み、再生の準備ができていなければ 409。長さ・作者・MP4 の有無は Stream から書く。
 * 題名の既定（Stream の `meta.name`）は画面が入れて送る。
 */
export const createRecreationItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("video"), ...recreationItemShape, video: recreationVideoFieldsSchema }),
  z.object({ type: z.literal("print"), ...recreationItemShape }),
  z.object({ type: z.literal("kit"), ...recreationItemShape, kit: recreationKitFieldsSchema }),
]);
export type CreateRecreationItemInput = z.input<typeof createRecreationItemSchema>;

/**
 * `PATCH /recreation/admin/items/:id`。送ったキーだけを変える（種類は変えない）。
 * `video` は動画の項目に、`kit` はキットの項目にだけ送る（合わなければ core が 400）。
 */
export const updateRecreationItemSchema = z.object({
  ...partialForUpdate(z.object(recreationItemShape)).shape,
  video: recreationVideoUpdateFieldsSchema.optional(),
  kit: partialForUpdate(recreationKitFieldsSchema).optional(),
});
export type UpdateRecreationItemInput = z.input<typeof updateRecreationItemSchema>;

/**
 * `POST /recreation/admin/items/:id/files`。staging（用途は役割で決まる・`RECREATION_FILE_UPLOAD_PURPOSES`）に上げた実体を
 * Qaito Park のバケットへ写して `recreation_files` に足す。キーはサーバーが作る。`displayOrder` を省くと末尾。
 */
export const addRecreationItemFileSchema = z.object({
  /** `POST /storage/uploads/staged` が返した `staged_id`（ブラウザの `issueAndTransfer` の `stagedId`） */
  stagedId: uuid,
  role: z.enum(RECREATION_FILE_ROLES),
  fileName: fileNameField,
  displayOrder: orderField.optional(),
});
export type AddRecreationItemFileInput = z.input<typeof addRecreationItemFileSchema>;

/** `GET /recreation/admin/categories?type=` */
export const listRecreationCategoriesQuerySchema = z.object({
  type: fromQuery(z.enum(RECREATION_TYPES).optional()),
});
export type ListRecreationCategoriesQuery = z.output<typeof listRecreationCategoriesQuerySchema>;
export type ListRecreationCategoriesParams = Partial<ListRecreationCategoriesQuery>;

/** `POST /recreation/admin/categories`。名前は種類の中で重ならない（重なると 409） */
export const createRecreationCategorySchema = z.object({
  type: z.enum(RECREATION_TYPES),
  name: z.string().trim().min(1).max(RECREATION_CATEGORY_NAME_MAX_LENGTH),
  displayOrder: orderField.default(0),
});
export type CreateRecreationCategoryInput = z.input<typeof createRecreationCategorySchema>;

/** `PATCH /recreation/admin/categories/:id`。種類は変えない（項目が種類つきで指しているため） */
export const updateRecreationCategorySchema = partialForUpdate(createRecreationCategorySchema.omit({ type: true }));
export type UpdateRecreationCategoryInput = z.input<typeof updateRecreationCategorySchema>;

/** `GET /recreation/admin/news?state=&limit=&offset=`。`state` を省くと削除済みのほかを全部 */
export const listRecreationAdminNewsQuerySchema = z.object({
  state: fromQuery(z.enum(RECREATION_ADMIN_STATES).optional()),
  limit: queryLimit,
  offset: queryOffset,
});
export type ListRecreationAdminNewsQuery = z.output<typeof listRecreationAdminNewsQuerySchema>;
export type ListRecreationAdminNewsParams = Partial<ListRecreationAdminNewsQuery>;

/**
 * `POST /recreation/admin/news`。`body` は平文（空の行で段落・改行はそのまま）。core が HTML に直し、`sanitizeNewsHtml` を通す。
 * 画像は作ったあとで `POST /recreation/admin/news/:id/images` で足す。
 */
export const createRecreationNewsSchema = z.object({
  title: titleField,
  body: z.string().trim().max(RECREATION_NEWS_BODY_MAX_LENGTH).default(""),
  url: optionalHttpsUrl,
  emoji: adminText(RECREATION_EMOJI_MAX_LENGTH),
  publishStatus: z.enum(RECREATION_PUBLISH_STATUSES).default("draft"),
  publishedAt: isoDateTime.nullable().optional(),
  displayOrder: orderField.default(0),
});
export type CreateRecreationNewsInput = z.input<typeof createRecreationNewsSchema>;

/**
 * `PATCH /recreation/admin/news/:id`。送ったキーだけを変える。画像の外し方:
 * - `coverImage: null` で表紙の画像を外す
 * - `bodyImageOrder` に残す本文の画像を今の並びの位置（0 から）で渡す。渡した順が新しい並びで、渡さなかった画像は外す
 *   （バケットの実体も消す）。位置を数えた並びを `expectedBodyImageKeys`（`RecreationAdminNews.bodyImageKeys` をそのまま）で
 *   必ず添える。api の今の並びと違えば 409 `NEWS_IMAGES_CHANGED` で何も書かない（古い画面から送った位置で、知らない画像を外さない）
 */
export const updateRecreationNewsSchema = z
  .object({
    ...partialForUpdate(createRecreationNewsSchema).shape,
    coverImage: z.null().optional(),
    bodyImageOrder: distinctArray(
      z.number().int().min(0).max(RECREATION_NEWS_BODY_IMAGES_MAX - 1),
      RECREATION_NEWS_BODY_IMAGES_MAX,
    ).optional(),
    /** 位置を数えた本文の画像の並び。今の並びと比べるだけで、書き込み・署名・削除には使わない（キーはサーバーが作る） */
    expectedBodyImageKeys: distinctArray(z.string().min(1).max(S3_KEY_MAX_LENGTH), RECREATION_NEWS_BODY_IMAGES_MAX).optional(),
  })
  .refine((v) => v.bodyImageOrder === undefined || v.expectedBodyImageKeys !== undefined, {
    message: "本文の画像を並べ直すときは、今の画像の並び（expectedBodyImageKeys）を添えてください",
    path: ["expectedBodyImageKeys"],
  });
export type UpdateRecreationNewsInput = z.input<typeof updateRecreationNewsSchema>;

/** `POST /recreation/admin/news/:id/images`。表紙は置き換え、本文の画像は末尾に足す（用途 `recreation_image`） */
export const addRecreationNewsImageSchema = z.object({
  stagedId: uuid,
  slot: z.enum(RECREATION_NEWS_IMAGE_SLOTS),
});
export type AddRecreationNewsImageInput = z.input<typeof addRecreationNewsImageSchema>;

/** `GET /recreation/admin/official-playlists?grouping=`（削除済みは出さない） */
export const listRecreationAdminOfficialPlaylistsQuerySchema = z.object({
  grouping: fromQuery(z.enum(RECREATION_OFFICIAL_GROUPINGS).optional()),
});
export type ListRecreationAdminOfficialPlaylistsQuery = z.output<typeof listRecreationAdminOfficialPlaylistsQuerySchema>;
export type ListRecreationAdminOfficialPlaylistsParams = Partial<ListRecreationAdminOfficialPlaylistsQuery>;

/** `POST /recreation/admin/official-playlists`。`recreationIds` が項目の並び（渡した順） */
export const createRecreationOfficialPlaylistSchema = z.object({
  name: nameField,
  description: adminText(RECREATION_DESCRIPTION_MAX_LENGTH),
  grouping: z.enum(RECREATION_OFFICIAL_GROUPINGS),
  publishStatus: z.enum(RECREATION_PUBLISH_STATUSES).default("draft"),
  displayOrder: orderField.default(0),
  recreationIds: distinctArray(uuid, RECREATION_REORDER_MAX_ITEMS).default([]),
});
export type CreateRecreationOfficialPlaylistInput = z.input<typeof createRecreationOfficialPlaylistSchema>;

/** `PATCH /recreation/admin/official-playlists/:id`。`recreationIds` を送ると項目を丸ごと置き換える */
export const updateRecreationOfficialPlaylistSchema = partialForUpdate(createRecreationOfficialPlaylistSchema);
export type UpdateRecreationOfficialPlaylistInput = z.input<typeof updateRecreationOfficialPlaylistSchema>;

/** 絞り込みのカテゴリの選択肢（`recreation_categories` の 1 行） */
export type RecreationCategoryOption = {
  readonly id: string;
  readonly name: string;
};

/**
 * 項目の共通の欄（一覧のカード）。数は組織の中で数える。
 * `viewCount` は動画なら再生（play）、プリントならファイルを開いた（open）の記録の数。`goodCount`・`badCount` は投票の数。
 * `thumbnailUrl`: 動画は専用のサムネイル（S3 の署名つき GET）か Stream のサムネイル、プリントはサムネイルか見本、キットはメインの画像。
 */
export type RecreationItemBase<T extends RecreationType = RecreationType> = {
  readonly id: string;
  readonly type: T;
  readonly title: string;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly tags: readonly string[];
  readonly careLevels: readonly RecreationCareLevel[];
  readonly supportTypes: readonly RecreationSupportType[];
  readonly seasons: readonly RecreationSeason[];
  readonly difficulty: RecreationDifficulty | null;
  readonly featured: boolean;
  /** 見せる項目は必ず持つ（公開で、公開日時が今より前） */
  readonly publishedAt: string;
  readonly thumbnailUrl: string | null;
  /** 本人のお気に入りに入っているか */
  readonly isFavorite: boolean;
  readonly viewCount: number;
  readonly goodCount: number;
  readonly badCount: number;
};

/** 動画 1 本（一覧のカード） */
export type RecreationVideo = RecreationItemBase<"video"> & {
  readonly durationSec: number;
  readonly durationClass: RecreationDurationClass;
  readonly creator: string | null;
  /** 本人の再生位置（秒）。再生したことが無ければ null */
  readonly progressSec: number | null;
  /** 本人が最後まで見たか */
  readonly completed: boolean;
};

/** 本人の再生位置（動画だけ） */
export type RecreationProgress = {
  readonly recreationId: string;
  readonly seconds: number;
  readonly completed: boolean;
  /** 最後に積み増した再生（`recreation_activity_logs` の play の行） */
  readonly lastPlayId: string | null;
  readonly updatedAt: string;
};

/** 動画 1 本の詳細 */
export type RecreationVideoDetail = RecreationVideo & {
  /** 概要。`sanitizeSummaryHtml` の許すタグだけの HTML */
  readonly summaryHtml: string | null;
  /** 本人の投票（無ければ null） */
  readonly vote: RecreationVoteValue | null;
  /** 本人の再生位置（無ければ null） */
  readonly progress: RecreationProgress | null;
};

/** 関連動画（点数つき・固定 12 本） */
export type RecreationRelatedVideo = RecreationVideo & {
  readonly score: number;
};

/** ファイル 1 件（署名 URL なし。AI の呼び出しにはこの形で出す） */
export type RecreationFile<R extends RecreationFileRole = RecreationFileRole> = {
  readonly id: string;
  readonly recreationId: string;
  readonly role: R;
  /** 開くときの Content-Disposition の `filename*` */
  readonly fileName: string;
  readonly contentType: RecreationFileContentType;
  readonly sizeBytes: number;
  readonly displayOrder: number;
};

/** ファイル 1 件と、開くための署名つき URL（S3 の GET・inline） */
export type RecreationFileView<R extends RecreationFileRole = RecreationFileRole> = RecreationFile<R> & {
  readonly url: string;
  readonly expiresInSec: number;
};

/** プリント 1 本（一覧のカード） */
export type RecreationPrint = RecreationItemBase<"print"> & {
  /** 見本の画像（無ければ null） */
  readonly previewUrl: string | null;
  /** 開ける添付（PDF）の数 */
  readonly attachmentCount: number;
};

/** プリント 1 本の詳細。画面はこの 1 回で開くまで済ませる（添付ごとに URL を取り直さない） */
export type RecreationPrintDetail = RecreationPrint & {
  readonly summaryHtml: string | null;
  /** 添付（role = attachment）を `display_order` 順に */
  readonly files: readonly RecreationFileView<"attachment">[];
};

/** ツールに渡すプリントの詳細（短い期限の URL を AI の文脈に残さない） */
export type RecreationPrintDetailForTool = Omit<RecreationPrintDetail, "files"> & {
  readonly files: readonly RecreationFile<"attachment">[];
};

/** キット 1 本（一覧のカード）。画像が無くても出す（画面は絵文字か既定の 🎁 で描く） */
export type RecreationKit = RecreationItemBase<"kit"> & {
  readonly catchcopy: string | null;
  readonly emoji: string | null;
  /** メインの画像（`thumbnailUrl` と同じもの） */
  readonly mainImageUrl: string | null;
};

/** キット 1 本の詳細 */
export type RecreationKitDetail = RecreationKit & {
  readonly summaryHtml: string | null;
  readonly kitContents: readonly string[];
  readonly howTo: readonly string[];
  readonly target: string | null;
  readonly budget: string | null;
  /** 画像。メイン、サブ（`display_order` 順）、チラシの順 */
  readonly images: readonly RecreationFileView<RecreationFileRoleOf<"kit">>[];
};

/** 種類ごとの一覧の形 */
export type RecreationItemByType = {
  readonly video: RecreationVideo;
  readonly print: RecreationPrint;
  readonly kit: RecreationKit;
};
/** どの種類でも入る項目（お気に入り・プレイリスト・履歴）。`type` で絞れる */
export type RecreationItem = RecreationItemByType[RecreationType];

/** お知らせ 1 件（一覧。本文は持たない） */
export type RecreationNews = {
  readonly id: string;
  readonly title: string;
  /** 外のリンク（`https://` だけ） */
  readonly url: string | null;
  readonly emoji: string | null;
  /** 表紙の画像 */
  readonly imageUrl: string | null;
  readonly publishedAt: string;
};

/** お知らせ 1 件の本文つき */
export type RecreationNewsDetail = RecreationNews & {
  /** `sanitizeNewsHtml` を通した HTML */
  readonly bodyHtml: string;
  /** 本文の下に順に並べる画像 */
  readonly bodyImageUrls: readonly string[];
};

/** プレイリストの共通の欄 */
type RecreationPlaylistCommon = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  /** 見せる項目の数 */
  readonly itemCount: number;
  /** 先頭の項目のサムネイル */
  readonly thumbnailUrl: string | null;
  /** 先頭の動画（「最初から再生」の行き先。動画が無ければ null） */
  readonly firstVideoId: string | null;
  /** 並び（公式は `display_order`、マイは `position`） */
  readonly position: number;
  readonly updatedAt: string;
};

/** 公式プレイリスト（共通の中身。読むだけ） */
export type RecreationOfficialPlaylist = RecreationPlaylistCommon & {
  readonly kind: "official";
  readonly grouping: RecreationOfficialGrouping;
  readonly userId: null;
};

/** マイプレイリスト（本人のもの） */
export type RecreationMyPlaylist = RecreationPlaylistCommon & {
  readonly kind: "mine";
  readonly grouping: null;
  /** 持ち主（permissions の規則に渡す材料。画面は `permission-context` の `userId` と比べる） */
  readonly userId: string;
};

/**
 * プレイリスト（公式とマイを 1 つの型で）。`GET /recreation/playlists/:id` は公式の表を先に引き、無ければ本人の表を引く。
 * 書き込みの口はマイだけ。
 */
export type RecreationPlaylist = RecreationOfficialPlaylist | RecreationMyPlaylist;

/** プレイリストの項目（見せる項目だけ・`position` 順） */
export type RecreationPlaylistItem = {
  readonly recreationId: string;
  readonly position: number;
  readonly item: RecreationItem;
};

export type RecreationPlaylistDetail = RecreationPlaylist & {
  readonly items: readonly RecreationPlaylistItem[];
};

/** 種類ごとのお気に入り 1 件 */
export type RecreationFavoriteOf<T extends RecreationType> = {
  readonly recreationId: string;
  readonly type: T;
  readonly createdAt: string;
  readonly item: RecreationItemByType[T];
};
/** お気に入り 1 件（見せる項目だけ） */
export type RecreationFavorite = { readonly [T in RecreationType]: RecreationFavoriteOf<T> }[RecreationType];

/** `POST /recreation/plays` の応答 */
export type RecreationPlayReceipt = {
  readonly playId: string;
};

/** `POST /recreation/file-opens` の応答 */
export type RecreationFileOpenReceipt = {
  readonly activityId: string;
};

/** 種類ごとの履歴 1 行 */
export type RecreationHistoryItemOf<T extends RecreationType> = {
  readonly recreationId: string;
  readonly type: T;
  /** 最後に見た（再生した・最後まで見た）か開いた日時 */
  readonly viewedAt: string;
  /** 最後の再生で見た秒数（プリントは 0） */
  readonly watchSeconds: number;
  /** 最後まで見たか（プリントは false） */
  readonly completed: boolean;
  /** 見せる項目でなくなっていれば null（行は残す） */
  readonly item: RecreationItemByType[T] | null;
};
/** 履歴 1 行（項目ごとに最新の記録） */
export type RecreationHistoryItem = { readonly [T in RecreationType]: RecreationHistoryItemOf<T> }[RecreationType];

/** `DELETE /recreation/history`・`DELETE /recreation/history/:recreationId` の応答（消した記録と再生位置の数） */
export type RecreationHistoryClearResult = {
  readonly deletedActivities: number;
  readonly deletedProgress: number;
};

/** 本人の投票と組織の中の数 */
export type RecreationVote = {
  readonly recreationId: string;
  readonly value: RecreationVoteValue | null;
  readonly goodCount: number;
  readonly badCount: number;
};

/**
 * `GET /recreation/videos/:id/playback` の応答。HLS は必ずあり、MP4 は Stream で MP4 が作ってある動画（`mp4_ready`）だけ。
 * 期限（`expiresInSec`）の前に取り直す。AI と委任の呼び出しには出さない。
 */
export type RecreationPlayback = {
  readonly recreationId: string;
  readonly hlsUrl: string;
  readonly mp4Url: string | null;
  readonly thumbnailUrl: string | null;
  readonly expiresInSec: number;
  readonly provider: RecreationPlaybackProvider;
};

/** `GET /recreation/prints/:id/files/:fileId/open-url` の応答（S3 の署名つき GET・inline） */
export type RecreationFileOpenUrl = {
  readonly fileId: string;
  readonly url: string;
  readonly expiresInSec: number;
  readonly fileName: string;
  readonly contentType: RecreationFileContentType;
};

/**
 * `GET /recreation/filters?type=` の応答。見せる項目が使っている値だけ。
 * 要介護度・支援内容・難易度・季節・所要時間は定数（`RECREATION_*` と `RECREATION_LABELS`）から選択肢を作る。
 */
export type RecreationFilters = {
  readonly type: RecreationType;
  readonly categories: readonly RecreationCategoryOption[];
  readonly tags: readonly string[];
  /** 動画の作者（動画のほかは空） */
  readonly creators: readonly string[];
};

/** ホームの区画（`limit + 1` で取って切る。`has_more` は一覧の続きの印と同じ名前） */
export type RecreationHomeSection<T> = {
  readonly items: readonly T[];
  readonly has_more: boolean;
};

/** 続きから見る（本人の再生位置つき） */
export type RecreationContinueWatchingItem = RecreationVideo & {
  readonly progress: RecreationProgress;
};

/** カテゴリごとの新着（動画のカテゴリ） */
export type RecreationHomeCategorySection = RecreationHomeSection<RecreationVideo> & {
  readonly category: RecreationCategoryOption;
};

/** ホーム（6 区画。動画の区画「映像レク」の入口） */
export type RecreationHome = {
  readonly continueWatching: RecreationHomeSection<RecreationContinueWatchingItem>;
  readonly newArrivals: RecreationHomeSection<RecreationVideo>;
  readonly popular: RecreationHomeSection<RecreationVideo>;
  /** 動画のお気に入り（足した新しい順） */
  readonly favorites: RecreationHomeSection<RecreationFavoriteOf<"video">>;
  readonly categories: readonly RecreationHomeCategorySection[];
  readonly officialPlaylists: RecreationHomeSection<RecreationOfficialPlaylist>;
};

/** 画面の出し分けの材料（`GET /recreation/permission-context`）。止めるのは api のゲート */
export type RecreationPermissionContext = {
  readonly userId: string | null;
  /** 組織の管理者（console 柱かルート）。他人のプレイリストを消せる・問い合わせを組織の全部見る */
  readonly isAdmin: boolean;
  /** `recreation:write` を持つ */
  readonly canWrite: boolean;
  /** `recreation:delete` を持つ */
  readonly canDelete: boolean;
  readonly canManageContent: boolean;
};

/** 問い合わせ 1 件（送った本人か組織の管理者だけが読む） */
export type RecreationInquiry = {
  readonly id: string;
  /** 送った人（permissions の規則に渡す材料） */
  readonly userId: string;
  /** キットが消えると null（`kitTitle` は残る） */
  readonly kitId: string | null;
  /** 送った時点のキットの名前 */
  readonly kitTitle: string;
  readonly type: RecreationInquiryType;
  readonly contactName: string;
  readonly tel: string;
  readonly email: string;
  readonly headcount: string | null;
  readonly careLevel: RecreationInquiryCareLevel | null;
  readonly message: string | null;
  readonly status: RecreationInquiryStatus;
  readonly closedAt: string | null;
  readonly closedBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * 再生の記録（`recreation_activity_logs.metrics`）の形。play の行は再生位置の保存のたびに積み増す（UPDATE）。
 * complete の行は 1 回の再生につき 1 行で、どの再生かを持つ。open の行は空。
 */
export type RecreationPlayMetrics = {
  readonly sourceKind: RecreationSourceKind;
  readonly deviceHint: RecreationDeviceHint | null;
  readonly ttffMs: number | null;
  readonly watchSeconds: number;
  readonly stallCount: number;
  readonly stallMs: number;
  readonly errorCode: string | null;
  /** 最後まで再生した（`ended`）日時 */
  readonly endedAt: string | null;
};
export type RecreationCompleteMetrics = {
  readonly playId: string;
};
export type RecreationActivityMetricsByAction = {
  readonly play: RecreationPlayMetrics;
  readonly complete: RecreationCompleteMetrics;
  readonly open: Readonly<Record<string, never>>;
};

/** 登録済みの動画との突き合わせ（Stream の 1 本が Qaito Park のどの項目か） */
export type RecreationStreamRegistration = {
  readonly recreationId: string;
  readonly title: string;
  /** 項目を論理削除してある（uid は登録し直せないので、元に戻す） */
  readonly deleted: boolean;
  readonly mp4Ready: boolean;
  readonly publishState: RecreationAdminState;
};

/** Stream の動画 1 本 */
export type RecreationStreamVideo = {
  readonly uid: string;
  /** Stream の `meta.name`（アップロードした時点の題名。登録の題名の既定） */
  readonly name: string | null;
  /** Stream の `meta.creator`（登録の作者の既定） */
  readonly creator: string | null;
  /** 長さ（秒）。まだ分からない動画は null */
  readonly durationSec: number | null;
  readonly readyToStream: boolean;
  /** Stream の `status.state`（`RECREATION_STREAM_STATES` のどれか。知らない値もそのまま） */
  readonly state: string;
  readonly createdAt: string;
  readonly thumbnailUrl: string | null;
  /** 未登録なら null */
  readonly registration: RecreationStreamRegistration | null;
};

/** Stream から消えた（再生できなくなった）登録済みの動画 */
export type RecreationStreamMissingVideo = {
  readonly recreationId: string;
  readonly title: string;
  readonly streamUid: string;
  readonly publishState: RecreationAdminState;
};

/** `GET /recreation/admin/stream-videos` の応答 */
export type RecreationStreamVideoList = {
  /** Stream の設定があるか。無ければ `videos`・`missing` は空 */
  readonly connected: boolean;
  readonly videos: readonly RecreationStreamVideo[];
  /** `state` が `all` か `missing` のときだけ入る（ほかの `state` と未接続のときは空）。Stream の一覧を最後まで読めなければ、口ごと 500 で返す */
  readonly missing: readonly RecreationStreamMissingVideo[];
  readonly fetchedAt: string;
};

/** 動画の欄（入稿） */
export type RecreationAdminVideoFields = {
  readonly streamUid: string;
  readonly durationSec: number;
  readonly durationClass: RecreationDurationClass;
  readonly thumbnailTimeSec: number | null;
  readonly creator: string | null;
  readonly mp4Ready: boolean;
  /** Stream から長さと MP4 の有無を最後に読んだ日時 */
  readonly streamCheckedAt: string | null;
};

/** キットの欄（入稿） */
export type RecreationAdminKitFields = {
  readonly catchcopy: string | null;
  readonly kitContents: readonly string[];
  readonly howTo: readonly string[];
  readonly target: string | null;
  readonly budget: string | null;
  readonly emoji: string | null;
};

/** 入稿の一覧の 1 行（共通の欄） */
type RecreationAdminItemRowCommon<T extends RecreationType> = {
  readonly id: string;
  readonly type: T;
  readonly title: string;
  readonly state: RecreationAdminState;
  readonly categoryId: string | null;
  readonly categoryName: string | null;
  readonly publishStatus: RecreationPublishStatus;
  readonly publishedAt: string | null;
  readonly featured: boolean;
  readonly displayOrder: number;
  readonly thumbnailUrl: string | null;
  /** 付いているファイルの数（役割を問わない） */
  readonly fileCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
};

/** 入稿の一覧の 1 行（`GET /recreation/admin/items`）。動画は uid と MP4 の有無も出す */
export type RecreationAdminItemRow =
  | (RecreationAdminItemRowCommon<"video"> & {
      readonly video: Pick<RecreationAdminVideoFields, "streamUid" | "durationSec" | "mp4Ready">;
    })
  | RecreationAdminItemRowCommon<"print">
  | RecreationAdminItemRowCommon<"kit">;

/** 入稿の詳細の共通の欄（親の表の全部の列と状態） */
type RecreationAdminItemCommon<T extends RecreationType> = RecreationAdminItemRowCommon<T> & {
  /** 概要の HTML（利用者の画面と同じ） */
  readonly summaryHtml: string | null;
  /** 編集の欄に出す平文（概要の HTML を平文に戻したもの） */
  readonly summaryText: string;
  readonly tags: readonly string[];
  readonly careLevels: readonly RecreationCareLevel[];
  readonly supportTypes: readonly RecreationSupportType[];
  readonly seasons: readonly RecreationSeason[];
  readonly difficulty: RecreationDifficulty | null;
  /** 移行のときのシニアカレッジの ID（入稿で作ったものは null） */
  readonly sourceId: string | null;
  /** 付いているファイル（署名つき URL・役割ごとに `display_order` 順） */
  readonly files: readonly RecreationFileView<RecreationFileRoleOf<T>>[];
  /** この項目が入っている公式プレイリスト */
  readonly officialPlaylistIds: readonly string[];
};

/** 入稿の詳細（`GET /recreation/admin/items/:id`・作成と更新の応答） */
export type RecreationAdminItem =
  | (RecreationAdminItemCommon<"video"> & { readonly video: RecreationAdminVideoFields })
  | RecreationAdminItemCommon<"print">
  | (RecreationAdminItemCommon<"kit"> & { readonly kit: RecreationAdminKitFields });

/** カテゴリ（入稿） */
export type RecreationCategory = {
  readonly id: string;
  readonly type: RecreationType;
  readonly name: string;
  readonly displayOrder: number;
  /** このカテゴリを指している項目の数（論理削除したものも数える。1 つでもあれば削除できない） */
  readonly itemCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** お知らせ（入稿） */
export type RecreationAdminNews = {
  readonly id: string;
  readonly title: string;
  readonly bodyHtml: string;
  /** 編集の欄に出す平文（本文の HTML を平文に戻したもの） */
  readonly bodyText: string;
  readonly url: string | null;
  readonly emoji: string | null;
  /** 表紙の画像（署名つき URL） */
  readonly imageUrl: string | null;
  /**
   * 本文の下に並べる画像の S3 のキー（api の今の並び）。`bodyImageOrder` の位置はこの並びの添字で、並べ直し・外すときは
   * これをそのまま `expectedBodyImageKeys` に返す
   */
  readonly bodyImageKeys: readonly string[];
  /** 本文の画像の署名つき URL（`bodyImageKeys` と同じ並び。署名できなかった画像は null で、位置はずらさない） */
  readonly bodyImageUrls: readonly (string | null)[];
  readonly publishStatus: RecreationPublishStatus;
  readonly publishedAt: string | null;
  readonly displayOrder: number;
  readonly state: RecreationAdminState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
};

/** 公式プレイリストの項目（入稿の編集の画面に名前と状態を出すための欄） */
export type RecreationAdminOfficialPlaylistItem = {
  readonly recreationId: string;
  readonly type: RecreationType;
  readonly title: string;
  readonly state: RecreationAdminState;
};

/** 公式プレイリスト（入稿） */
export type RecreationAdminOfficialPlaylist = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly grouping: RecreationOfficialGrouping;
  readonly publishStatus: RecreationPublishStatus;
  readonly displayOrder: number;
  /** 項目の並び（下書き・削除済みの項目も入る） */
  readonly recreationIds: readonly string[];
  /** `recreationIds` と同じ並びの項目（画面が 1 件ずつ引き直さなくて済むように） */
  readonly items: readonly RecreationAdminOfficialPlaylistItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
};
