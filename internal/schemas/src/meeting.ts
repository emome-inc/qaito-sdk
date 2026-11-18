import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { transcriptionOutputKey, type TranscriptEntry } from "./transcription";
import {
  RECORDING_FORMATS,
  isRecordingContentType,
  matchesRecordingMagic,
  recordingProbeLength,
  type RecordingContentType,
  type RecordingTranscribeFormat,
} from "./recording";

/** 取り込み元の種類（§5.4）。段 1 で作るのは `upload` だけ */
export const MEETING_SOURCE_KINDS = ["upload", "recall", "meet_api", "browser"] as const;
export type MeetingSourceKind = (typeof MEETING_SOURCE_KINDS)[number];

/** 会議の状態（§5.3）。`joining` / `recording` / `not_admitted` は bot（段 2）で使う */
export const MEETING_STATUSES = ["scheduled", "joining", "recording", "processing", "done", "failed", "not_admitted"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

/**
 * 取り込みの段（`meeting_captures.source_status`。電話の `phone_call_processing` と同じ形）。
 *   awaiting_upload → stored → transcribing → summarizing → done
 *                                                  ↘ failed（録音が終わってから 24 時間を過ぎても進めない）
 */
export const MEETING_CAPTURE_STATUSES = ["awaiting_upload", "stored", "transcribing", "summarizing", "done", "failed"] as const;
export type MeetingCaptureStatus = (typeof MEETING_CAPTURE_STATUSES)[number];
export const MEETING_CAPTURE_FINAL_STATUSES = ["done", "failed"] as const satisfies readonly MeetingCaptureStatus[];

/** 録音の種類（動画の会議は動画のまま置く。Transcribe は mp4 / webm の音声トラックを直接読む） */
export const MEETING_MEDIA_KINDS = ["audio", "video"] as const;
export type MeetingMediaKind = (typeof MEETING_MEDIA_KINDS)[number];

export const MEETING_TITLE_MAX = 200;
export const MEETING_URL_MAX = 2000;
export const MEETING_CALENDAR_REF_MAX = 500;
export const MEETING_PARTICIPANT_NAME_MAX = 100;
export const MEETING_PARTICIPANTS_MAX = 50;
/** 議事録の要約の上限（文字） */
export const MEETING_MINUTES_SUMMARY_MAX = 4000;
export const MEETING_MINUTES_ITEM_MAX = 500;
export const MEETING_MINUTES_ITEMS_MAX = 50;

/** 保持期間（組織ごと・日）。電話の受付ごとの保持と同じ幅と既定（eecall.md §7.1） */
export const MEETING_RETENTION_DAYS_MIN = 7;
export const MEETING_RETENTION_DAYS_MAX = 730;
export const MEETING_RETENTION_DAYS_DEFAULT = 90;

/** 取り込みの段の失敗のあと次に試すまでの分（以後は最後の値ごと）。電話と同じ */
export const MEETING_CAPTURE_RETRY_MINUTES = [1, 2, 5, 15, 30, 60] as const;
/** 失敗の数の頭打ち（期限 24 時間で約 28 回） */
export const MEETING_CAPTURE_ATTEMPTS_MAX = 30;
/** 録音が置けてから（＝録音が終わってから）この時間を過ぎても終わらなければ failed */
export const MEETING_CAPTURE_DEADLINE_HOURS = 24;

/**
 * 1 ファイルの上限。Transcribe のバッチは 1 ファイル 2GB・4 時間まで。動画の会議 2 時間程度を見込んで 1GB
 * （それを超える録音は取り込み元〔段 2〕の側で分ける）。
 */
export const MEETING_RECORDING_MAX_BYTES = 1024 * 1024 * 1024;
/**
 * 画面でその場で録るときの上限（秒）。Transcribe のバッチの 1 ファイル 4 時間に合わせる（それより長い録音は文字起こしできない）。
 * 録った音声は opus の webm で 1 時間 30MB 前後なので、1 ファイルの上限（`MEETING_RECORDING_MAX_BYTES`）には届かない。
 */
export const MEETING_CAPTURE_MAX_SECONDS = 4 * 60 * 60;
/** presigned PUT の有効期限（秒）。大きい動画を考えて 15 分 */
export const MEETING_UPLOAD_URL_EXPIRES_SEC = 900;
/** 再生の署名付き URL の有効期限（秒）。電話と同じ 300 秒 */
export const MEETING_RECORDING_URL_EXPIRES_SEC = 300;

/** Transcribe の `MediaFormat`（キーに拡張子を付けないので明示する） */
export type MeetingTranscribeFormat = RecordingTranscribeFormat;

/** 受け付ける形式（MIME → 種類・Transcribe の形式・マジックバイト）。正本は録音の共通の表（`./recording`） */
export const MEETING_RECORDING_UPLOAD_TYPES = RECORDING_FORMATS;

export type MeetingRecordingContentType = RecordingContentType;
export const MEETING_RECORDING_CONTENT_TYPES = Object.keys(MEETING_RECORDING_UPLOAD_TYPES) as [
  MeetingRecordingContentType,
  ...MeetingRecordingContentType[],
];

export const isMeetingRecordingContentType = isRecordingContentType;
/** マジックバイトの判定に要る先頭のバイト数（Range GET の長さ） */
export const meetingRecordingProbeLength = recordingProbeLength;
/** 実体の先頭が申告の MIME のマジックバイトと一致するか（バイトが足りなければ不一致） */
export const matchesMeetingRecordingMagic = matchesRecordingMagic;

/**
 * 録音の S3 キー（会議のバケットの中）。**サーバが作る**。会議 1 件に録音 1 つで、拡張子を付けない
 * （置き直しても同じキーを上書きし、形式の違う古い実体が孤児にならない。形式は行の `content_type`）。
 * `{orgId}/` で始める（アップロード規約 §1-2。組織の削除は接頭辞で消す）。
 */
export function meetingRecordingKey(organizationId: string, meetingId: string): string {
  return `${organizationId}/${meetingId}/recording`;
}

/** 文字起こしの出力（一時バケット `llmTemp`）。中身の削除も同じキーを消す */
export const meetingTranscriptOutputKey = (orgId: string, meetingId: string) =>
  transcriptionOutputKey("meetingRecording", orgId, meetingId);

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v));

