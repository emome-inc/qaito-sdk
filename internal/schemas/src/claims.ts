import { z } from "zod";
import { medicalDeductionClassValues, shoguKaizenTierValues } from "./claims-masters";
import { recordFacilityIdField } from "./api/record-facility";
import { jstToday } from "./jst";
import { ocrExtraPartsSchema } from "./ocr-images";
import { isNursingServiceType } from "./shared-options";

export const statementStatuses = [
  "draft",
  "validated",
  "needs_fix",
  "confirmed",
  "exported",
  "submitted",
  "accepted",
  "paid",
  "assessed",
  "held",
  "returned",
  "kago_pending",
  "voided",
  "void",
] as const;
export type StatementStatus = (typeof statementStatuses)[number];

export const manualStatementStatuses = [
  "submitted",
  "accepted",
  "paid",
  "assessed",
  "held",
  "returned",
  "kago_pending",
  "voided",
] as const;
export type ManualStatementStatus = (typeof manualStatementStatuses)[number];

export const billingBatchStatuses = ["open", "locked", "exported", "submitted", "void"] as const;
export type BillingBatchStatus = (typeof billingBatchStatuses)[number];

export const userInvoiceStatuses = ["draft", "issued", "superseded", "void"] as const;
export type UserInvoiceStatus = (typeof userInvoiceStatuses)[number];

export const benefitCategories = ["kaigo", "yobo", "sogo"] as const;
export type BenefitCategory = (typeof benefitCategories)[number];

export const careLevels = [
  "support1",
  "support2",
  "care1",
  "care2",
  "care3",
  "care4",
  "care5",
] as const;
export type CareLevel = (typeof careLevels)[number];

export const scaleClasses = ["normal", "large1", "large2"] as const;
export type ScaleClass = (typeof scaleClasses)[number];

export const scaleClassificationInputMethods = ["manual", "exception"] as const;
export type ScaleClassificationInputMethod = (typeof scaleClassificationInputMethods)[number];

export const designationKinds = ["honai", "minashi"] as const;
export type DesignationKind = (typeof designationKinds)[number];

export const regionGradeOverrides = ["1", "2", "3", "4", "5", "6", "7", "other"] as const;
export type RegionGradeOverride = (typeof regionGradeOverrides)[number];

/** user_invoice_lines.kind（U2/U3/U4 の 3 系統行） */
export const userInvoiceLineKinds = ["insurance_copay", "over_limit", "self_pay"] as const;
export type UserInvoiceLineKind = (typeof userInvoiceLineKinds)[number];

/** user_invoice_lines.tax_class */
export const taxClasses = ["taxable", "nontaxable"] as const;
export type TaxClass = (typeof taxClasses)[number];

/** user_payments.method（U8/D2） */
export const userPaymentMethods = ["cash", "transfer", "direct_debit"] as const;
export type UserPaymentMethod = (typeof userPaymentMethods)[number];

/** copay_certificates.copay_ratio（本人負担割合） */
export const copayRatios = [1, 2, 3] as const;
export type CopayRatio = (typeof copayRatios)[number];

export const additionGroups = [
  "bath_assist_1",
  "bath_assist_2",
  "chuujuudo_care",
  "lifestyle_counselor",
  "kobetsu_kunren_1_i",
  "kobetsu_kunren_1_ro",
  "kobetsu_kunren_2",
  "service_taisei_kyoka_1",
  "service_taisei_kyoka_2",
  "service_taisei_kyoka_3",
  "dementia_care",
  "young_dementia",
  "adl_maintenance_1",
  "adl_maintenance_2",
  "nutrition_assessment",
  "nutrition_improvement",
  "oral_function_1",
  "oral_function_2",
  "oral_nutrition_screening_1",
  "oral_nutrition_screening_2",
  "kagaku_kaigo_suishin",
  "life_function_link",
  "ittaiteki_service",
  "kango_emergency_1",
  "kango_emergency_2",
  "kango_special_management",
  "kango_specialist_management",
  "kango_terminal",
  "kango_remote_death",
  "kango_system_strength_1",
  "kango_system_strength_2",
  "kango_system_strength_yobo",
  "kango_oral_link",
  "tokubetsu_chiiki",
  "chusankan_shokibo",
] as const;
export type AdditionGroup = (typeof additionGroups)[number];

/** 加算グループ 1 件の表示情報（表示名 + その群が算定しうるサービスコード）。 */
export type AdditionGroupInfo = {
  /** 同じ事業所で算定期間を重ねられない択一の届出。 */
  exclusiveSet?: string;
  /** 届出と利用者ごとの算定条件を区別するための説明。 */
  filingDescription?: string;
  /** 届出を保存できるが、請求の自動判定には未対応のサービス種類。itemCodes に架空の対応を足さない。 */
  filingOnlyServiceTypes?: readonly string[];
  /** 画面表示名（届出設定・記録分析など全画面で共通に使う唯一の日本語ラベル） */
  label: string;
  /**
   * **サービス種別（6 桁コードの先頭 2 桁）ごと**の、その群の judge が計上しうるサービスコード。
   *
   * 同じ加算でも種別ごとにコード・単位数・算定単位が違う（例 栄養改善: 15 = 155605 per_time 200/回、
   * 16 = 165605 per_time 200/回、66 = 665003 **per_month** 200/月）。ここを 1 種別分しか持たないと
   * 「15 のコードを 16/66 でも使う」= マスタ不在で加算が丸ごと取り逃し、または誤った単位数での請求になる。
   * **キーが無い種別 = その種別ではこの群を算定しない**（judge が行を作らない）。
   *
   * 値の SoT は engine 側の各 judge の `ADDITION_CODES`（群 × 種別）。
   */
  itemCodesByServiceType: Readonly<Record<string, readonly string[]>>;
  /**
   * 全種別を通じてその群の judge が計上しうるサービスコード（= itemCodesByServiceType の和集合）。
   * `itemCodesByServiceType` から**機械生成**する（カタログ内で二重管理しない）。
   *
   * **単位数はここに持たない**（単位数の正は `tool.service_codes.unit_value` — 改定で動くものをコードに焼かない）。
   */
  itemCodes: readonly string[];
};

