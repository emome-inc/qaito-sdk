/**
 * app-header — 組み込みアプリ（QaitoChat・Qaito Piazza・E-CALL。DB を持たない別の Next アプリ）のヘッダーに、
 * ポータルと同じアプリ一覧（ランチャー）とアカウントの箱を出すための組み立て。
 *
 * 受け取るのは api の答え（`GET /auth/userinfo`・`GET /apps`・`GET /integration/launcher`）だけで、入れるかの判定は
 * しない（判定は api のゲートと表示権の 1 か所）。ここは行き先の URL を組み、`@qaito/vocabulary` の並べ方に渡す。
 * 3 つのアプリが同じものを出すために 1 か所に置く（web は自分の画面の中で `app-launcher` / `account-menu` が同じ並べ方を使う）。
 * URL の組み方（`@qaito/schemas/app-domain` の `webHostOrigin`・`external-apps` の `builtinExternalAppLaunchUrl`）は
 * 呼ぶ側が渡す（vocabulary は他の kit を import しない）。
 */
import {
  ACCOUNT_MENU_ENTRIES,
  CALENDAR_LAUNCH,
  DRIVE_LAUNCH,
  LIBRARY_LAUNCH,
  buildLauncherPillars,
  buildLauncherSections,
  type LauncherInput,
  type LauncherSection,
  type LauncherTile,
} from "./launcher";

/** `GET /apps` の 1 行のうち使うもの */
type InternalApp = { slug: string; name: string; icon_name: string; theme_token: string; path: string; logo_url: string | null };
/** `GET /integration/launcher` の外部アプリの 1 行のうち使うもの */
type ExternalApp = {
  id: string;
  name: string;
  icon_name: string;
  theme_token: string;
  logo_url: string | null;
  url: string;
  builtin_key: string | null;
};

/** URL の組み方（`@qaito/schemas` の関数を渡す） */
export type AppHeaderUrls = {
  /** `{sub}.{appDomain}` の origin（`webHostOrigin`） */
  hostOrigin: (subdomain: string) => string;
  /** 組み込みアプリの入口（`builtinExternalAppLaunchUrl`）。台帳に無いキーは null */
  builtinLaunchUrl: (builtinKey: string, orgSlug: string | null) => string | null;
};

export type AppHeaderInput = {
  /** ログインのときの組織 ID（ポータルの origin と組み込みアプリの入口に使う）。無ければポータルの行き先を出さない */
  orgSlug: string | null;
  /** `GET /auth/userinfo` の avatar_version */
  avatarVersion: string | null;
  apps: readonly InternalApp[];
  /** `GET /integration/launcher`（カレンダー・ライブラリ・管理コンソールを出すかは api が決めて返す。ここで scope を見ない） */
  launcher: {
    console_access: boolean;
    calendar_access: boolean;
    library_access: boolean;
    external_apps: readonly ExternalApp[];
  };
  /** 今いる組み込みアプリのキー（そのマスに印を付ける） */
  currentBuiltinKey?: string;
};

export type AppHeaderAccountEntry = { key: string; label: string; href: string; iconName: string; separatorBefore?: boolean };

export type AppHeaderMaterials = {
  sections: LauncherSection[];
  pillars: LauncherTile[];
  accountEntries: AppHeaderAccountEntry[];
  /** 本人の顔写真（web の `/api/me/photo` の中継）。無ければ null */
  avatarUrl: string | null;
  /** 今いるアプリのマスの key（`AppLauncherMenu` の currentKey） */
  currentKey: string | null;
};

/**
 * 本番のロゴは同一オリジンの相対パス（`/user-profiles/...`）なので、別のホストからは web の固定のホストの origin を付ける。
 * 顔写真（web の `/api/me/photo`。ログインの cookie は `.{appDomain}` で共有）も同じホストから読む。
 * 組織ごとのポータルのホスト（`{org}.{appDomain}`）にしないのは、3 つのアプリの CSP の img-src を完全一致の固定の
 * オリジンで書くため（ワイルドカードを使わない）。
 */
const ASSET_HOST = "console";

function absolute(url: string | null, origin: string): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${origin}${url}` : url;
}

export function buildAppHeaderMaterials(input: AppHeaderInput, urls: AppHeaderUrls): AppHeaderMaterials {
  const portal = input.orgSlug ? urls.hostOrigin(input.orgSlug) : null;
  const assets = urls.hostOrigin(ASSET_HOST);
  const showCalendar = input.launcher.calendar_access;
  const showLibrary = input.launcher.library_access;

  const externalApps: LauncherInput["externalApps"][number][] = [];
  for (const e of input.launcher.external_apps) {
    if (e.builtin_key === null) {
      externalApps.push({ ...toTile(e, assets), url: e.url, builtinKey: null });
      continue;
    }
    const url = urls.builtinLaunchUrl(e.builtin_key, input.orgSlug);
    if (url) externalApps.push({ ...toTile(e, assets), url, builtinKey: e.builtin_key });
  }

  const sections = portal
    ? buildLauncherSections({
        driveHref: `${portal}${DRIVE_LAUNCH.href}`,
        calendarHref: showCalendar ? `${portal}${CALENDAR_LAUNCH.href}` : null,
        libraryHref: showLibrary ? `${portal}${LIBRARY_LAUNCH.href}` : null,
        apps: input.apps.map((a) => ({
          slug: a.slug,
          name: a.name,
          url: `${urls.hostOrigin(a.slug)}${a.path === "/" ? "" : a.path}`,
          iconName: a.icon_name,
          logoUrl: absolute(a.logo_url, assets),
          themeToken: a.theme_token,
        })),
        externalApps,
      })
    : [];

  const accountEntries: AppHeaderAccountEntry[] = portal
    ? ACCOUNT_MENU_ENTRIES.filter(
        (e) => (e.needs !== "calendar" || showCalendar) && (e.needs !== "library" || showLibrary),
      ).map((e) => ({
        key: e.key,
        label: e.label,
        href: `${portal}${e.path}`,
        iconName: e.iconName,
        ...(e.separatorBefore ? { separatorBefore: true } : {}),
      }))
    : [];

  return {
    sections,
    pillars: buildLauncherPillars({
      portalUrl: portal,
      consoleUrl: input.launcher.console_access ? urls.hostOrigin("console") : null,
    }),
    accountEntries,
    currentKey: input.launcher.external_apps.find((e) => e.builtin_key !== null && e.builtin_key === input.currentBuiltinKey)?.id ?? null,
    avatarUrl: input.avatarVersion ? `${assets}/api/me/photo?v=${encodeURIComponent(input.avatarVersion)}` : null,
  };
}

function toTile(e: ExternalApp, origin: string) {
  return { id: e.id, name: e.name, iconName: e.icon_name, logoUrl: absolute(e.logo_url, origin), themeToken: e.theme_token };
}
