import type { ReactNode } from "react";

export function StickyActionBar({
  status,
  children,
}: {
  /** 左に出す状況の説明（未保存の件数など）。任意 */
  status?: ReactNode;
  /** 右に並べる操作（Button） */
  children: ReactNode;
}) {
  return (
    <div className="bf-sticky-actions" role="region" aria-label="保存の操作">
      {status !== undefined && <div className="bf-sticky-actions__status" aria-live="polite">{status}</div>}
      <div className="bf-sticky-actions__actions">{children}</div>
    </div>
  );
}
