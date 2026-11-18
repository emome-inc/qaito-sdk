
import type {
  VoiceTranscribeResult,
} from "../types.js";
import type { SdkTransport } from "../transport.js";

export function createVoiceNamespace(tx: SdkTransport) {
  return {
    /** 音声（PCM 16bit LE / モノラル / 16kHz）→ 文字。何も保存しない POST /voice/transcribe */
    transcribe: (audio: ArrayBuffer | Uint8Array) =>
      tx.requestBinary<VoiceTranscribeResult>("POST", "/voice/transcribe", audio),
  };
}
