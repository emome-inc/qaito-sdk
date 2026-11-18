import { z } from "zod";

/** 種類。`opinion` = ご意見 / `issue` = 障害報告（DB の CHECK と同じ集合）。 */
export const FEEDBACK_KINDS = ["opinion", "issue"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  opinion: "ご意見",
  issue: "障害報告",
};

/** 状態。`open` = 未対応 / `in_progress` = 対応中 / `done` = 対応済み（DB の CHECK と同じ集合）。 */
export const FEEDBACK_STATUSES = ["open", "in_progress", "done"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  done: "対応済み",
};

/** 件名の最大文字数。 */
export const FEEDBACK_TITLE_MAX = 200;
/** 本文の最大文字数。 */
export const FEEDBACK_BODY_MAX = 5000;
/** 返事の最大文字数。 */
export const FEEDBACK_RESPONSE_MAX = 5000;
/** 送った画面の URL の最大文字数。 */
export const FEEDBACK_PAGE_URL_MAX = 2000;

/**
 * 送った画面の URL として受けてよいか（`http:` / `https:` だけ）。
 *
 * `javascript:` / `data:` 等を受けると、受け取った側の画面でリンクにしたときに踏ませられる。
 */
export function isHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

const nonBlank = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label}は ${max} 文字以内で入力してください`)
    .refine((s) => s.trim().length > 0, `${label}は必須です`);

/**
 * ご意見・障害報告を送る。
 *
 * - `anonymous: true` なら送った人を**残さない**（core が `submitted_by` を null にする）
 * - `pageUrl` は障害報告のときだけ意味を持つ（ご意見で送られても core が捨てる）
 */
export const submitFeedbackSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  title: z
    .string()
    .trim()
    .min(1, "件名は必須です")
    .max(FEEDBACK_TITLE_MAX, `件名は ${FEEDBACK_TITLE_MAX} 文字以内で入力してください`),
  body: nonBlank(FEEDBACK_BODY_MAX, "本文"),
  /** 匿名で送る（既定: 名前つき） */
  anonymous: z.boolean().default(false),
  /** 障害報告のとき、どの画面で起きたか（任意・http / https のみ） */
  pageUrl: z
    .string()
    .trim()
    .max(FEEDBACK_PAGE_URL_MAX, `URL は ${FEEDBACK_PAGE_URL_MAX} 文字以内で入力してください`)
    .refine(isHttpUrl, "URL は http:// か https:// で始まるものを入力してください")
    .nullable()
    .optional(),
});
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

/** 受け取った側の一覧（種類・状態で絞る）。 */
export const listFeedbackQuerySchema = z.object({
  kind: z.enum(FEEDBACK_KINDS).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;

/** 自分の分（名前つきで送ったもの）の一覧。 */
export const listMyFeedbackQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListMyFeedbackQuery = z.infer<typeof listMyFeedbackQuerySchema>;

/** 状態を変える。 */
export const setFeedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
});
export type SetFeedbackStatusInput = z.infer<typeof setFeedbackStatusSchema>;

/** 返事を書く（書き直しは上書き。空にはしない）。 */
export const respondFeedbackSchema = z.object({
  response: nonBlank(FEEDBACK_RESPONSE_MAX, "返事"),
});
export type RespondFeedbackInput = z.infer<typeof respondFeedbackSchema>;

/** 今日の気分の段階。1 = つらい … 5 = とても良い（DB の CHECK と同じ範囲）。 */
export const DAILY_MOOD_MIN = 1;
export const DAILY_MOOD_MAX = 5;

/** 今日の気分を付ける（1 日 1 回・付けたあとは変えられない）。日はサーバが JST の今日で決める（入力で受けない）。 */
export const setMyMoodTodaySchema = z.object({
  mood: z.number().int().min(DAILY_MOOD_MIN).max(DAILY_MOOD_MAX),
});
export type SetMyMoodTodayInput = z.infer<typeof setMyMoodTodaySchema>;

/** 受け取った側の 1 件。匿名なら `submittedBy` / `submittedByName` は null。 */
export type FeedbackItem = {
  id: string;
  kind: FeedbackKind;
  title: string;
  body: string;
  anonymous: boolean;
  submittedBy: string | null;
  submittedByName: string | null;
  pageUrl: string | null;
  status: FeedbackStatus;
  response: string | null;
  respondedBy: string | null;
  respondedByName: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 自分の分の 1 件（ポータル）。受け取った側の担当者の名前は出さない。 */
export type MyFeedback = {
  id: string;
  kind: FeedbackKind;
  title: string;
  body: string;
  pageUrl: string | null;
  status: FeedbackStatus;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
};

/** 送った直後の応答。匿名なら本人でも後から見られないので、ID と種類だけを返す。 */
export type SubmittedFeedback = {
  id: string;
  kind: FeedbackKind;
  anonymous: boolean;
  createdAt: string;
};

/** 今日の気分（本人の分）。付けていなければ `mood` は null。`day` は JST の今日（YYYY-MM-DD）。 */
export type MyMoodToday = {
  day: string;
  mood: number | null;
};
