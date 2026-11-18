import { QaitoError } from "./error.js";

/** SSRF 対策: fetch 前に URL をバリデーション（IPv4 / IPv6 両対応） */
export function validateFetchUrl(url: string, baseUrl: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new QaitoError("Invalid URL scheme: only http(s) allowed", 400);
  }
  const hostname = parsed.hostname.toLowerCase();
  const baseHost = new URL(baseUrl).hostname.toLowerCase();
  if (hostname === baseHost) return;

  if (isPrivateOrLoopbackHost(hostname)) {
    throw new QaitoError("Internal network URLs are not allowed", 400);
  }
}

/** ループバック / プライベート / リンクローカル / メタデータホストの判定（IPv4 + IPv6） */
function isPrivateOrLoopbackHost(rawHost: string): boolean {
  if (!rawHost) return true;
  const host = rawHost.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (host === "localhost" || host === "metadata.google.internal") return true;

  const ipv4 = host.split(".").map((s) => Number(s));
  if (ipv4.length === 4 && !ipv4.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    const [a, b] = ipv4;
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  if (host.includes(":")) {
    const h = host.split("%")[0];
    if (h === "::1" || h === "::" || h === "::0") return true;
    if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;
    if (/^fe[89ab][0-9a-f]:/.test(h)) return true;

    const dotted = h.match(/^::ffff:(?:0:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (dotted) {
      const parts = dotted[1].split(".").map((s) => Number(s));
      if (parts.length === 4 && !parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        if (isV4Private(parts as [number, number, number, number])) return true;
      }
    }
    const hex = h.match(/^::ffff:([0-9a-f]{1,4})(?::([0-9a-f]{1,4}))?$/);
    if (hex) {
      const high = parseInt(hex[1], 16);
      const low = hex[2] !== undefined ? parseInt(hex[2], 16) : 0;
      if (
        !Number.isNaN(high) && !Number.isNaN(low) &&
        high >= 0 && high <= 0xffff && low >= 0 && low <= 0xffff
      ) {
        const v32 = hex[2] !== undefined ? (high << 16) | low : high;
        const octets: [number, number, number, number] = [
          (v32 >>> 24) & 0xff,
          (v32 >>> 16) & 0xff,
          (v32 >>> 8) & 0xff,
          v32 & 0xff,
        ];
        if (isV4Private(octets)) return true;
      }
    }
  }

  return false;
}

function isV4Private([a, b]: [number, number, number, number]): boolean {
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}