const ADDITION_GROUP_CATALOG_SOURCE: Record<AdditionGroup, Omit<AdditionGroupInfo, "itemCodes">> = {
  bath_assist_1: { label: "入浴介助加算(Ⅰ)", itemCodesByServiceType: { "15": ["155301"], "78": ["785301"], "16": ["165301"] } },
  bath_assist_2: { label: "入浴介助加算(Ⅱ)", itemCodesByServiceType: { "15": ["155303"], "78": ["785303"], "16": ["165303"] } },
  chuujuudo_care: { label: "中重度者ケア体制加算", itemCodesByServiceType: { "15": ["155306"], "78": ["785306"], "16": ["165614"] } },
  lifestyle_counselor: { label: "生活相談員配置等加算", itemCodesByServiceType: { "15": ["156350"], "78": ["786350"] } },
  kobetsu_kunren_1_i: { label: "個別機能訓練加算(Ⅰ)イ", itemCodesByServiceType: { "15": ["155051"], "78": ["785051"] } },
  kobetsu_kunren_1_ro: { label: "個別機能訓練加算(Ⅰ)ロ", itemCodesByServiceType: { "15": ["155053"], "78": ["785053"] } },
  kobetsu_kunren_2: { label: "個別機能訓練加算(Ⅱ)", itemCodesByServiceType: { "15": ["155052"], "78": ["785052"] } },
  service_taisei_kyoka_1: {
    label: "サービス提供体制強化加算(Ⅰ)",
    itemCodesByServiceType: { "15": ["156099"], "78": ["786099"], "16": ["166099"] },
    filingOnlyServiceTypes: ["13", "63"],
  },
  service_taisei_kyoka_2: {
    label: "サービス提供体制強化加算(Ⅱ)",
    itemCodesByServiceType: { "15": ["156100"], "78": ["786100"], "16": ["166100"] },
    filingOnlyServiceTypes: ["13", "63"],
  },
  service_taisei_kyoka_3: {
    label: "サービス提供体制強化加算(Ⅲ)",
    itemCodesByServiceType: { "15": ["156102"], "78": ["786102"], "16": ["166102"] },
  },
  dementia_care: { label: "認知症加算", itemCodesByServiceType: { "15": ["155305"], "78": ["785305"] } },
  young_dementia: { label: "若年性認知症利用者受入加算", itemCodesByServiceType: { "15": ["156109"], "78": ["786109"] } },
  adl_maintenance_1: { label: "ADL維持等加算(Ⅰ)", itemCodesByServiceType: { "15": ["156338"], "78": ["786338"] } },
  adl_maintenance_2: { label: "ADL維持等加算(Ⅱ)", itemCodesByServiceType: { "15": ["156339"], "78": ["786339"] } },
  nutrition_assessment: {
    label: "栄養アセスメント加算",
    itemCodesByServiceType: { "15": ["156116"], "78": ["786116"], "16": ["166116"], "66": ["666116"] },
  },
  nutrition_improvement: {
    label: "栄養改善加算",
    itemCodesByServiceType: { "15": ["155605"], "78": ["785605"], "16": ["165605"], "66": ["665003"] },
  },
  oral_function_1: {
    label: "口腔機能向上加算(Ⅰ)",
    itemCodesByServiceType: { "15": ["155606"], "78": ["785606"], "16": ["165606"], "66": ["665004"] },
  },
  oral_function_2: {
    label: "口腔機能向上加算(Ⅱ)",
    itemCodesByServiceType: { "15": ["155608"], "78": ["785608"], "66": ["665010"] },
  },
  oral_nutrition_screening_1: {
    label: "口腔・栄養スクリーニング加算(Ⅰ)",
    itemCodesByServiceType: { "15": ["156202"], "16": ["166202"], "66": ["666202"] },
  },
  oral_nutrition_screening_2: {
    label: "口腔・栄養スクリーニング加算(Ⅱ)",
    itemCodesByServiceType: { "15": ["156201"], "16": ["166201"], "66": ["666201"] },
  },
  kagaku_kaigo_suishin: {
    label: "科学的介護推進体制加算",
    itemCodesByServiceType: { "15": ["156361"], "78": ["786361"], "16": ["166361"], "66": ["666361"] },
  },
  life_function_link: {
    label: "生活機能向上連携加算",
    itemCodesByServiceType: { "15": ["154001", "154002", "154003"], "78": ["784001", "784002", "784003"] },
  },
  ittaiteki_service: { label: "一体的サービス提供加算", itemCodesByServiceType: { "66": ["666360"] } },
  kango_emergency_1: { exclusiveSet: "kango_emergency", label: "緊急時（介護予防）訪問看護加算(Ⅰ)", filingDescription: "介護保険の24時間の連絡・緊急対応の体制です。利用者への算定には別途同意・契約等の条件が必要です。医療保険の24時間対応体制加算とは別です。", itemCodesByServiceType: { "13": ["133001"], "63": ["633001"] } },
  kango_emergency_2: { exclusiveSet: "kango_emergency", label: "緊急時（介護予防）訪問看護加算(Ⅱ)", filingDescription: "介護保険の24時間の連絡・緊急対応の体制です。利用者への算定には別途同意・契約等の条件が必要です。医療保険の24時間対応体制加算とは別です。", itemCodesByServiceType: { "13": ["133100"], "63": ["633100"] } },
  kango_special_management: { label: "特別管理体制（特別管理加算Ⅰ・Ⅱ）", filingDescription: "介護保険の特別管理加算Ⅰ・Ⅱに共通する事業所の体制です。Ⅰ・Ⅱは利用者の状態で判定し、同じ体制を区分ごとに重複登録しません。", itemCodesByServiceType: { "13": ["134000", "134001"], "63": ["634000", "634001"] } },
  kango_specialist_management: { label: "専門管理加算", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13", "63"] },
  kango_terminal: { label: "ターミナルケア体制（ターミナルケア加算）", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13"] },
  kango_remote_death: { label: "遠隔死亡診断補助加算", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13"] },
  kango_system_strength_1: { label: "看護体制強化加算(Ⅰ)", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13"] },
  kango_system_strength_2: { label: "看護体制強化加算(Ⅱ)", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13"] },
  kango_system_strength_yobo: { label: "介護予防訪問看護の看護体制強化加算", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["63"] },
  kango_oral_link: { label: "口腔連携強化加算", itemCodesByServiceType: {}, filingOnlyServiceTypes: ["13", "63"] },
  tokubetsu_chiiki: { label: "特別地域加算", itemCodesByServiceType: {} },
  chusankan_shokibo: { label: "中山間地域等における小規模事業所加算", itemCodesByServiceType: {} },
};

/** 種別軸の宣言から和集合（`itemCodes`）を機械生成する（カタログ内での二重管理を作らない）。 */
function withUnionItemCodes(info: Omit<AdditionGroupInfo, "itemCodes">): AdditionGroupInfo {
  const itemCodes: string[] = [];
  for (const codes of Object.values(info.itemCodesByServiceType)) {
    for (const code of codes) if (!itemCodes.includes(code)) itemCodes.push(code);
  }
  return { ...info, itemCodes };
}

export const ADDITION_GROUP_CATALOG: Record<AdditionGroup, AdditionGroupInfo> = (() => {
  const out = {} as Record<AdditionGroup, AdditionGroupInfo>;
  for (const group of additionGroups) out[group] = withUnionItemCodes(ADDITION_GROUP_CATALOG_SOURCE[group]);
  return out;
})();

/** DB 由来の string を安全にラベル変換（未知値はそのまま返す）。 */
export function additionGroupLabel(slug: string): string {
  return (ADDITION_GROUP_CATALOG as Record<string, AdditionGroupInfo | undefined>)[slug]?.label ?? slug;
}

/** 提供年月・請求年月（'YYYY-MM'）。DB は day=01 の date 列だが入力は月粒度で受ける */
export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM 形式で入力してください");

export const claimsFacilityMonthQuerySchema = z.object({ year_month: yearMonthSchema });

export const insurerNumberSchema = z.string().regex(/^\d{6}$/, "insurerNumber は 6桁です");

export const insuredNumberSchema = z
  .string()
  .regex(/^[Hh0-9]\d{9}$|^\d{10}$/, "insuredNumber は 10桁（生保単独は先頭 H）です");

export const payerNumberSchema = z.string().regex(/^\d{8}$/, "payerNumber は 8桁です");

export const recipientNumberSchema = z.string().regex(/^\d{7}$/, "recipientNumber は 7桁です");

/** 事業所番号 10 桁の構成分解（`parseOfficeNumber` の戻り値）。 */
export interface OfficeNumberParts {
  /** 都道府県コード 2 桁（'01'〜'47'）。 */
  prefectureCode: string;
  /** 事業所区分 1 桁（みなし指定は医療機関種別を表す — 病院 1 / 歯科 3 / 薬局 4 等）。 */
  officeKind: string;
  /** 郡市区コード 2 桁。 */
  cityCode: string;
  /** 連番 4 桁。 */
  serial: string;
  /** 検証番号 1 桁。**算式未確認のため値の妥当性は検証していない**（桁として切り出すだけ）。 */
  checkDigit: string;
}

export const OFFICE_NUMBER_STRUCTURE_MESSAGE =
  "事業所番号は 10 桁の数字です（先頭 2 桁は都道府県コード 01〜47）";

/**
 * 事業所番号 10 桁を構成に分解する。構成が不正なら `null`。
 *
 * 入力は「正規化済みの 10 桁数字」を想定する（全角・空白・ハイフンの正規化は
 * `@qaito/schemas/facilities` の `officeNumberFieldSchema` が入力段で行う唯一の SoT。
 * ここでそれを再実装しない — 正規化の二重定義は経路ごとの緩さの差を生む）。
 */
export function parseOfficeNumber(value: string): OfficeNumberParts | null {
  if (!/^\d{10}$/.test(value)) return null;
  const prefectureCode = value.slice(0, 2);
  const pref = Number.parseInt(prefectureCode, 10);
  if (pref < 1 || pref > 47) return null;
  return {
    prefectureCode,
    officeKind: value.slice(2, 3),
    cityCode: value.slice(3, 5),
    serial: value.slice(5, 9),
    checkDigit: value.slice(9, 10),
  };
}

/** 事業所番号の構成検証（チェックデジットの値は見ない）。 */
export const officeNumberStructureSchema = z
  .string()
  .refine((v) => parseOfficeNumber(v) !== null, { message: OFFICE_NUMBER_STRUCTURE_MESSAGE });

/** createBatch(input) */

export const createRiyohyoMonthSchema = z.object({
  clientId: z.string().uuid(),
  carePlanId: z.string().uuid().nullish(),
  targetMonth: z.string().regex(/^\d{4}-\d{2}-01$/),
  hokenshaNo: z.string().regex(/^\d{6}$/).nullish(),
  hihokenshaNo: z.string().regex(/^[H0-9][0-9]{9}$/).nullish(),
  careLevelCode: z.string().max(2).nullish(),
  facilityId: recordFacilityIdField,
});
export type CreateRiyohyoMonthBody = z.infer<typeof createRiyohyoMonthSchema>;

/** 月ヘッダの更新（編集できる状態のときだけ）。送ったキーだけを変える */
export const updateRiyohyoMonthHeaderSchema = z.object({
  hokenshaNo: z.string().regex(/^\d{6}$/).nullish(),
  hihokenshaNo: z.string().regex(/^[H0-9][0-9]{9}$/).nullish(),
  careLevelCode: z.string().max(2).nullish(),
  carePlanId: z.string().uuid().nullish(),
});
export type UpdateRiyohyoMonthHeaderBody = z.infer<typeof updateRiyohyoMonthHeaderSchema>;

/**
 * 利用票の状態の操作（交付・実績の受領・締め・再交付・開き直し）の本文。
 * 開き直し（reopen）は承認した職員の ID が要る（無ければ core が approval_required で断る）。
 */
export const riyohyoMonthOpSchema = z.object({
  /** 開き直しを承認した職員の ID（staff.staff.id）。 */
  approvedByStaffId: z.string().uuid().nullish(),
  /** 補足。ID・事由コードだけで、個人の情報は書かない。 */
  note: z.string().max(500).nullish(),
});
export type RiyohyoMonthOpBody = z.infer<typeof riyohyoMonthOpSchema>;

export const transmitResultSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(["sent", "arrived", "error"]),
  receipt_number: z.string().max(64).optional(),
  gateway_status: z.string().max(16).optional(),
  error: z.object({ code: z.string().max(64), message: z.string().max(512) }).optional(),
});

export type TransmitResultPayload = z.infer<typeof transmitResultSchema>;

/** 開き直しのツールの本文（承認した職員を必須にする） */
export const riyohyoMonthReopenSchema = riyohyoMonthOpSchema.extend({
  approvedByStaffId: z.string().uuid(),
});

export const createBatchSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  billingYearMonth: yearMonthSchema,
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const confirmBatchSchema = z.object({
  waivedFindingIds: z.array(z.string().uuid()).default([]),
});
export type ConfirmBatchInput = z.infer<typeof confirmBatchSchema>;

/** recordBatchSubmitted(batchId, input) — Phase A 手動記録 */
export const recordBatchSubmittedSchema = z.object({
  submittedAt: z.string().datetime({ offset: true }),
});
export type RecordBatchSubmittedInput = z.infer<typeof recordBatchSubmittedSchema>;

/**
 * withdrawBatchSubmission(batchId, input) — 提出の取り下げ（電子請求受付システムで取り下げたあと）。
 * 月締めを取り消し、配下の明細書も取り消す。理由は必須（月締めの取消の理由と監査に残す）。
 */
export const withdrawBatchSubmissionSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
export type WithdrawBatchSubmissionInput = z.infer<typeof withdrawBatchSubmissionSchema>;

export const assignStatementsToBatchSchema = z.object({
  statementIds: z.array(z.string().uuid()).min(1),
});
export type AssignStatementsToBatchInput = z.infer<typeof assignStatementsToBatchSchema>;

export const voidBatchSchema = z.object({
  reason: z.string().min(1, "取消理由は必須です").max(2000),
});
export type VoidBatchInput = z.infer<typeof voidBatchSchema>;

/** recordStatementStatus(statementId, input) — 前方遷移のみサーバ検証（statement-transitions.ts が正） */
export const recordStatementStatusSchema = z.object({
  to: z.enum(manualStatementStatuses),
  notedAt: z.string().datetime({ offset: true }),
  memo: z.string().max(2000).optional(),
});
export type RecordStatementStatusInput = z.infer<typeof recordStatementStatusSchema>;

/** updateStatementNote(statementId, input) — 明細書の備考（月次請求の一覧の自由記入・500 字まで。空は null で消す） */
export const STATEMENT_NOTE_MAX = 500;
export const updateStatementNoteSchema = z.object({
  note: z.string().max(STATEMENT_NOTE_MAX).nullable(),
});
export type UpdateStatementNoteInput = z.infer<typeof updateStatementNoteSchema>;

/** まとめて刷る請求書の上限（GET の URL に id を並べるので、CloudFront の URL の上限 8,192 バイトに収める） */
export const INVOICE_PDF_BUNDLE_MAX = 100;

/** getInvoicesForPdf(input) — まとめて刷る請求書（重なりは 1 つにまとめる） */
export const invoicePdfBundleSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1).max(INVOICE_PDF_BUNDLE_MAX),
});
export type InvoicePdfBundleInput = z.infer<typeof invoicePdfBundleSchema>;

