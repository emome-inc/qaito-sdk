/**
 * error.ts — SDK が投げる唯一のエラー型。
 *
 * `client.ts` から分離したのは循環参照を切るため（`ssrf.ts` がこれを投げ、
 * `ssrf.ts` を使う名前空間を `client.ts` が組み立てる）。
 * 公開経路は変わらない: `client.ts` が re-export し、`index.ts` はそこから出す。
 */
export class QaitoError extends Error {
  status: number;
  code?: string;
  /** 細かい権限（scope の下）で断られた理由のコード（403 の応答の `reason`。例: `NOT_MODERATOR`） */
  reason?: string;
  /** APIが返した再試行用の情報（作成済みのIDなど）。 */
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, reason?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "QaitoError";
    this.status = status;
    this.code = code;
    this.reason = reason;
    this.details = details;
  }
}
