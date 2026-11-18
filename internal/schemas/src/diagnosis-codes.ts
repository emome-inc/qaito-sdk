import { z } from "zod";

const uuid = (name: string) => z.string().uuid(`${name} は UUID 形式です`);

/** 傷病名コード（支払基金・7 桁）。`0000999` = 未コード化傷病名（マスターに無いと決めた印） */
const diseaseCode = z.string().regex(/^\d{7}$/, "diseaseCode は 7 桁の数字です");
const modifierCodes = z.array(z.string().regex(/^\d{4}$/, "modifierCodes は 4 桁の数字です")).max(5);

/** 名前の並びをマスターに当てる（12-2 の指示書の読み取り・ツール）。1 回 20 件まで */
export const matchDiagnosisNamesSchema = z.object({
  names: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
});
export type MatchDiagnosisNamesInput = z.infer<typeof matchDiagnosisNamesSchema>;

/**
 * コードの無い傷病名にコードをまとめて付ける（12-4b）。1 回 200 件まで。
 * `expectedName` は当てたときの記録の名前。書く直前に「まだコードなし（または未コード化）・名前が同じ」を確かめ、
 * 違う行は飛ばして件数で知らせる（開いてから別の人が直した行を上書きしない）。名前は書き換えない。
 */
export const applyDiagnosisCodesSchema = z.object({
  items: z
    .array(
      z.object({
        id: uuid("id"),
        expectedName: z.string().min(1).max(200),
        diseaseCode,
        icd10Code: z.string().max(7, "icd10Code は 7 文字以内です").optional().nullable(),
        /** 省略は今の値のまま。渡せば置き換える */
        modifierCodes: modifierCodes.optional(),
      }),
    )
    .min(1)
    .max(200),
});
export type ApplyDiagnosisCodesInput = z.infer<typeof applyDiagnosisCodesSchema>;

/** 指示書と一緒に作る傷病名（`createInstructionWithSources` の `diagnoses`。名前だけの `diagnosisNames` は残す） */
export const instructionDiagnosisInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  diseaseCode: diseaseCode.optional().nullable(),
  icd10Code: z.string().max(7, "icd10Code は 7 文字以内です").optional().nullable(),
  modifierCodes: modifierCodes.optional(),
});
export type InstructionDiagnosisInput = z.infer<typeof instructionDiagnosisInputSchema>;
export const instructionDiagnosesSchema = z.array(instructionDiagnosisInputSchema).max(20);

/** 別表7/8 の候補を「あたらない」と外す（理由を残す） */
export const dismissConditionCandidateSchema = z.object({
  category: z.enum(["besshi7", "besshi8"]),
  /** 別表7/8 の項目コード（B7-01〜 / B8-01〜） */
  conditionCode: z.string().min(1).max(8),
  /** 根拠が傷病名か指示書か */
  basisKind: z.enum(["diagnosis", "instruction"]),
  basisId: uuid("basisId"),
  reason: z.string().trim().max(500).optional().nullable(),
});
export type DismissConditionCandidateInput = z.infer<typeof dismissConditionCandidateSchema>;
