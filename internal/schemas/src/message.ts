import { z } from "zod";

export const channelTypeValues = ["public", "private", "dm", "group_dm"] as const;
export type ChannelType = (typeof channelTypeValues)[number];

/** 組織の既定のチャンネルの印（`staff.message_channels.system_key`・0635） */
export const channelSystemKeyValues = ["announce", "chitchat"] as const;
export type ChannelSystemKey = (typeof channelSystemKeyValues)[number];

/**
 * 組織を作るとき・さかのぼりで入れる既定のチャンネル（0635 の SQL と同じ値。名前を変えたら migration と揃える）。
 * `broadcastRestricted`: 全体連絡は @channel / @everyone を管理者・モデレーターだけにする（投稿は誰でもできる）。
 * さかのぼりで採用した既存の同名チャンネルの設定は変えない
 */
export const DEFAULT_CHANNELS: readonly { readonly systemKey: ChannelSystemKey; readonly name: string; readonly topic: string; readonly description: string; readonly broadcastRestricted: boolean }[] = [
  { systemKey: "announce", name: "全体連絡", topic: "全員への連絡・お知らせ", description: "事業所全体に関わる連絡の場所です。アカウントのある全員が参加しています。", broadcastRestricted: true },
  { systemKey: "chitchat", name: "雑談", topic: "仕事以外の話題もどうぞ", description: "気軽に話す場所です。参加したくない人は抜けられます。", broadcastRestricted: false },
];

export const channelKindValues = ["general", "facility"] as const;
export type ChannelKind = (typeof channelKindValues)[number];

export const notificationKindValues = ["mention", "reply", "reaction", "dm"] as const;
export type NotificationKind = (typeof notificationKindValues)[number];

export const messageEventTypeValues = [
  /** 投稿（本流・スレッドの返信。返信なら parent_id が付く） */
  "message_created",
  "message_updated",
  "message_deleted",
  "reaction_added",
  "reaction_removed",
  /** 既読が進んだ（チャンネル / スレッド）。**本人の接続にだけ**届く（別の端末の未読を揃えるため） */
  "read_updated",
  /**
   * 「入力中」（§5.5）。打っている間は 3 秒に 1 回届き、受けた画面は最後に届いてから 7 秒で取り下げる。
   * スレッドで打っているときは parent_id が付く（チャンネル本体とは別の部屋）。DB には残らない
   */
  "typing",
  /** 「入力中」の取り下げ（送信した・画面を離れた）。届かなくても受けた画面が 7 秒で捨てる */
  "typing_stopped",
  /**
   * 自分あての通知（アクティビティ）が既読になった。**本人の接続にだけ**届く。チャンネル・スレッドを読んだとき
   * （そこへの通知が消える）とアクティビティで既読にしたときに、既読にした通知があればチャンネルごとに 1 件。
   * read_count はそのチャンネルで既読にした件数（画面はアクティビティの未読を取り直すか、この数だけ減らす）
   */
  "notifications_read",
  /**
   * 自分あての通知（アクティビティ）が増えた。**宛先の本人の接続にだけ**届く（`target_user_ids` は配る側だけが見て、
   * 本人へは channel_id だけを流す）。画面はこれを合図にアクティビティの未読を数え直す
   * （投稿・リアクションのたびに全員が数え直すと、読み取りの枠が人数 × 投稿数で減る・2026-11-12 本番の 429）
   */
  "notifications_created",
  /** チャンネルが作られた（見える人にだけ届く。非公開は作った人だけ） */
  "channel_created",
  /** 人の出入り（参加・退出・追加・除名・DM の作成）。target_user_id が出入りした人 */
  "membership_changed",
  /** 名前・トピック・公開範囲などの変更、アーカイブの解除 */
  "channel_updated",
  "channel_archived",
  /** チャンネルの削除（届いたら一覧から外す。以後そのチャンネルのイベントは来ない） */
  "channel_deleted",
] as const;
export type MessageEventType = (typeof messageEventTypeValues)[number];

/**
 * SSE で流すイベント。**ID と種類だけ**（本文・氏名・ファイル名は載せない ── 受けた画面が API を引き直す）。
 * キーは snake_case（SSE の data の JSON）。
 */
export type MessageEvent = {
  type: MessageEventType;
  channel_id: string;
  /** message_* / reaction_* の対象の投稿 */
  message_id?: string;
  /** スレッドの返信（message_*）・スレッドの既読（read_updated）のとき、親の投稿 */
  parent_id?: string;
  /** 操作した人の userId（ジョブの予約送信では予約した人） */
  actor_id?: string;
  /** membership_changed で出入りした人 */
  target_user_id?: string;
  /** notifications_read で、そのチャンネルの通知を既読にした件数 */
  read_count?: number;
  /** notifications_created の宛先（配る側だけが使う。本人の接続へ流すときは外す） */
  target_user_ids?: string[];
};

/**
 * 一覧の未読件数の上限。これ以上は数えない（数える行を `LIMIT` で打ち切る）。
 * `unreadCount === MESSAGE_UNREAD_COUNT_CAP` は「99 件を超えている」の意味で、画面は「99+」と出す。
 */
