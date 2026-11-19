import { z } from "zod";
import { isLocalAppDomain } from "./app-domain";

export const EXTERNAL_APP_FEATURE_LABEL = "連携アプリ";

/** タイルのアクセント色プリセット（bf テーマの oklch 系。棚の Qaito アプリと同じ質感） */
export const EXTERNAL_APP_THEME_PRESETS = [
  "oklch(0.55 0.12 301)",
  "oklch(0.55 0.13 210)",
  "oklch(0.545 0.110 160)",
  "oklch(0.55 0.12 60)",
  "oklch(0.55 0.14 25)",
  "oklch(0.55 0.10 250)",
  "oklch(0.55 0.09 120)",
  "oklch(0.45 0.02 270)",
] as const;

/** タイルのアイコン候補（MODULE_ICON_MAP に存在する lucide 名から抜粋） */
export const EXTERNAL_APP_ICON_PRESETS = [
  "AppWindow",
  "Globe",
  "Phone",
  "Video",
  "FileText",
  "Calendar",
  "Wrench",
  "Link2",
] as const;

const httpUrl = z
  .string()
  .url("正しい URL を入力してください")
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), "http(s) の URL を指定してください");

const metadataFields = {
  name: z.string().min(1, "アプリ名は必須です").max(100),
  description: z.string().max(200, "説明は 200 文字以内です").optional().default(""),
  iconName: z.string().max(50).optional().default("AppWindow"),
  themeToken: z.string().max(50).optional().default(EXTERNAL_APP_THEME_PRESETS[0]),
};

export const createExternalAppSchema = z.object({
  ...metadataFields,
  url: httpUrl,
});

export const updateExternalAppSchema = z.object({
  name: metadataFields.name.optional(),
  description: z.string().max(200).optional(),
  iconName: z.string().max(50).optional(),
  themeToken: z.string().max(50).optional(),
  url: httpUrl.optional(),
  enabled: z.boolean().optional(),
});

export const verificationDetailSchema = z.object({
  /** ログイン用の ID を発行しているか */
  clientIssued: z.boolean(),
  /** その ID で最後にログインした日時（ISO）。まだなら null */
  lastLoginAt: z.string().nullable(),
  /** その ID でログインしたことのある人の数 */
  loginUsers: z.number().int().nonnegative(),
  checkedAt: z.string(),
  notes: z.array(z.string()).optional(),
});

/** 連携アプリのログイン用の鍵の用途（`shared.api_keys.key_purpose`） */
export const LINKED_APP_OAUTH_KEY_PURPOSE = "linked_app_oauth";

/** ログインのあと戻ってよい URL の上限 */
export const LINKED_APP_REDIRECT_URI_MAX = 10;

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\]|([a-z0-9-]+\.)+localhost)$/i;

/**
 * 戻り先の URL 1 つ。https は任意のホスト。http は手元の開発（localhost・127.0.0.1・*.localhost）だけ。
 * `#` を含むものは受けない（OAuth の戻り先に fragment は使えない）。
 */
export const linkedAppRedirectUriSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    let u: URL;
    try {
      u = new URL(v);
    } catch {
      return false;
    }
    if (u.hash || u.username || u.password) return false;
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && LOCAL_HOSTS.test(u.hostname);
  }, "コールバック URL は https、または開発用の http://localhost にしてください");

export const linkedAppRedirectUrisSchema = z
  .array(linkedAppRedirectUriSchema)
  .min(1, "コールバック URL を 1 つ以上入れてください")
  .max(LINKED_APP_REDIRECT_URI_MAX, `コールバック URL は ${LINKED_APP_REDIRECT_URI_MAX} 件までです`)
  .refine((list) => new Set(list).size === list.length, "同じ URL が 2 回入っています");

/** 手元の開発の戻り先（http の localhost・127.0.0.1・*.localhost）か */
export function isLocalRedirectUri(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" && LOCAL_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

/** 手元の開発の戻り先を許す環境（完全一致の許可リスト。これ以外・未設定・一字違いは許さない） */
const LOCAL_REDIRECT_ENVS = new Set(["nonprod", "sandbox", "local"]);

export function allowsLocalRedirectUris(env: { NODE_ENV?: string; QAITO_ENV?: string }): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.QAITO_ENV !== undefined && LOCAL_REDIRECT_ENVS.has(env.QAITO_ENV);
}

