import type { ApiResponse, TokenResponse, OAuthUser } from "./types.js";

/** トークンの組（保存先とのやり取りの単位）。 */
export type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** アクセストークンの期限（epoch ms） */
  expiresAt: number;
};

/**
 * トークンの保存先。**どこに置くかはアプリが決める**（サーバーの cookie・モバイルの secure-store 等）。
 *
 * `QaitoOAuth` は発行・延長のたびに `save`、ログアウトで `clear` を呼び、`restore()` で `load` から読み戻す。
 * 延長（refresh）ではリフレッシュトークンがローテーションされるので、保存し直さないと
 * 次の延長で古いトークンを使って失敗する。
 */
export type OAuthTokenStore = {
  load(): OAuthTokens | null | Promise<OAuthTokens | null>;
  save(tokens: OAuthTokens): void | Promise<void>;
  clear(): void | Promise<void>;
};

export type QaitoOAuthOptions = {
  /**
   * 通常（confidential client）モード: raw API キー。
   * public client（PKCE）モードでは使用しない（apiKeyPrefix を指定する）。
   */
  apiKey?: string;
  /**
   * public client モード: key_prefix のみ（raw キー不要）。
   * 組み込みの外部アプリが `oauth.client(app, orgSlug)`（GET /auth/oauth/client）で取得した client_id を渡す。
   * PKCE（code_verifier）が必須なため secret なしで安全に動作する（RFC 7636）。
   */
  apiKeyPrefix?: string;
  baseUrl: string;
  /**
   * @deprecated portalUrl は getAuthorizationUrl の引数 `portalBaseUrl` に移動した。
   * 後方互換のため残すが、設定値は getAuthorizationUrl の portalBaseUrl 引数で上書きされる。
   */
  portalUrl?: string;
  redirectUri: string;
  /**
   * トークンが更新された時（初回発行・リフレッシュ）に呼ばれる。
   * refresh token はローテーションされるため、永続ストレージ（モバイルの
   * secure-store 等）を持つクライアントはここで必ず保存し直すこと。
   * 保存しないと「メモリ内でリフレッシュ → 旧 refresh token が失効 →
   * アプリ再起動で復元不能 = 強制再ログイン」になる。
   */
  onTokensChanged?: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }) => void;
  /** トークンの保存先（`OAuthTokenStore`）。省略時はインスタンスのメモリだけに持つ。 */
  tokenStore?: OAuthTokenStore;
};

export class QaitoOAuth {
  /** confidential client の raw API キー（public client モードでは undefined）*/
  private apiKey: string | undefined;
  /** public client の key_prefix（confidential client モードでは undefined）*/
  private apiKeyPrefix: string | undefined;
  private baseUrl: string;
  private redirectUri: string;
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private expiresAt: number = 0;
  private user: OAuthUser | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private codeVerifier: string | null = null;
  private onTokensChanged?: QaitoOAuthOptions["onTokensChanged"];
  private tokenStore?: OAuthTokenStore;

  constructor(options: QaitoOAuthOptions) {
    this.apiKey = options.apiKey;
    this.apiKeyPrefix = options.apiKeyPrefix;
    this.baseUrl = options.baseUrl;
    this.redirectUri = options.redirectUri;
    this.onTokensChanged = options.onTokensChanged;
    this.tokenStore = options.tokenStore;

    if (!this.apiKey && !this.apiKeyPrefix) {
      throw new Error("QaitoOAuth: apiKey または apiKeyPrefix のどちらかが必要です");
    }
  }

  /** PKCE code_verifier を生成（43-128文字のランダム文字列） */
  private static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /** code_verifier から code_challenge（S256）を計算 */
  private static async computeCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async getAuthorizationUrl(options: {
    /**
     * OAuth2 スコープ（スペース区切り）。
     *
     * 省略可能（RFC 6749 §3.3）: 省略した場合は `scope` パラメータを URL に含めない。
     * 認可サーバ（`/oauth/authorize`）はクライアント登録済みスコープを既定値として使う。
     * 有効スコープを毎回全列挙すると authorize URL のクエリ文字列が肥大化し、
     * WAF の SizeRestrictions_QUERYSTRING（2048 バイト）で 403（→ CloudFront で 404 化）
     * になる事故が起きたため、原則は省略を推奨する（2026-08-17 本番障害の恒久修正）。
     */
    scope?: string;
    state?: string;
    /**
     * OAuth2 authorize エンドポイントのベース URL（例: `https://test-org.app.qaito.ai`）。
     * 従来は constructor の `portalUrl` に固定していたが、multi-tenant 化のため引数に移動した。
     */
    portalBaseUrl: string;
  }): Promise<{ url: string; state: string; codeVerifier: string }> {
    const state = options.state ?? crypto.randomUUID();
    const codeVerifier = QaitoOAuth.generateCodeVerifier();
    const codeChallenge = await QaitoOAuth.computeCodeChallenge(codeVerifier);

    this.codeVerifier = codeVerifier;

    const url = new URL("/oauth/authorize", options.portalBaseUrl);
    const clientId = this.apiKeyPrefix ?? (this.apiKey ? this.apiKey.slice(0, 21) : "");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    if (options.scope) {
      url.searchParams.set("scope", options.scope);
    }
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return { url: url.toString(), state, codeVerifier };
  }

