import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { transcriptionOutputKey } from "./transcription";

const FULLWIDTH_DIGITS = "０１２３４５６７８９";

/** 電話番号を E.164 にそろえる。そろえられないもの（空・桁が合わない・市外局番なし）は null。 */
export function normalizePhoneE164(input: string | null | undefined): string | null {
  if (input == null) return null;

  let s = "";
  for (const ch of input) {
    const i = FULLWIDTH_DIGITS.indexOf(ch);
    s += i >= 0 ? String(i) : ch === "＋" ? "+" : ch;
  }

  s = s.replace(/(内線|ext|#|＃)[\s\S]*$/i, "");

  const plus = s.match(/[0-9+]/)?.[0] === "+";

  const d = s.replace(/[^0-9]/g, "");
  if (d === "") return null;

  let national: string;
  if (plus) {
    if (!/^[1-9]/.test(d)) return null;
    if (!d.startsWith("81")) {
      return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
    }
    national = d.slice(2);
    if (national.startsWith("0")) national = national.slice(1);
  } else if (d.startsWith("0081")) {
    national = d.slice(4);
    if (national.startsWith("0")) national = national.slice(1);
  } else if (d.startsWith("010")) {
    return null;
  } else if (d.startsWith("0")) {
    national = d.slice(1);
  } else {
    return null;
  }

  if (!/^[1-9][0-9]{8,9}$/.test(national)) return null;
  return `+81${national}`;
}

/** 逆引きで一度に受ける番号の上限（電話受付が束ねて引く 1 回ぶん）。 */
export const PHONE_LOOKUP_MAX_NUMBERS = 20;

/** E.164（DB の番号の列の CHECK と同じ式） */
export const PHONE_E164_PATTERN = /^\+[1-9][0-9]{7,14}$/;
/** Twilio の RecordingSid（DB の CHECK と同じ式。ダウンロード先の URL はこの形の値だけで組み立てる） */
export const PHONE_RECORDING_SID_PATTERN = /^RE[0-9a-f]{32}$/;
/** LINE の受信口のトークン（サーバが生成する 256 bit の乱数・小文字 hex 64 文字） */
export const PHONE_LINE_ENDPOINT_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const phoneTranscriptOutputKey = (orgId: string, callId: string) => transcriptionOutputKey("phoneCall", orgId, callId);
/** Slack Incoming Webhook の URL の先頭（宛先ドメイン固定・SSRF 対策。§9.2） */
export const PHONE_SLACK_WEBHOOK_URL_PREFIX = "https://hooks.slack.com/";

export const PHONE_ENDPOINT_KINDS = ["twilio_number", "line_webhook"] as const;
export type PhoneEndpointKind = (typeof PHONE_ENDPOINT_KINDS)[number];

export const PHONE_CLOSURE_KINDS = ["closed_all_day", "special_hours"] as const;
export type PhoneClosureKind = (typeof PHONE_CLOSURE_KINDS)[number];

export const PHONE_SCRIPT_ITEM_KEYS = [
  "greeting",
  "menu_intro",
  "menu_fallback",
  "submenu_intro",
  "emergency_menu",
  "repeat_menu",
  "record_prompt",
  "emergency_record_prompt",
  "invalid_prompt",
] as const;
export type PhoneScriptItemKey = (typeof PHONE_SCRIPT_ITEM_KEYS)[number];
/** 分岐ごとに持てる項目（その分岐の案内と録音の促しだけ） */
export const PHONE_SCRIPT_NODE_ITEM_KEYS = ["submenu_intro", "record_prompt"] as const satisfies readonly PhoneScriptItemKey[];

/** any = いつでも / open = 営業時間内だけ / closed = 時間外だけ */
export const PHONE_TIME_BANDS = ["any", "open", "closed"] as const;
export type PhoneTimeBand = (typeof PHONE_TIME_BANDS)[number];

export const PHONE_NUMBER_RULE_KINDS = ["allow", "block"] as const;
export type PhoneNumberRuleKind = (typeof PHONE_NUMBER_RULE_KINDS)[number];

export const PHONE_NOTIFY_PURPOSES = ["default", "emergency"] as const;
export type PhoneNotifyPurpose = (typeof PHONE_NOTIFY_PURPOSES)[number];

export const PHONE_NOTIFY_CHANNELS = ["line_group", "slack", "email", "piazza"] as const;
export type PhoneNotifyChannel = (typeof PHONE_NOTIFY_CHANNELS)[number];

export const PHONE_CREDENTIAL_KINDS = ["line_channel_access_token", "line_channel_secret", "slack_webhook_url"] as const;
export type PhoneCredentialKind = (typeof PHONE_CREDENTIAL_KINDS)[number];

/**
 * はじめの設定の手順（受付ごと）。number = 番号を割り当てた / hours = 受付時間を決めた（常時 AI 受付も可）/
 * notify = 受付の既定の通知先がある / line_keys = LINE の通知先があるとき LINE のトークンとシークレットを登録した
 */
export const PHONE_SETUP_STEPS = ["number", "hours", "notify", "line_keys"] as const;
export type PhoneSetupStep = (typeof PHONE_SETUP_STEPS)[number];

/**
 * ダッシュボードの削減時間の推計の前提（旧 phone-dx と同じ）: 人が出て対応すると 1 件 5 分、要約を読んで折り返すと 1 件 1 分。
 * 推計なので、画面には前提を一緒に出す
 */
export const PHONE_MINUTES_MANUAL = 5;
export const PHONE_MINUTES_AUTOMATED = 1;

/** 人の対応（未対応 / 対応中 / 完了） */
export const PHONE_HANDLING_STATUSES = ["open", "in_progress", "done"] as const;
export type PhoneHandlingStatus = (typeof PHONE_HANDLING_STATUSES)[number];

/** 録音処理の状態（§5.1）。none = 録音なし（作った時点で終端） */
export const PHONE_PROCESSING_STATUSES = ["none", "queued", "stored", "transcribing", "summarizing", "done", "failed"] as const;
export type PhoneProcessingStatus = (typeof PHONE_PROCESSING_STATUSES)[number];
/** 終端の状態（`finished_at` が入る） */
export const PHONE_PROCESSING_FINAL_STATUSES = ["done", "failed", "none"] as const satisfies readonly PhoneProcessingStatus[];

export const PHONE_CALL_ACTION_KINDS = ["status", "assign", "memo"] as const;
export type PhoneCallActionKind = (typeof PHONE_CALL_ACTION_KINDS)[number];

/**
 * 通知の 1 試行の状態。`queued` = 人の再送の Piazza（Piazza への投稿は機械の主体でしか書けないので、
 * 録音処理のジョブ `phone.advance-calls` が送って `sent` / `failed` にする・migration 0466）
 */
export const PHONE_NOTIFICATION_STATUSES = ["sent", "failed", "queued"] as const;
export type PhoneNotificationStatus = (typeof PHONE_NOTIFICATION_STATUSES)[number];

/**
 * 通知の失敗の種類（`phone_notifications.error_code`・本文なし）。`no_target` は通知先が 1 件も無い受電の 1 行。
 * 文言は `@qaito/vocabulary` の `MESSAGES.phone.notificationError`。
 */
export const PHONE_NOTIFICATION_ERROR_CODES = [
  "no_target",
  "line_failed",
  "slack_failed",
  "email_failed",
  "email_bounced",
  "piazza_failed",
  "channel_unavailable",
  "credential_missing",
  "staff_email_missing",
  "rate_limited",
] as const;
export type PhoneNotificationErrorCode = (typeof PHONE_NOTIFICATION_ERROR_CODES)[number];

/** 受付時間の評価の理由（`pure/business-hours.ts` の `evaluateReception` の `reason`・§4.2） */
export const PHONE_RECEPTION_OPEN_REASONS = [
  "always_after_hours",
  "in_slot",
  "special_hours",
  "closed_all_day",
  "holiday",
  "outside_slots",
  "no_slots",
] as const;
export type PhoneReceptionOpenReason = (typeof PHONE_RECEPTION_OPEN_REASONS)[number];

export const PHONE_RECEPTION_NAME_MAX = 100;
export const PHONE_ENDPOINT_LABEL_MAX = 50;
export const PHONE_MENU_LABEL_MAX = 50;
export const PHONE_SCRIPT_BODY_MAX = 500;
export const PHONE_NOTE_MAX = 100;
export const PHONE_TARGET_LABEL_MAX = 100;
export const PHONE_CALL_MEMO_MAX = 2000;
/** 番号のメモ（台帳に当たらない番号に付ける・E-CALL の電話帳の「顧客メモ」） */
export const PHONE_CALLER_NOTE_MAX = 500;
export const PHONE_SUMMARY_MAX = 4000;
export const PHONE_RETENTION_DAYS_MIN = 7;
export const PHONE_RETENTION_DAYS_MAX = 730;
export const PHONE_RETENTION_DAYS_DEFAULT = 90;
/** 1 受付の受付時間の枠の上限（曜日 × 枠） */
export const PHONE_RECEPTION_HOURS_MAX = 7 * 6;
/** 分岐の深さの上限（第 1 階層 + 子） */
export const PHONE_MENU_MAX_DEPTH = 2;
/**
 * 受電の処理の段が失敗したときの、次に試すまでの間隔（分。§5.2）。n 回目の失敗のあとは n 番目の値、
 * 使い切ったら最後の値（60 分）ごと。`failed` にするのは受電から 24 時間を過ぎたときだけ（回数では止めない）。
 * Twilio・S3・Transcribe の障害が数分続いただけで留守録を失わないため。
 */
export const PHONE_PROCESSING_RETRY_MINUTES = [1, 2, 5, 15, 30, 60] as const;
/**
 * この回数だけ失敗が続いたら、処理の途中でも要約なしの通知を先に出す（§5.2）。待ちの合計は 1+2+5+15 = 23 分。
 * 24 時間の再試行のあいだ受電を誰にも伝えないことを避ける（あとで処理が終わっても重ねて送らない）。
 */
export const PHONE_PROCESSING_NOTIFY_AFTER_FAILURES = 5;
/**
 * 処理の失敗の数（`phone_call_processing.attempts`）の頭打ち。上の間隔で 24 時間のあいだに失敗できるのは
 * 約 28 回（1+2+5+15+30 分のあと 60 分ごと）なので、少し余裕を見て 30 で止める（DB の CHECK と同じ値）。
 */
export const PHONE_PROCESSING_ATTEMPTS_MAX = 30;
/** 秘密の平文の長さの上限（LINE のトークン・Slack の URL） */
export const PHONE_CREDENTIAL_VALUE_MAX = 1000;

const PHONE_INPUT_MAX = 40;

/** 電話番号（入力はどの表記でもよい。E.164 にそろえて返す。そろえられなければ不正） */
export const phoneNumberInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(PHONE_INPUT_MAX)
  .transform((v, ctx) => {
    const e164 = normalizePhoneE164(v);
    if (!e164 || !PHONE_E164_PATTERN.test(e164)) {
      ctx.addIssue({ code: "custom", message: "電話番号の形が正しくありません" });
      return z.NEVER;
    }
    return e164;
  });

export function isDomesticForwardablePhone(e164: string | null | undefined): boolean {
  if (typeof e164 !== "string" || !e164.startsWith("+81")) return false;
  const n = e164.slice(3);
  if (/^(50|70|80|90)[0-9]{8}$/.test(n)) return true;
  if (!/^[1-9][0-9]{8}$/.test(n)) return false;
  if (/^[1-9]0/.test(n)) return false;
  return !/^(570|990|180|170)/.test(n);
}

/** 転送先の番号（入力はどの表記でもよい。E.164 にそろえて、国内の転送できる番号だけを通す）。 */
const forwardPhoneNumberInputSchema = phoneNumberInputSchema.refine(isDomesticForwardablePhone, {
  message: "転送先は国内の固定電話・携帯電話・050・フリーダイヤルの番号にしてください（0570・0990 などや国外の番号は使えません）",
});

/** 任意の転送先。空文字・null は「消す」（null）。 */
const optionalForwardNumber = z
  .union([z.literal("").transform(() => null), z.null(), forwardPhoneNumberInputSchema])
  .optional();
const optionalPhoneNumber = z
  .union([z.literal("").transform(() => null), z.null(), phoneNumberInputSchema])
  .optional();
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalUuid = z.string().uuid().nullable().optional();
const minuteOfDay = z.number().int().min(0).max(1439);
const endMinuteOfDay = z.number().int().min(1).max(1440);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD で入力してください");

/** POST /phone/receptions */
export const createPhoneReceptionSchema = z.object({
  name: z.string().trim().min(1, "名前は必須です").max(PHONE_RECEPTION_NAME_MAX),
  facilityId: z.string().uuid("事業所を選んでください"),
  forwardNumber: optionalForwardNumber,
  emergencyNumber: optionalForwardNumber,
  holidaysAsAfterHours: z.boolean().default(false),
  /** 常に時間外（AI 受付）として受ける */
  alwaysAfterHours: z.boolean().default(false),
  /** 画面に出す事業所の電話番号（お客さまの回線） */
  displayPhone: optionalPhoneNumber,
  blacklistEnabled: z.boolean().default(true),
  whitelistEnabled: z.boolean().default(false),
  transcriptionEnabled: z.boolean().default(true),
  aiRoutingEnabled: z.boolean().default(false),
  notifyOnDone: z.boolean().default(true),
  showPartyNameInNotify: z.boolean().default(false),
  recordingRetentionDays: z
    .number()
    .int()
    .min(PHONE_RETENTION_DAYS_MIN)
    .max(PHONE_RETENTION_DAYS_MAX)
    .default(PHONE_RETENTION_DAYS_DEFAULT),
  isActive: z.boolean().default(true),
});
/** PATCH /phone/receptions/:id */
export const updatePhoneReceptionSchema = partialForUpdate(createPhoneReceptionSchema);

/** 番号の割当（在庫から選ぶ・電話受付の管理者と platform-admin・§4.3・0565） */
export const assignPhoneNumberSchema = z.object({
  number: phoneNumberInputSchema,
  label: optionalText(PHONE_ENDPOINT_LABEL_MAX),
});
export type AssignPhoneNumberInput = z.input<typeof assignPhoneNumberSchema>;

export const phoneReceptionHourInputSchema = z
  .object({
    /** 0 = 日曜（JST） */
    weekday: z.number().int().min(0).max(6),
    openMinute: minuteOfDay,
    closeMinute: endMinuteOfDay,
  })
  .refine((v) => v.closeMinute > v.openMinute, { message: "終わりは始まりより後にしてください", path: ["closeMinute"] });

/** PUT /phone/receptions/:id/hours（枠を全部入れ直す。日をまたぐ枠は 2 行に分ける） */
export const replacePhoneReceptionHoursSchema = z
  .object({ slots: z.array(phoneReceptionHourInputSchema).max(PHONE_RECEPTION_HOURS_MAX) })
  .superRefine((v, ctx) => {
    const byDay = new Map<number, { openMinute: number; closeMinute: number }[]>();
    for (const s of v.slots) byDay.set(s.weekday, [...(byDay.get(s.weekday) ?? []), s]);
    for (const slots of byDay.values()) {
      const sorted = [...slots].sort((a, b) => a.openMinute - b.openMinute);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].openMinute < sorted[i - 1].closeMinute) {
          ctx.addIssue({ code: "custom", path: ["slots"], message: "同じ曜日の枠が重なっています" });
          return;
        }
      }
    }
  });