/** generateInvoicesForMonth(yearMonth, input?) — 事業所を 1 つに絞るとき（省略 = 見える事業所すべて） */
export const generateInvoicesForMonthSchema = z.object({
  facilityId: z.string().uuid().optional(),
});
export type GenerateInvoicesForMonthInput = z.infer<typeof generateInvoicesForMonthSchema>;

/** upsertSelfPayLine(invoiceId, line) の line = SelfPayLineInput（user_invoice_lines・kind 固定 'self_pay'） */
export const selfPayLineSchema = z.object({
  description: z.string().min(1, "descriptionは必須です").max(500),
  quantity: z.number().int().positive().optional().nullable(),
  amountYen: z.number().int(),
  taxClass: z.enum(taxClasses),
  medicalDeductionClass: z.enum(medicalDeductionClassValues).default("none"),
});
export type SelfPayLineInput = z.infer<typeof selfPayLineSchema>;

export const issueReceiptSchema = z
  .object({
    reissueReason: z.string().min(1, "再発行理由は必須です").max(2000).optional(),
  })
  .optional();
export type IssueReceiptInput = z.infer<typeof issueReceiptSchema>;

export const rihaProviderKinds = ["hospital_clinic", "roken", "iryoin"] as const;
export type RihaProviderKind = (typeof rihaProviderKinds)[number];

