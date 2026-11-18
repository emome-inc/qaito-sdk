import { z } from "zod";
import { normalizeKanaName } from "./kana";
import { partialForUpdate } from "./partial-for-update";

export const MEDICATION_NAME_MAX = 100;
export const MEDICATION_NAME_KANA_MAX = 200;
export const MEDICATION_MEMO_MAX = 1000;

/** 医薬品コード（全国の医薬品マスターのレセプト電算処理システム用コード・9 桁） */
const nationalCodeSchema = z.string().regex(/^\d{9}$/, "医薬品コードは 9 桁の数字です");

/** POST /medication/medications */
export const createMedicationSchema = z.object({
  name: z.string().trim().min(1, "薬の名前は必須です").max(MEDICATION_NAME_MAX),
  name_kana: z.string().max(MEDICATION_NAME_KANA_MAX).transform(normalizeKanaName).optional(),
  memo: z.string().trim().max(MEDICATION_MEMO_MAX).optional(),
  national_code: nationalCodeSchema.optional(),
});

/** PATCH /medication/medications/:id（医薬品コードは後から付け替えない） */
export const updateMedicationSchema = partialForUpdate(createMedicationSchema.omit({ national_code: true }));

export const ensureMedicationFromNationalSchema = z.object({ code: nationalCodeSchema });
export type EnsureMedicationFromNationalInput = z.infer<typeof ensureMedicationFromNationalSchema>;

/** GET /medication/medications（検索 `q`・かな順・削除済みを除く） */
export const listMedicationsQuerySchema = z.object({
  q: z.string().trim().max(MEDICATION_NAME_MAX).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type ListMedicationsQuery = z.infer<typeof listMedicationsQuerySchema>;

/** 剤形（医薬品マスターの「剤形」1 / 4 / 6 / 8 / 3 を写した値） */
export const nationalDosageForms = ["internal", "injection", "external", "dental", "other"] as const;
export type NationalDosageForm = (typeof nationalDosageForms)[number];

export const nationalDosageFormLabels: Record<NationalDosageForm, string> = {
  internal: "内用薬",
  injection: "注射薬",
  external: "外用薬",
  dental: "歯科用",
  other: "その他",
};

/** 取込の 1 行（CSV の列から組んだ正規形。DB の列と 1 対 1） */
export const nationalMedicationRowSchema = z.object({
  code: z.string().regex(/^\d{9}$/, "医薬品コードは 9 桁の数字です"),
  name: z.string().min(1, "漢字名称が空です"),
  name_kana: z.string().nullable(),
  unit: z.string().nullable(),
  dosage_form: z.enum(nationalDosageForms),
  yakka_code: z.string().regex(/^[0-9A-Z]{12}$/, "薬価基準収載医薬品コードは 12 桁です").nullable(),
  generic_name: z.string().nullable(),
  is_generic: z.boolean(),
  transitional_until: z.string().date().nullable(),
});
export type NationalMedicationRow = z.infer<typeof nationalMedicationRowSchema>;

export const NATIONAL_MEDICATION_QUERY_MAX = 50;

/**
 * GET /reference/national-medications（薬の名前の予測入力の全国の側）。`q` は名称・カナ・一般名の部分一致
 * （ひらがな・半角カナはカタカナに・NFKC にそろえて引く）。読むのは有効な版だけ。
 */
export const listNationalMedicationsQuerySchema = z.object({
  q: z.string().trim().min(1, "検索語を入れてください").max(NATIONAL_MEDICATION_QUERY_MAX),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNationalMedicationsQuery = z.infer<typeof listNationalMedicationsQuerySchema>;