/** POST /phone/receptions/:id/closures */
export const createPhoneReceptionClosureSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("closed_all_day"),
    closureDate: ymd,
    note: optionalText(PHONE_NOTE_MAX),
  }),
  z
    .object({
      kind: z.literal("special_hours"),
      closureDate: ymd,
      openMinute: minuteOfDay,
      closeMinute: endMinuteOfDay,
      note: optionalText(PHONE_NOTE_MAX),
    })
    .refine((v) => v.closeMinute > v.openMinute, { message: "終わりは始まりより後にしてください", path: ["closeMinute"] }),
]);

const menuNodeFields = {
  /** 親の分岐（同じ受付の分岐だけ。深さは 2 まで） */
  parentId: optionalUuid,
  /** この分岐に着いた受電を結ぶ事業所（第 1 階層だけ）。NULL = 受付の事業所 */
  routingFacilityId: optionalUuid,
  label: z.string().trim().min(1, "分岐の名前は必須です").max(PHONE_MENU_LABEL_MAX),
  /** 押すボタン（0〜9。`#` は緊急、`*` は繰り返しに予約） */
  digit: z.string().regex(/^[0-9]$/, "ボタンは 0〜9 の 1 文字です"),
  sortOrder: z.number().int().min(0).max(1000).default(0),
};
const rootOnlyRouting = (v: { parentId?: string | null; routingFacilityId?: string | null }) =>
  !(v.parentId && v.routingFacilityId);