export const billingProfileInputSchema = z.object({
  regionGradeOverride: z.enum(regionGradeOverrides).optional().nullable(),
  shoguKaizenTier: z.enum(shoguKaizenTierValues).optional().nullable(),
  rihaProviderKind: z.enum(rihaProviderKinds).optional().nullable(),
  serviceTypeCodeOverride: z.string().length(2).optional().nullable(),
  designationKind: z.enum(designationKinds).default("honai"),
  designationValidUntil: z.string().date().optional().nullable(),
  /** 請求先の国保連の電話（数字とハイフン・伝送管理に出す。職員が手で入れる） */
  kokuhorenPhone: z.string().trim().max(20).regex(/^[0-9][0-9-]*$/).optional().nullable(),
  /** 請求先の国保連のページの URL（http(s) だけ・伝送管理に出す。職員が手で入れる） */
  kokuhorenUrl: z.string().trim().max(500).url().regex(/^https?:\/\//).optional().nullable(),
  active: z.boolean().default(true),
});
export type BillingProfileInput = z.infer<typeof billingProfileInputSchema>;

export const saveAdditionFilingSchema = z
  .object({
    additionGroup: z.enum(additionGroups),
    filedAt: z.string().date().optional().nullable(),
    acceptedAt: z.string().date("acceptedAt は YYYY-MM-DD 形式です"),
  })
  .refine((v) => !v.filedAt || v.acceptedAt >= v.filedAt, {
    message: "受理日は届出日より前にできません",
    path: ["acceptedAt"],
  });
export type SaveAdditionFilingInput = z.infer<typeof saveAdditionFilingSchema>;

/**
 * 体制届出の変更（`PATCH …/addition-filings/:filingId`）。加算グループは変えない（変えるなら別の届出）。
 * 受理日を変えたら、算定開始日はサーバが登録と同じ導出（`deriveBillableFromIso`）で作り直す。
 * 片方だけ送ったときの「受理日が届出日より前」は、core が保存済みの値と合わせて見る。
 */
export const updateAdditionFilingSchema = z
  .object({
    filedAt: z.string().date("filedAt は YYYY-MM-DD 形式です").optional().nullable(),
    acceptedAt: z.string().date("acceptedAt は YYYY-MM-DD 形式です").optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine((v) => !v.filedAt || !v.acceptedAt || v.acceptedAt >= v.filedAt, {
    message: "受理日は届出日より前にできません",
    path: ["acceptedAt"],
  });
export type UpdateAdditionFilingInput = z.infer<typeof updateAdditionFilingSchema>;

/**
 * 体制届出の終了（`POST …/addition-filings/:filingId/end`）。算定を終える月（YYYY-MM）を受け、
 * `billable_until` をその月の末日にする（`deriveBillableUntilIso`）。行は消さない（請求の履歴を残す）。
 */
export const endAdditionFilingSchema = z.object({
  endMonth: yearMonthSchema,
});
export type EndAdditionFilingInput = z.infer<typeof endAdditionFilingSchema>;

/**
 * 算定終了月（'YYYY-MM'）→ `billable_until`（その月の末日 'YYYY-MM-DD'）。
 * `billableFromIso`（'YYYY-MM-DD'）の月より前の終了月は null（算定期間が 1 か月も無い）。
 * 形が合わないときも null。暦日として扱う（UTC 正規化。タイムゾーンで結果が動かない）。
 */
export function deriveBillableUntilIso(endMonth: string, billableFromIso: string): string | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(endMonth);
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(billableFromIso)) return null;
  if (endMonth < billableFromIso.slice(0, 7)) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const d = new Date(Date.UTC(year, month, 0));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 事業所のサービス種類コード（2 桁）で、体制届出に並べる加算グループを絞る。
 *
 * 自動算定の対象は `itemCodesByServiceType`、届出保存のみの対象は `filingOnlyServiceTypes`。
 * 地域系の加算（特別地域・中山間地域等の小規模事業所）は種別を問わず届けるので、代表コードを持たない群
 * （`itemCodesByServiceType` が空・`filingOnlyServiceTypes` なし）は常に残す。種別が分からない（null）ときは絞らない。
 */
export function additionGroupsForServiceType(serviceTypeCode: string | null): AdditionGroup[] {
  if (!serviceTypeCode) return [...additionGroups];
  return additionGroups.filter((g) => {
    const info = ADDITION_GROUP_CATALOG[g];
    return serviceTypeCode in info.itemCodesByServiceType
      || (info.filingOnlyServiceTypes?.includes(serviceTypeCode) ?? false)
      || (Object.keys(info.itemCodesByServiceType).length === 0 && !info.filingOnlyServiceTypes);
  });
}

/**
 * 年度（西暦。例 2026 = 令和8年度）の妥当域。制度上の運用範囲を保守的に固定する。
 *
 * 統合前は web（`saveScaleClassificationSchema`）と api（annual ルート内の inline `z.object`）に
 * 同じ値域が転記されていた。ここを唯一の出どころにする。
 * `coerce` は画面フォーム由来の数値文字列を受けるため（api でも数値文字列を許すのは無害な緩和）。
 */
export const claimsFiscalYearSchema = z.coerce.number().int().min(2000).max(2100);

export const saveScaleClassificationSchema = z.object({
  fiscalYear: claimsFiscalYearSchema,
  scaleClass: z.enum(scaleClasses),
  method: z.enum(scaleClassificationInputMethods),
});
export type SaveScaleClassificationInput = z.infer<typeof saveScaleClassificationSchema>;

export const addScaleClassificationApiSchema = saveScaleClassificationSchema
  .extend({ facilityId: z.string().uuid("facilityId は UUID 形式です") });
export type AddScaleClassificationApiInput = z.infer<typeof addScaleClassificationApiSchema>;

/** POST /claims/annual/scale/:id/confirm — 提案行の人手確定（区分の上書きは任意）。 */
export const confirmScaleClassificationSchema = z.object({
  scaleClass: z.enum(scaleClasses).optional(),
});
export type ConfirmScaleClassificationInput = z.infer<typeof confirmScaleClassificationSchema>;

export const assignTransmissionAgentSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  agentId: z
    .string()
    .regex(/^[A-Za-z0-9]{4,32}$/, "代理人 ID は英数 4〜32 文字です")
    .nullable(),
});
export type AssignTransmissionAgentInput = z.infer<typeof assignTransmissionAgentSchema>;

/**
 * 年次バッチの起動入力（`POST /claims/annual/scale/recompute` /
 * `POST /claims/annual/shogu-filings/ensure`）。
 */
export const annualFiscalYearInputSchema = z.object({ fiscalYear: claimsFiscalYearSchema });
export type AnnualFiscalYearInput = z.infer<typeof annualFiscalYearInputSchema>;

/**
 * `POST /claims/annual/scale/compute` — 単一事業所の evidence プレビュー（非永続）。
 * `opts` は老企36号の判定オプション（6/7 補正月・第一号事業合算・特例算定の強制）。
 */
export const computeScaleEvidenceSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  fiscalYear: claimsFiscalYearSchema,
  opts: z
    .object({
      sevenSeventhsMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/)).max(11).optional(),
      firstIssueEventInclusion: z.boolean().optional(),
      forceSpecialProjection: z.boolean().optional(),
    })
    .optional(),
});
export type ComputeScaleEvidenceInput = z.infer<typeof computeScaleEvidenceSchema>;

