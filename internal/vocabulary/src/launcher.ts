/**
 * launcher — ヘッダーのアプリ一覧（ランチャー）とアカウントの箱の中身。ポータル・業務アプリ・
 * 組み込みアプリ（QaitoChat・Qaito Piazza・E-CALL・Qaito Park）が同じ中身を出すための 1 か所。
 *
 * 見た目は bf-ui の `AppLauncherMenu` / `PortalAccountMenu` が持ち、ここは**何を並べるか**だけを持つ
 * （呼び名・行き先のパス・アイコンの名前・テーマ色）。並びと見出しは `APP_KIND_ORDER` / `APP_KIND_LABELS`。
 * 入れるかどうかの判定は持たない（呼ぶ側が口の答え ── 表示権で絞ったアプリ・scope・コンソールに入れるか ── を渡す）。
 *
 * 【なぜ vocabulary か】行き先・アイコン・色まで文言の置き場に置くのは広いが、web と 4 つの組み込みアプリ
 * （別の Next アプリ）が共有でき、server と client の両方から読める kit がここだけのため（bf-ui は他の kit を
 * import しない・schemas は Zod の型の置き場・sdk は文言を持たない）。
 */
import { APP_KIND_LABELS } from "./app-kind";

/** 行き先が決まっている入口（基本アプリ・ポータル・管理コンソール）の見た目 */
export type LaunchMeta = {
  readonly slug: string;
  readonly label: string;
  /** ポータルの中のパス（ポータルの外からはポータルの origin を前に付ける） */
  readonly href: string;
  readonly iconName: string;
  readonly themeToken: string;
};

export const BASE_APP_THEME_COLORS = {
  portal: { light: "oklch(0.45 0.02 270)", dark: "oklch(0.70 0.02 270)" },
  drive: { light: "oklch(0.52 0.11 250)", dark: "oklch(0.70 0.11 250)" },
  calendar: { light: "oklch(0.52 0.085 190)", dark: "oklch(0.70 0.085 190)" },
  library: { light: "oklch(0.52 0.11 60)", dark: "oklch(0.70 0.11 60)" },
  chat: { light: "oklch(0.52 0.11 130)", dark: "oklch(0.70 0.11 130)" },
} as const;

export const DRIVE_LAUNCH: LaunchMeta = {
  slug: "drive",
  label: "Qaito ドライブ",
  href: "/files",
  iconName: "HardDrive",
  themeToken: BASE_APP_THEME_COLORS.drive.light,
};

export const CALENDAR_LAUNCH: LaunchMeta = {
  slug: "calendar",
  label: "Qaito カレンダー",
  href: "/calendar",
  iconName: "CalendarDays",
  themeToken: BASE_APP_THEME_COLORS.calendar.light,
};

export const LIBRARY_LAUNCH: LaunchMeta = {
  slug: "library",
  label: "Qaito ライブラリ",
  href: "/library",
  iconName: "BookOpen",
  themeToken: BASE_APP_THEME_COLORS.library.light,
};

/** 柱（アプリではない）。ランチャーの頭の帯に出す */
export const PORTAL_LAUNCH: LaunchMeta = {
  slug: "portal",
  label: "ポータル",
  href: "/",
  iconName: "House",
  themeToken: BASE_APP_THEME_COLORS.portal.light,
};

export const CONSOLE_LAUNCH: LaunchMeta = {
  slug: "console",
  label: "管理コンソール",
  href: "/",
  iconName: "SlidersHorizontal",
  themeToken: "oklch(0.528 0.096 248.8)",
};

/** ランチャーの 1 マス */
export type LauncherTile = {
  key: string;
  name: string;
  href: string;
  iconName: string | null;
  logoUrl?: string | null;
  themeToken?: string | null;
  /** 別タブで開く（連携アプリ） */
  external?: boolean;
  /** 最近使ったアプリの履歴に載せる印（業務アプリ） */
  appSlug?: string;
};

export type LauncherSection = { key: string; label: string; tiles: LauncherTile[] };

/** ランチャーに渡す素材。どれも呼ぶ側が口から取った答え（ここで絞らない） */
export type LauncherInput = {
  driveHref: string;
  /** `calendar:read` を持つ人だけ */
  calendarHref?: string | null;
  /** `library:read` を持つ人だけ */
  libraryHref?: string | null;
  /** 表示権で絞った業務アプリ（URL は組み立て済み） */
  apps: readonly { slug: string; name: string; url: string; iconName: string | null; logoUrl?: string | null; themeToken?: string | null }[];
  /** 拡張アプリ（builtinKey あり）と連携アプリ（なし） */
  externalApps: readonly { id: string; name: string; url: string; iconName: string | null; logoUrl?: string | null; themeToken?: string | null; builtinKey: string | null }[];
};