/** POST /phone/receptions/:id/menu-nodes */
export const createPhoneMenuNodeSchema = z
  .object(menuNodeFields)
  .refine(rootOnlyRouting, { message: "事業所を結べるのは第 1 階層の分岐だけです", path: ["routingFacilityId"] });
/** PATCH /phone/menu-nodes/:id */
export const updatePhoneMenuNodeSchema = partialForUpdate(z.object(menuNodeFields)).refine(rootOnlyRouting, {
  message: "事業所を結べるのは第 1 階層の分岐だけです",
  path: ["routingFacilityId"],
});

/** PUT /phone/receptions/:id/script-items（項目 × 時間帯 ×〔分岐 or 共通〕で 1 行。「既定に戻す」は DELETE） */
export const upsertPhoneScriptItemSchema = z
  .object({
    /** NULL = 受付共通 */
    nodeId: optionalUuid,
    itemKey: z.enum(PHONE_SCRIPT_ITEM_KEYS),
    timeBand: z.enum(PHONE_TIME_BANDS).default("any"),
    body: z.string().trim().min(1, "読み上げる文は必須です").max(PHONE_SCRIPT_BODY_MAX),
  })
  .refine((v) => !v.nodeId || (PHONE_SCRIPT_NODE_ITEM_KEYS as readonly string[]).includes(v.itemKey), {
    message: "分岐ごとに変えられるのは、分岐の案内と録音の促しだけです",
    path: ["itemKey"],
  });