/** shogu_kaizen_filings.status（DB CHECK と 1:1）。 */
export const shoguFilingStatuses = ["not_submitted", "submitted", "accepted", "overdue"] as const;
export type ShoguFilingStatus = (typeof shoguFilingStatuses)[number];

/** shogu_kaizen_filings.kind（計画書 / 実績報告）。 */
export const shoguFilingKinds = ["plan", "report"] as const;
export type ShoguFilingKind = (typeof shoguFilingKinds)[number];

/**
 * 届出の状態機械（許可遷移表）。**画面の遷移先セレクタもここから作る**
 * （life の `lifeBatchTransitions` と同型 — 遷移表を UI 側に転記しない）。
 *
 * accepted は終端（受理後の巻き戻しは証跡の改竄に等しい）。overdue → submitted は
 * 「期限超過後の遅延提出」を記録するために許可する。
 */
export const shoguFilingTransitions: Record<ShoguFilingStatus, readonly ShoguFilingStatus[]> = {
  not_submitted: ["submitted", "overdue"],
  overdue: ["submitted"],
  submitted: ["accepted"],
  accepted: [],
};

/** `from` からの許可遷移先（未知の値は空 = 何もできない）。 */
export function allowedShoguFilingTransitions(from: string): readonly ShoguFilingStatus[] {
  return shoguFilingTransitions[from as ShoguFilingStatus] ?? [];
}

export function canTransitionShoguFiling(from: string, to: ShoguFilingStatus): boolean {
  return allowedShoguFilingTransitions(from).includes(to);
}

/**
 * POST /claims/annual/shogu-filings/:id/transition — 状態遷移の記録。
 * `not_submitted` へは戻せない（遷移表に無いので core が INVALID_STATE で拒否する）。
 */
