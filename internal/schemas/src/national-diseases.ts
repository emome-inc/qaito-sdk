import { z } from "zod";

/** 修飾語が傷病名の前に付くか後ろに付くか（修飾語コードの範囲で決まる）。 */
export const nationalModifierPositions = ["prefix", "suffix", "other"] as const;
export type NationalModifierPosition = (typeof nationalModifierPositions)[number];

export const nationalModifierPositionLabels: Record<NationalModifierPosition, string> = {
  prefix: "前に付く",
  suffix: "後ろに付く",
  other: "その他",
};

/**
 * 修飾語コード（4 桁）から前後を決める。仕様書（レセプト電算処理システム 基本マスターファイル仕様説明書）の
 * 修飾語マスターの項番 3: 0001〜7999 = 傷病名の接頭語 / 8000〜8999 = 接尾語 / 9000〜9999 = 歯科部位コード。
 */
export function nationalModifierPositionOf(code: string): NationalModifierPosition {
  const n = Number(code);
  if (n >= 1 && n <= 7999) return "prefix";
  if (n >= 8000 && n <= 8999) return "suffix";
  return "other";
}

/** 傷病名コード（7 桁）。`0000999` は「未コード化傷病名」（マスターに無い名前を記録するための固定コード）。 */
export const NATIONAL_DISEASE_UNCODED = "0000999";

/** ICD-10 の分類番号（大文字・ドットなし）。マスターには `T08-1` `M45-9` のようにハイフンを含む値がある（実ファイルで確認） */
export const ICD10_PATTERN = /^[A-Z][0-9A-Z]{2}[0-9A-Z-]{0,4}$/;
const icd10Schema = z.string().regex(ICD10_PATTERN, "ICD-10 の形ではありません");

/** 取込の 1 行（ファイルの列から組んだ正規形。DB の列と 1 対 1） */
export const nationalDiseaseRowSchema = z.object({
  code: z.string().regex(/^\d{7}$/, "傷病名コードは 7 桁の数字です"),
  name: z.string().min(1, "傷病名基本名称が空です"),
  name_kana: z.string().nullable(),
  /** ICD-10（2013）の基礎疾患の分類番号（ドットなし・例 `E103`。一部は `T08-1` のようにハイフンを含む）。無ければ null */
  icd10_primary: icd10Schema.nullable(),
  /** ICD-10（2013）の症状発現の分類番号（例 `H360`）。無ければ null */
  icd10_secondary: icd10Schema.nullable(),
  /** 廃止に伴う移行先の傷病名コード。無ければ null */
  successor_code: z.string().regex(/^\d{7}$/, "移行先コードは 7 桁の数字です").nullable(),
  /** 使用できる最終日。廃止されていなければ null */
  abolished_on: z.string().date().nullable(),
});
export type NationalDiseaseRow = z.infer<typeof nationalDiseaseRowSchema>;

export const nationalDiseaseModifierRowSchema = z.object({
  code: z.string().regex(/^\d{4}$/, "修飾語コードは 4 桁の数字です"),
  name: z.string().min(1, "修飾語名称が空です"),
  name_kana: z.string().nullable(),
  position: z.enum(nationalModifierPositions),
});
export type NationalDiseaseModifierRow = z.infer<typeof nationalDiseaseModifierRowSchema>;

export const NATIONAL_DISEASE_QUERY_MAX = 50;

/**
 * GET /reference/national-diseases（傷病名を選ぶ入力の候補）。`q` は名称・カナ・傷病名コード・ICD-10 で引く。
 * ひらがな・半角カナ・半角英数も受ける（そろえて引く）。読むのは有効な版だけ。
 */
export const listNationalDiseasesQuerySchema = z.object({
  q: z.string().trim().min(1, "検索語を入れてください").max(NATIONAL_DISEASE_QUERY_MAX),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNationalDiseasesQuery = z.infer<typeof listNationalDiseasesQuerySchema>;

/**
 * GET /reference/national-disease-modifiers（修飾語の候補）。表は約 2,400 行なので `q` は省略できる
 * （前後の区分だけで札に並べる使い方）。`position` で前に付く・後ろに付くを絞る。
 */
export const listNationalDiseaseModifiersQuerySchema = z.object({
  q: z.string().trim().max(NATIONAL_DISEASE_QUERY_MAX).optional(),
  position: z.enum(nationalModifierPositions).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNationalDiseaseModifiersQuery = z.infer<typeof listNationalDiseaseModifiersQuerySchema>;