export type CreateExternalAppInput = z.infer<typeof createExternalAppSchema>;
export type UpdateExternalAppInput = z.infer<typeof updateExternalAppSchema>;

/** 組み込み外部アプリ 1 つぶんの定義。 */
export type BuiltinExternalAppDef = {
  /** 登録簿・ポータルの棚に出す既定の名前。 */
  readonly name: string;
  readonly description: string;
  readonly iconName: string;
  readonly themeToken: string;
  /** 本番のホスト名の先頭（`{subdomain}.{appDomain}`）。 */
  readonly subdomain: string;
  /** ローカル開発の origin（`appDomain` が `localhost` / `*.localhost` のとき）。 */
  readonly localOrigin: (appDomain: string) => string;
  /** OAuth の callback のパス（origin からの相対）。 */
  readonly callbackPaths: readonly string[];
  /** origin の外にある redirect URI（dev の loopback 等）。モバイルの戻り先は `mobile` 項から導くのでここに書かない。 */
  readonly extraRedirectUris?: {
    readonly local: readonly string[];
    readonly deployed: (origin: string) => readonly string[];
  };
  /** OAuth クライアントの鍵（`shared.api_keys.key_purpose`）。SDK連携の画面には出さない内部の鍵。 */
  readonly keyPurpose: string;
  /** dev の seed がメンバーのグループへ割り当てる、このアプリだけを入れた権限セットの名前と説明。 */
  readonly memberAppSet: { readonly name: string; readonly description: string };
  readonly optIn?: boolean;
  /**
   * 有効化の口が既定の権限セットに足す scope（`optIn` のアプリだけ）。`admin` は既定のオーナー・管理者の権限セット、
   * `member` は既定のメンバーの権限セットへ（冪等・既に持つものは足さない）。入場（表示権限セット）と一緒に配らないと
   * 「入れるが何も見えない」になるので、有効化のときにまとめて配る。
   */
  readonly activationScopes?: { readonly admin: readonly string[]; readonly member: readonly string[] };
  readonly moduleUses?: Readonly<Record<string, readonly ("read" | "write")[]>>;
  readonly mobile?: BuiltinExternalAppMobileDef;
};

export type BuiltinExternalAppMobileDef = {
  /** ストア・ホーム画面に出す名前。 */
  readonly name: string;
  /** Android のパッケージ名。 */
  readonly androidPackage: string;
  /** iOS の Bundle ID。 */
  readonly iosBundleId: string;
  /** 戻り先の控えのスキーム（逆ドメイン形式・RFC 8252 §7.1）。 */
  readonly scheme: string;
  /** App Links / Universal Links のパス（`https://{subdomain}.{appDomain}` からの相対。Web の callback とは別）。OAuth の戻り先にも使う。 */
  readonly appLinksPath: string;
  /** この製品に届く通知の種別。 */
  readonly notificationTypes: readonly string[];
  /** EAS のプロジェクト ID（`eas init` の発行値）。空なら EAS のビルドで止まる。 */
  readonly easProjectId: string;
  /** Play アプリ署名の証明書の SHA-256（`AA:BB:…` の形・Play Console の「アプリの署名」で見える公開値）。assetlinks.json に出す。初回ビルドまでは空。 */
  readonly androidSha256CertFingerprints: readonly string[];
  /** Apple Developer の Team ID（10 文字・公開値）。apple-app-site-association の appIDs に出す。加入までは空。 */
  readonly appleTeamId: string;
  /** App Store のアプリの ID（数字だけ・App Store Connect の「Apple ID」・公開値）。更新の画面から App Store を開く。掲載までは空（空なら画面は文言だけ）。 */
  readonly iosAppStoreId: string;
  readonly minSupportedVersion: { readonly android: string; readonly ios: string };
};

