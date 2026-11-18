import type { ElementType, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

export type StatTone = "default" | "attention";

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="bf-statgrid">{children}</div>;
}

export function Stat({
  label,
  value,
  delta,
  trend,
  tone = "default",
  hint,
  href,
  linkAs,
}: {
  label: ReactNode;
  value: ReactNode;
  /** 増減（前期比など）。色 + 矢印 + 読み上げが付く強い行 */
  delta?: ReactNode;
  trend?: "up" | "down";
  /** 数字の意味づけ。`attention` = 手当てが要る数（赤）。増減ではないので矢印は付かない */
  tone?: StatTone;
  /** 数字の下に置く控えめな一言（単位・母数・言い換え） */
  hint?: ReactNode;
  /** 押したときの行き先。渡すとタイル全体がリンクになる */
  href?: string;
  /** リンクに使う部品（Next の `Link` など）。既定は `<a>` */
  linkAs?: ElementType;
}) {
  const inner = (
    <>
      <span className="bf-stat__label">{label}</span>
      <span className="bf-stat__value" data-tone={tone === "default" ? undefined : tone}>
        {value}
      </span>
      {delta && (
        <span className="bf-stat__delta" data-trend={trend}>
          {}
          {trend === "up" && <TrendingUp size="1em" aria-hidden="true" />}
          {trend === "down" && <TrendingDown size="1em" aria-hidden="true" />}
          {trend === "up" && <span className="bf-sr-only">増加 </span>}
          {trend === "down" && <span className="bf-sr-only">減少 </span>}
          {delta}
        </span>
      )}
      {hint && <span className="bf-stat__hint">{hint}</span>}
    </>
  );
  if (href !== undefined) {
    const Tag: ElementType = linkAs ?? "a";
    return (
      <Tag href={href} className="bf-stat">
        {inner}
      </Tag>
    );
  }
  return <div className="bf-stat">{inner}</div>;
}
