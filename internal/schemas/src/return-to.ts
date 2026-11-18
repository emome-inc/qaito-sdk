/**
 * サインイン・MFA・アプリのログインのあとに戻す先の判定（open redirect を防ぐ）。
 *
 * web（ポータルのサインイン・MFA の確認画面）と SDK（`@qaito/sdk/app-auth`）が同じ判定を使う。
 * 片方だけ緩いと、そこから外へ送れてしまう。
 */

/**
 * 同一オリジン内の相対パスとして安全に遷移できるか。
 *
 * `/` で始まるだけでは足りない: `//evil.example`・`/\\evil.example` はブラウザが
 * 別オリジンとして解釈する。制御文字（タブ・改行）はブラウザが取り除くため
 * `/\t/evil.example` が `//evil.example` になる ── これも弾く。
 */
export function isSafeNextPath(next: string | null | undefined): next is string {
  if (typeof next !== "string" || !next.startsWith("/")) return false;
  if (next.startsWith("//") || next.startsWith("/\\")) return false;
  if (/[\u0000-\u001f\u007f]/.test(next)) return false;
  return true;
}

/**
 * 戻り先の絶対 URL（`return_to`）として信頼してよいか。
 * `{appDomain}` そのものか、その**単層**のサブドメインだけを許す（`evil.client.{appDomain}` は弾く）。
 */
export function isTrustedReturnTo(url: string | null | undefined, appDomain: string): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname;
    if (host === appDomain) return true;
    if (!host.endsWith(`.${appDomain}`)) return false;
    const subdomain = host.slice(0, -`.${appDomain}`.length);
    return subdomain.length > 0 && !subdomain.includes(".");
  } catch {
    return false;
  }
}
