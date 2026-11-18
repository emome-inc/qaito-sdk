"use client";

import { useId, useState, type ReactNode } from "react";

export type AccordionItem = { value: string; title: ReactNode; content: ReactNode };

export function Accordion({
  items,
  defaultOpen,
  id,
  tone = "default",
}: {
  tone?: "default" | "warning";
  items: AccordionItem[];
  defaultOpen?: string[];
  /**
   * 開閉ボタンとパネルを結ぶ aria id のベース。省略時は useId() で自動採番する。
   * middleware の rewrite で配信される面（console・ポータル・各アプリのサブドメイン）では
   * SSR と CSR でツリーの経路が食い違って useId() がずれ、hydration の不一致になる。
   * そうした面では呼び出し側で安定した id を渡す（Tabs の id と同じ対処）。
   */
  id?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen ?? []));
  const autoId = useId();
  const baseId = id ?? autoId;

  function toggle(v: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  return (
    <div className="bf-accordion" data-tone={tone}>
      {items.map((it) => {
        const isOpen = open.has(it.value);
        return (
          <div className="bf-accordion__item" key={it.value}>
            <button
              type="button"
              className="bf-accordion__trigger"
              aria-expanded={isOpen}
              aria-controls={`${baseId}-${it.value}`}
              onClick={() => toggle(it.value)}
            >
              <span className="bf-accordion__title">{it.title}</span>
              <svg
                className="bf-accordion__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen && (
              <div className="bf-accordion__panel" id={`${baseId}-${it.value}`} role="region">
                {it.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
