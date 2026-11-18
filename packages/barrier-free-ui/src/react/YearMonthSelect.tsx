"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BigSelect } from "./BigSelect";
import { Button } from "./Button";

const YM_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** 業務の「今月」は JST で決める（サーバーの描画とブラウザで並びがずれないように）。 */
function thisMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/** YYYY-MM を n か月ずらす */
export function shiftYearMonth(ym: string, n: number): string {
  const m = YM_RE.exec(ym);
  if (!m) return ym;
  const idx = Number(m[1]) * 12 + (Number(m[2]) - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export function yearMonthLabel(ym: string): string {
  const m = YM_RE.exec(ym);
  return m ? `${m[1]}年${Number(m[2])}月` : ym;
}

type SelectProps = {
  /** フォームで送るときの名前（hidden input）。制御で使うなら value / onChange */
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel: string;
  /** 今月から何か月さかのぼって並べるか */
  monthsBack?: number;
  /** 今月から何か月先まで並べるか */
  monthsAhead?: number;
  placeholder?: string;
  /** 先頭に「すべての月」（値 ""）を足す。一覧の絞り込みに使う */
  allLabel?: string;
  disabled?: boolean;
};

/** 今の値が並びの外（古い月を URL で開いた等）でも選択肢に足して、表示が空にならないようにする。 */
export function YearMonthSelect({
  name,
  defaultValue,
  value,
  onChange,
  ariaLabel,
  monthsBack = 24,
  monthsAhead = 3,
  placeholder = "年月を選択",
  allLabel,
  disabled,
}: SelectProps) {
  const current = value ?? defaultValue ?? "";
  const options = useMemo(() => {
    let ym = shiftYearMonth(thisMonth(), monthsAhead);
    const months: string[] = [];
    for (let i = 0; i <= monthsBack + monthsAhead; i++) {
      months.push(ym);
      ym = shiftYearMonth(ym, -1);
    }
    if (YM_RE.test(current) && !months.includes(current)) {
      months.push(current);
      months.sort((a, b) => (a < b ? 1 : -1));
    }
    const opts = months.map((m) => ({ value: m, label: yearMonthLabel(m) }));
    return allLabel ? [{ value: "", label: allLabel }, ...opts] : opts;
  }, [current, monthsBack, monthsAhead, allLabel]);

  return (
    <BigSelect
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      disabled={disabled}
    />
  );
}

/**
 * 前月・翌月のボタン + 年月の選択。値は常に制御（value / onChange）。
 * allLabel を渡すと「すべての月」（値 ""）を選べる。"" のときは前月・翌月を押せない（選択から月を選ぶと使える）。
 */
export function YearMonthNav({
  value,
  onChange,
  ariaLabel = "年月",
  monthsBack,
  monthsAhead,
  allLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  monthsBack?: number;
  monthsAhead?: number;
  allLabel?: string;
  disabled?: boolean;
}) {
  const hasMonth = YM_RE.test(value);
  return (
    <div className="bf-yearmonth-nav" role="group" aria-label={ariaLabel}>
      <Button variant="ghost" aria-label="前月" onClick={() => onChange(shiftYearMonth(value, -1))} disabled={disabled || !hasMonth}>
        <ChevronLeft size={18} aria-hidden />
      </Button>
      <div className="bf-yearmonth-nav__select">
        <YearMonthSelect
          value={value}
          onChange={(v) => (v || allLabel ? onChange(v) : undefined)}
          ariaLabel={ariaLabel}
          monthsBack={monthsBack}
          monthsAhead={monthsAhead}
          allLabel={allLabel}
          disabled={disabled}
        />
      </div>
      <Button variant="ghost" aria-label="翌月" onClick={() => onChange(shiftYearMonth(value, 1))} disabled={disabled || !hasMonth}>
        <ChevronRight size={18} aria-hidden />
      </Button>
    </div>
  );
}
