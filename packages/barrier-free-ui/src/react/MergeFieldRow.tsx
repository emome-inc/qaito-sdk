"use client";

import type { ReactNode } from "react";
import { ChangeRow } from "./ChangeRow";
import { ChoiceButtons } from "./ChoiceButtons";
import { Input } from "./Input";

export type MergeFieldPick = "current" | "incoming" | "edit";

export function MergeFieldRow({
  id,
  label,
  current,
  incoming,
  pick,
  onPickChange,
  editValue = "",
  onEditChange,
  editable = true,
  labels,
  emptyLabel,
  note,
}: {
  /** ChoiceButtons と入力欄の id の元 */
  id: string;
  /** 項目名 */
  label: string;
  /** 今の値（表示用） */
  current: ReactNode;
  /** 取り込む値（表示用） */
  incoming: ReactNode;
  pick: MergeFieldPick;
  onPickChange: (pick: MergeFieldPick) => void;
  editValue?: string;
  onEditChange?: (value: string) => void;
  /** false なら「直す」を出さない */
  editable?: boolean;
  labels: { current: string; incoming: string; edit: string };
  emptyLabel?: string;
  /** 行の下に添える一言（直せない理由など） */
  note?: ReactNode;
}) {
  const options = [
    { value: "current", label: labels.current },
    { value: "incoming", label: labels.incoming },
    ...(editable ? [{ value: "edit", label: labels.edit }] : []),
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--bf-space-2)" }}>
      <ChangeRow label={label} from={current} to={incoming} emptyLabel={emptyLabel} />
      <ChoiceButtons
        id={`${id}-pick`}
        ariaLabel={`${label}の扱い`}
        options={options}
        value={pick}
        onChange={(v) => onPickChange(v as MergeFieldPick)}
      />
      {pick === "edit" && editable && (
        <Input
          id={`${id}-edit`}
          aria-label={`${label}（直した値）`}
          value={editValue}
          onChange={(e) => onEditChange?.(e.target.value)}
        />
      )}
      {note && <span className="bf-cell-sub">{note}</span>}
    </div>
  );
}
