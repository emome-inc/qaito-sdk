

/**
 * 発言 1 件。Transcribe の出力・外部の会議サービスの文字起こし（会議モジュールのパーサが写す）を、同じ形にそろえる。
 * `speaker` は表示の名前（Transcribe なら「話者1」、会議なら参加者名）。話者を分けていなければ null。
 * 時刻は録音の頭からの秒。分からなければ null。
 */
export type TranscriptEntry = {
  readonly speaker: string | null;
  readonly text: string;
  readonly startSec: number | null;
  readonly endSec: number | null;
};

export const TRANSCRIPTION_JOB_KINDS = {
  /** アセスメントの面談の録音。話者分離（最大 5 人） */
  assessmentRecording: {
    jobPrefix: "qaito-assessment-recording-",
    outputPrefix: "assessment-transcripts/",
    maxSpeakers: 5,
  },
  /** 受電の録音（phone）。話者は分けない（要約・検索に平文で使う） */
  phoneCall: {
    jobPrefix: "qaito-phone-call-",
    outputPrefix: "phone-transcripts/",
    maxSpeakers: null,
  },
  nursingVisitRecording: { jobPrefix: "qaito-nursing-visit-recording-", outputPrefix: "nursing-visit-transcripts/", maxSpeakers: 4 },
  meetingRecording: {
    jobPrefix: "qaito-meeting-recording-",
    outputPrefix: "meeting-transcripts/",
    maxSpeakers: 10,
  },
} as const satisfies Record<string, { jobPrefix: string; outputPrefix: string; maxSpeakers: number | null }>;

export type TranscriptionJobKind = keyof typeof TRANSCRIPTION_JOB_KINDS;

/** ジョブ名（決定的。対象の id は UUID で全体で一意）。DB に列を足さずに「この対象のジョブ」を引ける */
export function transcriptionJobName(kind: TranscriptionJobKind, targetId: string): string {
  return `${TRANSCRIPTION_JOB_KINDS[kind].jobPrefix}${targetId}`;
}

/** 出力 JSON のキー（一時バケット `llmTemp` の中。組織の配下） */
export function transcriptionOutputKey(kind: TranscriptionJobKind, organizationId: string, targetId: string): string {
  return `${TRANSCRIPTION_JOB_KINDS[kind].outputPrefix}${organizationId}/${targetId}.json`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** 出力キーがその種類の形か（消す・読む前に確かめる。リクエスト由来の文字列で他の種類のキーに触らない） */
export function isTranscriptionOutputKey(kind: TranscriptionJobKind, key: string): boolean {
  const prefix = TRANSCRIPTION_JOB_KINDS[kind].outputPrefix.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`^${prefix}${UUID}/${UUID}\\.json$`, "i").test(key);
}

/**
 * StartTranscriptionJob の入力。**フィールドの名前は AWS の API と同じ**にしてあり、ホストはそのままコマンドに渡す
 * （AWS の型はここに持ち込まない）。
 */
export type TranscriptionJobInput = {
  readonly TranscriptionJobName: string;
  readonly LanguageCode: "ja-JP";
  readonly MediaFormat?: "mp3" | "mp4" | "wav" | "flac" | "ogg" | "webm" | "amr";
  readonly Media: { readonly MediaFileUri: string };
  readonly OutputBucketName: string;
  readonly OutputKey: string;
  readonly OutputEncryptionKMSKeyId: string;
  readonly Settings?: { readonly ShowSpeakerLabels: true; readonly MaxSpeakerLabels: number };
};

/**
 * 1 件のジョブ入力。**録音の場所と出力の場所はサーバが決める**（入力から組み立てない）。
 * 話者分離は種類の `maxSpeakers` で決まる（null なら分けない）。
 */
export function buildTranscriptionJobInput(
  target: {
    readonly kind: TranscriptionJobKind;
    readonly organizationId: string;
    readonly targetId: string;
    readonly mediaBucket: string;
    readonly mediaKey: string;
    readonly mediaFormat?: TranscriptionJobInput["MediaFormat"];
  },
  where: { readonly outputBucket: string; readonly outputKmsKeyArn: string },
): TranscriptionJobInput {
  const maxSpeakers: number | null = TRANSCRIPTION_JOB_KINDS[target.kind].maxSpeakers;
  return {
    TranscriptionJobName: transcriptionJobName(target.kind, target.targetId),
    LanguageCode: "ja-JP",
    ...(target.mediaFormat ? { MediaFormat: target.mediaFormat } : {}),
    Media: { MediaFileUri: `s3://${target.mediaBucket}/${target.mediaKey}` },
    OutputBucketName: where.outputBucket,
    OutputKey: transcriptionOutputKey(target.kind, target.organizationId, target.targetId),
    OutputEncryptionKMSKeyId: where.outputKmsKeyArn,
    ...(maxSpeakers !== null ? { Settings: { ShowSpeakerLabels: true as const, MaxSpeakerLabels: maxSpeakers } } : {}),
  };
}

