"use client";

import { useState, type ReactNode } from "react";

export function Checkbox({
  name,
  label,
  ariaLabel,
  defaultChecked = false,
  checked: controlled,
  indeterminate = false,
  onChange,
  value = "true",
  disabled = false,
  markPresent = false,
}: {
  name?: string;
  /** 可視ラベル。省略時はチェックボックスのみ（行選択など）。その場合 ariaLabel を渡す。 */
  label?: ReactNode;
  ariaLabel?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  /**
   * 半選択（三状態）。「すべて選択」「グループ全選択」のヘッダ用。
   * aria-checked="mixed" を出し、ボックスにダッシュ（–）を表示する。
   * クリック時は「全選択」を意図して onChange(true) を返す。
   * （checked より優先。indeterminate=true なら見た目・ARIA は mixed）
   */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  value?: string;
  disabled?: boolean;
  /**
   * チェックの有無に関わらず `${name}__present`（値 "1"）を送る。受け側（`@qaito/schemas/form-checkbox` の
   * `readCheckbox`）が「外した」と「画面に無い」を区別できる。部分的な保存の画面から呼ばれうるフォームに付ける。
   */
  markPresent?: boolean;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const checked = isControlled ? controlled : internal;

  function toggle() {
    if (disabled) return;
    const next = indeterminate ? true : !checked;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label === undefined ? ariaLabel : undefined}
      disabled={disabled}
      className={label === undefined ? "bf-checkbox bf-checkbox--bare" : "bf-checkbox"}
      onClick={toggle}
    >
      {}
      {name && checked && !indeterminate && <input type="hidden" name={name} value={value} />}
      {name && markPresent && <input type="hidden" name={`${name}__present`} value="1" />}
      <span className="bf-checkbox__box" aria-hidden="true">
        {}
        {}
        <svg viewBox="0 0 16 16" width="85%" height="85%" focusable="false">
          <path
            d={indeterminate ? "M3.5 8h9" : "M3.5 8.5l3 3 6-7"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label !== undefined && <span>{label}</span>}
    </button>
  );
}

export function CheckboxGroup({ children }: { children: ReactNode }) {
  return (
    <div className="bf-checkbox-group" role="group">
      {children}
    </div>
  );
}
