"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FeedbackIcon } from "./Feedback";

export type NoticeTone = "error" | "warning" | "info";

export type NoticeItem = {
  /** 行のキー */
  id: string;
  tone: NoticeTone;
  /** 1 件の中身（文・つなぎ・ボタン） */
  content: ReactNode;
};

const WEIGHT: Record<NoticeTone, number> = { error: 3, warning: 2, info: 1 };

export function NoticeBar({
  id,
  items,
  summary,
  defaultOpen = false,
  rememberOpen = false,
}: {
  /** 一覧の id（aria-controls）。rewrite 配信面では useId が SSR / CSR でずれるので必須（HoverHint と同じ） */
  id: string;
  items: NoticeItem[];
  /** 帯の文（例「注意 5 件」）。件数の数え方と言い方は呼ぶ側が決める */
  summary: ReactNode;
  defaultOpen?: boolean;
  /**
   * 開け閉めをこの端末で覚える（`id` ごと・localStorage）。最初の描画は `defaultOpen` のまま出し、
   * 読み込んだあとで覚えた状態に合わせる（SSR と食い違わせない）。保存できない環境では覚えないだけ
   */
  rememberOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const storageKey = `bf-noticebar-open:${id}`;
  useEffect(() => {
    if (!rememberOpen) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "1" || saved === "0") setOpen(saved === "1");
    } catch {
    }
  }, [rememberOpen, storageKey]);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!rememberOpen) return;
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
    }
  };
  if (items.length === 0) return null;
  const heaviest = items.reduce<NoticeTone>((t, it) => (WEIGHT[it.tone] > WEIGHT[t] ? it.tone : t), "info");
  return (
    <div className="bf-noticebar" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="bf-noticebar__toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        <span className="bf-noticebar__icon" data-tone={heaviest} aria-hidden="true">
          <FeedbackIcon tone={heaviest} />
        </span>
        <span className="bf-noticebar__summary">{summary}</span>
        <ChevronDown className="bf-noticebar__chevron" aria-hidden="true" size={18} />
      </button>
      <ul className="bf-noticebar__list" id={id} hidden={!open}>
        {items.map((it) => (
          <li key={it.id} className="bf-noticebar__item">
            <span className="bf-noticebar__icon" data-tone={it.tone} aria-hidden="true">
              <FeedbackIcon tone={it.tone} />
            </span>
            <div className="bf-noticebar__body">{it.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