export const BUILTIN_EXTERNAL_APPS = {
  chat: {
    name: "QaitoChat",
    description: "AI に質問したり、記録の確認や書類づくりを頼んだりできます。",
    iconName: "QaitoChat",
    themeToken: "oklch(0.52 0.11 130)",
    subdomain: "chat",
    localOrigin: (appDomain) => `http://chat.${appDomain}:3001`,
    callbackPaths: ["/callback", "/api/auth/callback"],
    extraRedirectUris: {
      local: ["http://localhost:19284/callback"],
      deployed: () => [],
    },
    keyPurpose: "chat_oauth",
    memberAppSet: { name: "QaitoChat", description: "QaitoChat だけ" },
  },
  piazza: {
    name: "Qaito Piazza",
    description: "職員同士の連絡をチャンネルと DM でやり取りします。",
    iconName: "QaitoPiazza",
    themeToken: "oklch(0.58 0.13 290)",
    subdomain: "piazza",
    localOrigin: (appDomain) => `http://piazza.${appDomain}:3003`,
    callbackPaths: ["/api/auth/callback"],
    keyPurpose: "piazza_oauth",
    memberAppSet: { name: "Qaito Piazza", description: "Qaito Piazza だけ" },
    moduleUses: { message: ["read", "write"] },
    mobile: {
      name: "Piazza",
      androidPackage: "com.eeful.qaitopiazza",
      iosBundleId: "com.eeful.qaitopiazza",
      scheme: "ai.qaito.piazza",
      appLinksPath: "/oauth/callback",
      notificationTypes: ["message_mention", "message_dm"],
      easProjectId: "46b78230-960a-4b5f-a04e-e339b5d4f737",
      androidSha256CertFingerprints: [],
      appleTeamId: "Z4B4BL7D8C",
      iosAppStoreId: "6801179590",
      minSupportedVersion: { android: "0.1.0", ios: "0.1.0" },
    },
  },
  eecall: {
    name: "E-CALL",
    description: "かかってきた電話の受付・録音の要約・対応の記録をまとめます。",
    iconName: "QaitoEecall",
    themeToken: "oklch(0.55 0.13 210)",
    subdomain: "eecall",
    localOrigin: (appDomain) => `http://eecall.${appDomain}:3004`,
    callbackPaths: ["/api/auth/callback"],
    keyPurpose: "eecall_oauth",
    memberAppSet: { name: "E-CALL", description: "E-CALL だけ" },
    optIn: true,
    activationScopes: {
      admin: ["phone:read", "phone:write", "phone:delete", "phone-recording:read", "phone-recording:write", "phone-recording:delete"],
      member: ["phone:read", "phone:write"],
    },
    moduleUses: { phone: ["read", "write"] },
  },
  vision: {
    name: "映像分析",
    description: "カメラの映像を数秒ごとに文にして、レクリエーションの評価シートにまとめます。映像は保存しません。",
    iconName: "QaitoVision",
    themeToken: "oklch(0.56 0.13 40)",
    subdomain: "vision",
    localOrigin: (appDomain) => `http://vision.${appDomain}:3005`,
    callbackPaths: ["/api/auth/callback"],
    keyPurpose: "vision_oauth",
    memberAppSet: { name: "映像分析", description: "映像分析だけ" },
    optIn: true,
    activationScopes: {
      admin: ["video-analysis:read", "video-analysis:write", "video-analysis:delete"],
      member: ["video-analysis:read", "video-analysis:write"],
    },
    moduleUses: { "video-analysis": ["read", "write"] },
  },
} as const satisfies Record<string, BuiltinExternalAppDef>;

export type BuiltinExternalAppKey = keyof typeof BUILTIN_EXTERNAL_APPS;

/** 組み込みキーの一覧（組織作成・後付け・migration はこれを回す）。 */
export const BUILTIN_EXTERNAL_APP_KEY_LIST = Object.keys(BUILTIN_EXTERNAL_APPS) as BuiltinExternalAppKey[];

/**
 * 既定で備え付ける組み込みアプリ（`optIn` でないもの）。組織作成・後付けの備え付け・「備え付け済みか」の判定・
 * seed はこの一覧を回す。`optIn` のアプリは有効化の口が作ったあとでだけ、後付けの対象になる。
 */
export const DEFAULT_BUILTIN_EXTERNAL_APP_KEYS: readonly BuiltinExternalAppKey[] = BUILTIN_EXTERNAL_APP_KEY_LIST.filter(
  (k) => (BUILTIN_EXTERNAL_APPS[k] as BuiltinExternalAppDef).optIn !== true,
);