export const MESSAGE_UNREAD_COUNT_CAP = 100;

export const attachmentStatusValues = ["pending", "ready"] as const;
export type AttachmentStatus = (typeof attachmentStatusValues)[number];

/** 本文の最大文字数（DB CHECK: char_length(content) <= 4000） */
export const MESSAGE_CONTENT_MAX_LENGTH = 4000;
/** チャンネル名の最大文字数 */
export const CHANNEL_NAME_MAX_LENGTH = 80;
/** トピックの最大文字数（DB CHECK: char_length(topic) <= 250） */
export const CHANNEL_TOPIC_MAX_LENGTH = 250;
/** 1 投稿あたりの添付上限（現行 Slack クローン踏襲の初期値） */
export const MESSAGE_ATTACHMENT_MAX_COUNT = 10;

export const MESSAGE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
const MESSAGE_ATTACHMENT_CONTENT_TYPE_SET = new Set<string>(MESSAGE_ATTACHMENT_CONTENT_TYPES);

export function isAllowedAttachmentContentType(contentType: string): boolean {
  return MESSAGE_ATTACHMENT_CONTENT_TYPE_SET.has(contentType);
}

export function isWithinAttachmentSizeLimit(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MESSAGE_ATTACHMENT_MAX_BYTES;
}

/**
 * 画面の中で開いて見てよい添付 MIME（`Content-Disposition: inline` を出してよいもの）。
 * 画像・PDF・動画・音声だけ。テキスト・CSV・Office・zip は inline で配らない
 * （ブラウザに HTML 等として解釈させない / 中身は api 経由で文字として返す）。
 * SVG・HTML は添付の許可リストに無く、ここにも入れない。
 */
export const MESSAGE_ATTACHMENT_INLINE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
] as const;
const MESSAGE_ATTACHMENT_INLINE_CONTENT_TYPE_SET = new Set<string>(MESSAGE_ATTACHMENT_INLINE_CONTENT_TYPES);

export function isInlineViewableContentType(contentType: string): boolean {
  return MESSAGE_ATTACHMENT_INLINE_CONTENT_TYPE_SET.has(contentType);
}

/** 中身を文字として返してよい添付 MIME（api が S3 から先頭だけ読んで文字列で返す） */
export const MESSAGE_ATTACHMENT_TEXT_CONTENT_TYPES = ["text/plain", "text/csv"] as const;

