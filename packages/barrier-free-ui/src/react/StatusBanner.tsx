import type { ReactNode } from "react";

export type StatusItem = { label: ReactNode; value: ReactNode };

export function StatusBanner({ items }: { items: StatusItem[] }) {
  return (
    <div className="bf-statusbanner">
      {items.map((it, i) => (
        <div className="bf-statusbanner__item" key={i}>
          <span className="bf-statusbanner__label">{it.label}</span>
          <span className="bf-statusbanner__value">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
