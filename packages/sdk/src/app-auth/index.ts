import { isOrgSlug } from "@qaito/schemas/org-registration";
import { isSafeNextPath } from "@qaito/schemas/return-to";
import { PORTAL_CONTEXT_COOKIES, PORTAL_SESSION_COOKIES } from "@qaito/schemas/external-apps";
import { portalCookieDomain, webHostOrigin } from "@qaito/schemas/app-domain";
import { isOpaqueUserToken } from "@qaito/schemas/user-token";
import { ERROR_MESSAGES } from "@qaito/vocabulary/errors";
import { QaitoOAuth, type OAuthTokens, type OAuthTokenStore } from "../auth.js";
import { QaitoClient } from "../client.js";
import { QaitoError } from "../error.js";

export type AppAuthConfig = {
  /** 組み込みキー（`@qaito/schemas/external-apps` の `BUILTIN_EXTERNAL_APPS`。例 `chat` / `piazza`） */
  app: string;
  /** Qaito API の base URL（サーバー間の呼び出しに使う） */
  apiBaseUrl: string;
  /** `NEXT_PUBLIC_APP_DOMAIN`（ポータル `{org}.{appDomain}` の組み立てに使う） */
  appDomain: string;
  /** このアプリの OAuth callback（組み込みアプリの台帳の redirect URI と一致させる） */
  redirectUri: string;
  /** cookie に Secure を付けるか（本番 true・ローカルの http は false） */
  secureCookies: boolean;
  /** cookie 名の接頭辞（既定 `qaito`） */
  cookiePrefix?: string;
  /** 組織 ID を覚えておく cookie の名前（既定 `{prefix}_{app}_org_slug`） */
  orgCookieName?: string;
  /** callback で氏名と scope を置く cookie（画面の表示用・HttpOnly）。省略時は置かない */
  userCookieName?: string;
  /** モバイル等の Bearer（OAuth のユーザートークン）も BFF で受けるか（既定 false = cookie だけ） */
  acceptBearer?: boolean;
  /** ログイン画面のパス。エラー・組織未入力・サインアウトで組織が分からないときにここへ戻す（既定 `/`）。ログインに成功したあとの既定の戻り先はアプリのトップ `/` */
  homePath?: string;
};

/**
 * アクセストークン cookie の寿命（秒）。トークン応答の `expires_in`（`QaitoOAuth` が `expiresAt` に直したもの）
 * から決める。読めなければ 0（cookie を置かない ＝ 次の `session` で延長する）
 */
export function accessMaxAgeSec(expiresAt: number, now = Date.now()): number {
  const sec = Math.floor((expiresAt - now) / 1000);
  return Number.isFinite(sec) && sec > 0 ? sec : 0;
}
/** リフレッシュトークン cookie の寿命（30 日） */
export const REFRESH_MAX_AGE_SEC = 30 * 24 * 3600;
/** 組織 ID cookie の寿命（90 日・次回のログインの省力化） */
export const ORG_MAX_AGE_SEC = 90 * 24 * 3600;
/** 認可フローの一時 cookie の寿命（10 分） */
const FLOW_MAX_AGE_SEC = 600;

/** ログイン画面へ戻すときの `?error=` の値（表示の文言はアプリが決める） */
export const APP_AUTH_ERRORS = {
  orgNotFound: "org_not_found",
  loginUnavailable: "login_unavailable",
  callbackFailed: "callback_failed",
} as const;

/** `POST session` の 401 の `code`（延長できなかった） */
export const SESSION_EXPIRED_CODE = "session_expired";

