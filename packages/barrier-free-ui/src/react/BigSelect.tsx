"use client";

import { Badge, type BadgeTone } from "./Badge";
import { Tooltip } from "./Tooltip";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

/** disabled: 出したまま選べなくする（使えない理由は呼ぶ側が欄の外に書く） */
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** 名前の右に出す状態の印（担当の候補の「空いている」など）。選んだ値の欄にも出す。
   *  tooltip を渡すと、選んだ値の欄の印に重ねたときに吹き出しで補足を出す（印が記号だけのとき用）。
   *  一覧の中はスクロールの枠で吹き出しが切れるので出さない（一覧の補足は note に書く） */
  badge?: { label: string; tone: BadgeTone; tooltip?: string };
  /** 2 行目に小さく出す補足（前後の訪問・勤務時間など） */
  note?: string;
};

/** 一覧を切る祖先（はみ出しを隠す・スクロールする箱）と画面の、上下左右の端。 */
function clipBounds(el: HTMLElement): { top: number; bottom: number; left: number; right: number } {
  let top = 0;
  let bottom = window.innerHeight;
  let left = 0;
  let right = window.innerWidth;
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (getComputedStyle(p).overflowY === "visible") continue;
    const r = p.getBoundingClientRect();
    top = Math.max(top, r.top);
    bottom = Math.min(bottom, r.bottom);
    left = Math.max(left, r.left);
    right = Math.min(right, r.right);
  }
  return { top, bottom, left, right };
}

/** 開いた一覧の置き方。up = 上に開く / end = 欄の右端に揃える / maxHeight = 余白に収めた高さ（px） */
type PanelLayout = { up: boolean; end: boolean; maxHeight: number | null };
const DEFAULT_LAYOUT: PanelLayout = { up: false, end: false, maxHeight: null };
/** 一覧と欄・箱の端のあいだに空ける分（px） */
const PANEL_GAP = 8;

/** 選んだ値の欄の状態の印。tooltip があれば重ねたときに吹き出しで補足を出す（id は listId から作る） */
function badgeOf(badge: NonNullable<SelectOption["badge"]>, id: string) {
  const mark = <Badge tone={badge.tone} size="sm">{badge.label}</Badge>;
  return badge.tooltip ? <Tooltip id={id} label={badge.tooltip}>{mark}</Tooltip> : mark;
}

export function BigSelect({
  name,
  options,
  defaultValue,
  value: controlled,
  onChange,
  placeholder = "選択してください",
  filterThreshold = 8,
  ariaLabel,
  disabled = false,
  placement = "down",
  id,
}: {
  name?: string;
  /** トリガーのボタンに付ける id（`Field` の `<label htmlFor>` と結ぶ。`{({ id }) => <BigSelect id={id} …/>}`） */
  id?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** この件数を超えたら絞り込み入力を出す */
  filterThreshold?: number;
  ariaLabel?: string;
  disabled?: boolean;
  /** 一覧を開く向き。画面の下端にある欄（チャットの入力欄の段）は "up" */
  placement?: "down" | "up";
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? "");
  const value = isControlled ? controlled : internal;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  /** 開いているあいだの一覧の置き方（閉じたら既定に戻す） */
  const [layout, setLayout] = useState<PanelLayout>(DEFAULT_LAYOUT);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const showFilter = options.length > filterThreshold;

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useLayoutEffect(() => {
    if (!open) {
      setLayout(DEFAULT_LAYOUT);
      return;
    }
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const rect = root.getBoundingClientRect();
    const bounds = clipBounds(root);
    const need = panel.offsetHeight;
    const below = bounds.bottom - rect.bottom - PANEL_GAP;
    const above = rect.top - bounds.top - PANEL_GAP;
    const up = placement === "up" || (need > below && above > below);
    const room = Math.max(up ? above : below, 0);
    const width = panel.offsetWidth;
    setLayout({
      up,
      end: rect.left + width > bounds.right && rect.right - width >= bounds.left,
      maxHeight: need > room ? room : null,
    });
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function choose(v: string) {
    if (options.find((o) => o.value === v)?.disabled) return;
    if (!isControlled) setInternal(v);
    onChange?.(v);
    setOpen(false);
    setQuery("");
  }

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (open && (e.key === "Escape" || e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      onListKey(e);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    const last = filtered.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h >= last ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? last : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) choose(opt.value);
    }
  }

  return (
    <div
      className="bf-select"
      data-placement={layout.up ? "up" : placement}
      data-align={layout.end ? "end" : undefined}
      ref={rootRef}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        className="bf-select__trigger"
        data-placeholder={!selected}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        {selected?.badge ? (
          <span className="bf-select__value">
            <span className="bf-select__label">{selected.label}</span>
            {badgeOf(selected.badge, `${listId}-tip`)}
          </span>
        ) : (
          <span>{selected ? selected.label : placeholder}</span>
        )}
        <span className="bf-select__caret" aria-hidden="true">
          {}
          <svg viewBox="0 0 16 16" width="100%" height="100%" focusable="false">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="bf-select__panel"
          ref={panelRef}
          style={layout.maxHeight !== null ? { maxHeight: layout.maxHeight } : undefined}
          onKeyDown={onListKey}
        >
          {showFilter && (
            <div className="bf-select__filter">
              <input
                autoFocus
                type="search"
                className="bf-input"
                placeholder="絞り込む"
                value={query}
                aria-label="選択肢を絞り込む"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
              />
            </div>
          )}
          <div className="bf-select__options" role="listbox" id={listId}>
            {filtered.length === 0 && (
              <div className="bf-select__empty">該当する選択肢がありません</div>
            )}
            {filtered.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled || undefined}
                disabled={opt.disabled}
                data-highlighted={idx === highlight}
                className="bf-select__option"
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => choose(opt.value)}
                data-detail={opt.badge || opt.note ? true : undefined}
              >
                {opt.badge || opt.note ? (
                  <>
                    <span className="bf-select__option-main">
                      {opt.label}
                      {opt.badge ? <Badge tone={opt.badge.tone} size="sm">{opt.badge.label}</Badge> : null}
                    </span>
                    {opt.note ? <span className="bf-select__option-note">{opt.note}</span> : null}
                  </>
                ) : (
                  opt.label
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
