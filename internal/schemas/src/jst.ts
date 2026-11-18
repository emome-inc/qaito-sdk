
const TZ = "Asia/Tokyo";

/**
 * 任意の時刻を JST の日付（`YYYY-MM-DD`）にする。
 *
 * `sv-SE` ロケールは `YYYY-MM-DD` を返す（ISO と同形式）。
 * `Intl.DateTimeFormat` でも同じ結果になるが、**実装を 1 つに固定する**ために
 * こちらへ寄せた（同じ値を返す 2 実装が並ぶと、どちらを直すべきか分からなくなる）。
 */
export function jstDate(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** JST の「今日」（`YYYY-MM-DD`） */
export function jstToday(): string {
  return jstDate(new Date());
}

/**
 * JST の年月（`YYYY-MM`）。引数を省くと「今月」。
 *
 * 請求は月単位なので、`jstToday().slice(0, 7)` を各所で書くより
 * 意図が読める名前で 1 本にする。
 */
export function jstYearMonth(d: Date = new Date()): string {
  return jstDate(d).slice(0, 7);
}

/**
 * JST の「時」（0〜23）。
 *
 * 挨拶の出し分けなど、日付ではなく時間帯で分岐するとき用。日付と同じく
 * **端末 TZ でなく JST で決める**（出張先や端末設定で挙動が変わらないように）。
 */
export function jstHour(d: Date = new Date()): number {
  return Number(
    d.toLocaleString("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }),
  );
}

/**
 * JST の時刻（`HH:mm`・24 時間）。申し送りの「書いた時刻」など、時刻だけを出すとき用。
 * 端末 TZ でなく JST で決める（`hourCycle: "h23"` で真夜中を 00 にする。`jstHour` と同じ理由）。
 */
export function jstTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}
