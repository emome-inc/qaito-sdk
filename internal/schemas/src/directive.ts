import { z } from "zod";

/** 宛先の選び方。`all` は事業所で制限されない送り手（コンソール柱・root）だけが選べる。 */
export const DIRECTIVE_AUDIENCE_KINDS = ["all", "facility", "group", "users"] as const;
export type DirectiveAudienceKind = (typeof DIRECTIVE_AUDIENCE_KINDS)[number];

export const DIRECTIVE_AUDIENCE_LABELS: Record<DirectiveAudienceKind, string> = {
  all: "全員",
  facility: "事業所",
  group: "グループ",
  users: "個人",
};

/** 1 回に選べる宛先（事業所・グループ・個人）の上限。 */
export const DIRECTIVE_AUDIENCE_MAX = 200;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD で指定してください");

/** 業務連絡を送る。 */
export const sendDirectiveSchema = z
  .object({
    title: z.string().trim().min(1, "件名は必須です").max(200),
    body: z.string().trim().min(1, "本文は必須です").max(10000),
    /** 「確認しました」を求めるか（既定: 求める） */
    requiresAck: z.boolean().default(true),
    /** 対応の期限（任意） */
    dueOn: ymd.nullable().optional(),
    audienceKind: z.enum(DIRECTIVE_AUDIENCE_KINDS),
    /** 選んだ事業所・グループ・個人の ID（`all` のときは空） */
    audienceIds: z.array(z.string().uuid()).max(DIRECTIVE_AUDIENCE_MAX).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.audienceKind === "all" && v.audienceIds.length > 0) {
      ctx.addIssue({ code: "custom", path: ["audienceIds"], message: "全員宛のときは宛先を選びません" });
    }
    if (v.audienceKind !== "all" && v.audienceIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["audienceIds"], message: "宛先を 1 つ以上選んでください" });
    }
  });
export type SendDirectiveInput = z.infer<typeof sendDirectiveSchema>;

/** 送った一覧。 */
export const listSentDirectivesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListSentDirectivesQuery = z.infer<typeof listSentDirectivesQuerySchema>;

/**
 * 自分宛の一覧。
 *
 * - `pending` … まだ済んでいないもの（確認が要るのに未確認 / 確認が要らないのに未読）
 * - `all`     … 取り消されていない全部（新しい順）
 */
export const DIRECTIVE_INBOX_STATUSES = ["pending", "all"] as const;
export const listMyDirectivesQuerySchema = z.object({
  status: z.enum(DIRECTIVE_INBOX_STATUSES).default("pending"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListMyDirectivesQuery = z.infer<typeof listMyDirectivesQuerySchema>;

/** 返信の上限（DB の CHECK と同じ値）。 */
export const DIRECTIVE_REPLY_MAX = 1000;

/**
 * 受け取った人の文字の返信（「確認しました」の代わりに一言返す）。1 回だけ・上書きしない。
 * 返信すると既読になり、確認を求める業務連絡なら確認済みにもなる。
 */
export const replyToDirectiveSchema = z.object({
  text: z.string().trim().min(1, "返信を入力してください").max(DIRECTIVE_REPLY_MAX),
});
export type ReplyToDirectiveInput = z.infer<typeof replyToDirectiveSchema>;

/** 送った側の 1 件（一覧・確認状況の見出し）。 */
export type DirectiveSummary = {
  id: string;
  title: string;
  body: string;
  requiresAck: boolean;
  dueOn: string | null;
  audienceKind: DirectiveAudienceKind;
  audienceIds: string[];
  sentBy: string | null;
  sentByName: string | null;
  sentAt: string;
  revokedAt: string | null;
  recipientCount: number;
  readCount: number;
  ackedCount: number;
};

/** 確認状況の宛先 1 人。 */
export type DirectiveRecipientStatus = {
  userId: string;
  userName: string | null;
  readAt: string | null;
  ackedAt: string | null;
  /** 受け取った人の文字の返信（無ければ null） */
  reply: string | null;
  repliedAt: string | null;
};

/**
 * 送る画面の宛先の候補（送り手が選べるものだけ）。
 * 事業所で制限された送り手には、自分の所属の事業所と、そこに所属する人だけを返す。
 */
export type DirectiveAudienceOptions = {
  /** 全員宛を選べるか（事業所で制限されない送り手だけ） */
  canSendAll: boolean;
  facilities: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  users: { id: string; name: string }[];
};

/** 自分宛の 1 件（受け取った側）。本文は送信時点の写し。 */
export type MyDirective = {
  directiveId: string;
  title: string;
  body: string;
  requiresAck: boolean;
  dueOn: string | null;
  sentBy: string | null;
  sentByName: string | null;
  sentAt: string;
  readAt: string | null;
  ackedAt: string | null;
  /** 自分の返信（無ければ null）。返信は 1 回だけ */
  reply: string | null;
  repliedAt: string | null;
};
