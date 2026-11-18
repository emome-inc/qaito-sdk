
import type {
  BuiltinAppMember,
  BuiltinAppView,
  LauncherView,
  OAuthTokensRevokeResult,
  WorkingFacilityView,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createIntegrationNamespace(tx: SdkTransport) {
  return {
    /** 入れる組み込みアプリ 1 本と見た目（入れない・無い・無効は 404）GET /integration/builtin-apps/:key */
    builtinApp: (key: string) =>
      tx.request<BuiltinAppView>("GET", `/integration/builtin-apps/${pathParam(key, "key")}`),
    /** その組み込みアプリに入れる人（名前・グループ・組織の役・最大 200。入れないアプリ・QaitoChat は 404）GET /integration/builtin-apps/:key/members */
    builtinAppMembers: (key: string, params?: { limit?: number; offset?: number }) =>
      tx.request<BuiltinAppMember[]>("GET", `/integration/builtin-apps/${pathParam(key, "key")}/members${buildQueryString(params)}`),
    /** サインアウト: 本人の組み込みアプリのログインを全端末で終わらせる（PAT は残す）POST /integration/oauth-tokens/revoke */
    revokeOwnOAuthTokens: () =>
      tx.request<OAuthTokensRevokeResult>("POST", "/integration/oauth-tokens/revoke"),
    workingFacility: {
      /** いま作業している事業所の名前（範囲の外・無効は facility: null。facility:read は要らない）GET /integration/working-facility?id= */
      get: (id: string) => {
        const qs = new URLSearchParams({ id }).toString();
        return tx.request<WorkingFacilityView>("GET", `/integration/working-facility?${qs}`);
      },
    },
    /** ヘッダーのアプリ一覧の素材（入れる拡張アプリ・連携アプリと、管理コンソールに入れるか）GET /integration/launcher */
    launcher: () => tx.request<LauncherView>("GET", "/integration/launcher"),
  };
}
