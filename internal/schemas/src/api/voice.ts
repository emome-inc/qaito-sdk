import { z } from "zod";

/** サンプルレート（Hz）。ブラウザの AudioContext もこの値に固定する */
export const TRANSCRIBE_SAMPLE_RATE_HZ = 16000;

/** 録音の最大秒数（クライアント側で自動停止する）。1 発話を想定した上限 */
export const TRANSCRIBE_MAX_DURATION_SEC = 60;

/**
 * リクエストボディの最大バイト数（約 2MB）。
 * PCM 16bit（2 byte/sample）モノラル × サンプルレート × 最大秒数 + 5% の余裕。
 * ちょうどの秒数で切っても超過しうる（クライアント側の停止判定は非同期）ため余裕を持たせる。
 */
export const TRANSCRIBE_MAX_BYTES = Math.ceil(
  TRANSCRIBE_SAMPLE_RATE_HZ * 2 * TRANSCRIBE_MAX_DURATION_SEC * 1.05,
);

export const transcribeResponseSchema = z.object({
  text: z.string(),
});
export type TranscribeResponse = z.infer<typeof transcribeResponseSchema>;
