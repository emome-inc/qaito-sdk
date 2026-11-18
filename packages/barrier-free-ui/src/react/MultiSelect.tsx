"use client";

import { useState, type ReactNode } from "react";
import type { SelectOption } from "./BigSelect";

export function MultiSelect({
  name,
  options,
  defaultValue = [],
  value: controlled,
  onChange,
  ariaLabel,
  indicator = "check",
  trailing,
}: {
  name?: string;
  options: SelectOption[];
  defaultValue?: string[];
  value?: string[];
  onChange?: (values: string[]) => void;
  ariaLabel?: string;
  /** 選択中の印。"check" = ✓ を出す（既定）/ "none" = 色塗りだけ */
  indicator?: "check" | "none";
  /** 選択肢の名前の後ろに添える印（出欠のアイコン等）。文は持たない（読み上げの文は印の側で持つ） */
  trailing?: (value: string) => ReactNode;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const selected = isControlled ? controlled : internal;

  function toggle(v: string) {
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <div
      className="bf-multiselect"
      role="group"
      aria-label={ariaLabel}
      data-indicator={indicator === "none" ? "none" : undefined}
    >
      {name && selected.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className="bf-multiselect__opt"
            aria-pressed={on}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
            {trailing?.(opt.value)}
          </button>
        );
      })}
    </div>
  );
}