/** 肉声音声で受ける形式（mp3 / wav）。マジックバイトは `recording.ts` の表で確かめる */
export const PHONE_GUIDANCE_AUDIO_CONTENT_TYPES = ["audio/mpeg", "audio/wav"] as const;
export type PhoneGuidanceAudioContentType = (typeof PHONE_GUIDANCE_AUDIO_CONTENT_TYPES)[number];
/** 形式 → S3 キーの拡張子（キーはサーバが作る） */
export const PHONE_GUIDANCE_AUDIO_EXTENSIONS: Readonly<Record<PhoneGuidanceAudioContentType, string>> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};
/** 肉声音声の上限（5MiB） */
export const PHONE_GUIDANCE_AUDIO_MAX_BYTES = 5 * 1024 * 1024;

/** POST /phone/script-items/:id/audio/upload-url（宣言の形式と大きさ。実体は完了のときに確かめる） */
export const requestPhoneGuidanceAudioUploadSchema = z.object({
  contentType: z.enum(PHONE_GUIDANCE_AUDIO_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(PHONE_GUIDANCE_AUDIO_MAX_BYTES),
});

/** POST /phone/script-items/:id/audio/complete（受け取った uploadId と、宣言した形式） */
export const completePhoneGuidanceAudioUploadSchema = z.object({
  uploadId: z.string().uuid(),
  contentType: z.enum(PHONE_GUIDANCE_AUDIO_CONTENT_TYPES),
});

const numberRuleFields = {
  kind: z.enum(PHONE_NUMBER_RULE_KINDS),
  number: phoneNumberInputSchema,
  note: optionalText(PHONE_NOTE_MAX),
  /** allow の直通の転送先（国内の番号だけ）。block では持たない */
  forwardTo: optionalForwardNumber,
};
const blockHasNoForward = (v: { kind?: PhoneNumberRuleKind; forwardTo?: string | null }) =>
  !(v.kind === "block" && v.forwardTo);

/** POST /phone/receptions/:id/number-rules */
export const createPhoneNumberRuleSchema = z
  .object(numberRuleFields)
  .refine(blockHasNoForward, { message: "拒否する番号には転送先を設定できません", path: ["forwardTo"] });
/** PATCH /phone/number-rules/:id */
export const updatePhoneNumberRuleSchema = partialForUpdate(z.object(numberRuleFields)).refine(blockHasNoForward, {
  message: "拒否する番号には転送先を設定できません",
  path: ["forwardTo"],
});

const notifyTargetCommon = {
  /** NULL = 受付の既定 */
  nodeId: optionalUuid,
  purpose: z.enum(PHONE_NOTIFY_PURPOSES).default("default"),
  includeSummary: z.boolean().default(true),
  label: optionalText(PHONE_TARGET_LABEL_MAX),
};

/** POST /phone/receptions/:id/notify-targets（チャネルごとに宛先が排他） */
export const createPhoneNotifyTargetSchema = z
  .discriminatedUnion("channel", [
    z.object({
      ...notifyTargetCommon,
      channel: z.literal("line_group"),
      /** LINE のグループ ID */
      value: z.string().trim().min(1).max(100),
    }),
    z.object({
      ...notifyTargetCommon,
      channel: z.literal("slack"),
      /** Slack の Webhook URL を登録した鍵（phone_channel_credentials） */
      credentialId: z.string().uuid(),
    }),
    z
      .object({
        ...notifyTargetCommon,
        channel: z.literal("email"),
        /** 職員でないメールアドレス（共有の窓口） */
        value: z.string().trim().max(254).email().optional(),
        /** 職員（会社のメールに送る） */
        staffId: z.string().uuid().optional(),
      })
      .refine((v) => (v.value ? 1 : 0) + (v.staffId ? 1 : 0) === 1, {
        message: "メールの宛先は、職員かメールアドレスのどちらか 1 つです",
        path: ["value"],
      }),
    z.object({
      ...notifyTargetCommon,
      channel: z.literal("piazza"),
      /** Piazza のチャンネル（設定する人が見えるチャンネルだけ） */
      messageChannelId: z.string().uuid(),
    }),
  ])
  .refine((v) => v.purpose === "default" || (!v.nodeId && v.channel === "line_group"), {
    message: "緊急の通知先は、受付の既定の LINE だけに設定できます",
    path: ["purpose"],
  });
/** PATCH /phone/notify-targets/:id（宛先そのものは変えない。変えるときは作り直す） */
export const updatePhoneNotifyTargetSchema = z.object({
  includeSummary: z.boolean().optional(),
  label: optionalText(PHONE_TARGET_LABEL_MAX),
});

export const phoneCredentialKindSchema = z.enum(PHONE_CREDENTIAL_KINDS);

/** PUT /phone/receptions/:id/credentials/:kind */
export const setPhoneCredentialSchema = z.object({
  value: z.string().trim().min(1).max(PHONE_CREDENTIAL_VALUE_MAX),
  label: optionalText(PHONE_TARGET_LABEL_MAX),
});

/** Slack の Webhook URL か（宛先ドメイン固定。ほかは保存も送信もしない） */
export function isAllowedSlackWebhookUrl(url: string): boolean {
  return url.startsWith(PHONE_SLACK_WEBHOOK_URL_PREFIX) && !/[\s]/.test(url);
}

/** GET /phone/calls */
/** 受電の一覧のキーワードの長さの上限 */
export const PHONE_CALL_SEARCH_MAX = 100;
/** 要約・文字起こし（要配慮）に当てるキーワードの短さの下限（1 文字で本文を総当たりさせない） */
export const PHONE_CALL_CONTENTS_SEARCH_MIN = 2;

/**
 * キーワードを SQL の部分一致に直す。`like` は ILIKE の型（% _ \ を逃がす・ESCAPE '\' で使う）。
 * 数字・ハイフン・空白・+・括弧だけで数字が 3 桁以上なら、`digits` に番号の部分一致の数字（先頭の 0 を外す。
 * 番号は E.164〔+81…〕で持つので 03-… でも当たる）。それ以外は null
 */
export function phoneCallSearchTerms(q: string): { readonly like: string; readonly digits: string | null } {
  const n = q.normalize("NFKC").trim();
  const like = `%${n.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const raw = n.replace(/\D/g, "");
  const digits = /^[\d\s\-+()]+$/.test(n) && raw.length >= 3 ? raw.replace(/^0/, "") : null;
  return { like, digits };
}

export const listPhoneCallsQuerySchema = z.object({
  receptionId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  menuNodeId: z.string().uuid().optional(),
  handlingStatus: z.enum(PHONE_HANDLING_STATUSES).optional(),
  handledByStaffId: z.string().uuid().optional(),
  /** 着信日（JST）の範囲。両端を含む */
  from: ymd.optional(),
  to: ymd.optional(),
  callerNumber: z.string().trim().max(PHONE_INPUT_MAX).optional(),
  /**
   * キーワード（番号の一部・分岐名・受付名・対応のメモ・番号のメモ。要約・文字起こしは phone-recording:read の人だけに当てる）。
   * 空は絞らない
   */
  q: z
    .string()
    .trim()
    .max(PHONE_CALL_SEARCH_MAX)
    .optional()
    .transform((v) => (v ? v : undefined)),
  isEmergency: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")])
    .optional(),
  /** 確認していない通知の失敗がある受電だけ（true のときだけ絞る） */
  notifyFailed: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")])
    .optional(),
  /**
   * 一覧の行に文字起こしの全文を載せる（画面のため。phone-recording:read の人だけ・AI の呼び出しには載せない）。
   * ツールの入力には出さない
   */
  includeTranscript: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/** PATCH /phone/calls/:id（人が分岐を直す。事業所は同じ式で決まり直す・facility_id は受けない） */
export const updatePhoneCallSchema = z.object({
  menuNodeId: z.string().uuid().nullable(),
});

/** POST /phone/calls/:id/actions（追記のみ。handling_status / handled_by_staff_id はこの口の中でだけ書く） */
export const createPhoneCallActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("status"), toStatus: z.enum(PHONE_HANDLING_STATUSES) }),
  /** toStaffId = null は担当を外す */
  z.object({ kind: z.literal("assign"), toStaffId: z.string().uuid().nullable() }),
  z.object({ kind: z.literal("memo"), memo: z.string().trim().min(1, "メモは必須です").max(PHONE_CALL_MEMO_MAX) }),
]);

/** POST /phone/calls/:id/notifications/resend（targetId なし = 失敗した通知先すべて） */
export const resendPhoneNotificationSchema = z.object({
  targetId: z.string().uuid().optional(),
});

/** GET /phone/stats（月の範囲。YYYY-MM） */
export const phoneStatsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  receptionId: z.string().uuid().optional(),
  /** 事業所で絞る（受電の事業所。認可の範囲との積で、範囲の外なら 0 件） */
  facilityId: z.string().uuid().optional(),
});

/** GET /phone/receptions（事業所で絞る。認可の範囲との積） */
export const listPhoneReceptionsQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
});

/** GET /phone/callers（番号で絞る・受電の事業所で絞る〔認可の範囲との積〕） */
export const listPhoneCallersQuerySchema = z.object({
  number: z.string().trim().max(PHONE_INPUT_MAX).optional(),
  facilityId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/** GET /phone/caller-notes */
export const listPhoneCallerNotesQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
  number: z.string().trim().max(PHONE_INPUT_MAX).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
/** PUT /phone/caller-notes（事業所 × 番号で 1 つ。あれば書き替える） */
export const upsertPhoneCallerNoteSchema = z.object({
  facilityId: z.string().uuid("事業所を選んでください"),
  number: phoneNumberInputSchema,
  note: z.string().trim().min(1, "メモを入力してください").max(PHONE_CALLER_NOTE_MAX),
});
export type UpsertPhoneCallerNoteInput = z.input<typeof upsertPhoneCallerNoteSchema>;

/** 電話受付の役。組織の単位で持つ。組織の管理者（console 柱・ルート）は役によらず常に admin */
export const PHONE_ROLES = ["admin", "member"] as const;
export type PhoneRole = (typeof PHONE_ROLES)[number];
/** 割り当てられる役（member は「割り当てが無い」ことで表す） */
export const ASSIGNABLE_PHONE_ROLES = ["admin"] as const;
export type AssignablePhoneRole = (typeof ASSIGNABLE_PHONE_ROLES)[number];
/** 役の強さ（人とグループの両方から付いたら強い方） */
export const PHONE_ROLE_RANK: Readonly<Record<PhoneRole, number>> = { member: 0, admin: 1 };

/** POST /phone/roles — 人かグループのどちらか一方に役を付ける（同じ相手に同じ役があれば何もしない） */
export const assignPhoneRoleSchema = z.union([
  z.object({ role: z.enum(ASSIGNABLE_PHONE_ROLES), userId: z.string().uuid() }).strict(),
  z.object({ role: z.enum(ASSIGNABLE_PHONE_ROLES), groupId: z.string().uuid() }).strict(),
]);
export type AssignPhoneRoleInput = z.infer<typeof assignPhoneRoleSchema>;

/** 役の割り当て 1 行（相手は人かグループ） */
export type PhoneRoleAssignmentView = {
  readonly id: string;
  readonly role: AssignablePhoneRole;
  readonly subjectKind: "user" | "group";
  /** 人なら userId、グループなら groupId */
  readonly subjectId: string;
  /** 相手の名前（引けなければ null） */
  readonly name: string | null;
  /** 人が退職（アーカイブ）している。グループは常に false */
  readonly archived: boolean;
  /** グループの在籍のメンバーの数（人は null） */
  readonly memberCount: number | null;
  readonly createdAt: string;
};

/** GET /phone/roles の応答（役の画面がこれ 1 本で描ける） */
export type PhoneRolesView = {
  readonly assignments: readonly PhoneRoleAssignmentView[];
  /** 組織の管理者（常に電話受付の管理者・外せない）。ルートは名前を出さない */
  readonly orgAdmins: readonly { readonly userId: string; readonly name: string }[];
  /** 追加の候補（組織の在籍の職員とグループ） */
  readonly candidates: {
    readonly users: readonly { readonly userId: string; readonly name: string }[];
    readonly groups: readonly { readonly groupId: string; readonly name: string; readonly memberCount: number }[];
  };
  /** 呼んだ本人 */
  readonly me: { readonly userId: string; readonly isOrgAdmin: boolean; readonly role: PhoneRole };
};

export type CreatePhoneReceptionInput = z.input<typeof createPhoneReceptionSchema>;
export type UpdatePhoneReceptionInput = z.input<typeof updatePhoneReceptionSchema>;
export type ReplacePhoneReceptionHoursInput = z.input<typeof replacePhoneReceptionHoursSchema>;
export type CreatePhoneReceptionClosureInput = z.input<typeof createPhoneReceptionClosureSchema>;
export type CreatePhoneMenuNodeInput = z.input<typeof createPhoneMenuNodeSchema>;
export type UpsertPhoneScriptItemInput = z.input<typeof upsertPhoneScriptItemSchema>;
export type RequestPhoneGuidanceAudioUploadInput = z.input<typeof requestPhoneGuidanceAudioUploadSchema>;
export type CompletePhoneGuidanceAudioUploadInput = z.input<typeof completePhoneGuidanceAudioUploadSchema>;
export type CreatePhoneNumberRuleInput = z.input<typeof createPhoneNumberRuleSchema>;
export type CreatePhoneNotifyTargetInput = z.input<typeof createPhoneNotifyTargetSchema>;
export type CreatePhoneCallActionInput = z.input<typeof createPhoneCallActionSchema>;
export type ListPhoneCallsQuery = z.output<typeof listPhoneCallsQuerySchema>;

export type PhoneReception = {
  readonly id: string;
  readonly name: string;
  /** 受付を結ぶ事業所（必須） */
  readonly facilityId: string;
  readonly forwardNumber: string | null;
  readonly emergencyNumber: string | null;
  readonly holidaysAsAfterHours: boolean;
  /** 常に時間外（AI 受付）として受ける */
  readonly alwaysAfterHours: boolean;
  /** 画面に出す事業所の電話番号（お客さまの回線）。E.164 */
  readonly displayPhone: string | null;
  readonly blacklistEnabled: boolean;
  readonly whitelistEnabled: boolean;
  readonly transcriptionEnabled: boolean;
  readonly aiRoutingEnabled: boolean;
  readonly notifyOnDone: boolean;
  readonly showPartyNameInNotify: boolean;
  readonly recordingRetentionDays: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** 受信口。組織の画面には番号だけを見せる（LINE の口のトークンは管理者の画面だけ） */
export type PhoneEndpoint = {
  readonly id: string;
  readonly receptionId: string;
  readonly endpointKind: PhoneEndpointKind;
  readonly endpointKey: string;
  readonly label: string | null;
  readonly createdAt: string;
};

export type PhoneReceptionHour = {
  readonly id: string;
  readonly receptionId: string;
  readonly weekday: number;
  readonly openMinute: number;
  readonly closeMinute: number;
};

export type PhoneReceptionClosure = {
  readonly id: string;
  readonly receptionId: string;
  readonly closureDate: string;
  readonly kind: PhoneClosureKind;
  readonly openMinute: number | null;
  readonly closeMinute: number | null;
  readonly note: string | null;
};

export type PhoneMenuNode = {
  readonly id: string;
  readonly receptionId: string;
  readonly parentId: string | null;
  readonly routingFacilityId: string | null;
  readonly label: string;
  readonly digit: string;
  readonly sortOrder: number;
  /** 削除済み（履歴のラベル解決のときだけ返す） */
  readonly deletedAt: string | null;
};

export type PhoneScriptItem = {
  readonly id: string;
  readonly receptionId: string;
  readonly nodeId: string | null;
  readonly itemKey: PhoneScriptItemKey;
  readonly timeBand: PhoneTimeBand;
  readonly body: string;
  /** 肉声が登録済みか（S3 のキーは返さない） */
  readonly hasAudio: boolean;
};

/** 肉声音声の送り先（署名付き PUT・300 秒）。PUT のあと uploadId で完了を呼ぶ */
export type PhoneGuidanceAudioTicket = {
  readonly uploadId: string;
  readonly uploadUrl: string;
  /** PUT に付ける Content-Type（署名に含まれる） */
  readonly contentType: PhoneGuidanceAudioContentType;
  readonly expiresIn: number;
};

/** 受付に選べる番号（Qaito の在庫・0565） */
export type PhoneAssignableNumber = {
  /** E.164 */
  readonly number: string;
};

/**
 * はじめの設定の状況（GET /phone/setup-status）。受付ごとに手順の済み・未を返す。
 * `done: null` は確かめられない（LINE の鍵は電話受付の管理者だけが見られる）。LINE の通知先が無い受付には line_keys を出さない
 */
export type PhoneSetupStatus = {
  /** 受付が 1 つ以上あり、確かめられた手順が全部済み */
  readonly ready: boolean;
  readonly receptions: readonly {
    readonly receptionId: string;
    readonly name: string;
    readonly steps: readonly { readonly step: PhoneSetupStep; readonly done: boolean | null }[];
  }[];
};

/**
 * LINE の状況（GET /phone/receptions/:id/line-status・電話受付の管理者だけ）。グループの名前・人数と今月の送信の数。
 * 鍵が無いときは configured: false で、グループの名前・人数・送信の数は null
 */
export type PhoneLineStatus = {
  /** チャネルアクセストークンを登録している */
  readonly configured: boolean;
  /** 今月の送信（limit が null は上限なし）。取れなければ null */
  readonly quota: { readonly limit: number | null; readonly used: number } | null;
  /** LINE のグループの通知先（同じグループは 1 つにまとめる）。名前・人数は取れなければ null */
  readonly groups: readonly {
    readonly groupId: string;
    readonly name: string | null;
    readonly memberCount: number | null;
    /** このグループを使う通知先の数 */
    readonly targets: number;
  }[];
  /** 上限（PHONE_LINE_STATUS_GROUPS_MAX）を超えて LINE に問い合わせなかったグループの数 */
  readonly omittedGroups: number;
};

/** LINE の状況で問い合わせるグループの上限（1 回の表示で LINE を呼ぶ数を抑える） */
export const PHONE_LINE_STATUS_GROUPS_MAX = 20;
/** LINE の状況を置いておく秒数（画面を開き直すたびに LINE を呼ばない） */
export const PHONE_LINE_STATUS_CACHE_SEC = 60;

/** 番号のメモ */
export type PhoneCallerNote = {
  readonly id: string;
  readonly facilityId: string;
  /** E.164 */
  readonly number: string;
  readonly note: string;
  readonly updatedAt: string;
};

export type PhoneNumberRule = {
  readonly id: string;
  readonly receptionId: string;
  readonly kind: PhoneNumberRuleKind;
  readonly number: string;
  readonly note: string | null;
  readonly forwardTo: string | null;
  readonly createdAt: string;
};

export type PhoneNotifyTarget = {
  readonly id: string;
  readonly receptionId: string;
  readonly nodeId: string | null;
  readonly purpose: PhoneNotifyPurpose;
  readonly channel: PhoneNotifyChannel;
  readonly includeSummary: boolean;
  readonly label: string | null;
  readonly value: string | null;
  readonly staffId: string | null;
  readonly messageChannelId: string | null;
  readonly credentialId: string | null;
  /** Piazza のテスト送信を頼んで、まだ送っていない（ジョブが 1 分ごとに送る） */
  readonly testRequestedAt: string | null;
  /** 最後のテスト送信の時刻と失敗の種類（成功は null） */
  readonly lastTestAt: string | null;
  readonly lastTestErrorCode: PhoneNotificationErrorCode | null;
};

/** 秘密の要約（暗号文・平文は返さない） */
export type PhoneChannelCredentialSummary = {
  readonly id: string;
  readonly receptionId: string;
  readonly kind: PhoneCredentialKind;
  readonly label: string | null;
  readonly last4: string | null;
  readonly updatedAt: string;
};

export type PhoneCall = {
  readonly id: string;
  readonly receptionId: string;
  /** 受電の事業所（分岐の事業所 ?? 受付の事業所。必須） */
  readonly facilityId: string;
  readonly menuNodeId: string | null;
  readonly aiMenuNodeId: string | null;
  /** 着いた分岐の名前の写し（受電を事業所に結んだとき・AI の振り分け・人の訂正で写す。分岐を改名しても変わらない） */
  readonly menuLabel: string | null;
  /** 受付の名前の写し（受電を作ったときの名前） */
  readonly receptionName: string | null;
  readonly calledNumber: string | null;
  readonly callerNumber: string | null;
  readonly isEmergency: boolean;
  readonly recordingSeconds: number | null;
  readonly handlingStatus: PhoneHandlingStatus;
  readonly handledByStaffId: string | null;
  /** 着信日時 */
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PhoneCallProcessing = {
  readonly callId: string;
  readonly processingStatus: PhoneProcessingStatus;
  readonly attempts: number;
  readonly errorCode: string | null;
  /** 処理の途中で先に出した要約なしの通知（失敗が続いたとき）が届いた時刻 */
  readonly earlyNotifiedAt: string | null;
  /** 最後の通知（処理が終わったとき・緊急の着信のとき）が届いた時刻 */
  readonly notifiedAt: string | null;
  readonly finishedAt: string | null;
  readonly updatedAt: string;
};

export type PhoneCallAction = {
  readonly id: string;
  readonly callId: string;
  readonly kind: PhoneCallActionKind;
  readonly fromStatus: PhoneHandlingStatus | null;
  readonly toStatus: PhoneHandlingStatus | null;
  readonly toStaffId: string | null;
  readonly memo: string | null;
  readonly staffId: string | null;
  readonly userId: string;
  readonly createdAt: string;
};

export type PhoneNotification = {
  readonly id: string;
  readonly callId: string;
  readonly targetId: string | null;
  readonly channel: PhoneNotifyChannel;
  readonly status: PhoneNotificationStatus;
  readonly errorCode: PhoneNotificationErrorCode | null;
  readonly attemptedAt: string;
  readonly resolvedAt: string | null;
  readonly resolvedByStaffId: string | null;
  readonly resolvedByUserId: string | null;
};

/** 受電の中身（phone-recording:read）。録音そのものは短期の署名付き URL で別に返す */
export type PhoneRecordingContents = {
  readonly callId: string;
  readonly hasRecording: boolean;
  readonly transcript: string | null;
  readonly summary: string | null;
  readonly purgedAt: string | null;
};
