"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

function parseYmd(v: string | undefined): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? "");
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** YYYY-MM-DD に日数を足す（月・年をまたぐ） */
function addDays(v: string, days: number): string {
  const p = parseYmd(v);
  if (!p) return v;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

function weekdayOf(v: string): number {
  const p = parseYmd(v);
  return p ? new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() : 0;
}

/** チップの文字（「2026年11月1日(日)」） */
export function dateFieldLabel(v: string): string {
  const p = parseYmd(v);
  return p ? `${p.y}年${p.m}月${p.d}日(${WEEKDAY_JA[weekdayOf(v)]})` : "";
}

function todayLocal(): string {
  const n = new Date();
  return ymd(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

export function DateField({
  name,
  value: controlled,
  defaultValue,
  onChange,
  ariaLabel = "日付",
  placeholder = "日付を選ぶ",
  compact = false,
  disabled = false,
  id,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  /** 決めた日（YYYY-MM-DD） */
  onChange?: (value: string) => void;
  /** チップと暦の読み上げ名（「開始日」など） */
  ariaLabel?: string;
  placeholder?: string;
  /** 表示は M/D（曜）に省略。読み上げには年も残す。 */
  compact?: boolean;
  disabled?: boolean;
  /** 暦の id の元（rewrite 配信の面では安定 id を渡す） */
  id?: string;
}) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = isControlled ? controlled : internal;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value || todayLocal());
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const baseId = id ?? autoId;

  const panelRef = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    if (!open) {
      setUp(false);
      return;
    }
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const rect = root.getBoundingClientRect();
    const need = panel.offsetHeight + 8;
    const below = window.innerHeight - rect.bottom;
    setUp(need > below && rect.top > below);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-ymd="${cursor}"]`)?.focus();
  }, [open, cursor]);

  function openPanel() {
    if (disabled) return;
    setCursor(value || todayLocal());
    setOpen(true);
  }

  function choose(v: string) {
    if (!isControlled) setInternal(v);
    onChange?.(v);
    setOpen(false);
    chipRef.current?.focus();
  }

  function onChipKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openPanel();
    }
  }

  function onGridKey(e: KeyboardEvent<HTMLDivElement>) {
    const move: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in move) {
      e.preventDefault();
      setCursor((c) => addDays(c, move[e.key]));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const p = parseYmd(cursor)!;
      const t = new Date(Date.UTC(p.y, p.m - 1 + (e.key === "PageUp" ? -1 : 1), 1));
      const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
      setCursor(ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, Math.min(p.d, last)));
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      chipRef.current?.focus();
    }
  }

  const c = parseYmd(cursor) ?? parseYmd(todayLocal())!;
  const first = ymd(c.y, c.m, 1);
  const start = addDays(first, -weekdayOf(first));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = todayLocal();
  const monthLabel = `${c.y}年${c.m}月`;
  const shiftMonth = (delta: number) => {
    const t = new Date(Date.UTC(c.y, c.m - 1 + delta, 1));
    setCursor(ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, 1));
  };

  return (
    <div className="bf-datefield" ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={chipRef}
        type="button"
        className="bf-datefield__chip"
        aria-label={value ? `${ariaLabel}: ${dateFieldLabel(value)}` : ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-placeholder={!value || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onChipKey}
      >
        {value ? compact && parseYmd(value) ? `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}（${WEEKDAY_JA[weekdayOf(value)]}）` : dateFieldLabel(value) : placeholder}
      </button>
      {open && (
        <div ref={panelRef} className="bf-datefield__panel" data-placement={up ? "up" : undefined} role="dialog" aria-label={ariaLabel}>
          <div className="bf-datefield__head">
            <button type="button" className="bf-datefield__nav" aria-label="前の月" onClick={() => shiftMonth(-1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <span className="bf-datefield__month" id={`${baseId}-month`} aria-live="polite">
              {monthLabel}
            </span>
            <button type="button" className="bf-datefield__nav" aria-label="次の月" onClick={() => shiftMonth(1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="bf-datefield__grid" role="grid" aria-labelledby={`${baseId}-month`} ref={gridRef} onKeyDown={onGridKey}>
            <div className="bf-datefield__row" role="row">
              {WEEKDAY_JA.map((w) => (
                <span key={w} role="columnheader" className="bf-datefield__dow">
                  {w}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, r) => (
              <div key={r} className="bf-datefield__row" role="row">
                {days.slice(r * 7, r * 7 + 7).map((d) => {
                  const p = parseYmd(d)!;
                  return (
                    <span key={d} role="gridcell" aria-selected={d === value}>
                      <button
                        type="button"
                        className="bf-datefield__day"
                        data-ymd={d}
                        data-outside={p.m !== c.m || undefined}
                        data-today={d === today || undefined}
                        data-selected={d === value || undefined}
                        tabIndex={d === cursor ? 0 : -1}
                        aria-label={dateFieldLabel(d)}
                        onClick={() => choose(d)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            choose(d);
                          }
                        }}
                      >
                        {p.d}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