export function isTextPreviewContentType(contentType: string): boolean {
  return (MESSAGE_ATTACHMENT_TEXT_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/** 文字として返す先頭のバイト数（これを超える分は切って `truncated` を立てる） */
export const MESSAGE_ATTACHMENT_TEXT_PREVIEW_MAX_BYTES = 256 * 1024;

export const MESSAGE_EMOJI_MAX_BYTES = 256 * 1024;
/** 一覧で画像の URL を署名する件数の上限（使われた回数の多い順。署名はサーバー内の計算だけで S3 を往復しない） */
export const MESSAGE_EMOJI_SIGNED_LIST_MAX = 500;
/** 一覧の画像の URL の期限（秒）。ピッカーを開いている間に切れない長さ（GET の署名の範囲 300〜3600 の上限） */
export const MESSAGE_EMOJI_IMAGE_URL_EXPIRES_SEC = 3600;
/** 絵文字の画像の種類 ↔ S3 キーの拡張子（キーはサーバーが作る。配信の Content-Type はキーの拡張子から強制する） */
export const MESSAGE_EMOJI_EXTENSIONS: Readonly<Record<(typeof MESSAGE_EMOJI_CONTENT_TYPES)[number], string>> = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const MESSAGE_EMOJI_CONTENT_TYPES = ["image/png", "image/gif", "image/jpeg", "image/webp"] as const;
const MESSAGE_EMOJI_CONTENT_TYPE_SET = new Set<string>(MESSAGE_EMOJI_CONTENT_TYPES);

export function isAllowedEmojiContentType(contentType: string): boolean {
  return MESSAGE_EMOJI_CONTENT_TYPE_SET.has(contentType);
}

/**
 * DB に保存・照合する文字列は NUL（U+0000）を受けない。Postgres の text は NUL を保持できず、
 * 通すと INSERT / 検索が DB エラー（500）になる。入力の誤りとして 400 で返す。
 */
function pgText<T extends z.ZodString>(schema: T) {
  return schema.refine((v) => !v.includes("\u0000"), { message: "使用できない文字が含まれています" });
}

/** カスタム絵文字名: 1〜60 文字、空白と `:` を含まない */
export const emojiNameSchema = pgText(
  z
    .string()
    .min(1)
    .max(60)
    .regex(/^[^\s:]+$/, "空白と「:」は使用できません"),
);

const uuidField = z.string().uuid();
const isoDatetimeField = z.string().datetime({ offset: true }).or(z.string().datetime());

/** POST /message/channels（DM / グループ DM は createDmSchema を使う） */
export const createChannelSchema = z
  .object({
    type: z.enum(["public", "private"]).default("public"),
    name: pgText(z.string().trim().min(1).max(CHANNEL_NAME_MAX_LENGTH)),
    description: pgText(z.string().max(2000)).nullable().optional(),
    topic: pgText(z.string().max(CHANNEL_TOPIC_MAX_LENGTH)).nullable().optional(),
    isSecret: z.boolean().optional().default(false),
    broadcastRestricted: z.boolean().optional().default(false),
  })
  .refine((v) => v.type === "private" || !v.isSecret, {
    message: "シークレットは非公開チャンネルのみ設定できます",
    path: ["isSecret"],
  });
export type CreateChannelInput = z.infer<typeof createChannelSchema>;

/** POST /message/channels/dm（DM / グループ DM の get-or-create） */
export const createDmSchema = z.object({
  userIds: z.array(uuidField).min(1).max(20),
});
export type CreateDmInput = z.infer<typeof createDmSchema>;

/**
 * POST /message/channels/:id/members。`userId` 省略 = 自分が参加。
 * null・数値・UUID でない値は 400（自分の参加に倒さない。AI が変な値を出したときに黙って参加させない）。
 */
export const addMemberSchema = z.object({
  userId: uuidField.optional(),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

/**
 * PATCH /message/channels/:id
 *
 * `type` は公開 → 非公開の一方向だけ（非公開を公開に戻すと、招待した人以外にも過去ログが見える）。
 * 非公開にした時点で、投稿したことがある人・既読を付けた人・作成者・操作した人がメンバーになる。
 */
export const updateChannelSchema = z
  .object({
    name: pgText(z.string().trim().min(1).max(CHANNEL_NAME_MAX_LENGTH)).optional(),
    description: pgText(z.string().max(2000)).nullable().optional(),
    topic: pgText(z.string().max(CHANNEL_TOPIC_MAX_LENGTH)).nullable().optional(),
    broadcastRestricted: z.boolean().optional(),
    type: z.literal("private").optional(),
    isSecret: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "変更する項目がありません" });
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;

/** POST /message/channels/facility（事業所チャンネルの明示プロビジョニング。console 柱アクセス限定） */
export const createFacilityChannelSchema = z.object({
  facilityId: uuidField,
});
export type CreateFacilityChannelInput = z.infer<typeof createFacilityChannelSchema>;

/**
 * クエリ文字列の boolean（`?favoriteOnly=true`）。`z.coerce.boolean()` は `Boolean("false") === true`
 * なので **"false" が true に反転する**（セルフレビュー 2026-09-14 で検出）。job-role.ts と同じ transform で受ける。
 */
const queryBoolean = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === true || v === "true" || v === "1"));

/** GET /message/channels のクエリ */
export const listChannelsQuerySchema = z.object({
  favoriteOnly: queryBoolean,
  includeArchived: queryBoolean,
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type ListChannelsQueryInput = z.infer<typeof listChannelsQuerySchema>;

export const idParamSchema = z.object({ id: uuidField });

/** POST /message/channels/:id/messages */
export const createMessageSchema = z
  .object({
    content: pgText(z.string().max(MESSAGE_CONTENT_MAX_LENGTH)).default(""),
    parentId: uuidField.nullable().optional(),
    broadcastToChannel: z.boolean().optional().default(false),
    attachmentIds: z.array(uuidField).max(MESSAGE_ATTACHMENT_MAX_COUNT).optional().default([]),
  })
  .refine((v) => v.content.trim().length > 0 || v.attachmentIds.length > 0, {
    message: "本文または添付が必要です",
    path: ["content"],
  })
  .refine((v) => !v.broadcastToChannel || v.parentId != null, {
    message: "全体通知はスレッド返信のみ設定できます",
    path: ["broadcastToChannel"],
  });
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

/** PATCH /message/messages/:id */
export const updateMessageSchema = z.object({
  content: pgText(z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH)),
});
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

/** GET /message/channels/:id/messages のクエリ（チャンネル本流 or スレッド） */
export const listMessagesQuerySchema = z.object({
  parentId: uuidField.optional(),
  before: isoDatetimeField.optional(),
  after: isoDatetimeField.optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type ListMessagesQueryInput = z.infer<typeof listMessagesQuerySchema>;

/**
 * POST /message/channels/:id/typing — 「入力中」の合図（§5.5。DB に書かず SSE に流すだけ）。
 * `parentId` はスレッドで打っているとき（チャンネル本体の「入力中」とは別の部屋）。`stopped` は送信・離脱で取り下げる
 */
export const messageTypingSchema = z.object({
  parentId: uuidField.nullish(),
  stopped: z.boolean().optional(),
});
export type MessageTypingInput = z.infer<typeof messageTypingSchema>;
export const activeDaysQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export type ActiveDaysQueryInput = z.infer<typeof activeDaysQuerySchema>;
/** その月に投稿（本流 + 「チャンネルにも投稿」した返信・削除済みを除く）のある日。days は JST の YYYY-MM-DD の昇順 */
export type MessageActiveDaysView = { month: string; days: string[] };

export const reactionSchema = z.object({
  emoji: pgText(z.string().min(1).max(64)),
});
export type ReactionInput = z.infer<typeof reactionSchema>;

export const searchQuerySchema = z.object({
  q: pgText(z.string().min(1).max(200)),
  channelId: uuidField.optional(),
  userId: uuidField.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasAttachment: queryBoolean,
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/** POST /message/channels/:id/attachments（2 フェーズ第 1 フェーズ） */
export const attachmentUploadUrlSchema = z
  .object({
    fileName: pgText(z.string().min(1).max(255)),
    contentType: z.string().min(1).max(255),
    sizeBytes: z.number().int().positive(),
  })
  .refine((v) => isAllowedAttachmentContentType(v.contentType), {
    message: "許可されていないファイル形式です",
    path: ["contentType"],
  })
  .refine((v) => isWithinAttachmentSizeLimit(v.sizeBytes), {
    message: "ファイルサイズが上限を超えています",
    path: ["sizeBytes"],
  });
export type AttachmentUploadUrlInput = z.infer<typeof attachmentUploadUrlSchema>;

/**
 * GET /message/attachments/:id/url のクエリ。
 * `inline` = 画面の中で開く用（許可した MIME だけ。それ以外は 400）、`attachment` = ダウンロード用。
 * 省略時は従来どおり（画像は inline、それ以外は attachment）。
 */
export const attachmentDownloadQuerySchema = z.object({
  disposition: z.enum(["inline", "attachment"]).optional(),
});
export type AttachmentDownloadQueryInput = z.infer<typeof attachmentDownloadQuerySchema>;

export const createScheduledMessageSchema = z.object({
  content: pgText(z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH)),
  parentId: uuidField.nullable().optional(),
  scheduledFor: isoDatetimeField,
});
export type CreateScheduledMessageInput = z.infer<typeof createScheduledMessageSchema>;

export const createReminderSchema = z
  .object({
    messageId: uuidField.nullable().optional(),
    note: pgText(z.string().max(2000)).nullable().optional(),
    remindAt: isoDatetimeField,
  })
  .refine((v) => v.messageId != null || (v.note != null && v.note.trim().length > 0), {
    message: "対象の投稿またはメモが必要です",
    path: ["note"],
  });
export type CreateReminderInput = z.infer<typeof createReminderSchema>;

export const createCustomEmojiSchema = z
  .object({
    name: emojiNameSchema,
    contentType: z.string().min(1).max(255),
    sizeBytes: z.number().int().positive(),
  })
  .refine((v) => isAllowedEmojiContentType(v.contentType), {
    message: "許可されていない画像形式です（png/gif/jpeg/webp のみ）",
    path: ["contentType"],
  })
  .refine((v) => v.sizeBytes > 0 && v.sizeBytes <= MESSAGE_EMOJI_MAX_BYTES, {
    message: "画像サイズが上限を超えています",
    path: ["sizeBytes"],
  });
export type CreateCustomEmojiInput = z.infer<typeof createCustomEmojiSchema>;

/**
 * 「後で」「リマインダー」の一覧タブ。既定は `open`（未完了のみ）で、
 * 従来の「未完了だけ返す」挙動と後方互換になる。
 */
export const listStatusValues = ["open", "done", "all"] as const;
export type ListStatus = (typeof listStatusValues)[number];

export const listStatusQuerySchema = z.object({
  status: z.enum(listStatusValues).optional(),
});
export type ListStatusQueryInput = z.infer<typeof listStatusQuerySchema>;

/** GET /message/threads — 自分が参加している（立てた or 返信した）スレッドの続き。 */
export const threadsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type ThreadsQueryInput = z.infer<typeof threadsQuerySchema>;

export const attachmentKindValues = ["all", "image", "other"] as const;
export type AttachmentKind = (typeof attachmentKindValues)[number];

/** GET /message/attachments — 可視チャンネルで共有された添付の一覧。 */
export const attachmentsQuerySchema = z.object({
  channelId: uuidField.optional(),
  kind: z.enum(attachmentKindValues).optional(),
  q: pgText(z.string().max(200)).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type AttachmentsQueryInput = z.infer<typeof attachmentsQuerySchema>;

/** ステータスの短い文の上限（プロフィールとディレクトリの 1 行に収まる長さ） */
export const MESSAGE_STATUS_TEXT_MAX = 40;
/** ステータスの絵文字の上限（肌の色・合成の絵文字を含めて 1 つ分） */
export const MESSAGE_STATUS_EMOJI_MAX = 16;
/** 通知を止める時間帯の時刻（JST の "HH:MM"） */
const quietTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
/**
 * アクティビティに何を出すかの個人設定。端末ではなく**アカウント**に紐づく
 * （共有端末で入れ替わらない）。
 */
export const updateMessageUserPrefsSchema = z
  .object({
    showMention: z.boolean().optional(),
    showReply: z.boolean().optional(),
    showReaction: z.boolean().optional(),
    showBroadcast: z.boolean().optional(),
    /** ステータスの絵文字（空文字 = 外す） */
    statusEmoji: z.string().trim().max(MESSAGE_STATUS_EMOJI_MAX).optional(),
    /** ステータスの短い文（空文字 = 外す） */
    statusText: z.string().trim().max(MESSAGE_STATUS_TEXT_MAX).optional(),
    /** スマートフォンへの push を受け取るか（アクティビティの行は止めない） */
    pushEnabled: z.boolean().optional(),
    /** push を止める時間帯（JST の "HH:MM"。日をまたいでよい）。始まりと終わりは一緒に送る。null は「無し」 */
    quietStart: quietTimeSchema.nullable().optional(),
    quietEnd: quietTimeSchema.nullable().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "変更する項目がありません",
  })
  .refine(
    (v) =>
      (v.quietStart === undefined && v.quietEnd === undefined) ||
      (v.quietStart === null && v.quietEnd === null) ||
      (typeof v.quietStart === "string" && typeof v.quietEnd === "string" && v.quietStart !== v.quietEnd),
    { message: "時間帯は始まりと終わりを一緒に、違う時刻で指定してください" },
  );
export type UpdateMessageUserPrefsInput = z.infer<typeof updateMessageUserPrefsSchema>;

/**
 * all = すべて（既定）/ direct = 自分あて（@自分・返信・DM）だけ。@channel・グループ・事業所の展開では届かない /
 * none = ミュート（通知の行も push も作らない。未読の件数は残る）
 */
export const messageNotifyLevelValues = ["all", "direct", "none"] as const;
export type MessageNotifyLevel = (typeof messageNotifyLevelValues)[number];
export const setChannelNotifyLevelSchema = z.object({ level: z.enum(messageNotifyLevelValues) });
export type SetChannelNotifyLevelInput = z.infer<typeof setChannelNotifyLevelSchema>;

/** 本人にだけ見える呼び名の上限（サイドバーの 1 行に収まる長さ） */
export const MESSAGE_DM_NICKNAME_MAX = 40;
/** null か空文字 = 外す（参加者の名前を並べる表示に戻す） */
export const setChannelNicknameSchema = z.object({
  nickname: pgText(z.string().trim().max(MESSAGE_DM_NICKNAME_MAX)).nullable(),
});
export type SetChannelNicknameInput = z.infer<typeof setChannelNicknameSchema>;

/** 自分がミュートしている人（その人が起こした通知はアクティビティにも push にも出さない。投稿は見える） */
export type MessageMutedUserView = { userId: string; name: string | null; mutedAt: string };

/** following = 新しい返信の通知が届くか / explicit = 本人が押した設定か（false なら親の投稿者・返信した人としての自動） */
export type MessageThreadFollowView = { parentId: string; following: boolean; explicit: boolean };
export const setThreadFollowSchema = z.object({ following: z.boolean() });
export type SetThreadFollowInput = z.infer<typeof setThreadFollowSchema>;

export const MESSAGE_BULK_CHANNEL_MAX = 100;
export const bulkChannelChangeValues = ["archive", "unarchive", "restrict-broadcast", "allow-broadcast"] as const;
export type BulkChannelChange = (typeof bulkChannelChangeValues)[number];
export const bulkChannelUpdateSchema = z.object({
  channelIds: z.array(uuidField).min(1).max(MESSAGE_BULK_CHANNEL_MAX),
  change: z.enum(bulkChannelChangeValues),
});
export type BulkChannelUpdateInput = z.infer<typeof bulkChannelUpdateSchema>;
/** done = 変えた（もう同じ状態だったものも含む）/ skipped = 見えない・DM・名前がぶつかる等で変えられなかったもの */
/** 同じ組織の人の顔写真の版（写真のある人だけ。版は写真の鍵の最後の部分・`?v=` に使う） */
export type MessagePersonPhotoView = { userId: string; version: string };
/** 顔写真の署名 URL（短い期限。画面へは Piazza のサーバーが画像だけを中継する） */
export type MessagePhotoTicket = { url: string };
export type MessageBulkChannelResultView = { done: string[]; skipped: { channelId: string; reason: string }[] };

/** チャンネル。事業所チャンネルの `name` は事業所名（表示時に引く。コピーしない） */
export type MessageChannelView = {
  id: string;
  /**
   * 組織の既定のチャンネルの印（0635）。`announce` = 全体連絡（全員参加・抜けられない・アーカイブも削除もできない）、
   * `chitchat` = 雑談（全員参加・抜けられる）。印のあるチャンネルの参加者は行を持たず、在籍中のアカウント全員から導く。
   * 古いクライアントは知らないので省略可（無ければ普通のチャンネル）
   */
  systemKey?: ChannelSystemKey | null;
  organizationId: string;
  type: ChannelType;
  kind: ChannelKind;
  facilityId: string | null;
  dmKey: string | null;
  name: string | null;
  description: string | null;
  topic: string | null;
  broadcastRestricted: boolean;
  isSecret: boolean;
  createdBy: string | null;
  archivedAt: string | null;
  /** アーカイブした人（0497 より前のアーカイブ・退職で消えた人は null） */
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** チャンネル一覧の 1 行（自分から見た参加・お気に入り・未読） */
export type MessageChannelListItem = MessageChannelView & {
  isMember: boolean;
  isFavorite: boolean;
  unreadCount: number;
  /** チャンネル本流の最後の投稿の時刻（投稿が無ければ null） */
  lastMessageAt: string | null;
  /** DM / グループ DM の参加者（参加した順）。DM 以外は null */
  dmMembers: { userId: string; name: string }[] | null;
  /** 自分の通知の段（設定が無ければ "all"） */
  notifyLevel: MessageNotifyLevel;
  /** グループ DM に自分が付けた呼び名（本人にだけ見える）。付けていない・グループ DM 以外は null */
  nickname: string | null;
  /** アーカイブした人の名前（アーカイブ済みのときだけ・分からなければ null） */
  archivedByName: string | null;
};

export type MessageChannelMemberView = { userId: string; name: string; joinedAt: string };

export const messageAuthorKindValues = ["user", "qaito", "system"] as const;
export type MessageAuthorKind = (typeof messageAuthorKindValues)[number];

/** DB の値を発言者の種類に絞る（知らない値は人の投稿） */
export function toMessageAuthorKind(v: unknown): MessageAuthorKind {
  return v === "qaito" || v === "system" ? v : "user";
}

/** 自動の通知の出どころ（`staff.messages.source`。CHECK と同じ集合） */
export const MESSAGE_SYSTEM_SOURCES = ["phone"] as const;
export type MessageSystemSource = (typeof MESSAGE_SYSTEM_SOURCES)[number];

export const postSystemNoticeSchema = z.object({
  channelId: z.string().uuid(),
  content: pgText(z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH)),
  source: z.enum(MESSAGE_SYSTEM_SOURCES),
  /** 出どころの行（電話受付なら受電 ID） */
  sourceId: z.string().uuid(),
});
export type PostSystemNoticeInput = z.infer<typeof postSystemNoticeSchema>;

/** 本文中の予約語（`@qaito`。大文字小文字を区別しない） */
export const QAITO_WORD = "qaito";
/** 質問文の上限（`@qaito` を除いた本文を切る） */
export const QAITO_QUESTION_MAX_LENGTH = 2000;
/** 文脈（直前の投稿の引用）の上限 */
export const QAITO_CONTEXT_MAX_LENGTH = 8000;
/** 答えの本文の上限 */
export const QAITO_ANSWER_MAX_LENGTH = 1200;
/** 根拠の投稿の上限 */
export const QAITO_SOURCES_MAX = 5;

/**
 * 根拠の投稿（AI の内部の受け渡し・DB の `staff.messages.qaito_sources` の jsonb の形。snake_case）。
 * ID だけ（チャンネル名・本文は載せない ── 読む人が見られるとは限らない）
 */
export type QaitoSourceRef = { message_id: string; channel_id: string; parent_id: string | null };

/** 根拠の投稿（API の応答の形。camelCase） */
export type MessageQaitoSource = { messageId: string; channelId: string; parentId: string | null };

/** 親のループ（基盤 agent の `askQaito`）への入力 */
export type QaitoAskInput = {
  /** `@qaito` を除いた質問（QAITO_QUESTION_MAX_LENGTH まで。空なら message 側が既定の問いを入れる） */
  question: string;
  /** message の core が組み立てた文脈の引用（QAITO_CONTEXT_MAX_LENGTH まで） */
  context: string;
  /** 文脈に入れた投稿（根拠の控えに入る） */
  contextRefs: QaitoSourceRef[];
};

/** 親のループの結果。例外にしない（上限に当たれば partial） */
export type QaitoAskOutcome =
  | {
      ok: true;
      /** QAITO_ANSWER_MAX_LENGTH に切って返す */
      answer: string;
      partial: boolean;
      /** 控え（道具の結果・文脈に実際に出てきた投稿）に絞ったもの。QAITO_SOURCES_MAX まで */
      sources: QaitoSourceRef[];
      /** 呼んだモジュールエージェントの slug（監査用） */
      agents: string[];
      totalMs: number;
    }
  | {
      ok: false;
      code: "forbidden" | "budget" | "monthly_budget" | "guardrail_blocked" | "upstream" | "no_answer" | "internal";
    };

/**
 * 失敗の投稿のコード（文言は `@qaito/vocabulary` の `messageQaito.failure`）。
 * `budget` は Gateway の組織ごとの日次予算、`monthly_budget` は `@qaito` の組織ごとの月の上限、
 * `guardrail_blocked` は答えに Guardrails が BLOCK する情報が含まれていた（ANONYMIZE の置き換えはそのまま答えに出す）。
 * `upstream` は AI の呼び出し（Gateway・Bedrock）が失敗した・応答が途中で切れた（5xx・stream の切断・`message_stop` の無い終わり・
 * SSE の error。親は 1 回だけその場でやり直してから書く）、`no_answer` は呼び出しは返ったが `qaito_finish` に答えが無かった、
 * `internal` はそれ以外（例外・Gateway の宛先が無い）。どれも本文・trace は残さない（コードだけ）
 */
export const qaitoFailureCodeValues = [
  "rate_limited",
  "budget",
  "monthly_budget",
  "forbidden",
  "guardrail_blocked",
  "interrupted",
  "upstream",
  "no_answer",
  "internal",
] as const;
export type QaitoFailureCode = (typeof qaitoFailureCodeValues)[number];

/** 質問の行（`staff.message_qaito_asks`）の状態 */
export const qaitoAskStatusValues = ["pending", "running", "answered", "failed", "abandoned"] as const;
export type QaitoAskStatus = (typeof qaitoAskStatusValues)[number];

/** 職員（名前と ID だけ）。招待・DM の宛先候補、検索の投稿者候補 */
export type MessageUserRef = { userId: string; name: string };

/** 投稿者（退職・削除で投稿の userId が null のとき・Qaito の投稿は null） */
export type MessageAuthor = { id: string; name: string };

/**
 * 発言者の見た目に要る項目（投稿者を持つすべての view に付く）。見た目の判定は
 * `@qaito/modules/message/pure` の `describeAuthor` 1 本（`author === null` を画面ごとに判定しない）
 */
export type MessageAuthorFields = {
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  /** Qaito の投稿で、答えを頼んだ人（誰の権限で調べたか）。退職・Qaito 以外は null */
  askedBy: MessageAuthor | null;
};

/** 投稿そのもの（作成・編集・削除の応答） */
export type MessageRowView = {
  id: string;
  organizationId: string;
  channelId: string;
  userId: string | null;
  parentId: string | null;
  content: string;
  replyCount: number;
  broadcastToChannel: boolean;
  hasAttachment: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  authorKind: MessageAuthorKind;
  /** Qaito の投稿が答えた質問の投稿（Qaito 以外は null） */
  questionId: string | null;
  /** Qaito の投稿の根拠（Qaito 以外は null） */
  qaitoSources: MessageQaitoSource[] | null;
};

/** `users` はリアクションした人（付けた順・全員）。ユーザー行が引けない人は `name: null` */
export type MessageReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  users: { id: string; name: string | null }[];
};

export type MessageAttachmentSummary = { id: string; fileName: string; mimeType: string; sizeBytes: number };

/** スレッドの親に付く返信の概要。participants は返信した人を新しい順に最大 3 人 */
export type MessageThreadSummary = { lastReplyAt: string | null; participants: { id: string; name: string | null }[] };

/** 「チャンネルにも投稿」した返信に付く親投稿の冒頭。親が削除済みなら excerpt は null */
export type MessageParentPreview = MessageAuthorFields & {
  id: string;
  excerpt: string | null;
  deleted: boolean;
  lastReplyAt: string | null;
};

/** 投稿（一覧・単票・検索）。投稿者・リアクション・添付などを同梱する */
export type MessageView = MessageRowView & {
  author: MessageAuthor | null;
  askedBy: MessageAuthor | null;
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentSummary[];
  thread: MessageThreadSummary | null;
  parentPreview: MessageParentPreview | null;
};

/** ピン留めの一覧の 1 行（投稿の本文・リアクション・添付を同梱） */
export type MessagePinView = MessageAuthorFields & {
  id: string;
  organizationId: string;
  channelId: string;
  messageId: string;
  pinnedBy: string | null;
  pinnedAt: string;
  content: string;
  messageUserId: string | null;
  messageCreatedAt: string;
  messageEditedAt: string | null;
  messageParentId: string | null;
  messageBroadcastToChannel: boolean;
  pinnedByName: string | null;
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentSummary[];
};

/** アクティビティ（メンション・返信・リアクション・DM）の 1 行 */
export type MessageNotificationView = MessageAuthorFields & {
  id: string;
  organizationId: string;
  userId: string;
  kind: NotificationKind;
  channelId: string;
  messageId: string;
  actorId: string | null;
  emoji: string | null;
  readAt: string | null;
  createdAt: string;
  content: string;
};

/** 自分が関わるスレッドの 1 行 */
export type MessageThreadListItem = MessageAuthorFields & {
  id: string;
  channelId: string;
  userId: string | null;
  content: string;
  replyCount: number;
  createdAt: string;
  lastReplyAt: string | null;
  actualReplyCount: number;
  lastReadAt: string | null;
  hasUnread: boolean;
};

/** 予約送信 */
export type MessageScheduledView = {
  id: string;
  organizationId: string;
  channelId: string;
  userId: string;
  parentId: string | null;
  content: string;
  scheduledFor: string;
  claimedAt: string | null;
  sentAt: string | null;
  failedReason: string | null;
  createdAt: string;
};

/** リマインダー（作成・完了の応答） */
export type MessageReminderView = {
  id: string;
  organizationId: string;
  userId: string;
  messageId: string | null;
  channelId: string | null;
  note: string | null;
  remindAt: string;
  doneAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

/** リマインダーの一覧の 1 行（見えなくなった投稿の本文・投稿者は null） */
export type MessageReminderListItem = MessageReminderView & MessageAuthorFields & {
  messageContent: string | null;
  messageDeletedAt: string | null;
};

/** 添付の行（アップロードの完了の応答） */
export type MessageAttachmentView = {
  id: string;
  organizationId: string;
  messageId: string | null;
  channelId: string;
  uploadedBy: string | null;
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: AttachmentStatus;
  createdAt: string;
};

/** ファイル一覧の 1 行 */
export type MessageAttachmentListItem = MessageAuthorFields & {
  id: string;
  channelId: string;
  messageId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  messageCreatedAt: string | null;
};

export type MessageUploadTicket = { attachment_id: string; upload_url: string; expires_in: number };

export type MessageDownloadTicket = {
  url: string;
  expires_at: string;
  file_name: string;
  content_type: string;
  size: number;
  /** この URL の Content-Disposition（画面で開く = inline / ダウンロード = attachment） */
  disposition: "inline" | "attachment";
};

export type MessageTextPreview = {
  text: string;
  /** 先頭だけを返した（元のファイルはもっと大きい） */
  truncated: boolean;
  encoding: "utf-8" | "shift_jis";
  file_name: string;
  content_type: string;
  size: number;
};

export type MessageCustomEmojiView = {
  id: string;
  organizationId: string;
  name: string;
  s3Key: string;
  createdBy: string | null;
  usageCount: number;
  createdAt: string;
};

export type MessageCustomEmojiListItem = MessageCustomEmojiView & { imageUrl: string | null };

export type MessageEmojiTicket = { emoji: MessageCustomEmojiView; upload_url: string; expires_in: number };

/**
 * 未読のまとめ（GET /message/unread-summary）。モバイルのアプリのバッジと、Web の見出しの件数に使う。
 * どれも `MESSAGE_UNREAD_COUNT_CAP` で数え止める（その値は「99 件を超えている」の意味）。
 */
export type MessageUnreadSummary = {
  /** 未読のアクティビティ（自分あてのメンション・返信・リアクション・DM の通知）。バッジはこの数 */
  activity: number;
  /** 未読の投稿がある、参加中の DM・グループ DM の数 */
  directChannels: number;
  /** 未読の投稿がある、参加中のチャンネルの数（DM を除く・アーカイブ済みを除く） */
  channels: number;
};

export type MessageUserPrefsView = {
  showMention: boolean;
  showReply: boolean;
  showReaction: boolean;
  showBroadcast: boolean;
  statusEmoji: string | null;
  statusText: string | null;
  pushEnabled: boolean;
  /** push を止める時間帯（JST の "HH:MM"）。無ければ両方 null */
  quietStart: string | null;
  quietEnd: string | null;
};

export type MessagePermissionContext = {
  userId: string;
  /** 組織の管理者（管理コンソールに入れる人）。常に Piazza の管理者（`role` は admin） */
  isAdmin: boolean;
  /** Piazza の役（§8.3.1）。画面は `@qaito/modules/message/permissions` の規則に渡して出し分ける */
  role: MessageRole;
};

/**
 * Piazza の中だけで効く役。**scope・DB の門番・トークン・権限セットには載せない**（細かい権限の材料）。
 * 組織の管理者（console 柱・ルート）は常に admin。割り当てが無ければ member
 */
export const messageRoleValues = ["admin", "moderator", "member"] as const;
export type MessageRole = (typeof messageRoleValues)[number];

/** 割り当てられる役（member は「割り当てが無い」ことで表す） */
export const assignableMessageRoleValues = ["admin", "moderator"] as const;
export type AssignableMessageRole = (typeof assignableMessageRoleValues)[number];

/** 役の強さ（人とグループの両方から付いたら強い方） */
export const MESSAGE_ROLE_RANK: Readonly<Record<MessageRole, number>> = { member: 0, moderator: 1, admin: 2 };

/**
 * POST /message/roles — 人かグループのどちらか一方に役を付ける（同じ相手に別の役があれば付け替え）
 */
export const assignMessageRoleSchema = z.union([
  z.object({ role: z.enum(assignableMessageRoleValues), userId: uuidField }).strict(),
  z.object({ role: z.enum(assignableMessageRoleValues), groupId: uuidField }).strict(),
]);
export type AssignMessageRoleInput = z.infer<typeof assignMessageRoleSchema>;

/** 役の割り当て 1 行（相手は人かグループ） */
export type MessageRoleAssignmentView = {
  id: string;
  role: AssignableMessageRole;
  subjectKind: "user" | "group";
  /** 人なら userId、グループなら groupId */
  subjectId: string;
  /** 相手の名前（引けなければ null） */
  name: string | null;
  /** 人が退職（アーカイブ）している。グループは常に false */
  archived: boolean;
  /** グループの人数（人なら null） */
  memberCount: number | null;
  /** グループの在籍のメンバー（人なら null）。保存後に管理できる人を、重なりを除いて数えるのに使う */
  memberIds: string[] | null;
  createdAt: string;
};

/** 常に管理者の人（組織の管理者。外せない） */
export type MessageRoleOrgAdmin = { userId: string; name: string };

/** 追加の候補（組織の在籍の職員とグループ） */
export type MessageRoleCandidates = {
  users: { userId: string; name: string }[];
  /** memberIds は在籍のメンバー（保存後に管理できる人を重なりを除いて数えるのに使う） */
  groups: { groupId: string; name: string; memberCount: number; memberIds: string[] }[];
};

/** GET /message/roles の応答（役の画面がこれ 1 本で描ける） */
export type MessageRolesView = {
  assignments: MessageRoleAssignmentView[];
  orgAdmins: MessageRoleOrgAdmin[];
  candidates: MessageRoleCandidates;
  /** 呼んだ本人（自分の役が変わる警告の計算に使う） */
  me: { userId: string; isOrgAdmin: boolean; groupIds: string[] };
};
