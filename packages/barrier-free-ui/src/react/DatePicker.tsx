"use client";

import { useMemo, useState } from "react";
import { BigSelect, type SelectOption } from "./BigSelect";
import { Button } from "./Button";

function parse(v: string | undefined): { y: string; m: string; d: string } {
  if (!v) return { y: "", m: "", d: "" };
  const [y = "", m = "", d = ""] = v.split("-");
  return { y, m: String(Number(m) || ""), d: String(Number(d) || "") };
}

function daysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

/** 西暦→和暦の簡易併記（昭和/平成/令和）。範囲外は西暦のみ。 */
function eraLabel(year: number): string {
  if (year >= 2019) return `令和${year - 2018}年(${year})`;
  if (year >= 1989) return `平成${year - 1988}年(${year})`;
  if (year >= 1926) return `昭和${year - 1925}年(${year})`;
  return `${year}`;
}

export function DatePicker({
  name,
  defaultValue,
  value,
  onChange,
  minYear,
  maxYear = new Date().getFullYear() + 10,
  showEra = true,
  clearable = false,
  ariaLabel = "日付",
  disabled = false,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  /** 年に和暦を併記する（生年月日向け） */
  showEra?: boolean;
  /** 「消す」ボタンを出す（任意の日付） */
  clearable?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const init = parse(value ?? defaultValue);
  const [y, setY] = useState(init.y);
  const [m, setM] = useState(init.m);
  const [d, setD] = useState(init.d);

  const lowYear = minYear ?? maxYear - 120;

  const yearOpts: SelectOption[] = useMemo(() => {
    const selected = Number(y);
    const top = selected > maxYear ? selected : maxYear;
    const bottom = selected && selected < lowYear ? selected : lowYear;
    const arr: SelectOption[] = [];
    for (let yr = top; yr >= bottom; yr--) {
      arr.push({ value: String(yr), label: showEra ? eraLabel(yr) : `${yr}年` });
    }
    return arr;
  }, [lowYear, maxYear, showEra, y]);

  const monthOpts: SelectOption[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}月`,
      })),
    [],
  );

  const dayOpts: SelectOption[] = useMemo(() => {
    const max = daysInMonth(Number(y), Number(m));
    return Array.from({ length: max }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}日`,
    }));
  }, [y, m]);

  const compose = (yy: string, mm: string, dd: string) =>
    yy && mm && dd ? `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}` : "";
  const composed = compose(y, m, d);

  const [seenValue, setSeenValue] = useState(value);
  if (value !== undefined && value !== seenValue) {
    setSeenValue(value);
    if (value !== composed) {
      const p = parse(value);
      setY(p.y);
      setM(p.m);
      setD(p.d);
    }
  }

  function update(yy: string, mm: string, dd: string) {
    setY(yy);
    setM(mm);
    setD(dd);
    const next = compose(yy, mm, dd);
    if (next !== composed) onChange?.(next);
  }

  const yearOptsWithCurrent =
    y && !yearOpts.some((o) => o.value === y)
      ? [...yearOpts, { value: y, label: showEra ? eraLabel(Number(y)) : `${y}年` }].sort((a, b) => Number(b.value) - Number(a.value))
      : yearOpts;

  const monthDay = (
    <>
      <div className="bf-datepicker__col">
        <BigSelect
          options={monthOpts}
          value={m}
          onChange={(v) => {
            const max = daysInMonth(Number(y), Number(v));
            update(y, v, Number(d) > max ? String(max) : d);
          }}
          placeholder="月"
          ariaLabel="月"
          disabled={disabled}
        />
      </div>
      <div className="bf-datepicker__col">
        <BigSelect
          options={dayOpts}
          value={d}
          onChange={(v) => update(y, m, v)}
          placeholder="日"
          ariaLabel="日"
          disabled={disabled}
        />
      </div>
    </>
  );

  return (
    <div className="bf-datepicker" role="group" aria-label={ariaLabel} data-era={showEra ? "true" : undefined}>
      {name && <input type="hidden" name={name} value={composed} />}
      <div className="bf-datepicker__col bf-datepicker__col--year">
        <BigSelect
          options={yearOptsWithCurrent}
          value={y}
          onChange={(v) => {
            const max = daysInMonth(Number(v), Number(m));
            update(v, m, Number(d) > max ? String(max) : d);
          }}
          placeholder="年"
          ariaLabel="年"
          disabled={disabled}
        />
      </div>
      {}
      {showEra ? <div className="bf-datepicker__md">{monthDay}</div> : monthDay}
      {clearable && (y || m || d) && (
        <Button variant="ghost" onClick={() => update("", "", "")} disabled={disabled} aria-label={`${ariaLabel}を消す`}>
          消す
        </Button>
      )}
    </div>
  );
}
