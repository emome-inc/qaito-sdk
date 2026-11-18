import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="bf-empty">
      {icon && <div className="bf-empty__icon" aria-hidden="true">{icon}</div>}
      <p className="bf-empty__title">{title}</p>
      {description && <p className="bf-empty__desc">{description}</p>}
      {action}
    </div>
  );
}
