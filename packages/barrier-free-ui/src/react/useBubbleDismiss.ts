"use client";
import { useEffect, useState, type FocusEvent } from "react";

/**
 * 吹き出し（Tooltip / HoverHint）を Esc で消す（WCAG 2.1 1.4.13「ホバーやフォーカスで出る内容は、
 * ポインタもフォーカスも動かさずに消せる」）。吹き出しは CSS の :hover / :focus-within だけで出るので、
 * 対象に乗っている（ホバーかフォーカス）間だけ Esc を聞き、押されたら `data-bf-dismissed` を立てて隠す。
 * ポインタが離れるかフォーカスが外れたら元に戻す（次に乗ったときはまた出る）。
 */
export function useBubbleDismiss() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const engaged = hovered || focused;
  if (!engaged && dismissed) setDismissed(false);

  useEffect(() => {
    if (!engaged || dismissed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [engaged, dismissed]);

  return {
    "data-bf-dismissed": dismissed ? "" : undefined,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
    },
  };
}
