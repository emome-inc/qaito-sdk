
import type {
  MyUsageThisMonth,
} from "../types.js";
import type { SdkTransport } from "../transport.js";

export function createUsageNamespace(tx: SdkTransport) {
  return {
    /** 本人の今月の使用量（日ごとの QT・使っていない日は 0）GET /usage-billing/me/usage */
    me: () => tx.request<MyUsageThisMonth>("GET", "/usage-billing/me/usage"),
  };
}
