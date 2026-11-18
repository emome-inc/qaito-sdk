"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export function TagInput({
  name,
  defaultValue = [],
  value: controlled,
  onChange,
  presets,
  placeholder = "入力して Enter",
  ariaLabel,
  disabled = false,
}: {
  name?: string;
  defaultValue?: string[];
  value?: string[];
  onChange?: (tags: string[]) => void;
  /** ワンタップ追加できる候補。未追加のものだけ「+ 候補」として表示される。 */
  presets?: string[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const tags = isControlled ? controlled : internal;
  const [draft, setDraft] = useState("");

  function commit(next: string[]) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  function add(v: string) {
    if (disabled) return;
    const t = v.trim();
    if (t && !tags.includes(t)) commit([...tags, t]);
    setDraft("");
  }
  function remove(t: string) {
    if (disabled) return;
    commit(tags.filter((x) => x !== t));
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  }

  const availablePresets = (presets ?? []).filter((p) => !tags.includes(p));

  return (
    <div className="bf-taginput-wrap">
      <div className="bf-taginput">
        {name && tags.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
        {tags.map((t) => (
          <span className="bf-tag" key={t}>
            {t}
            <button
              type="button"
              className="bf-tag__remove"
              aria-label={`${t} を削除`}
              onClick={() => remove(t)}
            >
              <X size="0.9em" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="bf-taginput__input"
          value={draft}
          placeholder={placeholder}
          aria-label={ariaLabel}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && add(draft)}
        />
      </div>
      {availablePresets.length > 0 && (
        <div className="bf-taginput__presets">
          {availablePresets.map((p) => (
            <button
              type="button"
              key={p}
              className="bf-taginput__preset"
              disabled={disabled}
              onClick={() => add(p)}
            >
              ＋ {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
