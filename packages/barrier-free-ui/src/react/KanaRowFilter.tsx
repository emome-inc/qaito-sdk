"use client";

import { KANA_ROWS, type KanaRow } from "./kana";

export function KanaRowFilter({
  value,
  onChange,
  label = "頭文字で絞り込み",
}: {
  /** 選んでいる行（null = すべて） */
  value: KanaRow | null;
  onChange: (row: KanaRow | null) => void;
  /** グループの読み上げ名 */
  label?: string;
}) {
  return (
    <div className="bf-kana-rows" role="group" aria-label={label}>
      <button type="button" className="bf-kana-rows__btn" aria-pressed={value === null} onClick={() => onChange(null)}>
        すべて
      </button>
      {KANA_ROWS.map((row) => {
        const active = value === row;
        return (
          <button
            key={row}
            type="button"
            className="bf-kana-rows__btn"
            aria-pressed={active}
            aria-label={`${row}行`}
            onClick={() => onChange(active ? null : row)}
          >
            {row}
          </button>
        );
      })}
    </div>
  );
}
