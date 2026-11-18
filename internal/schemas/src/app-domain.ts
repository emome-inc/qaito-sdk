
export const WEB_HOST_DEV_PORT = 3000;

/** `appDomain` がローカル開発か（`localhost` / `*.localhost`）。 */
export function isLocalAppDomain(appDomain: string): boolean {
  return appDomain === "localhost" || appDomain.endsWith(".localhost");
}

/**
 * web が受けるホスト（ポータル `{org}.{appDomain}`・業務アプリ・コンソール）の origin。
 * 本番は `https://{subdomain}.{appDomain}`、ローカルは `http://{subdomain}.{appDomain}:3000`。
 * 組み込みの外部アプリ（別ホスト・別ポート）は `./external-apps` の `builtinExternalAppOrigin` を使う。
 */
export function webHostOrigin(subdomain: string, appDomain: string): string {
  return isLocalAppDomain(appDomain)
    ? `http://${subdomain}.${appDomain}:${WEB_HOST_DEV_PORT}`
    : `https://${subdomain}.${appDomain}`;
}

export function portalCookieDomain(appDomain: string | null | undefined): string | undefined {
  if (!appDomain || appDomain === "localhost") return undefined;
  return `.${appDomain}`;
}