/** 既定では備え付けない組み込みアプリか（有効化の口でだけ作る）。 */
export function isOptInBuiltinExternalApp(key: BuiltinExternalAppKey): boolean {
  return (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).optIn === true;
}

/** 組み込みアプリが使うモジュールと操作（`moduleUses`）。持たないアプリ・キーでない値は空。 */
export function builtinExternalAppModuleUses(key: string | null | undefined): Readonly<Record<string, readonly ("read" | "write")[]>> {
  if (!isBuiltinExternalAppKey(key)) return {};
  return (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).moduleUses ?? {};
}

/** 組み込みアプリを選んだときに付く scope（`moduleUses` を `{module}:{op}` に広げたもの）。 */
export function builtinExternalAppScopes(key: string | null | undefined): string[] {
  return Object.entries(builtinExternalAppModuleUses(key)).flatMap(([m, ops]) => ops.map((op) => `${m}:${op}`));
}

/**
 * 既定で備え付ける組み込みアプリ（`optIn` でないもの）が使う scope。組織の作成・既定のバックフィルが、
 * 既定の管理者・メンバーの権限セットへ入れる（既定でアプリに入れるのに中で何もできない、を作らない）。
 */
export function defaultBuiltinAppScopes(): string[] {
  return [...new Set(DEFAULT_BUILTIN_EXTERNAL_APP_KEYS.flatMap((k) => builtinExternalAppScopes(k)))];
}

/** キーの定数（`BUILTIN_EXTERNAL_APP_KEYS.chat` のように名前で参照するため）。 */
export const BUILTIN_EXTERNAL_APP_KEYS = Object.fromEntries(
  BUILTIN_EXTERNAL_APP_KEY_LIST.map((k) => [k, k]),
) as { readonly [K in BuiltinExternalAppKey]: K };

/** 組み込み外部アプリの既定表示名（登録簿・ポータル棚で使う）。 */
export const BUILTIN_EXTERNAL_APP_NAMES = Object.fromEntries(
  BUILTIN_EXTERNAL_APP_KEY_LIST.map((k) => [k, BUILTIN_EXTERNAL_APPS[k].name]),
) as Record<BuiltinExternalAppKey, string>;

/** 組み込みアプリの OAuth クライアントの鍵の用途（`shared.api_keys.key_purpose`）。 */
export const BUILTIN_OAUTH_KEY_PURPOSES = BUILTIN_EXTERNAL_APP_KEY_LIST.map(
  (k) => BUILTIN_EXTERNAL_APPS[k].keyPurpose,
);

export function isBuiltinExternalAppKey(value: unknown): value is BuiltinExternalAppKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(BUILTIN_EXTERNAL_APPS, value);
}

/** 組み込みアプリのホスト名の先頭（`chat` / `piazza` / `eecall` / `vision`）。 */
export type BuiltinExternalAppSubdomain = (typeof BUILTIN_EXTERNAL_APPS)[BuiltinExternalAppKey]["subdomain"];

/** 組み込みアプリのホスト名の先頭の一覧。web はこれを予約し、組織 ID に使わせない。 */
export const BUILTIN_EXTERNAL_APP_SUBDOMAINS: readonly BuiltinExternalAppSubdomain[] = BUILTIN_EXTERNAL_APP_KEY_LIST.map(
  (k) => BUILTIN_EXTERNAL_APPS[k].subdomain,
);

/** ホスト名の先頭が組み込みアプリのものなら、そのキー。違えば null。 */
export function builtinExternalAppKeyForSubdomain(subdomain: string | null | undefined): BuiltinExternalAppKey | null {
  if (!subdomain) return null;
  return BUILTIN_EXTERNAL_APP_KEY_LIST.find((k) => BUILTIN_EXTERNAL_APPS[k].subdomain === subdomain) ?? null;
}

/** ホスト名の先頭が組み込みアプリのものか。 */
export function isBuiltinExternalAppSubdomain(
  subdomain: string | null | undefined,
): subdomain is BuiltinExternalAppSubdomain {
  return builtinExternalAppKeyForSubdomain(subdomain) !== null;
}