/** 会議の URL（https だけ。暗号化はしないが一覧には出さない） */
const meetingUrlSchema = z
  .string()
  .trim()
  .max(MEETING_URL_MAX)
  .url()
  .refine((v) => v.startsWith("https://"), { message: "https の URL だけを受け付けます" });

export const meetingParticipantInputSchema = z.object({
  displayName: z.string().trim().min(1).max(MEETING_PARTICIPANT_NAME_MAX),
  /** 職員の行（任意。同じ組織の職員だけ） */
  staffId: z.string().uuid().nullable().optional(),
});
export type MeetingParticipantInput = z.infer<typeof meetingParticipantInputSchema>;

const meetingFields = {
  title: z.string().trim().min(1).max(MEETING_TITLE_MAX),
  /** 事業所（必須。会議の行の事業所の境界 = stamp） */
  facilityId: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  meetingUrl: meetingUrlSchema.nullable().optional(),
  calendarEventRef: nullableText(MEETING_CALENDAR_REF_MAX).optional(),
  /** 参加者（送れば丸ごと入れ替える） */
  participants: z.array(meetingParticipantInputSchema).max(MEETING_PARTICIPANTS_MAX).optional(),
};

/** 会議を作る。取り込み元は段 1 では `upload` だけ */
export const createMeetingSchema = z.object({
  ...meetingFields,
  sourceKind: z.literal("upload").optional(),
});
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

/** 会議を直す（送ったキーだけ）。取り込み元は変えられない */
export const updateMeetingSchema = partialForUpdate(z.object(meetingFields));
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * カレンダーの予定の 1 回に結ぶ会議の手掛かり（`calendarEventRef`）。**予定 ID + 回の日付（JST）**。
 * 繰り返しの予定は回ごとに別の会議にするので、予定 ID だけでは足りない（同じ予定の別の回と区別できない）。
 * 画面（ポータルのカレンダー）・QaitoChat・SDK が同じ形で作れるようにここに置く。
 */
export function meetingCalendarEventRef(eventId: string, occurrenceDate: string): string {
  return `calendar:${eventId}:${occurrenceDate}`;
}

