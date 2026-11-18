
import type {
  BuiltinAppOAuthClient,
  DeviceTokenResponse,
  UserFacePhoto,
  UserInfo,
} from "../types.js";
import type { SdkTransport } from "../transport.js";

export function createDeviceNamespace(tx: SdkTransport) {
  return {
    token: (userId: string) =>
      tx.request<DeviceTokenResponse>("POST", "/auth/device-token", {
        grant_type: "face_recognition",
        user_id: userId,
      }),
    userFacePhotos: () => tx.request<UserFacePhoto[]>("GET", "/auth/users/face-photos"),
  };
}

export function createOAuthNamespace(tx: SdkTransport) {
  return {
    /**
     * GET /auth/oauth/client — 組み込みの外部アプリ（`chat` / `piazza`）の、その組織の OAuth 公開クライアント ID と組織名。
     * ログイン前の口（認証不要）。組織が無い・アプリ未設定はどちらも 404。
     */
    client: (app: string, orgSlug: string) => {
      const qs = new URLSearchParams({ app, org_slug: orgSlug }).toString();
      return tx.request<BuiltinAppOAuthClient>("GET", `/auth/oauth/client?${qs}`);
    },
    /** GET /auth/userinfo — トークンの本人（失効・期限切れ・退職処理なら 401 / 404） */
    userinfo: () => tx.request<UserInfo>("GET", "/auth/userinfo"),
  };
}