  /**
   * コールバック URL からトークンを取得する。
   *
   * public client モード（apiKeyPrefix 指定時）:
   *   - Authorization ヘッダなし
   *   - body に client_id（prefix）を含めてトークン交換
   *   - PKCE（code_verifier）を含めることが必須（PKCE なしは token.ts が invalid_grant を返す）
   *
   * confidential client モード（apiKey 指定時）:
   *   - Authorization: Bearer {rawKey} ヘッダでトークン交換（従来通り）
   */
  async handleCallback(callbackUrl: string, expectedState?: string, codeVerifier?: string): Promise<void> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get("code");
    if (!code) throw new Error("認可コードがありません");

    if (expectedState !== undefined) {
      const actualState = url.searchParams.get("state");
      if (actualState !== expectedState) {
        throw new Error("state が一致しません（CSRF 検証失敗）");
      }
    }

    const verifier = codeVerifier ?? this.codeVerifier;

    const isPublicClient = !!this.apiKeyPrefix;
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!isPublicClient && this.apiKey) {
      requestHeaders["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        grant_type: "authorization_code",
        ...(isPublicClient ? { client_id: this.apiKeyPrefix } : {}),
        code,
        redirect_uri: this.redirectUri,
        ...(verifier && { code_verifier: verifier }),
      }),
    });

    const json = (await response.json()) as ApiResponse<TokenResponse>;
    if (!json.success) throw new Error(json.error);

    this.accessToken = json.data.access_token;
    this.refreshTokenValue = json.data.refresh_token;
    this.expiresAt = Date.now() + json.data.expires_in * 1000;
    this.user = json.data.user ?? null;
    this.codeVerifier = null;
    await this.notifyTokensChanged();
  }

  /** 発行・延長のたびに、保存先へ書き、フックを呼ぶ。 */
  private async notifyTokensChanged(): Promise<void> {
    if (!this.accessToken || !this.refreshTokenValue) return;
    const tokens = { accessToken: this.accessToken, refreshToken: this.refreshTokenValue, expiresAt: this.expiresAt };
    if (this.tokenStore) await this.tokenStore.save(tokens);
    this.onTokensChanged?.(tokens);
  }

  /**
   * 保存先（`tokenStore`）からトークンを読み戻す。読めたら true。
   * サーバーではリクエストごとにインスタンスを作り、cookie から読み戻してから延長・失効を呼ぶ。
   */
  async restore(): Promise<boolean> {
    if (!this.tokenStore) return false;
    const tokens = await this.tokenStore.load();
    if (!tokens) return false;
    this.accessToken = tokens.accessToken || null;
    this.refreshTokenValue = tokens.refreshToken || null;
    this.expiresAt = tokens.expiresAt;
    return true;
  }

  /** トークンをリフレッシュ（並行呼び出し時はロックで1回にまとめる） */
  async refreshToken(): Promise<boolean> {
    if (!this.refreshTokenValue) return false;
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this._doRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async _doRefresh(): Promise<boolean> {
    try {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        requestHeaders["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: this.refreshTokenValue,
          ...(this.apiKeyPrefix ? { client_id: this.apiKeyPrefix } : {}),
        }),
      });

      const json = (await response.json()) as ApiResponse<TokenResponse>;
      if (!json.success) return false;

      this.accessToken = json.data.access_token;
      this.refreshTokenValue = json.data.refresh_token;
      this.expiresAt = Date.now() + json.data.expires_in * 1000;
      await this.notifyTokensChanged();
      return true;
    } catch {
      return false;
    }
  }

  /** 外部から取得済みトークンを注入する */
  setTokens(tokens: { accessToken: string; refreshToken: string; expiresAt: number }): void {
    this.accessToken = tokens.accessToken;
    this.refreshTokenValue = tokens.refreshToken;
    this.expiresAt = tokens.expiresAt;
  }

  /** 現在のトークン状態を取得する */
  getTokens(): { accessToken: string | null; refreshToken: string | null; expiresAt: number } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshTokenValue,
      expiresAt: this.expiresAt,
    };
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  getUser(): OAuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.expiresAt;
  }

  async revokeToken(): Promise<void> {
    try {
      if (this.apiKey) {
        const token = this.accessToken || this.refreshTokenValue;
        if (token) {
          const response = await fetch(`${this.baseUrl}/auth/token/revoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
            body: JSON.stringify({ token }),
          });
          if (!response.ok) console.error(`Token revocation failed: ${response.status}`);
        }
      } else {
        if (!this.accessToken && this.refreshTokenValue) await this.refreshToken();
        if (this.accessToken) {
          const response = await fetch(`${this.baseUrl}/integration/oauth-tokens/revoke`, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.accessToken}` },
          });
          if (!response.ok) console.error(`Token revocation failed: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Token revocation error:", err instanceof Error ? err.message : String(err));
    }

    this.accessToken = null;
    this.refreshTokenValue = null;
    this.expiresAt = 0;
    this.user = null;
    if (this.tokenStore) await this.tokenStore.clear();
  }
}
