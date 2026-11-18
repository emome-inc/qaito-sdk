import type { ReactNode } from "react";

export type SummaryStripItem = {
  key: string;
  icon?: ReactNode;
  /** 数字や短い値 */
  value: ReactNode;
  /** 何の数か */
  label: string;
  /** 注意を引く数（要配慮など）。色に加えて値の太さでも示す */
  tone?: "default" | "attention";
};

export function SummaryStrip({ items, label }: { items: readonly SummaryStripItem[]; label?: string }) {
  return (
    <ul className="bf-summary-strip" aria-label={label}>
      {items.map((i) => (
        <li key={i.key} className="bf-summary-strip__item" data-tone={i.tone === "attention" ? "attention" : undefined}>
          {i.icon && (
            <span className="bf-summary-strip__icon" aria-hidden="true">
              {i.icon}
            </span>
          )}
          <span className="bf-summary-strip__value">{i.value}</span>
          <span className="bf-summary-strip__label">{i.label}</span>
        </li>
      ))}
    </ul>
  );
}
