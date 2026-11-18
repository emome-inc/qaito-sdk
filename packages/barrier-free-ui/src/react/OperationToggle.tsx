import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";

export type PermissionOperation = "read" | "write" | "delete";

/** 操作 → アイコン（全面で同じ絵にする） */
export const OPERATION_ICONS: Record<PermissionOperation, LucideIcon> = {
  read: Eye,
  write: Pencil,
  delete: Trash2,
};

export function OperationToggle({
  op,
  label,
  pressed,
  onChange,
  disabled = false,
  describedBy,
}: {
  op: PermissionOperation;
  /** 操作の言葉（「閲覧」など。正本は呼び出し側） */
  label: string;
  pressed: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** 何の操作か（モジュール名など）を読み上げに足す要素の id */
  describedBy?: string;
}) {
  const Icon = OPERATION_ICONS[op];
  return (
    <button
      type="button"
      className="bf-op-toggle"
      data-op={op}
      aria-pressed={pressed}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!pressed)}
    >
      <Icon aria-hidden="true" className="bf-op-toggle__icon" />
      <span>{label}</span>
    </button>
  );
}