/** 組み込みアプリの origin（本番 `https://{subdomain}.{appDomain}`・ローカルは定義の `localOrigin`）。 */
export function builtinExternalAppOrigin(key: BuiltinExternalAppKey, appDomain: string): string {
  const def: BuiltinExternalAppDef = BUILTIN_EXTERNAL_APPS[key];
  return isLocalAppDomain(appDomain) ? def.localOrigin(appDomain) : `https://${def.subdomain}.${appDomain}`;
}

export function builtinExternalAppMobileRedirects(
  key: BuiltinExternalAppKey,
  appDomain: string,
): { readonly appLink: string | null; readonly scheme: string } | null {
  const def: BuiltinExternalAppDef = BUILTIN_EXTERNAL_APPS[key];
  if (!def.mobile) return null;
  return {
    appLink: isLocalAppDomain(appDomain) ? null : `https://${def.subdomain}.${appDomain}${def.mobile.appLinksPath}`,
    scheme: `${def.mobile.scheme}:${def.mobile.appLinksPath}`,
  };
}

/**
 * モバイルの殻がこの OS で使う戻り先（1 本）。
 *
 * - Android: App Links（https）。カスタムスキームは他のアプリも名乗れるので、App Links が検証できるとき
 *   （設定表に Play の署名の指紋があり、配信先が https）だけ使う。指紋が入るまではスキーム（PKCE で認可コードを守る）
 * - iOS: スキーム。ASWebAuthenticationSession は呼んだアプリにだけ戻り先を返すので横取りされない
 *   （https の戻り先は iOS 17.4 からなので使わない）
 */
export function builtinExternalAppMobileRedirectUri(
  key: BuiltinExternalAppKey,
  appDomain: string,
  os: "android" | "ios",
): string {
  const redirects = builtinExternalAppMobileRedirects(key, appDomain);
  const mobile = (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).mobile;
  if (!redirects || !mobile) throw new Error(`組み込みアプリ ${key} に mobile 項がありません`);
  if (os === "android" && redirects.appLink && mobile.androidSha256CertFingerprints.length > 0) return redirects.appLink;
  return redirects.scheme;
}

export function builtinExternalAppRedirectUris(key: BuiltinExternalAppKey, appDomain: string): string[] {
  const def: BuiltinExternalAppDef = BUILTIN_EXTERNAL_APPS[key];
  const origin = builtinExternalAppOrigin(key, appDomain);
  const extra = def.extraRedirectUris
    ? isLocalAppDomain(appDomain)
      ? def.extraRedirectUris.local
      : def.extraRedirectUris.deployed(origin)
    : [];
  const mobile = builtinExternalAppMobileRedirects(key, appDomain);
  const mobileUris = mobile ? [...(mobile.appLink ? [mobile.appLink] : []), mobile.scheme] : [];
  return [...def.callbackPaths.map((p) => `${origin}${p}`), ...mobileUris, ...extra];
}

export const MOBILE_PUSH_OSES = ["android", "ios"] as const;
export type MobilePushOs = (typeof MOBILE_PUSH_OSES)[number];

/** `mobile` 項を持つアプリ × OS。PushStack が Platform Application を作る単位で、api の ARN の表の行。 */
export function mobilePushTargets(): { readonly key: BuiltinExternalAppKey; readonly os: MobilePushOs }[] {
  return BUILTIN_EXTERNAL_APP_KEY_LIST.filter((key) => (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).mobile).flatMap(
    (key) => MOBILE_PUSH_OSES.map((os) => ({ key, os })),
  );
}

/**
 * この種別の通知を受け取る製品（`shared.device_push_tokens.app_key`）。push-dispatcher が送り先の行を絞る。
 * どの製品の `notificationTypes` にも無い種別は、どこにも送らない（空配列）。
 */
export function mobileAppKeysForNotificationType(type: string): BuiltinExternalAppKey[] {
  return BUILTIN_EXTERNAL_APP_KEY_LIST.filter((key) =>
    (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).mobile?.notificationTypes.includes(type),
  );
}

/** api に入る Platform Application の ARN の環境変数の名前（`SNS_PLATFORM_APP_ARN_{KEY}_{OS}`）。CDK の ComputeStack が同じ名前で入れる。 */
export function snsPlatformAppArnEnvName(key: BuiltinExternalAppKey, os: MobilePushOs): string {
  return `SNS_PLATFORM_APP_ARN_${key.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${os.toUpperCase()}`;
}

