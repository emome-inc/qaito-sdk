
export const APP_KIND_LABELS = {
  base: "基本アプリ",
  app: "業務アプリ",
  builtin: "拡張アプリ",
  linked: "連携アプリ",
} as const;

export type AppKindKey = keyof typeof APP_KIND_LABELS;

/** 並び（棚の見出し・ランチャー・コンソールのまとまり）。基本 → 拡張 → 業務 → 連携 */
export const APP_KIND_ORDER: readonly AppKindKey[] = ["base", "builtin", "app", "linked"];
