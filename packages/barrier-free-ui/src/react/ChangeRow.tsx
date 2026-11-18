
import type { ReactNode } from "react";

export function ChangeRow({
  label,
  from,
  to,
  emptyLabel = "未設定",
}: {
  /** 項目名 */
  label: ReactNode;
  /** 変更前。省くと変更後だけを出す */
  from?: ReactNode;
  /** 変更後 */
  to: ReactNode;
  /** 空の値に出す言葉 */
  emptyLabel?: string;
}) {
  const show = (v: ReactNode) => (v === null || v === undefined || v === "" ? emptyLabel : v);
  const hasFrom = from !== undefined;
  const changed = !hasFrom || from !== to;
  return (
    <div className="bf-change-row">
      <span className="bf-change-row__label">{label}</span>
      {hasFrom && (
        <span className={changed ? "bf-change-row__from bf-change-row__from--changed" : "bf-change-row__from"}>
          {show(from)}
        </span>
      )}
      {hasFrom && changed && (
        <span className="bf-change-row__arrow" aria-label="から">
          <span aria-hidden="true">→</span>
        </span>
      )}
      {changed && <span className="bf-change-row__to">{show(to)}</span>}
    </div>
  );
}
