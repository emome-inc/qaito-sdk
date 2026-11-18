/**
 * serialize.ts — リクエストの組み立てに使う小さな道具。
 *
 * `client.ts` に同居していたものを、モジュール別の名前空間から共有できるよう切り出した
 * （中身は 1 文字も変えていない）。
 */

/** snake_case キーを camelCase に変換する（1 段階のみ、ネスト非対象）*/
export function snakeToCamelKey(s: string): string {
  return s.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

/** オブジェクトの最上位キーを snake_case → camelCase に変換して返す */
export function toApiCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[snakeToCamelKey(k)] = v;
  }
  return result;
}

/** クエリパラメータ（undefined/null 除外）を `?a=b&c=d` 形式にする（キーは呼び出し側が API と一致させる）*/
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const q = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return q ? `?${q}` : "";
}

/** Data URL → Blob 変換 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}