import type { ReactNode } from "react";

export type SummaryStripItem = {
  key: string;
  icon?: ReactNode;
  /** 数字や短い値 */
  value: ReactNode;
  /** 何の数か */
  label: string;
  /** 状態の色。attention = 注意（要対応・未確認など）/ success = 良い状態（確認済みなど） */
  tone?: "default" | "attention" | "success";
  /** 割合の横棒（「12 のうち 5」など）。max が 0 以下なら出さない */
  meter?: { value: number; max: number };
};

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  if (max <= 0) return null;
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <span
      className="bf-summary-strip__meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span className="bf-summary-strip__meter-fill" style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}

export function SummaryStrip({ items, label }: { items: readonly SummaryStripItem[]; label?: string }) {
  return (
    <ul className="bf-summary-strip" aria-label={label}>
      {items.map((i) => (
        <li
          key={i.key}
          className="bf-summary-strip__item"
          data-tone={i.tone && i.tone !== "default" ? i.tone : undefined}
        >
          <span className="bf-summary-strip__label">
            {i.icon && (
              <span className="bf-summary-strip__icon" aria-hidden="true">
                {i.icon}
              </span>
            )}
            {i.label}
          </span>
          <span className="bf-summary-strip__value">{i.value}</span>
          {i.meter && <Meter value={i.meter.value} max={i.meter.max} label={i.label} />}
        </li>
      ))}
    </ul>
  );
}