const tileOf = (m: LaunchMeta, href: string): LauncherTile => ({
  key: m.slug,
  name: m.label,
  href,
  iconName: m.iconName,
  themeToken: m.themeToken,
});

/** 区分ごとのまとまり（基本 → 拡張 → 業務 → 連携）。空のまとまりは出さない（基本アプリはドライブがあるので必ず出る） */
export function buildLauncherSections(input: LauncherInput): LauncherSection[] {
  const base: LauncherTile[] = [
    tileOf(DRIVE_LAUNCH, input.driveHref),
    ...(input.calendarHref ? [tileOf(CALENDAR_LAUNCH, input.calendarHref)] : []),
    ...(input.libraryHref ? [tileOf(LIBRARY_LAUNCH, input.libraryHref)] : []),
  ];
  const ext = (e: LauncherInput["externalApps"][number], external: boolean): LauncherTile => ({
    key: e.id,
    name: e.name,
    href: e.url,
    iconName: e.iconName,
    ...(e.logoUrl !== undefined ? { logoUrl: e.logoUrl } : {}),
    ...(e.themeToken !== undefined ? { themeToken: e.themeToken } : {}),
    external,
  });
  const sections: LauncherSection[] = [
    { key: "base", label: APP_KIND_LABELS.base, tiles: base },
    { key: "builtin", label: APP_KIND_LABELS.builtin, tiles: input.externalApps.filter((e) => e.builtinKey !== null).map((e) => ext(e, false)) },
    {
      key: "app",
      label: APP_KIND_LABELS.app,
      tiles: input.apps.map((a) => ({
        key: a.slug,
        name: a.name,
        href: a.url,
        iconName: a.iconName,
        ...(a.logoUrl !== undefined ? { logoUrl: a.logoUrl } : {}),
        ...(a.themeToken !== undefined ? { themeToken: a.themeToken } : {}),
        appSlug: a.slug,
      })),
    },
    { key: "linked", label: APP_KIND_LABELS.linked, tiles: input.externalApps.filter((e) => e.builtinKey === null).map((e) => ext(e, true)) },
  ];
  return sections.filter((s) => s.tiles.length > 0);
}

/** 柱の帯（ポータル・管理コンソール）。行き先が無いものは出さない */
export function buildLauncherPillars(links: { portalUrl: string | null; consoleUrl: string | null }): LauncherTile[] {
  return [
    ...(links.portalUrl ? [tileOf(PORTAL_LAUNCH, links.portalUrl)] : []),
    ...(links.consoleUrl ? [tileOf(CONSOLE_LAUNCH, links.consoleUrl)] : []),
  ];
}

/** アカウントの箱の行（ポータルの「自分まわり」）。`path` はポータルの中のパス */
export type AccountMenuEntry = {
  key: string;
  label: string;
  path: string;
  iconName: string;
  separatorBefore?: boolean;
  /** この scope を持つ人だけに出す（判定は呼ぶ側） */
  needs?: "calendar" | "library";
};

export const ACCOUNT_MENU_ENTRIES: readonly AccountMenuEntry[] = [
  { key: "profile", label: "プロフィール", path: "/profile", iconName: "Contact" },
  { key: "facility", label: "設定事業所", path: "/settings/facility", iconName: "Building2", separatorBefore: true },
  { key: "drive", label: DRIVE_LAUNCH.label, path: DRIVE_LAUNCH.href, iconName: DRIVE_LAUNCH.iconName },
  { key: "calendar", label: CALENDAR_LAUNCH.label, path: CALENDAR_LAUNCH.href, iconName: CALENDAR_LAUNCH.iconName, needs: "calendar" },
  { key: "library", label: LIBRARY_LAUNCH.label, path: LIBRARY_LAUNCH.href, iconName: LIBRARY_LAUNCH.iconName, needs: "library" },
  { key: "mfa", label: "MFA設定", path: "/settings/mfa", iconName: "ShieldCheck" },
  { key: "mcp", label: "MCP で接続", path: "/settings/mcp", iconName: "Link2" },
];

export const ACCOUNT_MENU_LABELS = {
  signout: "サインアウト",
  colorMode: "画面の明るさ",
  launcher: "アプリ一覧",
  launcherLoading: "読み込み中…",
  pillars: "ポータル・管理コンソール",
} as const;
