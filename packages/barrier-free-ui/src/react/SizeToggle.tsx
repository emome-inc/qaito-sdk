"use client";

import { useBfSize, type BfSize } from "./SizeProvider";

const OPTIONS: { value: BfSize; label: string; aria: string }[] = [
  { value: "sm", label: "小", aria: "文字とボタンを小さくする" },
  { value: "md", label: "中", aria: "文字とボタンを標準にする" },
  { value: "lg", label: "大", aria: "文字とボタンを大きくする" },
];

export function SizeToggle() {
  const { size, setSize } = useBfSize();
  return (
    <div className="bf-size-toggle" role="group" aria-label="表示サイズの切替">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="bf-size-toggle__btn"
          aria-label={opt.aria}
          aria-pressed={size === opt.value}
          data-active={size === opt.value}
          onClick={() => setSize(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
