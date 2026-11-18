"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

export function OtpInput({
  name,
  length = 6,
  onChange,
  ariaLabel = "確認コード",
}: {
  name?: string;
  length?: number;
  onChange?: (value: string) => void;
  ariaLabel?: string;
}) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function update(next: string[]) {
    setDigits(next);
    onChange?.(next.join(""));
  }

  function onInput(i: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    update(next);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    const next = Array(length).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    update(next);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div className="bf-otp" role="group" aria-label={ariaLabel}>
      {name && <input type="hidden" name={name} value={digits.join("")} />}
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="bf-otp__box"
          inputMode="numeric"
          maxLength={1}
          value={d}
          aria-label={`${i + 1}桁目`}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}
