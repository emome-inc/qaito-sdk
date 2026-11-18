"use client";

import { useState, type ReactNode, type AnchorHTMLAttributes } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { IconButton } from "./Button";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
/** A month picker on wide screens, an expandable week picker on phones. Dates are ISO calendar dates. */
export function ResponsiveCalendar({ selectedDate, today, hrefForDate, renderLink, defaultExpanded = false }: {
  selectedDate: string;
  today: string;
  hrefForDate: (date: string) => string;
  renderLink?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => ReactNode;
  /** 狭い幅でも最初から月全体を出す（日付を選ぶダイアログの中など、週の帯に畳む必要が無いとき） */
  defaultExpanded?: boolean;
}) {
  const [month, setMonth] = useState(`${selectedDate.slice(0, 7)}-01`);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [syncedDate, setSyncedDate] = useState(selectedDate);
  if (syncedDate !== selectedDate) {
    setSyncedDate(selectedDate);
    setMonth(`${selectedDate.slice(0, 7)}-01`);
    setExpanded(defaultExpanded);
  }
  const first = new Date(`${month}T00:00:00Z`);
  const label = `${first.getUTCFullYear()}年${first.getUTCMonth() + 1}月`;
  const selected = new Date(`${selectedDate}T00:00:00Z`);
  const weekStart = new Date(selected);
  weekStart.setUTCDate(selected.getUTCDate() - selected.getUTCDay());
  const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const dates = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(1 - first.getUTCDay() + index);
    return { value: date.toISOString().slice(0, 10), day: date.getUTCDate(), weekday: WEEKDAYS[date.getUTCDay()], inWeek: date >= weekStart && date <= weekEnd };
  });
  const moveMonth = (delta: number) => { const next = new Date(first); next.setUTCMonth(next.getUTCMonth() + delta); setMonth(next.toISOString().slice(0, 10)); setExpanded(true); };
  return <section className="bf-responsive-calendar" data-expanded={expanded} aria-label="日付を選ぶカレンダー">
    <header>
      <strong aria-live="polite">{label}</strong>
      <IconButton label="前の月" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></IconButton>
      <IconButton label="次の月" onClick={() => moveMonth(1)}><ChevronRight size={18} /></IconButton>
      <span className="bf-mobile-only"><IconButton label={expanded ? "週表示に戻す" : "月全体を表示"} aria-expanded={expanded} onClick={() => { setMonth(`${selectedDate.slice(0, 7)}-01`); setExpanded(!expanded); }}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</IconButton></span>
    </header>
    <div className="bf-responsive-calendar__grid">
      {WEEKDAYS.map(day => <span className="bf-responsive-calendar__weekday" key={day}>{day}</span>)}
      {dates.map(date => {
        const props = { href: hrefForDate(date.value), className: `bf-responsive-calendar__date${date.inWeek ? " bf-responsive-calendar__date--week" : ""}`, "data-outside": date.value.slice(0, 7) !== month.slice(0, 7), "data-selected": date.value === selectedDate, "aria-current": date.value === today ? "date" as const : undefined, "aria-label": `${date.value}（${date.weekday}）${date.value === today ? "、今日" : ""}${date.value === selectedDate ? "、選択中" : ""}`, children: date.day };
        return <span className={`bf-responsive-calendar__cell${date.inWeek ? " bf-responsive-calendar__cell--week" : ""}`} key={date.value}>{renderLink ? renderLink(props) : <a {...props} />}</span>;
      })}
    </div>
  </section>;
}
