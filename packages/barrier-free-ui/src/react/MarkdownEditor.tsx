"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Bold, Heading2, Image as ImageIcon, Link2, List, ListOrdered, Table } from "lucide-react";
import { IconButton } from "./Button";

type Insert = { before: string; after?: string; placeholder?: string; block?: boolean };

const TOOLS: { key: string; label: string; icon: ReactNode; insert: Insert }[] = [
  { key: "h2", label: "見出し", icon: <Heading2 aria-hidden="true" />, insert: { before: "## ", placeholder: "見出し", block: true } },
  { key: "bold", label: "太字", icon: <Bold aria-hidden="true" />, insert: { before: "**", after: "**", placeholder: "太字" } },
  { key: "ul", label: "箇条書き", icon: <List aria-hidden="true" />, insert: { before: "- ", placeholder: "項目", block: true } },
  { key: "ol", label: "番号つきの箇条書き", icon: <ListOrdered aria-hidden="true" />, insert: { before: "1. ", placeholder: "項目", block: true } },
  {
    key: "table",
    label: "表",
    icon: <Table aria-hidden="true" />,
    insert: { before: "| 項目 | 内容 |\n|---|---|\n| ", after: " |  |", placeholder: "…", block: true },
  },
  { key: "link", label: "リンク", icon: <Link2 aria-hidden="true" />, insert: { before: "[", after: "](https://)", placeholder: "リンクの文字" } },
];

export function MarkdownEditor({
  value,
  onChange,
  renderPreview,
  onPickImage,
  name,
  id,
  ariaLabel = "本文（Markdown）",
  rows = 18,
  disabled = false,
}: {
  value: string;
  onChange: (next: string) => void;
  /** プレビューを描く（Markdown の描画の規則は呼ぶ側が持つ） */
  renderPreview: (value: string) => ReactNode;
  /** 画像を選んでアップロードし、差し込む参照を返す。省略すると画像の道具を出さない */
  onPickImage?: () => Promise<{ alt: string; src: string } | null>;
  /** フォームで送るときの名前（hidden ではなく textarea の name） */
  name?: string;
  id?: string;
  ariaLabel?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function insert(ins: Insert) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || ins.placeholder || "";
    const needsBreak = ins.block && start > 0 && value[start - 1] !== "\n";
    const head = `${needsBreak ? "\n" : ""}${ins.before}`;
    const next = value.slice(0, start) + head + selected + (ins.after ?? "") + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const s = start + head.length;
      el.setSelectionRange(s, s + selected.length);
    });
  }

  const tabRefs = useRef<Record<"write" | "preview", HTMLButtonElement | null>>({ write: null, preview: null });

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tab === "write" ? "preview" : "write";
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  async function pickImage() {
    if (!onPickImage) return;
    const picked = await onPickImage();
    if (!picked) return;
    insert({ before: `![${picked.alt}](${picked.src})`, block: true });
  }

  return (
    <div className="bf-md-editor" data-tab={tab}>
      <div className="bf-md-editor__bar">
        <div className="bf-md-editor__tools" role="toolbar" aria-label="書き方">
          {TOOLS.map((t) => (
            <IconButton key={t.key} label={t.label} title={t.label} onClick={() => insert(t.insert)} disabled={disabled}>
              {t.icon}
            </IconButton>
          ))}
          {onPickImage && (
            <IconButton label="画像" title="画像" onClick={pickImage} disabled={disabled}>
              <ImageIcon aria-hidden="true" />
            </IconButton>
          )}
        </div>
        <div className="bf-md-editor__tabs" role="tablist" aria-label="表示の切り替え">
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-write`}
            ref={(el) => {
              tabRefs.current.write = el;
            }}
            tabIndex={tab === "write" ? 0 : -1}
            onKeyDown={onTabKey}
            aria-selected={tab === "write"}
            aria-controls={`${baseId}-write`}
            className="bf-md-editor__tab"
            onClick={() => setTab("write")}
          >
            書く
          </button>
          <button
            type="button"
            role="tab"
            id={`${baseId}-tab-preview`}
            ref={(el) => {
              tabRefs.current.preview = el;
            }}
            tabIndex={tab === "preview" ? 0 : -1}
            onKeyDown={onTabKey}
            aria-selected={tab === "preview"}
            aria-controls={`${baseId}-preview`}
            className="bf-md-editor__tab"
            onClick={() => setTab("preview")}
          >
            プレビュー
          </button>
        </div>
      </div>
      <div className="bf-md-editor__panes">
        <div className="bf-md-editor__write" id={`${baseId}-write`} role="tabpanel" aria-labelledby={`${baseId}-tab-write`}>
          {}
          <textarea
            ref={ref}
            className="bf-textarea bf-md-editor__input"
            name={name}
            aria-label={ariaLabel}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            spellCheck={false}
          />
        </div>
        <div
          className="bf-md-editor__preview bf-prose"
          id={`${baseId}-preview`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-preview`}
        >
          {value.trim() === "" ? <p className="bf-md-editor__empty">まだ何も書かれていません。</p> : renderPreview(value)}
        </div>
      </div>
    </div>
  );
}
