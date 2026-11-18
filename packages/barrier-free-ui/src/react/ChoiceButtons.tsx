"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type ChoiceOption = { value: string; label: string };

export function ChoiceButtons({
  name,
  options,
  defaultValue,
  value: controlledValue,
  onChange,
  disabled = false,
  ariaLabel,
  id,
  indicator = "check",
  size = "md",
}: {
  name?: string;
  options: ChoiceOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  /** グループ id。middleware rewrite 面では SSR/CSR で useId() がズレて hydration mismatch に
   *  なるため、そうした面では安定 id を明示する（Tabs / Field の id prop と同じ対処） */
  id?: string;
  /** 選択中の印。"check" = 左に ✓ を出す（既定）/ "none" = 色塗りと太字だけ（✓ の分の左右の余白も詰める） */
  indicator?: "check" | "none";
  /** 大きさ。"sm" = 文字を小さく、ボタンを文字の幅に詰める（押せる高さ 44px は保つ）。ダイアログの補助の選択に使う */
  size?: "md" | "sm";
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? "");
  const value = isControlled ? controlledValue : internal;
  const autoId = useId();
  const groupId = id ?? autoId;
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    const last = options.length - 1;
    let target = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") target = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = idx === 0 ? last : idx - 1;
    if (target >= 0) {
      e.preventDefault();
      select(options[target].value);
      btnRefs.current[target]?.focus();
    }
  }

  return (
    <div
      className="bf-choice"
      role="radiogroup"
      aria-label={ariaLabel}
      id={groupId}
      data-indicator={indicator === "none" ? "none" : undefined}
      data-size={size === "sm" ? "sm" : undefined}
    >
      {name && <input type="hidden" name={name} value={value} />}
      {options.map((opt, idx) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              btnRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!value && idx === 0) ? 0 : -1}
            data-active={active}
            disabled={disabled}
            className="bf-choice__btn"
            onClick={() => select(opt.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
