
export type RecordingMediaKind = "audio" | "video";

/** Transcribe の `MediaFormat`（キーに拡張子を付けない口があるので明示する） */
export type RecordingTranscribeFormat = "mp3" | "mp4" | "wav" | "webm";

export type MagicSignature = { readonly offset: number; readonly bytes: readonly number[] };

const ISO_BMFF: readonly MagicSignature[] = [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }];
const EBML: readonly MagicSignature[] = [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }];

export const RECORDING_FORMATS = {
  "audio/mpeg": {
    mediaKind: "audio",
    transcribeFormat: "mp3",
    signatures: [
      { offset: 0, bytes: [0x49, 0x44, 0x33] },
      { offset: 0, bytes: [0xff, 0xfb] },
      { offset: 0, bytes: [0xff, 0xf3] },
      { offset: 0, bytes: [0xff, 0xf2] },
      { offset: 0, bytes: [0xff, 0xfa] },
      { offset: 0, bytes: [0xff, 0xe3] },
    ],
  },
  "audio/mp4": { mediaKind: "audio", transcribeFormat: "mp4", signatures: ISO_BMFF },
  "audio/wav": { mediaKind: "audio", transcribeFormat: "wav", signatures: [{ offset: 8, bytes: [0x57, 0x41, 0x56, 0x45] }] },
  "audio/webm": { mediaKind: "audio", transcribeFormat: "webm", signatures: EBML },
  "video/mp4": { mediaKind: "video", transcribeFormat: "mp4", signatures: ISO_BMFF },
  "video/webm": { mediaKind: "video", transcribeFormat: "webm", signatures: EBML },
} as const satisfies Record<
  string,
  { mediaKind: RecordingMediaKind; transcribeFormat: RecordingTranscribeFormat; signatures: readonly MagicSignature[] }
>;

export type RecordingContentType = keyof typeof RECORDING_FORMATS;

/**
 * `audio/webm;codecs=opus` のような引数つきの MIME を、表のキーの形にする。
 * ブラウザの MediaRecorder は引数つきで返すので、照らす前に必ず通す。
 */
export function normalizeRecordingContentType(mimeType: string): string {
  const base = (mimeType.split(";")[0] ?? "").trim().toLowerCase();
  return RECORDING_MIME_ALIASES[base] ?? base;
}

/**
 * ブラウザ・OS が付ける別名の MIME → 表のキー。
 * macOS の .m4a はブラウザによって audio/x-m4a になる（実体は同じ ISO BMFF）。
 * .wav は audio/x-wav・audio/wave・audio/vnd.wave で来ることがある（実体は同じ RIFF/WAVE）。
 */
const RECORDING_MIME_ALIASES: Readonly<Record<string, string>> = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
};

/** 引数を外した MIME が録音の表にあるか */
export function isRecordingContentType(v: unknown): v is RecordingContentType {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(RECORDING_FORMATS, v);
}

/** マジックバイトの判定に要る先頭のバイト数（Range GET の長さ） */
export function recordingProbeLength(contentType: RecordingContentType): number {
  return RECORDING_FORMATS[contentType].signatures.reduce((m, s) => Math.max(m, s.offset + s.bytes.length), 0);
}

/** 実体の先頭が申告の MIME のマジックバイトと一致するか（バイトが足りなければ不一致） */
export function matchesRecordingMagic(head: Uint8Array, contentType: RecordingContentType): boolean {
  return RECORDING_FORMATS[contentType].signatures.some(
    (sig) => head.length >= sig.offset + sig.bytes.length && sig.bytes.every((b, i) => head[sig.offset + i] === b),
  );
}

/** アセスメントの録音で受ける形式（音声だけ）。画面の MediaRecorder は webm か mp4 を返す */
export const ASSESSMENT_RECORDING_CONTENT_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"] as const satisfies readonly RecordingContentType[];

/**
 * アセスメントの録音の 1 ファイルの上限。opus の webm で 1 時間 30〜60MB・AAC 128kbps で約 60MB なので、
 * 3 時間の面談まで収まる 200MB。Transcribe のバッチの上限（2GB・4 時間）より十分小さい。
 */
export const ASSESSMENT_RECORDING_MAX_BYTES = 200 * 1024 * 1024;

/**
 * 引数は `codecs=…` だけを許す（MediaRecorder が付けるもの）。署名とオブジェクトの Content-Type には申告の値がそのまま残るので、
 * `audio/webm;x=text/html` のような任意の引数を持ち込ませない。
 */
const RECORDING_CONTENT_TYPE_SHAPE = /^[a-z]+\/[a-z0-9.+-]+(\s*;\s*codecs=("[a-z0-9.,+-]+"|[a-z0-9.,+-]+))?$/i;

/** 申告の MIME（`codecs` の引数つきでよい）がアセスメントの録音で受けられるか */
export function isAssessmentRecordingContentType(mimeType: string): boolean {
  if (!RECORDING_CONTENT_TYPE_SHAPE.test(mimeType.trim())) return false;
  const base = normalizeRecordingContentType(mimeType);
  return (ASSESSMENT_RECORDING_CONTENT_TYPES as readonly string[]).includes(base);
}
