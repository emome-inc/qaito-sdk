import { z } from "zod";

export const APP_THEME_PRESETS = [
  { id: "purple", label: "紫", light: "oklch(0.55 0.12 301)", dark: "oklch(0.70 0.12 301)" },
  { id: "blue", label: "青", light: "oklch(0.55 0.13 210)", dark: "oklch(0.68 0.13 210)" },
  { id: "green", label: "緑", light: "oklch(0.545 0.110 160)", dark: "oklch(0.65 0.11 160)" },
  { id: "orange", label: "橙", light: "oklch(0.55 0.12 60)", dark: "oklch(0.70 0.12 60)" },
  { id: "red", label: "赤", light: "oklch(0.55 0.14 25)", dark: "oklch(0.66 0.14 25)" },
  { id: "indigo", label: "藍", light: "oklch(0.55 0.10 250)", dark: "oklch(0.68 0.10 250)" },
  { id: "lime", label: "黄緑", light: "oklch(0.55 0.09 120)", dark: "oklch(0.68 0.09 120)" },
  { id: "gray", label: "灰", light: "oklch(0.45 0.02 270)", dark: "oklch(0.70 0.02 270)" },
  { id: "teal", label: "青緑", light: "oklch(0.54 0.13 187)", dark: "oklch(0.68 0.13 187)" },
  { id: "pink", label: "桃", light: "oklch(0.55 0.14 350)", dark: "oklch(0.68 0.14 350)" },
] as const;

export type AppThemePreset = (typeof APP_THEME_PRESETS)[number];
export type AppThemePresetId = AppThemePreset["id"];

export const APP_THEME_PRESET_IDS = APP_THEME_PRESETS.map((p) => p.id) as [
  AppThemePresetId,
  ...AppThemePresetId[],
];

export const appThemePresetIdSchema = z.enum(APP_THEME_PRESET_IDS);

/** id から候補を引く。未知の id は undefined（保存済みの値が候補から消えた場合は既定に戻る）。 */
export function findAppThemePreset(id: string | null | undefined): AppThemePreset | undefined {
  if (!id) return undefined;
  return APP_THEME_PRESETS.find((p) => p.id === id);
}

/** 色の値（明るい時）から候補を引く。連携アプリの `theme_token` を候補に戻すのに使う。 */
export function findAppThemePresetByLight(value: string | null | undefined): AppThemePreset | undefined {
  if (!value) return undefined;
  return APP_THEME_PRESETS.find((p) => p.light === value);
}

/** bf-ui のクラス名。 */
export function appThemePresetClass(id: AppThemePresetId): string {
  return `bf-theme-preset-${id}`;
}

/** ロゴに受ける形式。SVG は受けない（中にスクリプトを持てるため）。 */
export const APP_LOGO_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const APP_LOGO_MAX_BYTES = 1024 * 1024;

export const APP_NAME_MAX = 40;
export const APP_DESCRIPTION_MAX = 200;

/**
 * ロゴの扱い。
 *   keep    … 変えない
 *   remove  … 外してアイコン表示に戻す
 *   replace … アップロード済みの staging（用途 `app_logo`）に差し替える
 */
export const appLogoChangeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("keep") }),
  z.object({ action: z.literal("remove") }),
  z.object({ action: z.literal("replace"), stagedId: z.string().uuid() }),
]);
export type AppLogoChange = z.infer<typeof appLogoChangeSchema>;

/**
 * 見た目の保存。名前・説明・テーマ色は `null` で Qaito の既定に戻す（内部アプリのみ意味を持つ。
 * 連携アプリは名前が必須で、`null` の名前は受けない ─ 保存する側で判定する）。
 */
export const appBrandingUpdateSchema = z.object({
  name: z.string().trim().min(1, "アプリ名を入力してください").max(APP_NAME_MAX).nullable(),
  description: z.string().trim().max(APP_DESCRIPTION_MAX).nullable(),
  themePreset: appThemePresetIdSchema.nullable(),
  logo: appLogoChangeSchema,
});
export type AppBrandingUpdate = z.infer<typeof appBrandingUpdateSchema>;

/** 画面と各面が使う、解決済みの見た目。 */
export type ResolvedAppBranding = {
  name: string;
  description: string;
  /** 候補の id。null = アプリ固有の既定テーマ（内部アプリの `bf-theme-{slug}`） */
  themePreset: AppThemePresetId | null;
  /** 棚のタイル色（明るい時の値） */
  themeToken: string;
  /** ロゴ画像の URL。null = アイコンで表示 */
  logoUrl: string | null;
  /** 組織が変えた項目があるか（画面の「既定に戻す」表示用） */
  customized: boolean;
};