export const CLIENT_APP_HEADER = "X-Qaito-Client";

/** 版が古くて断ったときの応答の `code`（HTTP 426）。 */
export const CLIENT_UPGRADE_REQUIRED_CODE = "CLIENT_UPGRADE_REQUIRED";

export type ClientAppPlatform = MobilePushOs | "web";

export type ClientAppInfo = {
  readonly appKey: BuiltinExternalAppKey;
  readonly platform: ClientAppPlatform;
  readonly version: string;
};

const APP_VERSION_RE = /^\d{1,6}(\.\d{1,6}){0,2}$/;
const CLIENT_APP_HEADER_RE = /^([a-z][a-z0-9-]{0,31})\/(android|ios|web)\/(\d{1,6}(?:\.\d{1,6}){0,2})$/;

/** `x.y.z` の比べ（足りない桁は 0）。a が古ければ負・同じなら 0・新しければ正。形が違えば null */
export function compareAppVersions(a: string, b: string): number | null {
  if (!APP_VERSION_RE.test(a) || !APP_VERSION_RE.test(b)) return null;
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function formatClientAppHeader(info: ClientAppInfo): string {
  return `${info.appKey}/${info.platform}/${info.version}`;
}

/** ヘッダーの値を読む。形が違う・知らない製品なら null（判定しない） */
export function parseClientAppHeader(value: string | null | undefined): ClientAppInfo | null {
  const m = value ? CLIENT_APP_HEADER_RE.exec(value.trim()) : null;
  if (!m || !isBuiltinExternalAppKey(m[1])) return null;
  return { appKey: m[1], platform: m[2] as ClientAppPlatform, version: m[3]! };
}

/**
 * このヘッダーの殻を断るか。断るのは、知っている製品のモバイルの殻で、版が最低の版より古いときだけ。
 * ヘッダーが無い・読めない・Web・最低の版を持たない製品は通す（判定できないものを止めない）。
 */
export function clientUpgradeRequired(headerValue: string | null | undefined): boolean {
  const info = parseClientAppHeader(headerValue);
  if (!info || info.platform === "web") return false;
  const mobile = (BUILTIN_EXTERNAL_APPS[info.appKey] as BuiltinExternalAppDef).mobile;
  if (!mobile) return false;
  const cmp = compareAppVersions(info.version, mobile.minSupportedVersion[info.platform]);
  return cmp !== null && cmp < 0;
}

/** 更新の画面から開くストアの URL。iOS は App Store の ID が設定表に入るまで null（画面は文言だけ） */
export function mobileStoreUrl(key: BuiltinExternalAppKey, os: MobilePushOs): string | null {
  const mobile = (BUILTIN_EXTERNAL_APPS[key] as BuiltinExternalAppDef).mobile;
  if (!mobile) return null;
  if (os === "android") return `https://play.google.com/store/apps/details?id=${mobile.androidPackage}`;
  return mobile.iosAppStoreId ? `https://apps.apple.com/app/id${mobile.iosAppStoreId}` : null;
}

/** 棚・コンソールから開く URL（`?org=` を付けると、アプリがその組織でログインを始める）。 */
export function builtinExternalAppLaunchUrl(
  key: BuiltinExternalAppKey,
  appDomain: string,
  orgSlug?: string | null,
): string {
  const origin = builtinExternalAppOrigin(key, appDomain);
  return orgSlug ? `${origin}/?org=${encodeURIComponent(orgSlug)}` : origin;
}

export type VerificationDetail = z.infer<typeof verificationDetailSchema>;
export type VerificationStatus = "unverified" | "passed" | "failed";

/**
 * ポータル（web）のログインの cookie。web が親ドメイン（`.{appDomain}`）に置く。
 * 組み込みの外部アプリはサインアウトでこれも消す（端末を共用する現場で、次の人が前の人のまま入らないように）。
 */
export const PORTAL_SESSION_COOKIES = {
  access: "qaito-access-token",
  refresh: "qaito-refresh-token",
  orgSlug: "qaito_org_slug",
} as const;

export const PORTAL_CONTEXT_COOKIES = {
  facilityId: "qaito_facility_id",
} as const;