export const transitionShoguFilingSchema = z.object({
  to: z.enum(["submitted", "accepted", "overdue"]),
  submittedAt: z.string().date("submittedAt は YYYY-MM-DD 形式です").optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type TransitionShoguFilingInput = z.infer<typeof transitionShoguFilingSchema>;

/**
 * 算定開始日ルールの分類（Phase A 通所介護は 'homon_tsusho' のみ実使用）。
 */
export const billableFromRules = ["homon_tsusho", "shisetsu"] as const;
export type BillableFromRule = (typeof billableFromRules)[number];

export function deriveBillableFromIso(acceptedAtIso: string, rule: BillableFromRule): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(acceptedAtIso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);

  const targetMonth =
    rule === "homon_tsusho"
      ? month + (day <= 15 ? 1 : 2)
      :
        month + (day === 1 ? 0 : 1);

  const d = new Date(Date.UTC(year, targetMonth, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** upsertInsuranceRegistration(clientId, input) — insurance_registrations（E2） */
export const insuranceRegistrationInputSchema = z.object({
  insurerNumber: insurerNumberSchema,
  insuredNumber: insuredNumberSchema,
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です"),
  validUntil: z.string().date().optional().nullable(),
});
export type InsuranceRegistrationInput = z.infer<typeof insuranceRegistrationInputSchema>;

/** upsertCopayCertificate(clientId, input) — copay_certificates（E2・毎年8/1切替） */
export const copayCertificateInputSchema = z.object({
  copayRatio: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です"),
  validUntil: z.string().date().optional().nullable(),
});
export type CopayCertificateInput = z.infer<typeof copayCertificateInputSchema>;

/** upsertKohiCertificate(clientId, input) — kohi_certificates（E3・0〜3件/人） */
export const kohiCertificateInputSchema = z.object({
  legalCategory: z.string().length(2, "legalCategory は法別2桁です"),
  payerNumber: payerNumberSchema,
  recipientNumber: recipientNumberSchema,
  benefitRate: z.number().int().min(0).max(100).optional().nullable(),
  copayAmount: z.number().int().nonnegative().optional().nullable(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です"),
  validUntil: z.string().date().optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
});
export type KohiCertificateInput = z.infer<typeof kohiCertificateInputSchema>;

export const paymentNoticeInputSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  paymentYearMonth: z.string().date("paymentYearMonth は YYYY-MM-DD 形式です"),
  receivedAt: z.string().min(1, "receivedAt は必須です"),
  /**
   * 取り込んだ支払決定額通知（`tool.notices`・kind=shiharai_kettei）。原本の保管キーはサーバがそこから引く
   * （鍵を入力で受けない。任意の鍵を保存させない）。
   */
  noticeId: z.string().uuid("noticeId は UUID 形式です"),
  totalPaidYen: z.number().int().nonnegative().optional().nullable(),
});
export type PaymentNoticeInput = z.infer<typeof paymentNoticeInputSchema>;

/**
 * updatePaymentNotice(paymentNoticeId, input) — 登録で入れた項目を直す（`PATCH /claims/payments/notices/:id`）。
 * 事業所は変えない（元の通知の事業所で決まる）。元の通知を替えるときは同じ事業所の支払決定額通知だけ。
 * 送った項目だけ変える（既定値を注入しない）。消込の行がある通知・取消済みの通知は 409。
 */
export const updatePaymentNoticeInputSchema = z.object({
  paymentYearMonth: z.string().date("paymentYearMonth は YYYY-MM-DD 形式です").optional(),
  receivedAt: z.string().min(1, "receivedAt は必須です").optional(),
  noticeId: z.string().uuid("noticeId は UUID 形式です").optional(),
  totalPaidYen: z.number().int().nonnegative().optional().nullable(),
});
export type UpdatePaymentNoticeInput = z.infer<typeof updatePaymentNoticeInputSchema>;

/**
 * voidPaymentNotice(paymentNoticeId, input) — 支払通知の取消（論理・`POST /claims/payments/notices/:id/void`）。
 * 理由は必須。消込の行がある通知は先に消込を取り消す（409）。
 */
export const voidPaymentNoticeInputSchema = z.object({
  reason: z.string().trim().min(1, "取消の理由を入力してください").max(500),
});
export type VoidPaymentNoticeInput = z.infer<typeof voidPaymentNoticeInputSchema>;

export const kokuhorenNoticeKinds = [
  "shinsa_zogen",
  "zogen_tanisu",
  "henrei_ichiran",
  "saishinsa_kettei",
  "kago_kettei",
  "shiharai_uchiwake",
  "shiharai_kettei",
  "jigyoshobetsu_meisai",
  "kogaku_taisho",
] as const;
export type KokuhorenNoticeKind = (typeof kokuhorenNoticeKinds)[number];

/** 通知の受領日時の上限（JST の今日 + 1 日の終わり = 明後日の 0 時 JST の手前）。呼ぶたびに今を読む */
function receivedAtUpperBoundMs(): number {
  return new Date(`${jstToday()}T00:00:00+09:00`).getTime() + 2 * 24 * 60 * 60 * 1000;
}

export const importNoticeInputSchema = z.object({
  staged_id: z.string().uuid("staged_id は UUID 形式です"),
  kind: z.enum(kokuhorenNoticeKinds),
  /** 事業所 ID。PDF の通知のときだけ使う（CSV はファイルの事業所番号から引く） */
  facility_id: z.string().uuid("facility_id は UUID 形式です").optional(),
  /** 受領日時（ISO 8601）。省略時はサーバの現在時刻。上限は JST の明日いっぱい（先の日付の打ち間違いを断る） */
  received_at: z
    .string()
    .datetime({ offset: true })
    .refine((v) => new Date(v).getTime() < receivedAtUpperBoundMs(), "received_at は明日までです")
    .optional(),
});
export type ImportNoticeInput = z.infer<typeof importNoticeInputSchema>;

export const reconcilePaymentsInputSchema = z.object({
  lines: z
    .array(
      z.object({
        statementId: z.string().uuid("statementId は UUID 形式です"),
        decidedYen: z.number().int("decidedYen は整数（円）です"),
      }),
    )
    .min(1, "明細を1件以上入力してください"),
});
export type ReconcilePaymentsInput = z.infer<typeof reconcilePaymentsInputSchema>;

export const userPaymentInputSchema = z.object({
  invoiceId: z.string().uuid("invoiceId は UUID 形式です"),
  method: z.enum(userPaymentMethods),
  amountYen: z.number().int("amountYen は整数（円）です"),
  receivedAt: z.string().date("receivedAt は YYYY-MM-DD 形式です"),
  matched: z.boolean().optional(),
  memo: z.string().max(1000).optional().nullable(),
});
export type UserPaymentInput = z.infer<typeof userPaymentInputSchema>;

export const userPaymentToolInputSchema = userPaymentInputSchema.omit({ matched: true }).extend({
  method: z.enum(["transfer", "cash"]),
});

/** 未収金ステータス（U8 Tabs。SoT = reconcile/user-payments.ts classifyReceivable の閾値） */
export const receivableStatuses = ["unpaid", "partial", "settled"] as const;
export type ReceivableStatus = (typeof receivableStatuses)[number];

export const compliancePeriodKinds = ["bcp", "gyakutai", "teicho", "jinketsu", "pt_kajo"] as const;
export type CompliancePeriodKind = (typeof compliancePeriodKinds)[number];

export const compliancePeriodRetroPolicies = ["none", "to_event_month", "to_discovery_month"] as const;
export type CompliancePeriodRetroPolicy = (typeof compliancePeriodRetroPolicies)[number];

/** 事業所のサービス種類で並ぶ区分。訪問看護（13・63）は訪問回数超過等減算も持つ */
export function complianceKindsFor(serviceTypeCode: string | null | undefined): CompliancePeriodKind[] {
  const base: CompliancePeriodKind[] = ["bcp", "gyakutai", "teicho", "jinketsu"];
  return isNursingServiceType(serviceTypeCode) ? [...base, "pt_kajo"] : base;
}

/**
 * 実施状況のチェック項目のキー（evidence に残す名前）。期間の開始と月ごとの申告が同じ項目を使う。
 * 項目の名前（画面の文言）は @qaito/vocabulary の COMPLIANCE_MESSAGES.evidenceLabels。
 */
export const COMPLIANCE_EVIDENCE_KEYS = {
  bcp: ["bcp_planned", "bcp_training"],
  gyakutai: ["abuse_committee", "abuse_guideline", "abuse_training", "abuse_officer"],
} as const satisfies Partial<Record<CompliancePeriodKind, readonly string[]>>;
export type ComplianceEvidenceKey = (typeof COMPLIANCE_EVIDENCE_KEYS)[keyof typeof COMPLIANCE_EVIDENCE_KEYS][number];

/** その区分のチェック項目のキー（項目の無い区分は空） */
export function complianceEvidenceKeysOf(kind: CompliancePeriodKind): readonly ComplianceEvidenceKey[] {
  return (COMPLIANCE_EVIDENCE_KEYS as Partial<Record<CompliancePeriodKind, readonly ComplianceEvidenceKey[]>>)[kind] ?? [];
}

/** evidence のキーがその区分の項目だけか（空・null は通す） */
function evidenceKeysValid(kind: CompliancePeriodKind, evidence: Record<string, boolean> | null | undefined): boolean {
  if (!evidence) return true;
  const allowed: readonly string[] = complianceEvidenceKeysOf(kind);
  return Object.keys(evidence).every((key) => allowed.includes(key));
}

/**
 * 減算の率・単位（画面の説明に出す値）。計算は請求のエンジンが国のマスタの減算コードで行い、この表は使わない。
 * 改定でマスタが変わったら、ここも合わせて直す（説明の文言は @qaito/vocabulary の COMPLIANCE_MESSAGES が値を差し込む）。
 * - BCP・虐待防止: 所定単位数の 1%（-1/100）
 * - 定員超過・人員欠如: 所定単位数の 70%
 * - 訪問回数超過等減算: 理学療法士等の訪問 1 回につき 8 単位（介護予防の 12 月超は 15 単位）
 */
export const COMPLIANCE_DEDUCTIONS = {
  ratePercent: 1,
  multiplierPercent: 70,
  ptKajoUnitsPerVisit: 8,
  ptKajoYoboOver12UnitsPerVisit: 15,
} as const;

export const openCompliancePeriodInputSchema = z.object({
  kind: z.enum(compliancePeriodKinds),
  appliesFrom: z.string().date("appliesFrom は YYYY-MM-DD 形式です"),
  evidence: z.record(z.string(), z.boolean()).optional().nullable(),
  retroPolicy: z.enum(compliancePeriodRetroPolicies).default("none"),
}).refine((v) => evidenceKeysValid(v.kind, v.evidence), { path: ["evidence"], message: "チェック項目がこの区分のものではありません" });
export type OpenCompliancePeriodInput = z.infer<typeof openCompliancePeriodInputSchema>;

/** closeCompliancePeriod(periodId, input) — 期間の終了（是正・改善確認） */
export const closeCompliancePeriodInputSchema = z.object({
  appliesUntil: z.string().date("appliesUntil は YYYY-MM-DD 形式です"),
});
export type CloseCompliancePeriodInput = z.infer<typeof closeCompliancePeriodInputSchema>;

export const complianceDeclarationKinds = ["bcp", "gyakutai"] as const;
export type ComplianceDeclarationKind = (typeof complianceDeclarationKinds)[number];
export const complianceDeclarationResults = ["compliant", "noncompliant"] as const;
export type ComplianceDeclarationResult = (typeof complianceDeclarationResults)[number];

const complianceMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "月は YYYY-MM 形式です");

/** upsertComplianceDeclaration(facilityId, input) — 提供月 × 種別の申告（上書き）。不適合なら翌月 1 日から減算の期間を作り、適合なら閉じる */
export const upsertComplianceDeclarationInputSchema = z.object({
  serviceYearMonth: complianceMonthSchema,
  kind: z.enum(complianceDeclarationKinds),
  result: z.enum(complianceDeclarationResults),
  evidence: z.record(z.string(), z.boolean()).optional().nullable(),
}).refine((v) => evidenceKeysValid(v.kind, v.evidence), { path: ["evidence"], message: "チェック項目がこの区分のものではありません" });
export type UpsertComplianceDeclarationInput = z.infer<typeof upsertComplianceDeclarationInputSchema>;

/** listComplianceDeclarations の ?from=&to=（YYYY-MM・両端を含む。省略は全期間） */
export const listComplianceDeclarationsQuerySchema = z.object({
  from: complianceMonthSchema.optional(),
  to: complianceMonthSchema.optional(),
});
export type ListComplianceDeclarationsQuery = z.infer<typeof listComplianceDeclarationsQuerySchema>;

export const facilityIdParam = z.object({ facilityId: z.string().uuid("facilityId は UUID 形式です") });
export const batchIdParam = z.object({ batchId: z.string().uuid("batchId は UUID 形式です") });
export const statementIdParam = z.object({ statementId: z.string().uuid("statementId は UUID 形式です") });
export const invoiceIdParam = z.object({ invoiceId: z.string().uuid("invoiceId は UUID 形式です") });
export const claimsClientIdParam = z.object({ clientId: z.string().uuid("clientId は UUID 形式です") });
export const findingIdParam = z.object({ findingId: z.string().uuid("findingId は UUID 形式です") });
export const paymentNoticeIdParam = z.object({ paymentNoticeId: z.string().uuid("paymentNoticeId は UUID 形式です") });
export const compliancePeriodIdParam = z.object({ periodId: z.string().uuid("periodId は UUID 形式です") });

export const STATEMENT_TRANSITIONS: Record<StatementStatus, readonly StatementStatus[]> = {
  draft: ["validated", "needs_fix", "confirmed", "void"],
  validated: ["confirmed", "needs_fix", "draft", "void"],
  needs_fix: ["validated", "draft", "void"],
  confirmed: ["exported", "void"],
  exported: ["submitted"],
  submitted: ["accepted"],
  accepted: ["paid", "assessed", "held", "returned"],
  paid: ["kago_pending"],
  assessed: [],
  held: ["accepted"],
  returned: [],
  kago_pending: ["voided", "paid"],
  voided: [],
  void: [],
} as const;

export const BATCH_TRANSITIONS: Record<BillingBatchStatus, readonly BillingBatchStatus[]> = {
  open: ["locked", "void"],
  locked: ["exported", "void"],
  exported: ["submitted"],
  submitted: [],
  void: [],
} as const;

export type StatementTransitionContext = "unreconcile" | "withdrawal";
export const STATEMENT_CONTEXT_TRANSITIONS: Record<
  StatementTransitionContext,
  Partial<Record<StatementStatus, readonly StatementStatus[]>>
> = {
  unreconcile: { paid: ["accepted"] },
  withdrawal: { exported: ["void"], submitted: ["void"] },
} as const;

/**
 * 提出の取り下げで月締めが通る辺（submitted → void）。**BATCH_TRANSITIONS には載せない**。
 * 表に足すと、取消の口（`voidBatch`）が提出済みの月締めからも通り、審査の結果の有無を見ずに取り消せてしまう。
 * 取り下げの口だけがこの辺を使い、審査の結果が付いた明細書（accepted 以降）が 1 件でもあれば断る。
 */
export const SUBMISSION_WITHDRAWAL = { from: "submitted", to: "void" } as const;

/**
 * from → to が許可されているか。
 * `context` を渡すと**その文脈の辺だけ**を引く（表の辺は通さない）。渡さなければ明細書遷移表だけを引く。
 */
export function isAllowedStatementTransition(
  from: StatementStatus,
  to: StatementStatus,
  context?: StatementTransitionContext,
): boolean {
  if (context) return STATEMENT_CONTEXT_TRANSITIONS[context]?.[from]?.includes(to) ?? false;
  return STATEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * from → to がバッチ遷移表で許可されているか。
 * `from` は DB 由来の生 status（string）を許容する（未知値は表に無い = false）。呼出側の `as never` を不要にする。
 */
export function isAllowedBatchTransition(from: string, to: BillingBatchStatus): boolean {
  return (BATCH_TRANSITIONS as Record<string, readonly BillingBatchStatus[]>)[from]?.includes(to) ?? false;
}

export function isPreExport(status: StatementStatus): boolean {
  return status === "draft" || status === "validated" || status === "needs_fix" || status === "confirmed";
}

export const adjustmentTriggers = [
  "returned",
  "assessed",
  "kago",
  "copay_retro",
  "benefit_mgmt_revised",
] as const;
export type AdjustmentTrigger = (typeof adjustmentTriggers)[number];

export const adjustmentDetectedBys = ["notice", "local_diff", "manual"] as const;
export type AdjustmentDetectedBy = (typeof adjustmentDetectedBys)[number];

export const adjustmentStatuses = ["detected", "reviewing", "approved", "settled", "withdrawn"] as const;
export type AdjustmentStatus = (typeof adjustmentStatuses)[number];

export const userBillingImpactSchema = z.object({
  currentInvoiceId: z.string().uuid().nullable(),
  /** + = 追加請求 / − = 返金 */
  deltaCopayYen: z.number().int().nullable(),
  deltaMedicalDeductionYen: z.number().int().nullable(),
  basis: z.enum(["notice", "recalc_draft"]),
  note: z.string().min(1).max(1000),
});
export type UserBillingImpact = z.infer<typeof userBillingImpactSchema>;

/** POST /claims/adjustments — 手動起票（detected_by は起票経路が決めるので入力に含めない）。 */
export const openAdjustmentCaseInputSchema = z.object({
  trigger: z.enum(adjustmentTriggers),
  statementId: z.string().uuid(),
  noticeItemId: z.string().uuid().optional(),
  impactDraft: userBillingImpactSchema.optional(),
});
export type OpenAdjustmentCaseInput = z.infer<typeof openAdjustmentCaseInputSchema>;

export const approveAdjustmentCaseInputSchema = z.object({
  actions: z.object({
    reviseStatement: z.boolean(),
    regenerateInvoiceDraft: z.boolean(),
  }),
  reason: z.string().min(1).max(500).optional(),
});
export type ApproveAdjustmentCaseInput = z.infer<typeof approveAdjustmentCaseInputSchema>;

export const kagoKinds = ["same_month", "normal"] as const;
export type KagoKind = (typeof kagoKinds)[number];

export const kagoDecisions = ["approved", "rejected"] as const;
export type KagoDecision = (typeof kagoDecisions)[number];

export const submitKagoClaimInputSchema = z.object({
  statementId: z.string().uuid(),
  kind: z.enum(kagoKinds),
  insurerNumber: insurerNumberSchema,
  submittedAt: z.string().min(1).optional(),
});
export type SubmitKagoClaimInput = z.infer<typeof submitKagoClaimInputSchema>;

export const recordKagoDecisionInputSchema = z.object({
  decision: z.enum(kagoDecisions),
  decidedAt: z.string().min(1).optional(),
});
export type RecordKagoDecisionInput = z.infer<typeof recordKagoDecisionInputSchema>;

/** 返戻一覧の手動突合で人が選ぶ遷移先（返戻 / 保留）。 */
export const manualNoticeMatchTargets = ["returned", "held"] as const;
export type ManualNoticeMatchTarget = (typeof manualNoticeMatchTargets)[number];

export const manualNoticeMatchInputSchema = z.object({
  statementId: z.string().uuid(),
  apply: z.boolean().optional(),
  to: z.enum(manualNoticeMatchTargets).optional(),
});
export type ManualNoticeMatchInput = z.infer<typeof manualNoticeMatchInputSchema>;

const hmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** 提供票の予定の 1 行（自分の事業所の行）。days は「日 → 予定の回数」（0 の日は送らない・1〜31） */
export const provisionPlanLineSchema = z.object({
  lineId: z.string().uuid().nullable(),
  serviceTypeCode: z.string().regex(/^[0-9A-Z]{2}$/).nullable(),
  serviceCode: z.string().regex(/^[0-9A-Z]{6}$/).nullable(),
  name: z.string().min(1).max(100),
  startTime: hmSchema.nullable(),
  endTime: hmSchema.nullable(),
  unitValue: z.number().int().min(0).max(100000).nullable(),
  days: z.record(z.string().regex(/^([1-9]|[12]\d|3[01])$/), z.number().int().min(0).max(99)),
});
export type ProvisionPlanLineBody = z.infer<typeof provisionPlanLineSchema>;

/** PUT /claims/provision/clients/:clientId/plan — 予定（自分の事業所の行）の保存。yearMonth は提供年月 */
export const saveProvisionPlanSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  facilityId: z.string().uuid(),
  lines: z.array(provisionPlanLineSchema).max(100),
});
export type SaveProvisionPlanBody = z.infer<typeof saveProvisionPlanSchema>;

/**
 * POST /claims/provision/clients/:clientId/return — 返送（確定した実績を返した印）。
 * 同じ形で /confirm（実績の確定）・/unconfirm（確定の取り消し）も受ける。yearMonth は提供年月
 */
export const returnProvisionSheetSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  facilityId: z.string().uuid(),
});
export type ReturnProvisionSheetBody = z.infer<typeof returnProvisionSheetSchema>;

