import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/** Server-compatible navigation list; the entire row is a real link. */
export function CompactLinkList({ items, ariaLabel }: {
  items: { key: string; href: string; title: ReactNode; description?: ReactNode; trailing?: ReactNode }[];
  ariaLabel?: string;
}) {
  return <ul className="bf-compact-link-list" aria-label={ariaLabel}>
    {items.map((item) => <li key={item.key}>
      <a href={item.href} className="bf-compact-link-list__link">
        <span className="bf-compact-link-list__body">
          <span className="bf-compact-link-list__title">{item.title}</span>
          {item.description && <span className="bf-compact-link-list__description">{item.description}</span>}
        </span>
        {item.trailing && <span className="bf-compact-link-list__trailing">{item.trailing}</span>}
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    </li>)}
  </ul>;
}
