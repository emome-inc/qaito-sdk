"use client";

import { useMemo, useState } from "react";
import { BigSelect, type SelectOption } from "./BigSelect";

function parse(v?: string): { h: string; m: string } {
  if (!v) return { h: "", m: "" };
  const [h = "", m = ""] = v.split(":");
  return { h: String(Number(h)), m: String(Number(m)) };
}

/**
 * 時・分 → 送信する値（`HH:MM`）。**片方だけのときは時刻にならない**ので空にする。
 *
 * 片方だけの状態は {@link nextMinuteForHour} と「分は時を選ぶまで押せない」で
 * 作れないようにしてある（下の `TimePicker` 参照）。ここはその最後の受け皿。
 */
export function composeTimeValue(h: string, m: string): string {
  if (h === "" || m === "") return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function nextMinuteForHour(hour: string, minute: string): string {
  if (hour === "") return "";
  return minute === "" ? "0" : minute;
}

export function TimePicker({
  name,
  defaultValue,
  minuteStep = 5,
  clearable = false,
  disabled = false,
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  minuteStep?: number;
  /**
   * 「指定なし」を選べるようにする（選ぶと空 = 未設定に戻る）。
   * これが無いと一度選んだ時刻を消せず、面ごとに「未設定に戻す」ボタンを生やすことになる。
   *
   * 「指定なし」を出すのは**時の側だけ**。分にも出すと「8時・指定なし」という
   * 時刻にならない組み合わせが作れてしまう（未設定に戻すのは時を指定なしにする）。
   */
  clearable?: boolean;
  /** 読むだけの面で操作させない（保存できない人に触らせない）。 */
  disabled?: boolean;
  /**
   * 時刻が変わったときに送る値（hidden input と同じ `HH:MM`・片方だけなら `""`）。
   * 面が 2 つの時刻を比べて確かめる（送迎の迎え・送り等）ときに使う。値の持ち主はこの部品のまま。
   */
  onChange?: (value: string) => void;
}) {
  const init = parse(defaultValue);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);

  const hours: SelectOption[] = useMemo(
    () => [
      ...(clearable ? [{ value: "", label: "指定なし" }] : []),
      ...Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: `${i}時` })),
    ],
    [clearable],
  );
  const minutes: SelectOption[] = useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => {
        const v = i * minuteStep;
        return { value: String(v), label: `${String(v).padStart(2, "0")}分` };
      }),
    [minuteStep],
  );

  const changeHour = (v: string) => {
    const nextM = nextMinuteForHour(v, m);
    setH(v);
    setM(nextM);
    onChange?.(composeTimeValue(v, nextM));
  };
  const changeMinute = (v: string) => {
    setM(v);
    onChange?.(composeTimeValue(h, v));
  };

  const composed = composeTimeValue(h, m);

  return (
    <div className="bf-datepicker" role="group" aria-label="時刻">
      {name && <input type="hidden" name={name} value={composed} />}
      <div className="bf-datepicker__col">
        <BigSelect
          options={hours}
          value={h}
          onChange={changeHour}
          placeholder="時"
          ariaLabel="時"
          disabled={disabled}
        />
      </div>
      <div className="bf-datepicker__col">
        {}
        <BigSelect
          options={minutes}
          value={m}
          onChange={changeMinute}
          placeholder="分"
          ariaLabel="分"
          disabled={disabled || h === ""}
        />
      </div>
    </div>
  );
}
