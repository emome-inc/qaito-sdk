
/**
 * カタカナをひらがなに変換する。
 * かな入力（カタカナ）でひらがなのフィールドにヒットさせるための正規化。
 * 介護現場の名簿検索はかな入力が主なので、検索の既定挙動として持つ。
 */
export function toHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** 五十音の行（あ行・か行 …） */
export type KanaRow = "あ" | "か" | "さ" | "た" | "な" | "は" | "ま" | "や" | "ら" | "わ";

/** 行の並び（五十音順） */
export const KANA_ROWS: readonly KanaRow[] = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

/** 各行に属するひらがな（濁点・半濁点・小書きを含む） */
const ROW_CHARS: Record<KanaRow, string> = {
  あ: "あいうえおぁぃぅぇぉゔ",
  か: "かきくけこがぎぐげごゕゖ",
  さ: "さしすせそざじずぜぞ",
  た: "たちつてとだぢづでどっ",
  な: "なにぬねの",
  は: "はひふへほばびぶべぼぱぴぷぺぽ",
  ま: "まみむめも",
  や: "やゆよゃゅょ",
  ら: "らりるれろ",
  わ: "わをんゐゑゎ",
};

const CHAR_TO_ROW: Map<string, KanaRow> = (() => {
  const m = new Map<string, KanaRow>();
  for (const row of KANA_ROWS) for (const ch of ROW_CHARS[row]) m.set(ch, row);
  return m;
})();

/**
 * ふりがなの先頭文字から五十音の行を返す。カタカナはひらがなに寄せる。
 * 先頭が漢字・英字など行に属さない文字なら null（行では絞れない）。
 */
export function kanaRowOf(reading: string | null | undefined): KanaRow | null {
  if (!reading) return null;
  for (const ch of toHiragana(reading).trim()) {
    const row = CHAR_TO_ROW.get(ch);
    if (row) return row;
    if (ch.trim()) return null;
  }
  return null;
}

/** ふりがなが指定の行に属するか。row が null（すべて）なら常に true */
export function matchesKanaRow(reading: string | null | undefined, row: KanaRow | null): boolean {
  return row === null || kanaRowOf(reading) === row;
}

/**
 * 並んだ一覧で、頭文字の目安（`KanaInitialMarker`）を出す位置。行（`kanaRowOf`）が前の人と変わる人が true
 * （先頭は true）。並び順は呼び出し側のまま（五十音順に並べるのは一覧の責務）。
 * 行に属さない人（ふりがなが空・漢字など）が続くときは、最初の 1 人だけ true。
 */
export function kanaRowBreaks<T>(items: readonly T[], readingOf: (item: T) => string | null | undefined): boolean[] {
  let prev: KanaRow | null | undefined;
  return items.map((item, i) => {
    const row = kanaRowOf(readingOf(item));
    const isBreak = i === 0 || row !== prev;
    prev = row;
    return isBreak;
  });
}
