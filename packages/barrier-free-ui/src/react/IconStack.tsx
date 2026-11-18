import type { ReactNode } from "react";

export type IconStackItem = { key: string; label: string; icon: ReactNode };

export function IconStack({
  items,
  max = 5,
  label,
}: {
  items: readonly IconStackItem[];
  /** 並べる数の上限。超えた分は「+N」 */
  max?: number;
  /** 全体の読み上げ（例「含むモジュール: 利用者台帳、ケア記録 ほか 3」）。省略時は名前を並べる */
  label?: string;
}) {
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  const spoken = label ?? items.map((i) => i.label).join("、");
  return (
    <span className="bf-icon-stack" role="img" aria-label={spoken}>
      {shown.map((i) => (
        <span key={i.key} className="bf-icon-stack__item" title={i.label} aria-hidden="true">
          {i.icon}
        </span>
      ))}
      {rest.length > 0 && (
        <span className="bf-icon-stack__more" title={rest.map((i) => i.label).join("、")} aria-hidden="true">
          +{rest.length}
        </span>
      )}
    </span>
  );
}
