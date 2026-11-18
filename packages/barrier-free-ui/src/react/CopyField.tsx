"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./Button";

export function CopyField({
  value,
  label,
  caption,
  multiline = false,
}: {
  /** 表示してコピーする値 */
  value: string;
  /** 何の値かの読み上げ名（「{label}をコピー」になる）。画面には出ない */
  label?: string;
  /** 値の上に出す見出し（ファイル名・言語名・値の名前）。省略すると見出し無し */
  caption?: ReactNode;
  /** 改行を保って出す（複数行のコード）。既定は 1 行の値 */
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }

  const name = label ? `${label}をコピー` : "コピー";
  const button = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="bf-copyfield__button"
        onClick={handleCopy}
        aria-label={name}
        title={name}
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </Button>
      {}
      <span className="bf-sr-only" role="status" aria-live="polite">
        {copied ? "コピーしました" : ""}
      </span>
    </>
  );

  if (multiline) {
    return (
      <div className="bf-copyfield" data-multiline="true">
        <div className="bf-copyfield__head">
          <span className="bf-copyfield__caption">{caption}</span>
          {button}
        </div>
        <pre className="bf-copyfield__code">
          <code>{value}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="bf-copyfield">
      {caption !== undefined && <span className="bf-copyfield__caption">{caption}</span>}
      <div className="bf-copyfield__row">
        <code className="bf-copyfield__value">{value}</code>
        {button}
      </div>
    </div>
  );
}
