"use client";

import { useState } from "react";

export function Stepper({
  name,
  defaultValue = 0,
  value: controlled,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  ariaLabel,
  id,
}: {
  name?: string;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** 刻み。小数でもよい（0.1 刻みの体温など）。桁は step から決めて丸める */
  step?: number;
  ariaLabel?: string;
  /** 数値欄の id。`Field` の `{ id }` を渡してラベルと結び付ける */
  id?: string;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? controlled : internal;

  const decimals = (String(step).split(".")[1] ?? "").length;
  function set(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    const rounded = decimals > 0 ? Number(clamped.toFixed(decimals)) : clamped;
    if (!isControlled) setInternal(rounded);
    onChange?.(rounded);
  }

  return (
    <div className="bf-stepper" role="group" aria-label={ariaLabel}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        className="bf-stepper__btn"
        aria-label="減らす"
        disabled={value <= min}
        onClick={() => set(value - step)}
      >
        −
      </button>
      <input
        type="number"
        id={id}
        className="bf-stepper__value"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel ?? "数値"}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) set(n);
        }}
      />
      <button
        type="button"
        className="bf-stepper__btn"
        aria-label="増やす"
        disabled={value >= max}
        onClick={() => set(value + step)}
      >
        ＋
      </button>
    </div>
  );
}
