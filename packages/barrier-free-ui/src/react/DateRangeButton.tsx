"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, IconButton } from "./Button";
import { Dialog } from "./Dialog";

export type DateRangeValue = { start: string; end: string };

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** `YYYY-MM-DD` を日数だけずらす（暦の日付で数える。時差に依らない） */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
function addMonths(month: string, months: number): string {
  const d = new Date(`${month}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
/** 端末の暦の今日（`today` を渡さないとき） */
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 既定の期間（今日を基準に。週は日曜はじまり） */
export function dateRangePresets(today: string): { label: string; start: string; end: string }[] {
  const weekStart = addDays(today, -weekdayOf(today));
  const thisMonth = monthStart(today);
  const lastMonth = addMonths(thisMonth, -1);
  return [
    { label: "今日", start: today, end: today },
    { label: "昨日", start: addDays(today, -1), end: addDays(today, -1) },
    { label: "今週（日〜今日）", start: weekStart, end: today },
    { label: "先週（日〜土）", start: addDays(weekStart, -7), end: addDays(weekStart, -1) },
    { label: "今月", start: thisMonth, end: today },
    { label: "先月", start: lastMonth, end: addDays(thisMonth, -1) },
    { label: "過去 7 日間", start: addDays(today, -6), end: today },
    { label: "過去 14 日間", start: addDays(today, -13), end: today },
    { label: "過去 30 日間", start: addDays(today, -29), end: today },
  ];
}

/**
 * 期間を選ぶボタン。押すと左に既定の期間・右にミニカレンダーが出て、開始日 → 終了日の順に押して範囲を選ぶ。
 * 閉じている間も名前つきの hidden を持つので、囲んだ GET フォームの期間が消えない。
 */
export function DateRangeButton({
  start, end, onChange, startName, endName, minYear, maxYear, today,
  submitOnApply = false, disabled = false,
}: DateRangeValue & {
  onChange?: (value: DateRangeValue) => void;
  startName?: string;
  endName?: string;
  minYear?: number;
  maxYear?: number;
  /** 既定の期間の基準日（`YYYY-MM-DD`）。業務日（JST）を使う画面は渡す。省略すると端末の今日 */
  today?: string;
  submitOnApply?: boolean;
  disabled?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ start, end });
  const [seen, setSeen] = useState({ start, end });
  if (seen.start !== start || seen.end !== end) {
    setSeen({ start, end });
    setRange({ start, end });
  }
  const [draft, setDraft] = useState(range);
  /** 次に押した日を開始日にするか終了日にするか */
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [month, setMonth] = useState(monthStart(range.end || range.start || localToday()));
  const sameYear = range.start.slice(0, 4) === range.end.slice(0, 4);
  const short = (date: string) => date ? (sameYear ? date.slice(5) : date).replace(/-/g, "/") : "未指定";
  const long = (date: string) => date ? `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日` : "未選択";
  const invalid = !draft.start || !draft.end || draft.start > draft.end;
  const base = today ?? localToday();
  const presets = dateRangePresets(base);
  const minDate = minYear ? `${minYear}-01-01` : null;
  const maxDate = maxYear ? `${maxYear}-12-31` : null;
  const outOfRange = (date: string) => (minDate !== null && date < minDate) || (maxDate !== null && date > maxDate);

  function openPicker() {
    setDraft(range);
    setPicking("start");
    setMonth(monthStart(range.end || range.start || base));
    setOpen(true);
  }
  function pick(date: string) {
    if (picking === "start") {
      setDraft({ start: date, end: "" });
      setPicking("end");
      return;
    }
    setDraft((value) => (date < value.start ? { start: date, end: value.start } : { start: value.start, end: date }));
    setPicking("start");
  }
  function choosePreset(preset: DateRangeValue) {
    setDraft({ start: preset.start, end: preset.end });
    setPicking("start");
    setMonth(monthStart(preset.end));
  }

  const first = addDays(month, -weekdayOf(month));
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  const monthLabel = `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`;

  return (
    <div ref={root} className="bf-date-range">
      {startName && <input type="hidden" name={startName} value={range.start} disabled={disabled} />}
      {endName && <input type="hidden" name={endName} value={range.end} disabled={disabled} />}
      <Button variant="secondary" disabled={disabled} aria-label={`期間 ${range.start}から${range.end}`} aria-haspopup="dialog" aria-expanded={open} onClick={openPicker}>
        <CalendarDays size={18} aria-hidden="true" />{short(range.start)}〜{short(range.end)}
      </Button>
      <Dialog open={open} title="期間を選択" size="lg" placement="bottom" onClose={() => setOpen(false)} body={
        <div className="bf-date-range__picker">
          <div className="bf-date-range__presets" role="group" aria-label="既定の期間">
            {presets.map((preset) => (
              <button key={preset.label} type="button" className="bf-date-range__preset"
                aria-pressed={draft.start === preset.start && draft.end === preset.end}
                onClick={() => choosePreset(preset)}>
                {preset.label}
              </button>
            ))}
          </div>
          <div className="bf-date-range__calendar">
            <div className="bf-date-range__ends">
              <button type="button" className="bf-date-range__end" aria-pressed={picking === "start"} onClick={() => setPicking("start")}>
                <small>開始日</small>{long(draft.start)}
              </button>
              <span aria-hidden="true">–</span>
              <button type="button" className="bf-date-range__end" aria-pressed={picking === "end"} disabled={!draft.start} onClick={() => setPicking("end")}>
                <small>終了日</small>{long(draft.end)}
              </button>
            </div>
            <div className="bf-date-range__month">
              <IconButton label="前の月" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={18} /></IconButton>
              <strong aria-live="polite">{monthLabel}</strong>
              <IconButton label="次の月" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></IconButton>
            </div>
            <div className="bf-date-range__grid">
              {WEEKDAYS.map((day) => <span key={day} className="bf-date-range__weekday" aria-hidden="true">{day}</span>)}
              {days.map((date) => {
                const edge = date === draft.start || date === draft.end;
                const inside = !!draft.start && !!draft.end && date > draft.start && date < draft.end;
                return (
                  <button key={date} type="button" className="bf-date-range__day"
                    data-outside={date.slice(0, 7) !== month.slice(0, 7) || undefined}
                    data-edge={edge || undefined}
                    data-inside={inside || undefined}
                    aria-current={date === base ? "date" : undefined}
                    disabled={outOfRange(date)}
                    aria-label={`${long(date)}（${WEEKDAYS[weekdayOf(date)]}）${date === draft.start ? "、開始日" : ""}${date === draft.end ? "、終了日" : ""}${date === base ? "、今日" : ""}`}
                    onClick={() => pick(date)}>
                    {Number(date.slice(8, 10))}
                  </button>
                );
              })}
            </div>
            <p className="bf-date-range__hint" aria-live="polite">
              {picking === "end" ? "終了日を押してください。" : "開始日を押すと選び直せます。"}
            </p>
          </div>
        </div>
      }>
        <Button variant="secondary" onClick={() => setOpen(false)}>キャンセル</Button>
        <Button disabled={invalid} onClick={() => {
          flushSync(() => { setRange(draft); onChange?.(draft); setOpen(false); });
          if (submitOnApply) root.current?.closest("form")?.requestSubmit();
        }}>適用</Button>
      </Dialog>
    </div>
  );
}