export const confirmProvisionSheetSchema = returnProvisionSheetSchema.extend({
  dryRun: z.boolean().optional(),
});
export type ConfirmProvisionSheetBody = z.infer<typeof confirmProvisionSheetSchema>;

export const listNursingBillingMonthQuerySchema = z.object({
  facilityId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export type ListNursingBillingMonthQuery = z.infer<typeof listNursingBillingMonthQuerySchema>;

/**
 * POST /claims/nursing-billing/clients/:clientId/confirm — 介護（提供票）と医療（医療の月の確定）をまとめて確定する。
 * dryRun = チェックだけ（確定しない）。
 */
export const NURSING_MONTHLY_ADDITION_KEYS = ["emergency", "special_management", "initial", "discharge_guidance"] as const;
export type NursingMonthlyAdditionKey = (typeof NURSING_MONTHLY_ADDITION_KEYS)[number];

/** 当月だけ手動追加できる月次加算。金額・単位は入力せず、その月のマスタを使う。 */
export const NURSING_MONTHLY_MANUAL_CODES = ["3001", "3100", "4000", "4001", "4023", "4002", "4003"] as const;
export const NURSING_MONTHLY_MANUAL_CATALOG = {
  "3001": { key: "emergency", name: "緊急時訪問看護加算Ⅰ" },
  "3100": { key: "emergency", name: "緊急時訪問看護加算Ⅱ" },
  "4000": { key: "special_management", name: "特別管理加算Ⅰ" },
  "4001": { key: "special_management", name: "特別管理加算Ⅱ" },
  "4023": { key: "initial", name: "初回加算Ⅰ" },
  "4002": { key: "initial", name: "初回加算Ⅱ" },
  "4003": { key: "discharge_guidance", name: "退院時共同指導加算" },
} as const satisfies Record<(typeof NURSING_MONTHLY_MANUAL_CODES)[number], { key: NursingMonthlyAdditionKey; name: string }>;
export const nursingMonthlyManualAdditionSchema = z.object({
  itemCode: z.enum(NURSING_MONTHLY_MANUAL_CODES),
  quantity: z.number().int().min(1).max(2),
  reason: z.string().trim().min(1).max(500),
}).refine((a) => a.itemCode === "4003" || a.quantity === 1, { path: ["quantity"] });
export type NursingMonthlyManualAddition = z.infer<typeof nursingMonthlyManualAdditionSchema>;
const nursingMonthlyManualAdditionsSchema = z.array(nursingMonthlyManualAdditionSchema).max(4).refine((rows) => {
  const keys = rows.map((a) => NURSING_MONTHLY_MANUAL_CATALOG[a.itemCode].key);
  return new Set(keys).size === keys.length && !(keys.includes("initial") && keys.includes("discharge_guidance"));
});

export const confirmNursingBillingMonthSchema = listNursingBillingMonthQuerySchema.extend({
  manualAdditions: nursingMonthlyManualAdditionsSchema.optional(),
  excludedAdditions: z.array(z.enum(NURSING_MONTHLY_ADDITION_KEYS)).optional(),
  dryRun: z.boolean().optional(),
});
export type ConfirmNursingBillingMonthBody = z.infer<typeof confirmNursingBillingMonthSchema>;

/** DELETE /claims/nursing-billing/clients/:clientId/confirm?facilityId&month — 介護・医療の確定をまとめて取り消す */
export const unconfirmNursingBillingMonthQuerySchema = listNursingBillingMonthQuerySchema;

export const PROVISION_PLAN_BULK_MAX_CLIENTS = 200;

const serviceCode6 = z.string().regex(/^[0-9A-Z]{6}$/);

export const provisionPlanBulkOpSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("add"), serviceCode: serviceCode6, days: z.enum(["base", "none"]).default("base") }),
  z.object({ kind: z.literal("replace"), fromServiceCode: serviceCode6, toServiceCode: serviceCode6 }),
  z.object({ kind: z.literal("remove"), serviceCode: serviceCode6 }),
]);
export type ProvisionPlanBulkOp = z.infer<typeof provisionPlanBulkOpSchema>;

