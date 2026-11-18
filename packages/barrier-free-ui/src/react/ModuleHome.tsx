import type { CSSProperties, ElementType, ReactNode } from "react";

export type HomeTile = {
  icon?: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  /** 補助情報（任意）。配下機能リスト等、情報量を増やしたい admin 系で使う。未指定なら出さない */
  meta?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** タイルのアクセント色（oklch 等）。アイコン・下縁・ホバーに反映。未指定は既定パレットを自動割当 */
  accent?: string;
  hint?: ReactNode;
};

/** hint 吹き出しの安定 id を href（無ければ index）から導出する */
function tileHintId(t: HomeTile, i: number): string {
  const base = typeof t.href === "string" && t.href ? t.href.replace(/[^\w-]+/g, "-") : "x";
  return `bf-tile-hint-${base}-${i}`;
}

const DEFAULT_PALETTE = [
  "oklch(0.54 0.13 145)",
  "oklch(0.53 0.11 245)",
  "oklch(0.53 0.12 195)",
  "oklch(0.56 0.12 70)",
  "oklch(0.55 0.16 25)",
  "oklch(0.54 0.13 305)",
  "oklch(0.52 0.10 265)",
  "oklch(0.48 0.02 260)",
];

export function ModuleHome({
  items,
  autoColor = true,
  density = "default",
  linkAs,
}: {
  items: HomeTile[];
  /** accent 未指定タイルに既定パレットを自動割当（既定 true）。false でテーマ色に統一 */
  autoColor?: boolean;
  /**
   * タイルの大きさ。`compact` はアイコンを左に置いた低いタイルで、入り口を十数個並べる面
   * （管理画面のショートカット等）に使う。既定は大きいタイル（モジュールのホーム）。
   */
  density?: "default" | "compact";
  /** href を持つタイルの描画要素（Next.js なら `Link` を渡すとページ遷移がクライアント側になる）。既定は `a` */
  linkAs?: ElementType;
}) {
  const LinkTag: ElementType = linkAs ?? "a";
  return (
    <div className="bf-home" data-density={density === "compact" ? "compact" : undefined}>
      {items.map((t, i) => {
        const accent =
          t.accent ?? (autoColor ? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] : undefined);
        const style = accent
          ? ({ "--bf-primary": accent } as CSSProperties)
          : undefined;
        const hintId = t.hint ? tileHintId(t, i) : undefined;
        const inner = (
          <>
            {t.icon && (
              <span className="bf-tile__icon" aria-hidden="true">
                {t.icon}
              </span>
            )}
            <span className="bf-tile__label">{t.label}</span>
            {t.sub && <span className="bf-tile__sub">{t.sub}</span>}
            {t.meta && <span className="bf-tile__meta">{t.meta}</span>}
            {t.hint && (
              <span className="bf-hoverhint__bubble" role="tooltip" id={hintId}>
                {t.hint}
              </span>
            )}
          </>
        );
        return t.href ? (
          <LinkTag key={i} className="bf-tile" href={t.href} style={style} aria-describedby={hintId}>
            {inner}
          </LinkTag>
        ) : (
          <button
            key={i}
            type="button"
            className="bf-tile"
            onClick={t.onClick}
            style={style}
            aria-describedby={hintId}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
