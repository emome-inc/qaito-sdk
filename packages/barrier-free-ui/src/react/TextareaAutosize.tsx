"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from "react";
import { CharCount } from "./CharCount";

export type TextareaAutosizeProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows"
> & {
  /** 最低表示行数（初期高さ）。既定 3 */
  minRows?: number;
  /** これを超えたらスクロール。既定 12 */
  maxRows?: number;
  /** 文字数の上限。渡すと欄の下に今の字数と上限を出す */
  maxChars?: number;
};

/** `field-sizing: content` が使えるか（使えれば JS 計測は不要） */
function supportsFieldSizing(): boolean {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("field-sizing", "content")
  );
}

export function TextareaAutosize({
  className,
  minRows = 3,
  maxRows = 12,
  style,
  onInput,
  onChange,
  value,
  defaultValue,
  maxChars,
  ...rest
}: TextareaAutosizeProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const countId = useId();
  const [typed, setTyped] = useState(() => String(defaultValue ?? "").length);
  const length = value !== undefined ? String(value).length : typed;
  const over = maxChars !== undefined && length > maxChars;

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (supportsFieldSizing()) return;

    const cs = getComputedStyle(el);
    const borderAdjust =
      cs.boxSizing === "border-box"
        ? (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
        : 0;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + borderAdjust}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize, value, defaultValue]);

  const textarea = (
    <textarea
      ref={ref}
      rows={minRows}
      data-autosize="true"
      className={`bf-textarea${className ? ` ${className}` : ""}`}
      style={
        {
          "--bf-ta-min-rows": String(minRows),
          "--bf-ta-max-rows": String(maxRows),
          ...style,
        } as CSSProperties
      }
      value={value}
      defaultValue={defaultValue}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      onChange={(e) => {
        if (maxChars !== undefined && value === undefined) setTyped(e.currentTarget.value.length);
        onChange?.(e);
      }}
      {...rest}
      {...(maxChars !== undefined
        ? {
            "aria-describedby": [rest["aria-describedby"], countId].filter(Boolean).join(" "),
            ...(over ? { "aria-invalid": true } : {}),
          }
        : {})}
    />
  );
  if (maxChars === undefined) return textarea;
  return (
    <>
      {textarea}
      <CharCount id={countId} count={length} max={maxChars} />
    </>
  );
}
