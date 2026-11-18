"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Clock } from "lucide-react";

const STEP = 15;

function toMinutes(v: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function fromMinutes(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

/** 表示（「午前9:00」「午後2:15」。0 時は午前0、12 時は午後0） */
export function timeFieldLabel(v: string): string {
  const n = toMinutes(v);
  if (n === null) return "";
  const h = Math.floor(n / 60);
  const mm = String(n % 60).padStart(2, "0");
  return h < 12 ? `午前${h}:${mm}` : `午後${h - 12}:${mm}`;
}

/** 24 時間の表示（「09:00」「14:15」）。値（HH:MM）と同じ字面 */
function timeFieldLabel24(v: string): string {
  return toMinutes(v) === null ? "" : v;
}

/** 長さの文（「30分」「1時間」「2時間30分」） */
function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/**
 * 打ち込みを HH:MM に読む。読めなければ null。
 * 受ける形: 14:15 / 14時15分 / 1415 / 14 / 2:15 / 午後2:15 / 午前9 / 午後12:30（＝ 12:30）/ 2:15pm
 */
export function parseTimeInput(raw: string, maxMinutes = 1439): string | null {
  let s = raw.trim().replace(/[０-９：]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).toLowerCase();
  if (!s) return null;
  let pm: boolean | null = null;
  if (/^(午後|pm)/.test(s) || /(午後|pm)$/.test(s)) pm = true;
  if (/^(午前|am)/.test(s) || /(午前|am)$/.test(s)) pm = false;
  s = s.replace(/午前|午後|am|pm/g, "").replace(/時/, ":").replace(/分/, "").trim();
  let h: number;
  let m: number;
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  const digits = /^(\d{1,4})$/.exec(s);
  if (colon) {
    h = Number(colon[1]);
    m = Number(colon[2]);
  } else if (digits) {
    const d = digits[1];
    if (d.length <= 2) {
      h = Number(d);
      m = 0;
    } else {
      h = Number(d.slice(0, d.length - 2));
      m = Number(d.slice(-2));
    }
  } else {
    return null;
  }
  if (pm === true && h < 12) h += 12;
  if (pm === false && h === 12) h = 0;
  if (m > 59 || h * 60 + m > maxMinutes || (pm !== null && h > 23)) return null;
  return fromMinutes(h * 60 + m);
}

export function TimeField({
  name,
  value: controlled,
  defaultValue,
  onChange,
  durationFrom,
  durationStep,
  hour24 = false,
  maxMinutes = 1439,
  icons = false,
  placeholder,
  ariaLabel = "時刻",
  "aria-describedby": describedBy,
  clearable = false,
  disabled = false,
  id,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  /** 決めた時刻（HH:MM） */
  onChange?: (value: string) => void;
  /** この時刻（HH:MM）から後の行だけを並べ、各行に長さを添える。終了の時刻の欄で開始を渡す */
  durationFrom?: string | null;
  /** `durationFrom` からこの分の倍数の時刻だけを一覧に並べる（20 なら 20・40・60 分後…）。打ち込みは制限しない */
  durationStep?: number;
  /** 欄と一覧を 24 時間（「14:15」）で出す。既定は「午後2:15」 */
  hour24?: boolean;
  /** 選べる上限を開始日 00:00 からの分で指定（34:00 なら 2040）。 */
  maxMinutes?: number;
  /** 左に時計・右に ∨ を出す */
  icons?: boolean;
  /** 空のときの案内（「時間」） */
  placeholder?: string;
  ariaLabel?: string;
  "aria-describedby"?: string;
  /** 文字を消して離れたら空にする（任意の時刻の欄） */
  clearable?: boolean;
  disabled?: boolean;
  /** 入力欄の id。一覧の id にも使う */
  id?: string;
}) {
  const label = hour24 || maxMinutes >= 1440 ? timeFieldLabel24 : timeFieldLabel;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const value = isControlled ? controlled : internal;
  const [text, setText] = useState(label(value));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [typed, setTyped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;

  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(label(value));
  }

  const from = durationFrom ? toMinutes(durationFrom) : null;
  const options = useMemo(() => {
    const step = from !== null && durationStep && durationStep > 0 ? durationStep : null;
    const all = step !== null
      ? Array.from({ length: Math.floor((maxMinutes - from!) / step) + 1 }, (_, i) => from! + i * step)
      : Array.from({ length: Math.floor(maxMinutes / STEP) + 1 }, (_, i) => i * STEP);
    const list = from === null ? all : all.filter((n) => n > from);
    return list.map((n) => ({
      value: fromMinutes(n),
      label: label(fromMinutes(n)),
      note: from === null ? null : `（${durationLabel(n - from)}）`,
    }));
  }, [from, durationStep, label, maxMinutes]);

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
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function openList() {
    if (disabled) return;
    const n = toMinutes(value);
    const idx = n === null ? 0 : options.findIndex((o) => (toMinutes(o.value) ?? 0) >= n);
    setHighlight(idx < 0 ? 0 : idx);
    setTyped(false);
    setOpen(true);
  }

  function commit(v: string) {
    if (!isControlled) setInternal(v);
    setText(label(v));
    if (v !== value) onChange?.(v);
  }

  function choose(v: string) {
    commit(v);
    setOpen(false);
  }

  /** 打ち込んだ文字を読み直す（読めなければ元に戻す） */
  function readTyped() {
    if (clearable && text.trim() === "") return commit("");
    const parsed = parseTimeInput(text, maxMinutes);
    if (parsed) commit(parsed);
    else setText(label(value));
  }

  /** 打った文字を欄に入れ、読める時刻なら一覧をその近くの行へ動かす */
  function onType(next: string) {
    setText(next);
    setTyped(true);
    const n = toMinutes(parseTimeInput(next, maxMinutes) ?? "");
    if (n === null) return;
    const idx = options.findIndex((o) => (toMinutes(o.value) ?? 0) >= n);
    if (idx >= 0) setHighlight(idx);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const last = options.length - 1;
      setTyped(false);
      setHighlight((h) => (e.key === "ArrowDown" ? (h >= last ? 0 : h + 1) : h <= 0 ? last : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && !typed && options[highlight]) choose(options[highlight].value);
      else {
        readTyped();
        setOpen(false);
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setText(label(value));
    }
  }

  const input = (
    <input
      id={id}
      type="text"
      className="bf-timefield__input"
      role="combobox"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="none"
      aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
      inputMode="text"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      onChange={(e) => onType(e.target.value)}
      onClick={() => (open ? setOpen(false) : openList())}
      onBlur={() => {
        readTyped();
      }}
      onKeyDown={onKey}
    />
  );

  return (
    <div className="bf-timefield" ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} />}
      {icons ? (
        <span className="bf-timefield__box">
          {input}
          <span className="bf-timefield__clock" aria-hidden="true">
            <Clock width="100%" height="100%" focusable="false" />
          </span>
          <span className="bf-timefield__caret" aria-hidden="true">
            {}
            <svg viewBox="0 0 16 16" width="100%" height="100%" focusable="false">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      ) : (
        input
      )}
      {open && (
        <div className="bf-timefield__panel" role="listbox" id={listId} aria-label={ariaLabel} ref={listRef}>
          {options.map((o, idx) => (
            <div
              key={o.value}
              id={`${listId}-${idx}`}
              role="option"
              aria-selected={o.value === value}
              data-index={idx}
              data-highlighted={idx === highlight || undefined}
              className="bf-timefield__option"
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.value);
              }}
            >
              {o.label}
              {o.note && <span className="bf-timefield__note">{o.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
