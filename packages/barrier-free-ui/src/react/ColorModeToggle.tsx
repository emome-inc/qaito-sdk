"use client";

import { useBfColorMode, type BfColorMode } from "./ColorModeProvider";

const OPTIONS: { value: BfColorMode; label: string; aria: string }[] = [
  { value: "light", label: "明るい", aria: "画面を明るい配色にする" },
  { value: "dark", label: "暗い", aria: "画面を暗い配色にする" },
];

export function ColorModeToggle() {
  const { mode, setMode } = useBfColorMode();
  return (
    <div className="bf-size-toggle" role="group" aria-label="画面の明るさの切替">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="bf-size-toggle__btn"
          aria-label={opt.aria}
          aria-pressed={mode === opt.value}
          data-active={mode === opt.value}
          onClick={() => setMode(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