export const startMeetingFromCalendarSchema = z.object({
  eventId: z.string().uuid(),
  occurrenceDate: ymd,
  title: z.string().max(1000).optional(),
  facilityId: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export type StartMeetingFromCalendarInput = z.infer<typeof startMeetingFromCalendarSchema>;

/** 会議の一覧の絞り込み（クエリ文字列のまま受ける） */
export const listMeetingsQuerySchema = z.object({
  status: z.enum(MEETING_STATUSES).optional(),
  facilityId: z.string().uuid().optional(),
  /** カレンダーの予定の手掛かりで絞る（完全一致。`meetingCalendarEventRef` の形） */
  calendarEventRef: z.string().trim().min(1).max(MEETING_CALENDAR_REF_MAX).optional(),
  /** 予定の日（JST・`YYYY-MM-DD`）。予定の無い会議は作成日で見る */
  from: ymd.optional(),
  to: ymd.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
export type ListMeetingsQuery = z.infer<typeof listMeetingsQuerySchema>;

/** 録音のアップロードの発行（申告の MIME とサイズ。実体は登録の口が確かめる） */
export const issueMeetingRecordingUploadSchema = z.object({
  contentType: z.enum(MEETING_RECORDING_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(MEETING_RECORDING_MAX_BYTES),
});
export type IssueMeetingRecordingUploadInput = z.infer<typeof issueMeetingRecordingUploadSchema>;

/** 保持期間の設定（組織ごと） */
export const updateMeetingRecordingSettingsSchema = z.object({
  recordingRetentionDays: z.number().int().min(MEETING_RETENTION_DAYS_MIN).max(MEETING_RETENTION_DAYS_MAX),
  /** 短くして次の掃除で消える件数の確認（1 回目の 409 `would_purge` で返った `purgeCount`）。数え直した件数と一致したときだけ保存する */
  confirmPurgeCount: z.number().int().min(0).optional(),
});
export type UpdateMeetingRecordingSettingsInput = z.infer<typeof updateMeetingRecordingSettingsSchema>;

const minutesItem = z.string().trim().min(1).max(MEETING_MINUTES_ITEM_MAX);

/** 議事録。LLM の出力をこの形で確かめてから保存する（形が合わなければ保存しない） */
export const meetingMinutesSchema = z.object({
  summary: z.string().trim().max(MEETING_MINUTES_SUMMARY_MAX),
  decisions: z.array(minutesItem).max(MEETING_MINUTES_ITEMS_MAX).default([]),
  actionItems: z
    .array(
      z.object({
        task: minutesItem,
        owner: z.string().trim().max(MEETING_PARTICIPANT_NAME_MAX).nullable().default(null),
        due: z.string().trim().max(50).nullable().default(null),
      }),
    )
    .max(MEETING_MINUTES_ITEMS_MAX)
    .default([]),
  topics: z.array(minutesItem).max(MEETING_MINUTES_ITEMS_MAX).default([]),
});
export type MeetingMinutes = z.infer<typeof meetingMinutesSchema>;

export type MeetingParticipant = {
  readonly id: string;
  readonly displayName: string;
  readonly staffId: string | null;
};

/** 取り込みの状態（失敗の種類だけ。本文なし） */
export type MeetingCapture = {
  readonly status: MeetingCaptureStatus;
  readonly attempts: number;
  readonly failureKind: string | null;
  readonly deadlineAt: string | null;
  readonly finishedAt: string | null;
};

/** 会議（一覧）。会議の URL は一覧に出さない（詳細だけ） */
export type MeetingSummary = {
  readonly id: string;
  readonly title: string;
  readonly facilityId: string;
  readonly scheduledAt: string | null;
  readonly sourceKind: MeetingSourceKind;
  readonly status: MeetingStatus;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly capture: MeetingCapture | null;
};

/** 会議（詳細） */
export type Meeting = MeetingSummary & {
  /** 詳細の口（getMeeting）だけ: この人が会議を直す・消せるか（作った人・同じグループ・管理者）。中身（録音・議事録）を消せるかも同じ */
  readonly canEdit?: boolean;
  readonly meetingUrl: string | null;
  readonly calendarEventRef: string | null;
  readonly participants: readonly MeetingParticipant[];
};

/** 録音の中身（要配慮）。録音そのものは返さない（短期の署名付き URL は別の口） */
export type MeetingRecordingContents = {
  readonly meetingId: string;
  readonly hasRecording: boolean;
  readonly mediaKind: MeetingMediaKind | null;
  readonly contentType: string | null;
  readonly sizeBytes: number | null;
  readonly durationSec: number | null;
  readonly uploadedAt: string | null;
  readonly transcript: readonly TranscriptEntry[] | null;
  readonly transcriptText: string | null;
  readonly minutes: MeetingMinutes | null;
  readonly minutesGeneratedAt: string | null;
  readonly purgedAt: string | null;
};

export type MeetingRecordingSettings = {
  readonly recordingRetentionDays: number;
};
