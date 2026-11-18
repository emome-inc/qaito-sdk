/**
 * user-token — OAuth で発行したユーザートークンの形。
 *
 * 発行する基盤（`@qaito/platform/auth`）・振り分ける api（`dualAuthMiddleware`）・受け取る BFF
 * （`@qaito/sdk/app-auth` の Bearer）が同じ関数で判定する。
 */

/**
 * OAuth2 で発行したユーザートークン（小文字 hex 128 文字）か。
 * API Key（`qaito_sk_`）・PAT（`qaito_pat_`）・GoTrue JWT（`ey...`）と形で区別できる。
 */
export function isOpaqueUserToken(value: string): boolean {
  return value.length === 128 && /^[0-9a-f]+$/.test(value);
}