/** ジョブの状態（AWS の 4 値 + 見つからない） */
export type TranscriptionJobState =
  | { readonly status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" }
  | { readonly status: "FAILED" }
  | { readonly status: "NOT_FOUND" };

/**
 * Transcribe のジョブ操作（**失敗は例外**）。`start` は同じ名前のジョブが既にあれば成功扱い（at-least-once で 2 度来る）。
 * `get` は見つからなければ `NOT_FOUND`、`remove` は無ければ何もしない。実体は `@qaito/platform/voice/pure` が作る。
 */
export type TranscriptionJobPort = {
  start(input: TranscriptionJobInput): Promise<void>;
  get(jobName: string): Promise<TranscriptionJobState>;
  remove(jobName: string): Promise<void>;
};

/**
 * 文字起こしの手順が使う外部 I/O 一式（どのモジュールでも同じ形）。モジュールは録音の置き場（バケット）を
 * 自分で足して使う（assessment の `RecordingTranscriptionPorts` = これ + `recordingsBucket`）。
 */
export type BatchTranscriptionPorts = {
  readonly jobs: TranscriptionJobPort;
  /** 出力 JSON の取り出し（S3）。無ければ null */
  readonly readObject: (bucket: string, key: string) => Promise<Uint8Array | null>;
  readonly deleteObject: (bucket: string, key: string) => Promise<void>;
  readonly outputBucket: string;
  readonly outputKmsKeyArn: string;
};

/**
 * 「ジョブが無い」の判定。GetTranscriptionJob は `NotFoundException` のほか、
 * `BadRequestException: The requested job couldn't be found` を返すことがある。
 */
export function isTranscriptionJobNotFound(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "NotFoundException") return true;
  return err.name === "BadRequestException" && /couldn't be found|not found/i.test(err.message);
}

/** StartTranscriptionJob の「同じ名前のジョブがある」 */
export function isTranscriptionJobConflict(err: unknown): boolean {
  return err instanceof Error && (err.name === "ConflictException" || /already exists/i.test(err.message));
}

/** Transcribe の出力 JSON のうち、使う部分だけ */
type TranscribeOutput = {
  results?: {
    transcripts?: Array<{ transcript?: unknown }>;
    items?: Array<{
      type?: string;
      speaker_label?: string;
      start_time?: string;
      end_time?: string;
      alternatives?: Array<{ content?: string }>;
    }>;
  };
};

/** `spk_0` → `話者1`（画面は `^話者\d+: ` で話者を色分けする） */
export function speakerDisplayName(label: string): string {
  const m = /^spk_(\d+)$/.exec(label);
  return m ? `話者${Number(m[1]) + 1}` : label;
}

/** 話者の分からない発言の表示名 */
export const UNKNOWN_SPEAKER = "話者?";

const sec = (v: unknown): number | null => {
  if (typeof v !== "string" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Transcribe の出力を発言の配列にする。話者ラベルがあれば話者が変わるところで区切り、無ければ全文を 1 件にする。
 * ja-JP は分かち書きしないので単語を空白なしで連結する。句読点は直前の発言に付ける。
 * 形が読めないときは `null`（呼び出し側が失敗にする）。
 */
export function parseTranscribeOutput(output: unknown): TranscriptEntry[] | null {
  if (typeof output !== "object" || output === null) return null;
  const results = (output as TranscribeOutput).results;
  if (!results || typeof results !== "object") return null;

  const items = Array.isArray(results.items) ? results.items : [];
  const hasSpeakers = items.some((i) => typeof i.speaker_label === "string");
  if (!hasSpeakers) {
    const transcripts = Array.isArray(results.transcripts) ? results.transcripts : [];
    const text = transcripts
      .map((t) => (typeof t.transcript === "string" ? t.transcript : ""))
      .join("")
      .trim();
    const times = items.filter((i) => i.type !== "punctuation");
    return text === ""
      ? []
      : [{ speaker: null, text, startSec: sec(times[0]?.start_time), endSec: sec(times[times.length - 1]?.end_time) }];
  }

  const out: TranscriptEntry[] = [];
  let current = "";
  let line = "";
  let start: number | null = null;
  let end: number | null = null;
  const flush = () => {
    const text = line.trim();
    if (text) out.push({ speaker: current ? speakerDisplayName(current) : UNKNOWN_SPEAKER, text, startSec: start, endSec: end });
  };
  for (const item of items) {
    const content = item.alternatives?.[0]?.content ?? "";
    const speaker = item.speaker_label;
    if (item.type !== "punctuation" && speaker && speaker !== current) {
      flush();
      current = speaker;
      line = "";
      start = null;
      end = null;
    }
    if (item.type !== "punctuation") {
      start ??= sec(item.start_time);
      end = sec(item.end_time) ?? end;
    }
    line += content;
  }
  flush();
  return out;
}

/** 処理した音声の秒数（最後の発言の終わり。計量に使う）。分からなければ null */
export function transcriptDurationSec(entries: readonly TranscriptEntry[]): number | null {
  let max: number | null = null;
  for (const e of entries) if (e.endSec !== null && (max === null || e.endSec > max)) max = e.endSec;
  return max;
}

/** 「話者N: 発言」の行（話者の無い発言は本文だけ）。同じ話者の続く発言はまとめない（区切りは発言の配列のまま） */
export function formatTranscriptWithSpeakers(entries: readonly TranscriptEntry[]): string {
  return entries.map((e) => (e.speaker ? `${e.speaker}: ${e.text}` : e.text)).join("\n");
}

/** 本文だけを空白なしで連結する（電話の要約・検索に使う平文） */
export function formatTranscriptPlain(entries: readonly TranscriptEntry[]): string {
  return entries
    .map((e) => e.text)
    .join("")
    .trim();
}

/**
 * Transcribe の出力をそのまま文字列に整える。話者ラベルがあれば「話者N: 発言」の行、無ければ全文 1 行。
 * 形が読めないときは `null`。
 */
export function formatTranscribeOutput(output: unknown): string | null {
  const entries = parseTranscribeOutput(output);
  if (entries === null) return null;
  return entries.some((e) => e.speaker !== null) ? formatTranscriptWithSpeakers(entries) : formatTranscriptPlain(entries);
}
