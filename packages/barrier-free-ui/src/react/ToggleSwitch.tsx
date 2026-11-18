"use client";

import { useState } from "react";

export function ToggleSwitch({
  name,
  label,
  defaultChecked = false,
  checked: controlled,
  onChange,
  onLabel = "ON",
  offLabel = "OFF",
  disabled = false,
  variant = "row",
}: {
  name?: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
  variant?: "row" | "bare";
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const checked = isControlled ? controlled : internal;

  function toggle() {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={variant === "bare" ? "bf-switch bf-switch--bare" : "bf-switch"}
      onClick={toggle}
    >
      {name && <input type="hidden" name={name} value={checked ? "true" : "false"} />}
      {variant !== "bare" && (
        <span className="bf-switch__label" aria-hidden="true">
          {label}
        </span>
      )}
      <span className="bf-switch__state">
        <span className="bf-switch__statetext" aria-hidden="true">
          {checked ? onLabel : offLabel}
        </span>
        <span className="bf-switch__track" aria-hidden="true">
          <span className="bf-switch__thumb" />
        </span>
      </span>
    </button>
  );
}