/** POST /claims/provision/plan-bulk/dry-run — 一括設定の下見（書かない。変わる人・行と対象外の人を数える） */
export const previewProvisionPlanBulkSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  facilityId: z.string().uuid(),
  clientIds: z.array(z.string().uuid()).min(1).max(PROVISION_PLAN_BULK_MAX_CLIENTS),
  op: provisionPlanBulkOpSchema,
});
export type PreviewProvisionPlanBulkBody = z.infer<typeof previewProvisionPlanBulkSchema>;

/**
 * POST /claims/provision/plan-bulk — 一括設定の実行。下見の件数（変わる人数・行数）と digest（変わる人と、その人の今の行・
 * 書く行をまとめた値）を一緒に送り、サーバーが下見をやり直して違えば書かずに 409（下見からやり直す）。
 * 件数だけだと、人が入れ替わって同じ数になったときに、見せた下見と違う人を書いてしまう
 */
export const applyProvisionPlanBulkSchema = previewProvisionPlanBulkSchema.extend({
  expected: z.object({
    clients: z.number().int().min(0).max(PROVISION_PLAN_BULK_MAX_CLIENTS),
    lines: z.number().int().min(0),
    digest: z.string().regex(/^[0-9a-f]{64}$/),
  }),
});
export type ApplyProvisionPlanBulkBody = z.infer<typeof applyProvisionPlanBulkSchema>;

/** 提供票の読み取りで受けるファイルの種類（画像 / PDF）。 */
export const PROVISION_OCR_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"] as const;

export const analyzeProvisionSheetSchema = z.object({
  base64_content: z.string().min(1),
  mime_type: z.enum(PROVISION_OCR_MIME_TYPES),
  /** 写真を上から帯に分けた続き（`./ocr-images`） */
  extra_parts: ocrExtraPartsSchema.optional(),
  facility_id: z.string().uuid().optional(),
  year_month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
});
export type AnalyzeProvisionSheetBody = z.infer<typeof analyzeProvisionSheetSchema>;

/** 提供票の実績の 1 行（サービスコード単位。日 → 回数）。 */
export const provisionActualLineSchema = z.object({
  serviceTypeCode: z.string().regex(/^[0-9A-Z]{2}$/),
  itemCode: z.string().regex(/^[0-9A-Z]{4}$/),
  name: z.string().max(200),
  days: z.record(z.string().regex(/^([1-9]|[12]\d|3[01])$/), z.number().int().min(0).max(99)),
});

/** PUT /claims/provision/clients/:clientId/actuals — 提供票で直した実績の保存（確定の前だけ）。yearMonth は提供年月 */
export const saveProvisionActualsSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  facilityId: z.string().uuid(),
  lines: z.array(provisionActualLineSchema).max(100),
});
export type SaveProvisionActualsBody = z.infer<typeof saveProvisionActualsSchema>;

/** このサービス種類では届出保存のみで、自動算定には未対応か。 */
export function additionFilingIsRegistrationOnly(group: AdditionGroup, serviceTypeCode: string | null): boolean {
  const types = ADDITION_GROUP_CATALOG[group].filingOnlyServiceTypes;
  return !!types && (serviceTypeCode === null || types.includes(serviceTypeCode));
}
