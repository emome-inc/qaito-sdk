"use client";

import { useState } from "react";

export function Slider({
  name,
  defaultValue = 0,
  value: controlled,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  ariaLabel,
}: {
  name?: string;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  ariaLabel?: string;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? controlled : internal;

  function set(n: number) {
    if (!isControlled) setInternal(n);
    onChange?.(n);
  }

  return (
    <div className="bf-slider">
      <input
        type="range"
        className="bf-slider__input"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => set(Number(e.target.value))}
      />
      <span className="bf-slider__value">
        {value}
        {unit}
      </span>
    </div>
  );
}
