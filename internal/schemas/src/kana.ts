
/**
 * ひらがな（ぁ U+3041 〜 ゖ U+3096）を対応するカタカナ（ァ U+30A1 〜 ヶ U+30F6）へ。
 *
 * 範囲はこの 1 区間だけ。踊り字（ゝ ゞ）・濁点の単体（゛ ゜）は変えない
 * （client-billing の全銀名義の出力を変えないため・SQL の translate と 1 対 1 で対応させるため）。
 */
export function hiraganaToKatakana(input: string): string {
  return input.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

/**
 * NFKC を掛けてから、ひらがなをカタカナへ。
 *
 * NFKC が半角カナ（ｶﾞ）を全角（ガ）へ合成し、全角英数を半角へ、全角空白（U+3000）を
 * 半角空白へ倒す。空白の整理はしない（呼び出し側の規則に任せる）。
 */
export function toFullwidthKatakana(input: string): string {
  return hiraganaToKatakana(input.normalize("NFKC"));
}

/**
 * 氏名のふりがなを保存の形にそろえる。
 *
 * 1. NFKC（半角カナ → 全角・全角空白 → 半角 等）
 * 2. ひらがな → 全角カタカナ
 * 3. 空白の連続を半角空白 1 つに
 * 4. 前後の空白を落とす
 *
 * 空白は JS の `\s`（U+0009–000D・U+0020・U+00A0・U+1680・U+2000–200A・U+2028・U+2029・
 * U+202F・U+205F・U+3000・U+FEFF）。SQL 側は同じ集合を列挙して書いてある。
 */
export function normalizeKanaName(input: string): string {
  return toFullwidthKatakana(input).replace(/\s+/g, " ").trim();
}

export function normalizeKanaNameOrNull(input: string | null | undefined): string | null {
  if (input == null) return null;
  const v = normalizeKanaName(input);
  return v === "" ? null : v;
}
