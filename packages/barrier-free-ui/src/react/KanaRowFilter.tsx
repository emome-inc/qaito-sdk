"use client";

import { KANA_ROWS, type KanaRow } from "./kana";

type FilterProps = {
  mode?: "filter";
  /** 選んでいる行（null = すべて） */
  value: KanaRow | null;
  onChange: (row: KanaRow | null) => void;
  /** グループの読み上げ名 */
  label?: string;
};

type JumpProps = {
  mode: "jump";
  /** 行き先のある行（無い行は押せない） */
  available: ReadonlySet<KanaRow>;
  /** その行の最初の人へ移る */
  onJump: (row: KanaRow) => void;
  /** まとまりの読み上げ名 */
  label?: string;
};

export function KanaRowFilter(props: FilterProps | JumpProps) {
  if (props.mode === "jump") {
    const { available, onJump, label = "五十音で行へ移る" } = props;
    return (
      <nav className="bf-kana-rows" aria-label={label}>
        {KANA_ROWS.map((row) => {
          const has = available.has(row);
          return (
            <button
              key={row}
              type="button"
              className="bf-kana-rows__btn"
              aria-label={has ? `${row}行へ移る` : `${row}行はありません`}
              disabled={!has}
              onClick={() => onJump(row)}
            >
              {row}
            </button>
          );
        })}
      </nav>
    );
  }
  const { value, onChange, label = "頭文字で絞り込み" } = props;
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
