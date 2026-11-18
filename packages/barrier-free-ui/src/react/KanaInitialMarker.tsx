"use client";

import { kanaRowOf } from "./kana";

export function KanaInitialMarker({
  reading,
  visible = true,
}: {
  /** その人のふりがな */
  reading: string | null | undefined;
  /** 字を出すか（`kanaRowBreaks` の値。false でも幅は空けて名前の頭をそろえる） */
  visible?: boolean;
}) {
  const row = visible ? kanaRowOf(reading) : null;
  return (
    <span className="bf-kana-initial" data-empty={row === null ? "" : undefined} aria-hidden="true">
      {row}
    </span>
  );
}