export function parseCookie(cookieHeader: string, name: string): string | undefined {
  const re = new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`);
  return cookieHeader.match(re)?.[1];
}

export function createAppAuth(config: AppAuthConfig) {
  const prefix = config.cookiePrefix ?? "qaito";
  const names = {
    access: `${prefix}_access_token`,
    refresh: `${prefix}_refresh_token`,
    clientId: `${prefix}_oauth_client_id`,
    state: `${prefix}_oauth_state`,
    verifier: `${prefix}_pkce_verifier`,
    next: `${prefix}_login_next`,
    org: config.orgCookieName ?? `${prefix}_${config.app}_org_slug`,
  };
  const home = config.homePath ?? "/";

  function setCookie(name: string, value: string, maxAge: number, domain?: string): string {
    const parts = [`${name}=${value}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${maxAge}`];
    if (domain) parts.push(`Domain=${domain}`);
    if (config.secureCookies) parts.push("Secure");
    return parts.join("; ");
  }
  const clearCookie = (name: string, domain?: string) => setCookie(name, "", 0, domain);

  /**
   * 相対の Location で返す（`req.url` の origin は ECS ではバインドアドレス `0.0.0.0` になるため使わない）。
   */
  function redirect(location: string, cookies: string[] = []): Response {
    const headers = new Headers([["Location", location]]);
    for (const c of cookies) headers.append("Set-Cookie", c);
    return new Response(null, { status: 307, headers });
  }
  const homeWith = (param: string, value: string) =>
    `${home}${home.includes("?") ? "&" : "?"}${new URLSearchParams({ [param]: value }).toString()}`;

  function json(body: unknown, status: number, cookies: string[] = []): Response {
    const headers = new Headers([
      ["Content-Type", "application/json"],
      ["Cache-Control", "no-store"],
    ]);
    for (const c of cookies) headers.append("Set-Cookie", c);
    return new Response(JSON.stringify(body), { status, headers });
  }

  function portalOrigin(orgSlug: string): string {
    return webHostOrigin(orgSlug, config.appDomain);
  }

  /** 組織 ID → この組織のこのアプリの OAuth 公開クライアント ID（ログイン前の口）。無ければ null */
  async function resolveClientId(orgSlug: string): Promise<string | null> {
    try {
      const data = await new QaitoClient({ baseUrl: config.apiBaseUrl }).oauth.client(config.app, orgSlug);
      return data.client_id;
    } catch {
      return null;
    }
  }

  /** cookie を書き出す保存先（延長・交換で得たトークンを Set-Cookie に積む） */
  function cookieStore(cookieHeader: string, out: string[]): OAuthTokenStore {
    return {
      load: () => {
        const refreshToken = parseCookie(cookieHeader, names.refresh);
        const accessToken = parseCookie(cookieHeader, names.access);
        if (!refreshToken && !accessToken) return null;
        return { accessToken: accessToken ?? "", refreshToken: refreshToken ?? "", expiresAt: 0 };
      },
      save: (t: OAuthTokens) => {
        out.push(setCookie(names.access, t.accessToken, accessMaxAgeSec(t.expiresAt)));
        out.push(setCookie(names.refresh, t.refreshToken, REFRESH_MAX_AGE_SEC));
      },
      clear: () => {
        out.push(clearCookie(names.access), clearCookie(names.refresh));
      },
    };
  }

  function oauthFor(clientId: string, cookieHeader: string, out: string[]): QaitoOAuth {
    return new QaitoOAuth({
      apiKeyPrefix: clientId,
      baseUrl: config.apiBaseUrl,
      redirectUri: config.redirectUri,
      tokenStore: cookieStore(cookieHeader, out),
    });
  }

  /**
   * リフレッシュトークンで延長し、新しいトークンの Set-Cookie を `out` に積む。延長できたら true。
   * client_id は cookie（callback で保存）を使い、無ければ組織 ID から引き直す。
   */
  async function refreshInto(cookieHeader: string, out: string[]): Promise<{ ok: boolean; accessToken?: string }> {
    if (!parseCookie(cookieHeader, names.refresh)) return { ok: false };
    let clientId = parseCookie(cookieHeader, names.clientId) ?? null;
    if (!clientId) {
      const org = parseCookie(cookieHeader, names.org);
      if (!isOrgSlug(org)) return { ok: false };
      clientId = await resolveClientId(org);
      if (!clientId) return { ok: false };
      out.push(setCookie(names.clientId, clientId, REFRESH_MAX_AGE_SEC));
    }
    const oauth = oauthFor(clientId, cookieHeader, out);
    await oauth.restore();
    const refreshed = await oauth.refreshToken();
    const accessToken = oauth.getAccessToken();
    return refreshed && accessToken ? { ok: true, accessToken } : { ok: false };
  }

  /** `valid` = 使える / `invalid` = サーバが拒否した / `unknown` = 確かめられなかった */
  async function verify(userToken: string): Promise<"valid" | "invalid" | "unknown"> {
    try {
      await new QaitoClient({ baseUrl: config.apiBaseUrl, userToken }).oauth.userinfo();
      return "valid";
    } catch (error) {
      if (error instanceof QaitoError && (error.status === 401 || error.status === 404)) return "invalid";
      return "unknown";
    }
  }

  /**
   * ログインを始める組織。アプリが覚えている組織、無ければポータルが親ドメインに置いた組織 ID の cookie。
   * ポータルの組織 ID は資格情報ではなく「どの組織で認可を始めるか」の手がかりで、入ってよいかはポータルの認可が決める。
   * これがあるので、ポータルにログインしていれば、アプリを直接開いても組織 ID を聞かずに入れる
   */
  function rememberedOrg(cookieHeader: string): string | undefined {
    for (const name of [names.org, PORTAL_SESSION_COOKIES.orgSlug]) {
      const org = parseCookie(cookieHeader, name);
      if (isOrgSlug(org)) return org;
    }
    return undefined;
  }

  /** GET login — `?org=`（無ければ覚えている組織）でポータルの認可へ送る。`?next=` はログイン後の戻り先（相対パス） */
  async function login(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const cookieHeader = req.headers.get("cookie") ?? "";
    const org = url.searchParams.get("org") ?? rememberedOrg(cookieHeader);
    if (!isOrgSlug(org)) return redirect(homeWith("need_org", "1"));

    const clientId = await resolveClientId(org);
    if (!clientId) return redirect(homeWith("error", APP_AUTH_ERRORS.orgNotFound));

    let authorizeUrl: string;
    let state: string;
    let codeVerifier: string;
    try {
      ({ url: authorizeUrl, state, codeVerifier } = await oauthFor(clientId, "", []).getAuthorizationUrl({
        portalBaseUrl: portalOrigin(org),
      }));
    } catch {
      return redirect(homeWith("error", APP_AUTH_ERRORS.loginUnavailable));
    }

    const next = url.searchParams.get("next");
    return redirect(authorizeUrl, [
      setCookie(names.state, state, FLOW_MAX_AGE_SEC),
      setCookie(names.verifier, codeVerifier, FLOW_MAX_AGE_SEC),
      setCookie(names.clientId, clientId, REFRESH_MAX_AGE_SEC),
      setCookie(names.org, org, ORG_MAX_AGE_SEC),
      ...(isSafeNextPath(next) ? [setCookie(names.next, encodeURIComponent(next), FLOW_MAX_AGE_SEC)] : []),
    ]);
  }

  /** GET callback — state を確かめ、認可コードをトークンに交換して cookie に置き、戻り先へ */
  async function callback(req: Request): Promise<Response> {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const expectedState = parseCookie(cookieHeader, names.state);
    const verifier = parseCookie(cookieHeader, names.verifier);
    const clientId = parseCookie(cookieHeader, names.clientId);
    if (!expectedState || !clientId) return redirect(homeWith("error", APP_AUTH_ERRORS.callbackFailed));

    const out: string[] = [];
    const oauth = oauthFor(clientId, "", out);
    try {
      await oauth.handleCallback(req.url, expectedState, verifier);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "app_auth_callback_failed",
          app: config.app,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return redirect(homeWith("error", APP_AUTH_ERRORS.callbackFailed));
    }

    const user = oauth.getUser();
    if (config.userCookieName && user) {
      out.push(
        setCookie(
          config.userCookieName,
          encodeURIComponent(JSON.stringify({ name: user.name, scopes: user.scopes })),
          REFRESH_MAX_AGE_SEC,
        ),
      );
    }

    let location = "/";
    const nextRaw = parseCookie(cookieHeader, names.next);
    if (nextRaw) {
      try {
        const next = decodeURIComponent(nextRaw);
        if (isSafeNextPath(next)) location = next;
      } catch {
      }
    }
    out.push(clearCookie(names.state), clearCookie(names.verifier), clearCookie(names.next));
    return redirect(location, out);
  }

  /** POST refresh — 延長だけを行う（画面は session を使う） */
  async function refresh(req: Request): Promise<Response> {
    const out: string[] = [];
    const r = await refreshInto(req.headers.get("cookie") ?? "", out);
    if (!r.ok) return json({ success: false, code: SESSION_EXPIRED_CODE }, 401);
    return json({ success: true }, 200, out);
  }

  /**
   * POST session — ログインセッションが使えるかを**サーバ側で**確かめ、必要なら延長する。
   * 200 = 使える / 401 `session_expired` = 延長できない（死んだ access cookie は消す）/ 503 = 確かめられない。
   */
  async function session(req: Request): Promise<Response> {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const accessToken = parseCookie(cookieHeader, names.access);
    if (accessToken) {
      const verdict = await verify(accessToken);
      if (verdict === "valid") return json({ success: true }, 200);
      if (verdict === "unknown") return json({ success: false, code: "SESSION_CHECK_UNAVAILABLE" }, 503);
    }
    const expired = () =>
      json({ success: false, code: SESSION_EXPIRED_CODE }, 401, accessToken ? [clearCookie(names.access)] : []);

    const out: string[] = [];
    const r = await refreshInto(cookieHeader, out);
    if (!r.ok || !r.accessToken) return expired();
    if ((await verify(r.accessToken)) === "invalid") return json({ success: false, code: SESSION_EXPIRED_CODE }, 401, [clearCookie(names.access)]);
    return json({ success: true }, 200, out);
  }

  /**
   * POST logout — サインアウト。応答の `signinUrl` へ画面を送る。
   *
   * 1. 本人のトークンでサーバ側を失効させる（アクセスとリフレッシュは同じ行なので 1 本で両方止まる・qaito#651）
   * 2. アプリの cookie を消す
   * 3. **ポータルのログインの cookie も消す。** 残すと、次に開いたとき OAuth の認可がポータルのログインを
   *    見つけ、同意画面も無い（自社アプリ）ので、ログイン画面を一度も出さずに前の人のまま入ってしまう。
   *    端末を共用する現場では、職員 B が職員 A のアカウントで入る事故になる
   * 4. 行き先は、覚えている組織のポータルのログイン画面（組織が分からなければアプリのログイン画面）
   */
  async function logout(req: Request): Promise<Response> {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const out: string[] = [];
    const oauth = oauthFor(parseCookie(cookieHeader, names.clientId) ?? config.app, cookieHeader, out);
    if (await oauth.restore()) await oauth.revokeToken();

    for (const name of [names.access, names.refresh, names.clientId, names.state, names.verifier, names.next]) {
      out.push(clearCookie(name));
    }
    if (config.userCookieName) out.push(clearCookie(config.userCookieName));
    const domain = portalCookieDomain(config.appDomain);
    for (const name of [...Object.values(PORTAL_SESSION_COOKIES), ...Object.values(PORTAL_CONTEXT_COOKIES)]) {
      out.push(clearCookie(name, domain));
      if (domain) out.push(clearCookie(name));
    }
    const org = parseCookie(cookieHeader, names.org);
    const signinUrl = isOrgSlug(org) ? `${portalOrigin(org)}/signin` : home;
    return json({ success: true, signinUrl }, 200, out);
  }

  /** リクエストからユーザートークンを取り出す（cookie。`acceptBearer` なら Bearer も）。無ければ undefined */
  function getUserToken(req: Request): string | undefined {
    const fromCookie = parseCookie(req.headers.get("cookie") ?? "", names.access);
    if (fromCookie) return fromCookie;
    if (!config.acceptBearer) return undefined;
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    return isOpaqueUserToken(bearer) ? bearer : undefined;
  }

  /** BFF の入口用。トークンがあれば文字列、無ければ 401 の Response を返す */
  function requireUserToken(req: Request): string | Response {
    return getUserToken(req) ?? json({ success: false, error: ERROR_MESSAGES.unauthorized, code: "UNAUTHORIZED" }, 401);
  }

  /** 覚えている組織 ID（アプリの cookie、無ければポータルの組織 ID の cookie。形が崩れていれば undefined） */
  function getOrgSlug(req: Request): string | undefined {
    return rememberedOrg(req.headers.get("cookie") ?? "");
  }

  return {
    login,
    callback,
    refresh,
    session,
    logout,
    getUserToken,
    requireUserToken,
    getOrgSlug,
    /** その組織のポータルの origin（「ポータルへ戻る」の行き先） */
    portalOrigin,
    /** cookie の名前（画面の分岐で読むため） */
    cookieNames: names,
  };
}

export type AppAuth = ReturnType<typeof createAppAuth>;
