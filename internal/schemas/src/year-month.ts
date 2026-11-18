import { jstYearMonth } from "./jst";

/** 'YYYY-MM' → その月の 1 日（'YYYY-MM-01'）。 */
export function firstDayOfMonth(yearMonth: string): string {
  return `${yearMonth}-01`;
}

/** 'YYYY-MM' → その月の末日（'YYYY-MM-DD'）。 */
export function lastDayOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, "0")}`;
}

/** 'YYYY-MM' の日数（28〜31）。 */
export function daysInMonthCount(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** 'YYYY-MM' → 翌月の 1 日（'YYYY-MM-01'）。範囲条件の上端（`< 翌月1日`）に使う。 */
export function firstDayOfNextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

/** 'YYYY-MM' → 前月。 */
export function prevYm(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

/** 'YYYY-MM' → 翌月。 */
export function nextYm(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** 当月（JST 暦）の 'YYYY-MM'。**既定値の提示専用**（決定的な計算には使わない）。 */
export function currentYearMonth(): string {
  return jstYearMonth();
}
