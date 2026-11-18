import { z } from "zod";
import { jstYearMonth } from "./jst";

/**
 * 自動の欄（`field_key`）。事業所の種別から規則で決まる（`daily-closing/pure/field-rules.ts`）。
 * 給付管理の人数（`kyotaku_clients`・居宅 43 / 46）・貸与の月額（`rental_monthly`・千円・福祉用具 17 / 67）は
 * 月の欄（役割 `monthly`。値は月の 1 日に持つ）で、請求・貸与の契約から読む（段 3）。
 */
export const CLOSING_AUTO_FIELD_KEYS = [
  "attendance",
  "attendance_evening",
  "attendance_through",
  "transport_pickup",
  "transport_dropoff",
  "visit_11",
  "visit_11_tsuin",
  "visit_nurse_kaigo",
  "visit_nurse_iryo",
  "visit_reha_kaigo",
  "visit_reha_iryo",
  "visit_reha",
  "staff_on_duty",
  "staff_hours",
  "kyotaku_clients",
  "rental_monthly",
] as const;
export type ClosingAutoFieldKey = (typeof CLOSING_AUTO_FIELD_KEYS)[number];

/** 欄のキー（自動の欄のキーか、手入力の欄の `m_` で始まるキー） */
export const CLOSING_FIELD_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;
/** 手入力の欄のキー（サーバが作る） */
export const CLOSING_MANUAL_FIELD_KEY_RE = /^m_[a-z0-9]{8,32}$/;

/** 通所の提供時間の区分（参考）。`start_time` から `end_time` までの長さで分ける */
export const CLOSING_TIME_BANDS = ["3-4h", "4-5h", "5-6h", "6-7h", "7-8h", "8-9h", "other"] as const;
export type ClosingTimeBand = (typeof CLOSING_TIME_BANDS)[number];

/**
 * 日の状態。
 *   closed   … 締まっている（通所 = 実績の確定・訪問 = 予定が全部 実施 / 取消 で未判定が無い・手入力だけの部署 = 値がある）
 *   open     … 集計日を過ぎたのに締まっていない（未入力）
 *   upcoming … 集計日がまだ来ていない
 *   off      … 稼働しない日（定休の曜日・係数 0 の日）
 *   no_rule  … 締まったかを判定できない部署（自動の欄が出勤だけで手入力の欄も無い）
 */
export const CLOSING_DAY_STATUSES = ["closed", "open", "upcoming", "off", "no_rule"] as const;
export type ClosingDayStatus = (typeof CLOSING_DAY_STATUSES)[number];

/** 行の出どころ（`tool.closing_entries.source`） */
export const CLOSING_ENTRY_SOURCES = ["manual", "override", "legacy"] as const;
export type ClosingEntrySource = (typeof CLOSING_ENTRY_SOURCES)[number];

/** 欄の出どころ（`tool.closing_unit_fields.source`） */
export const CLOSING_FIELD_SOURCES = ["auto", "manual"] as const;
export type ClosingFieldSource = (typeof CLOSING_FIELD_SOURCES)[number];

/**
 * 欄の役割（元の `Service.role`）。
 *   daily_base … その月の 1 日あたりの基準金額（値は月に 1 つ・月の 1 日に持つ。入力のある営業日の売上に足す）
 *   one_shot   … その日限りのショット売上（着地見込みで先へ延ばさない）
 *   monthly    … 月の値（月の 1 日に持つ）を、稼働日に係数で按分して日次に載せる（❓11）
 */
export const CLOSING_FIELD_ROLES = ["daily_base", "one_shot", "monthly"] as const;
export type ClosingFieldRole = (typeof CLOSING_FIELD_ROLES)[number];

/** 施策の確度（元の 0.25 / 0.5 / 0.75 / 1） */
export const CLOSING_INITIATIVE_PROBS = [0.25, 0.5, 0.75, 1] as const;

export const CLOSING_OVERRIDE_REASON_MAX = 200;
export const CLOSING_DAY_NOTE_MAX = 1000;
/** 1 回のまとめ書きの行数の上限（31 日 × 欄） */
export const CLOSING_ENTRIES_MAX = 600;
/** 件数の上限（numeric(10,1)） */
export const CLOSING_COUNT_MAX = 999_999_999;
/** 金額の上限（千円・numeric(12,1)） */
export const CLOSING_AMOUNT_MAX = 99_999_999_999;
export const CLOSING_NAME_MAX = 100;
export const CLOSING_TEXT_MAX = 200;

const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const YMD_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 締めの月（YYYY-MM） */
export const closingMonthSchema = z.string().regex(YM_RE);
/** 締めの日（YYYY-MM-DD・JST の暦日） */
export const closingDateSchema = z.string().regex(YMD_RE);
const uuidSchema = z.string().regex(UUID_RE);

/**
 * 小数 n 桁まで。浮動小数の誤差は許す（1.1 * 100 = 110.00000000000001 を「3 桁以上」と読まない）
 */
const decimals = (n: number) => (v: number) => {
  const scaled = v * 10 ** n;
  return Math.abs(Math.round(scaled) - scaled) < 1e-6;
};
/** 件数は 0 以上・小数 1 桁まで */
const closingCountSchema = z.number().min(0).max(CLOSING_COUNT_MAX).refine(decimals(1), { message: "小数は 1 桁まで" });
/** 金額（千円）は 0 以上・小数 1 桁まで */
const closingAmountSchema = z.number().min(0).max(CLOSING_AMOUNT_MAX).refine(decimals(1), { message: "小数は 1 桁まで" });
/** 単価（千円）は 0 以上・小数 3 桁まで */
const closingPriceSchema = z.number().min(0).max(9_999_999).refine(decimals(3), { message: "小数は 3 桁まで" });
/** 係数は 0〜9.99・小数 2 桁まで */
const closingCoefSchema = z.number().min(0).max(9.99).refine(decimals(2), { message: "小数は 2 桁まで" });

/** 部署を作る（事業所を 1 つ選ぶ。1 事業所 1 部署） */
export const createClosingUnitSchema = z
  .object({
    facilityId: z.string().regex(UUID_RE),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .strict();
export type CreateClosingUnitInput = z.infer<typeof createClosingUnitSchema>;

/** 部署を直す（事業部への割り当て・並び・元のシステムの名前） */
export const updateClosingUnitSchema = z
  .object({
    divisionId: uuidSchema.nullable().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    /**
     * 切替月の前月を**縮める・外す**だけ（null で外す。今の値より前の月だけ・延ばすのは取り込みの口だけ・M-1）。
     * 縮めた後の月の legacy の行・欄は消さない（欄は active_to で表に出ず、行は自動の集計に戻る）
     */
    legacyUntil: closingMonthSchema.nullable().optional(),
    legacyKey: z.string().trim().max(CLOSING_TEXT_MAX).nullable().optional(),
  })
  .strict();
export type UpdateClosingUnitInput = z.infer<typeof updateClosingUnitSchema>;

/** 事業部を作る・直す */
export const closingDivisionInputSchema = z
  .object({
    name: z.string().trim().min(1).max(CLOSING_NAME_MAX),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .strict();
export type ClosingDivisionInput = z.infer<typeof closingDivisionInputSchema>;
export const updateClosingDivisionSchema = closingDivisionInputSchema.partial().strict();
export type UpdateClosingDivisionInput = z.infer<typeof updateClosingDivisionSchema>;

/**
 * 補正と手入力のまとめ書き（部署 × 月）の 1 行。`count: null` はその欄・その日の値を外す。
 * 自動の欄への値は**補正**で理由が要る。手入力の欄は理由が要らない（core が欄の定義で見分ける）。
 */
export const closingEntryInputSchema = z
  .object({
    fieldKey: z.string().regex(CLOSING_FIELD_KEY_RE),
    date: closingDateSchema,
    count: closingCountSchema.nullable(),
    reason: z.string().trim().max(CLOSING_OVERRIDE_REASON_MAX).optional(),
  })
  .strict();
export type ClosingEntryInput = z.infer<typeof closingEntryInputSchema>;

export const saveClosingEntriesSchema = z
  .object({
    entries: z.array(closingEntryInputSchema).min(1).max(CLOSING_ENTRIES_MAX),
  })
  .strict();
export type SaveClosingEntriesInput = z.infer<typeof saveClosingEntriesSchema>;

/** 備考（空文字で消す） */
export const saveClosingDayNoteSchema = z
  .object({
    note: z.string().max(CLOSING_DAY_NOTE_MAX),
  })
  .strict();
export type SaveClosingDayNoteInput = z.infer<typeof saveClosingDayNoteSchema>;

/** 締まっていない日の一覧の絞り込み */
export const closingMissingQuerySchema = z
  .object({
    month: closingMonthSchema,
  })
  .strict();
export type ClosingMissingQuery = z.infer<typeof closingMissingQuerySchema>;

export const closingDayFlashQuerySchema = z
  .object({
    facilityId: uuidSchema,
    date: closingDateSchema,
  })
  .strict();
export type ClosingDayFlashQuery = z.infer<typeof closingDayFlashQuerySchema>;

/** 全社・事業部の集計（divisionId で事業部に絞る） */
export const closingCompanyQuerySchema = z
  .object({
    month: closingMonthSchema,
    divisionId: uuidSchema.optional(),
  })
  .strict();
export type ClosingCompanyQuery = z.infer<typeof closingCompanyQuerySchema>;

/** 施策を作る */
export const createClosingInitiativeSchema = z
  .object({
    unitId: uuidSchema,
    month: closingMonthSchema,
    title: z.string().trim().min(1).max(CLOSING_TEXT_MAX),
    effect: closingAmountSchema,
    prob: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75), z.literal(1)]),
    dueText: z.string().trim().max(CLOSING_NAME_MAX).nullable().optional(),
    ownerText: z.string().trim().max(CLOSING_NAME_MAX).nullable().optional(),
  })
  .strict();
export type CreateClosingInitiativeInput = z.infer<typeof createClosingInitiativeSchema>;
/** 施策を直す（部署と月は変えない） */
export const updateClosingInitiativeSchema = createClosingInitiativeSchema.omit({ unitId: true, month: true }).partial().strict();
export type UpdateClosingInitiativeInput = z.infer<typeof updateClosingInitiativeSchema>;
/** 施策の一覧の絞り込み */
export const closingInitiativesQuerySchema = z
  .object({
    month: closingMonthSchema,
    unitId: uuidSchema.optional(),
  })
  .strict();
export type ClosingInitiativesQuery = z.infer<typeof closingInitiativesQuerySchema>;

/**
 * 欄の定義と単価。自動の欄は `fieldKey` に自動の欄のキーを入れて単価・役割だけを決める。
 * 手入力の欄は `fieldKey` を省くとサーバが作る（`m_…`）。単価を変えるときは理由を書ける（単価の履歴に残る）。
 */
export const closingUnitFieldInputSchema = z
  .object({
    fieldKey: z.string().regex(CLOSING_FIELD_KEY_RE).optional(),
    source: z.enum(CLOSING_FIELD_SOURCES),
    name: z.string().trim().min(1).max(CLOSING_NAME_MAX),
    unitLabel: z.string().trim().min(1).max(20),
    avgPrice: closingPriceSchema,
    role: z.enum(CLOSING_FIELD_ROLES).nullable().optional(),
    budgetShare: z.number().min(0).max(100).nullable().optional(),
    activeFrom: closingMonthSchema.nullable().optional(),
    activeTo: closingMonthSchema.nullable().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    priceReason: z.string().trim().max(CLOSING_TEXT_MAX).optional(),
    /** 手入力の自費の欄（請求書に自費の行がある月は月の実績に足さない・段 3 の M2）。手入力の欄だけ */
    selfPay: z.boolean().optional(),
  })
  .strict();
export type ClosingUnitFieldInput = z.infer<typeof closingUnitFieldInputSchema>;

/** 部署の計画（曜日係数・定休・目標件数の単価・過去最高・イヴニングの時刻） */
export const closingUnitPlanInputSchema = z
  .object({
    coefWd: closingCoefSchema,
    coefSat: closingCoefSchema,
    coefSun: closingCoefSchema,
    coefHol: closingCoefSchema,
    closedDows: z.array(z.number().int().min(0).max(6)).max(7),
    avgPrice: closingPriceSchema,
    maxSales: closingAmountSchema.nullable(),
    maxDays: z.number().min(0).max(31).refine(decimals(2)).nullable(),
    eveningFrom: z.string().regex(HM_RE),
  })
  .strict();
export type ClosingUnitPlanInput = z.infer<typeof closingUnitPlanInputSchema>;

/** 月の季節係数（0〜9.99・小数 2 桁まで）。月を足す・直すで同じ範囲 */
const closingFactorSchema = z.number().min(0).max(9.99).refine(decimals(2));

/** 次の月を足す（季節係数は省くと 1） */
export const addClosingMonthSchema = z
  .object({
    month: closingMonthSchema,
    factor: closingFactorSchema.optional(),
  })
  .strict();
export type AddClosingMonthInput = z.infer<typeof addClosingMonthSchema>;

/** 月の季節係数を直す（確定した月は直せない・409） */
export const updateClosingMonthSchema = z
  .object({
    factor: closingFactorSchema,
  })
  .strict();
export type UpdateClosingMonthInput = z.infer<typeof updateClosingMonthSchema>;

/** 予算のまとめ書き（部署 × 月・千円） */
export const upsertClosingBudgetsSchema = z
  .object({
    items: z
      .array(z.object({ unitId: uuidSchema, budget: closingAmountSchema }).strict())
      .min(1)
      .max(500),
  })
  .strict();
export type UpsertClosingBudgetsInput = z.infer<typeof upsertClosingBudgetsSchema>;

/** 事業部の月次の確定値 */
export const upsertClosingDivisionResultSchema = z
  .object({
    divisionId: uuidSchema,
    month: closingMonthSchema,
    budget: closingAmountSchema.nullable().optional(),
    actual: closingAmountSchema.nullable().optional(),
    note: z.string().trim().max(CLOSING_TEXT_MAX).nullable().optional(),
  })
  .strict();
export type UpsertClosingDivisionResultInput = z.infer<typeof upsertClosingDivisionResultSchema>;

/** 部署（`tool.closing_units` + 事業所の名前・種別） */
export type ClosingUnit = {
  id: string;
  facilityId: string;
  facilityName: string;
  serviceTypeCode: string | null;
  divisionId: string | null;
  sortOrder: number;
  /** 元のシステムの数字が正の最後の月（YYYY-MM）。この月以前は取り込んだ値だけを数える（段 4） */
  legacyUntil: string | null;
  createdAt: string;
};

/** 部署をまだ作っていない事業所（境界の内・自組織） */
export type ClosingUnitCandidate = {
  facilityId: string;
  facilityName: string;
  serviceTypeCode: string | null;
};

export type ClosingUnitList = {
  units: ClosingUnit[];
  candidates: ClosingUnitCandidate[];
  /**
   * 組織全体の数字（事業部・事業部の確定値・月の確定）を書ける・見られる人か（❓27 (b)）。
   * ゲートと同じ判定（isOrgWideFacilityScope）。画面はこれで操作を出し分ける（拒否はゲートが持つ）
   */
  orgWide: boolean;
};

/** 事業部 */
export type ClosingDivision = {
  id: string;
  name: string;
  sortOrder: number;
};

/**
 * 欄（自動の欄と手入力の欄）。`reference` は売上に入れない参考の欄（単価 0）。
 * `avgPrice` は千円 / 1 件。
 */
export type ClosingField = {
  key: string;
  label: string;
  unitLabel: string;
  source: ClosingFieldSource;
  reference: boolean;
  avgPrice: number;
  role: ClosingFieldRole | null;
};

/** 補正（その欄・その日の値と理由） */
export type ClosingOverride = {
  count: number;
  reason: string | null;
  updatedAt: string;
};

/** 部署 × 日の 1 行 */
export type ClosingDay = {
  date: string;
  status: ClosingDayStatus;
  /** 欄ごとの値（自動の欄は補正があれば補正、無ければ自動。手入力の欄は入れた値） */
  values: Record<string, number>;
  /** 自動の値（補正の前） */
  autoValues: Record<string, number>;
  overrides: Record<string, ClosingOverride>;
  /** 通所の提供時間の区分ごとの人数（参考・通所の部署だけ） */
  bands: Partial<Record<ClosingTimeBand, number>> | null;
  /** 訪問看護の保険の判定がまだの訪問（どちらの欄にも入れない） */
  unjudgedVisits: number;
  note: string | null;
  /** 日次予算（千円）・目標件数・売上（締まっていない日は null）・累計 */
  budget: number;
  target: number | null;
  sales: number | null;
  cumBudget: number;
  cumSales: number | null;
};

/** 月のまとめ（元の `summarize` + 施策 + 補正後最高） */
export type ClosingMonthSummary = {
  budget: number;
  salesToDate: number;
  budgetToDate: number;
  /** 進捗率（%） */
  rate: number;
  /** 着地見込み（継続分を予算のペースで延ばした額 + ショット売上の実績） */
  landing: number;
  /** 施策の効果（Σ 効果 × 確度） */
  initiativesEffect: number;
  landingWithInitiatives: number;
  missingDays: number;
  complete: boolean;
  /** 補正後最高（過去最高 × 当月の営業日換算 ÷ 基準営業日） */
  adjustedMaxSales: number | null;
  /** 営業日換算 */
  workingDayEquiv: number;
};

/**
 * 月の実績の根拠（段 3・設計 §4.1）。
 *   billing     … 請求から出した（明細書・請求書のどちらかがある月）
 *   flash       … 請求の無い部署（障害福祉・介護外・種別の無い事業所）。実績 = 速報
 *   unavailable … 請求が準備中か、その月の請求がまだ無い、または数える明細書の金額がすべて未算出。実績は空（0 にしない）
 *   legacy      … 切替前の月（部署の legacy_until 以前）。元のシステムの売上が正で、実績 = 速報（❓17・段 4）
 */
export const CLOSING_ACTUAL_BASES = ["billing", "flash", "unavailable", "legacy"] as const;
export type ClosingActualBasis = (typeof CLOSING_ACTUAL_BASES)[number];

/**
 * 利用者負担をどちらから足したか（✅13・二重に足さない）。
 *   invoice   … 発行済みの請求書の `billed_yen`（負担 + 自費 + 税）だけ
 *   statement … 請求書が未発行なので明細書の `copay_yen` で代用
 *   mixed     … 利用者ごとに上の 2 つが混ざる（発行済みの人は請求書・未発行の人は明細書）
 *   none      … 負担の額が無い
 */
export const CLOSING_COPAY_BASES = ["invoice", "statement", "mixed", "none"] as const;
export type ClosingCopayBasis = (typeof CLOSING_COPAY_BASES)[number];

/** 明細書がどこまで進んだか（数えた明細書のうち一番手前の段） */
export const CLOSING_CLAIMS_STAGES = ["draft", "confirmed", "submitted", "paid"] as const;
export type ClosingClaimsStage = (typeof CLOSING_CLAIMS_STAGES)[number];

/** 月の実績を今の請求から出したか、確定時の写し（`closing_month_actuals`）から読んだか */
export const CLOSING_ACTUAL_SOURCES = ["live", "snapshot"] as const;
export type ClosingActualSource = (typeof CLOSING_ACTUAL_SOURCES)[number];

/**
 * 部署 × 月の「速報 | 実績 | 差」と根拠（段 3・設計 §4.1）。金額のうち `flash` `actual` `diff` `manualSales` は千円（小数 1 桁）、
 * 内訳の `…Yen` は円。読むのは事業所 × 月の合計だけで、利用者は出さない。
 */
export type ClosingMonthActual = {
  basis: ClosingActualBasis;
  source: ClosingActualSource;
  /** 速報（Σ日の売上・千円） */
  flash: number;
  /** 実績（千円）。`basis = unavailable` は null */
  actual: number | null;
  /** 実績 − 速報（千円） */
  diff: number | null;
  /** 保険請求（円・最新の revision で void / voided / returned を除いた明細書の合計） */
  insuranceYen: number | null;
  /** 公費（円・明細書の公費の請求額の合計） */
  kohiYen: number | null;
  /** 利用者請求（円・発行済みの請求書の `billed_yen` の合計） */
  userBilledYen: number | null;
  /** 明細書の利用者負担のうち、請求書が未発行の利用者の分（円） */
  copayYen: number | null;
  copayBasis: ClosingCopayBasis | null;
  /** 実績に足した手入力の欄の売上（千円・自費・販売など） */
  manualSales: number;
  /**
   * 手入力の自費の欄のうち、実績に足さなかった売上（千円）= min(手入力の自費, 請求書の自費)。請求書の自費は `billed_yen` に
   * 入っているので二重に足さない（✅26。速報には残る）。確定時の写しから読んだときは null
   */
  selfPayExcluded: number | null;
  /** 数えた明細書の件数 */
  statementCount: number | null;
  /**
   * 数えた明細書のうち金額が未算出（`insurance_claim_yen` も `copay_yen` も NULL）の件数。
   * 全件が未算出で他に金額の出どころが無いときは実績を空にし（`basis = unavailable`・0 にしない）、一部だけなら出せる分を出す。
   * 確定時の写しから読んだときは「全件が未算出」だけが分かる（一部のときは null）
   */
  pendingStatements: number | null;
  claimsStatus: ClosingClaimsStage | null;
  /** 給付管理の人数（居宅 43 / 46 の部署だけ） */
  kyotakuClients: number | null;
  /** 貸与の月額（円・福祉用具 17 / 67 の部署だけ） */
  rentalMonthlyYen: number | null;
  /** 写しを取った時刻（`source = snapshot` のとき） */
  capturedAt: string | null;
};

/**
 * 束ねた「速報 | 実績 | 差」（全社・事業部）。
 * 実績は 事業部の確定値（過去月の受け皿だけ・✅15）＞ 部署の実績（請求・請求の無い部署は速報）の合計。
 * どの部署も実績が出ていなければ null。
 */
export type ClosingActualTotal = {
  flash: number;
  actual: number | null;
  diff: number | null;
  source: "division_result" | "units" | "unavailable";
  /** 実績が出ていない部署の数（準備中・請求がまだ無い） */
  unavailableUnits: number;
};

/** 部署 × 月 */
export type ClosingUnitMonth = {
  unit: ClosingUnit;
  month: string;
  /** 集計日（翌朝 10 時を過ぎた日まで。これより後の日は `upcoming`） */
  asOf: string;
  /** 確定した月か（確定した月は自動の値も確定時の写しを使い、補正・手入力を断る） */
  locked: boolean;
  /** 切替前の月か（部署の legacy_until 以前。取り込んだ元の値だけを数え、補正・手入力を断る・段 4） */
  legacy: boolean;
  fields: ClosingField[];
  days: ClosingDay[];
  /** 締まった日（と判定しない部署の日）の合計 */
  totals: Record<string, number>;
  summary: ClosingMonthSummary;
  /** 月の速報と実績（請求）と差。確定した月は確定時の写しから */
  monthActual: ClosingMonthActual;
};

/** 締まっていない日（部署ごと） */
export type ClosingMissingUnit = {
  unitId: string;
  facilityId: string;
  facilityName: string;
  missingDates: string[];
  closedDays: number;
  /** 締まっていない日を判定できない部署 */
  noRule: boolean;
  /** 合計に入らない日（締まった日・判定しない日以外）に、手入力か補正の値がある日 */
  uncountedDates: string[];
  totals: Record<string, number>;
  fields: ClosingField[];
};

export type ClosingMissingEntries = {
  month: string;
  asOf: string;
  units: ClosingMissingUnit[];
};

export type ClosingDayFlash = {
  unitId: string;
  facilityId: string;
  date: string;
  /** 利用人数（補正があれば補正の値） */
  attendance: number;
  /** 利用人数の欄の単価（円） */
  unitPriceYen: number;
  /** 暫定売上（円） */
  salesYen: number;
};

/** 着地見込みの 1 行（部署） */
export type ClosingLandingRow = {
  unitId: string;
  facilityName: string;
  divisionId: string | null;
  budget: number;
  rate: number;
  landing: number;
  initiativesEffect: number;
  landingWithInitiatives: number;
  diff: number;
  complete: boolean;
  salesToDate: number;
  budgetToDate: number;
  missingDays: number;
  adjustedMaxSales: number | null;
  /** 月の速報と実績（請求）と差 */
  monthActual: ClosingMonthActual;
};

/** 束ねた進捗（全社・事業部） */
export type ClosingProgress = {
  budget: number;
  salesToDate: number;
  budgetToDate: number;
  rate: number;
  landing: number;
  initiativesEffect: number;
  landingWithInitiatives: number;
  diff: number;
};

/** 日別の積算（全社・事業部） */
export type ClosingCompanyDay = {
  date: string;
  budget: number;
  cumBudget: number;
  sales: number | null;
  cumSales: number | null;
};

/** ヒートマップの 1 行（部署 × 日の対予算比 %・未入力は null） */
export type ClosingHeatmapRow = {
  unitId: string;
  facilityName: string;
  ratios: (number | null)[];
};

/** 急変・要注意（平常ペースから ±15pt 以上・または備考あり） */
export type ClosingAlert = {
  unitId: string;
  facilityName: string;
  date: string;
  sales: number;
  budget: number;
  ratio: number;
  dev: number;
  note: string;
};

/** 週の変動（直近 1 週間の平均日次売上が基準から動いた部署） */
export type ClosingWeeklyShift = {
  unitId: string;
  facilityName: string;
  weekAvg: number;
  baseAvg: number;
  ratio: number;
  sigma: number;
  belowFloor: boolean;
};

/** 事業部の月次の確定値 */
export type ClosingDivisionResult = {
  divisionId: string;
  month: string;
  budget: number | null;
  actual: number | null;
  note: string | null;
};

/** 全社・事業部の集計 */
export type ClosingCompanySummary = {
  month: string;
  asOf: string;
  /** 集計日（その月の何日まで数えたか。先の月は 0） */
  throughDay: number;
  divisionId: string | null;
  total: ClosingProgress;
  /** 前月比（同じ日数の売上の比・%） */
  prevMonthRate: number | null;
  divisions: (ClosingProgress & { divisionId: string | null; name: string; monthActual: ClosingActualTotal })[];
  units: ClosingLandingRow[];
  heatmap: ClosingHeatmapRow[];
  daily: ClosingCompanyDay[];
  alerts: ClosingAlert[];
  weeklyShifts: ClosingWeeklyShift[];
  divisionResults: ClosingDivisionResult[];
  /** 切替前（legacy）の部署の数。0 より大きく、ほかの部署と混ざっていれば混在の月（❓22） */
  legacyUnits: number;
  /** 全体の速報と実績と差 */
  monthActual: ClosingActualTotal;
};

/** 施策 */
export type ClosingInitiative = {
  id: string;
  unitId: string;
  month: string;
  title: string;
  effect: number;
  prob: number;
  dueText: string | null;
  ownerText: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 書き出しの部署ごとの月の実績 */
export type ClosingExportMonthActual = {
  unitId: string;
  facilityName: string;
  monthActual: ClosingMonthActual;
};

/** 書き出し（CSV の本文。文字は UTF-8・BOM なし）。CSV の末尾にも部署ごとの月の行（速報・実績・差・内訳）を付ける */
export type ClosingExport = {
  filename: string;
  csv: string;
  monthActuals: ClosingExportMonthActual[];
};

/** 欄の定義（daily-closing-budget） */
export type ClosingUnitField = {
  unitId: string;
  fieldKey: string;
  source: ClosingFieldSource;
  name: string;
  unitLabel: string;
  avgPrice: number;
  role: ClosingFieldRole | null;
  budgetShare: number | null;
  activeFrom: string | null;
  activeTo: string | null;
  /** 手入力の自費の欄 */
  selfPay: boolean;
  sortOrder: number;
  updatedAt: string;
};

/** 部署の計画（daily-closing-budget）。行が無ければ既定値（係数 1・定休なし・イヴニング 17:00） */
export type ClosingUnitPlan = {
  unitId: string;
  coefWd: number;
  coefSat: number;
  coefSun: number;
  coefHol: number;
  closedDows: number[];
  avgPrice: number;
  maxSales: number | null;
  maxDays: number | null;
  eveningFrom: string;
  saved: boolean;
};

/** 締めの月（daily-closing-budget） */
export type ClosingMonth = {
  month: string;
  factor: number;
  locked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
};

/** 予算（部署 × 月・千円） */
export type ClosingBudget = {
  unitId: string;
  month: string;
  budget: number;
};

/** 単価の履歴 */
export type ClosingPriceChange = {
  id: string;
  unitId: string;
  fieldKey: string;
  oldPrice: number | null;
  newPrice: number;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
};

/** 取り込みの上限（部署 × 月の塊 1 つ） */
export const CLOSING_LEGACY_FIELDS_MAX = 60;
export const CLOSING_LEGACY_RECORDS_MAX = 2000;
export const CLOSING_LEGACY_INITIATIVES_MAX = 100;

/** 取り込む部署の計画（元の facilities の係数・定休・目標件数の単価・過去最高） */
const closingLegacyPlanSchema = z
  .object({
    coefWd: closingCoefSchema,
    coefSat: closingCoefSchema,
    coefSun: closingCoefSchema,
    coefHol: closingCoefSchema,
    closedDows: z.array(z.number().int().min(0).max(6)).max(7),
    avgPrice: closingPriceSchema,
    maxSales: closingAmountSchema.nullable(),
    maxDays: z.number().min(0).max(31).refine(decimals(2)).nullable(),
  })
  .strict();

/** 取り込む欄（元の facility_services。名前で突き合わせる・手入力の欄として作る・❓21） */
const closingLegacyFieldSchema = z
  .object({
    name: z.string().trim().min(1).max(CLOSING_NAME_MAX),
    unitLabel: z.string().trim().min(1).max(20),
    avgPrice: closingPriceSchema,
    role: z.enum(["daily_base", "one_shot"]).nullable(),
    budgetShare: z.number().min(0).max(100).nullable(),
    activeFrom: closingMonthSchema.nullable(),
    sortOrder: z.number().int().min(0).max(9999),
    selfPay: z.boolean().optional(),
  })
  .strict();

/** 取り込む実績の 1 つ（元の service_records の visits。planned は運ばない・❓20） */
const closingLegacyRecordSchema = z
  .object({
    field: z.string().trim().min(1).max(CLOSING_NAME_MAX),
    date: closingDateSchema,
    count: z.number().min(0).max(CLOSING_COUNT_MAX).refine(decimals(1)),
  })
  .strict();

/**
 * 過去分の取り込み（部署 × 月の塊）。CLI が元のバックアップを名前に引き直して送る（元の uuid は持ち込まない）。
 * `facilityId: null` は対応表に無い事業所名（dryRun が止める）。`lockMonth` は元で確定済みの月の最後の塊だけ true。
 */
const importClosingLegacyBaseSchema = z
  .object({
    dryRun: z.boolean(),
    legacyKey: z.string().trim().min(1).max(CLOSING_TEXT_MAX),
    facilityId: uuidSchema.nullable(),
    divisionName: z.string().trim().min(1).max(CLOSING_NAME_MAX).nullable().optional(),
    legacyUntil: closingMonthSchema,
    month: closingMonthSchema,
    factor: z.number().min(0).max(9.99).refine(decimals(2)).optional(),
    plan: closingLegacyPlanSchema.optional(),
    fields: z.array(closingLegacyFieldSchema).max(CLOSING_LEGACY_FIELDS_MAX),
    budget: closingAmountSchema.nullable().optional(),
    records: z.array(closingLegacyRecordSchema).max(CLOSING_LEGACY_RECORDS_MAX),
    notes: z
      .array(z.object({ date: closingDateSchema, note: z.string().max(CLOSING_DAY_NOTE_MAX) }).strict())
      .max(31)
      .optional(),
    initiatives: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(CLOSING_TEXT_MAX),
            effect: closingAmountSchema,
            prob: z.union([z.literal(0.25), z.literal(0.5), z.literal(0.75), z.literal(1)]),
            dueText: z.string().trim().max(CLOSING_NAME_MAX).nullable().optional(),
            ownerText: z.string().trim().max(CLOSING_NAME_MAX).nullable().optional(),
          })
          .strict(),
      )
      .max(CLOSING_LEGACY_INITIATIVES_MAX)
      .optional(),
    divisionResults: z
      .array(
        z
          .object({
            divisionName: z.string().trim().min(1).max(CLOSING_NAME_MAX),
            budget: closingAmountSchema.nullable(),
            actual: closingAmountSchema.nullable(),
            note: z.string().trim().max(CLOSING_TEXT_MAX).nullable().optional(),
          })
          .strict(),
      )
      .max(50)
      .optional(),
    lockMonth: z.boolean().optional(),
  })
  .strict();

/**
 * 塊の中の日付は塊の月の中だけ（H-1。月の外の日付で、確定済みの月や切り替え後の月の補正を legacy で上書きさせない）。
 * legacyUntil は JST の当月より前だけ（今の月・先の月を「元の数字が正」にしない・M-1）。
 */
function refineLegacyChunk(
  d: { month: string; legacyUntil: string; records: { date: string }[]; notes?: { date: string }[] },
  ctx: z.RefinementCtx,
): void {
  d.records.forEach((r, i) => {
    if (!r.date.startsWith(`${d.month}-`)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["records", i, "date"], message: "塊の月の外の日付" });
  });
  (d.notes ?? []).forEach((n, i) => {
    if (!n.date.startsWith(`${d.month}-`)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["notes", i, "date"], message: "塊の月の外の日付" });
  });
  if (d.legacyUntil >= jstYearMonth()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["legacyUntil"], message: "当月より前の月だけ" });
  }
}

export const importClosingLegacySchema = importClosingLegacyBaseSchema.superRefine(refineLegacyChunk);
export type ImportClosingLegacyInput = z.infer<typeof importClosingLegacySchema>;

/** 突き合わせ（読むだけ）。取り込みと同じ塊に、元の欄 → Qaito の自動の欄の対応（autoKeys）を足す */
export const reconcileClosingLegacySchema = importClosingLegacyBaseSchema
  .omit({ dryRun: true, lockMonth: true })
  .extend({
    autoKeys: z.record(z.string().trim().min(1).max(CLOSING_NAME_MAX), z.enum(CLOSING_AUTO_FIELD_KEYS)).optional(),
  })
  .strict()
  .superRefine(refineLegacyChunk);
export type ReconcileClosingLegacyInput = z.infer<typeof reconcileClosingLegacySchema>;

/**
 * 取り込みを止める理由。
 *   unmapped_facility       … 対応表に無い事業所名（facilityId が空）
 *   forbidden_facility      … 事業所が自組織に無いか、主体の事業所の境界の外
 *   unknown_field           … 実績が欄の定義に無い名前を指している（detail に欄の名前）
 *   month_after_legacy      … 塊の月が legacyUntil より後
 *   legacy_until_conflict   … 部署にもう別の legacy_until が入っている
 *   legacy_key_conflict     … 部署にもう別の legacy_key が入っている
 *   division_forbidden      … 事業部を作る・事業部の確定値を書くには、組織全体の人であること（組織全体の数字）
 *   month_forbidden         … まだ無い月（組織に 1 行・季節係数）を作るには、組織全体の人であること
 */
export const CLOSING_LEGACY_PROBLEMS = [
  "unmapped_facility",
  "forbidden_facility",
  "unknown_field",
  "month_after_legacy",
  "legacy_until_conflict",
  "legacy_key_conflict",
  "division_forbidden",
  "month_forbidden",
] as const;
export type ClosingLegacyProblemCode = (typeof CLOSING_LEGACY_PROBLEMS)[number];

export type ClosingLegacyProblem = { code: ClosingLegacyProblemCode; detail: string | null };

/** 塊ごとに書いた（dryRun では書く予定の）件数。値が同じものは数えない */
export type ClosingLegacyCounts = {
  unit: number;
  plan: number;
  fields: number;
  month: number;
  budget: number;
  records: number;
  recordsRemoved: number;
  notes: number;
  initiatives: number;
  divisionResults: number;
  lock: number;
};

/** 取り込みの結果（備考の本文は返さない） */
export type ClosingLegacyImportResult = {
  dryRun: boolean;
  applied: boolean;
  month: string;
  unitId: string | null;
  /** 確定済みの月で何もしなかった */
  skipped: "locked" | null;
  problems: ClosingLegacyProblem[];
  counts: ClosingLegacyCounts;
};

/** 突き合わせの欄 × 日の差（件数） */
export type ClosingLegacyDayDiff = {
  date: string;
  field: string;
  legacy: number | null;
  qaito: number | null;
  diff: number | null;
};

/** 突き合わせの結果（読むだけ） */
export type ClosingLegacyReconcileResult = {
  month: string;
  unitId: string | null;
  problems: ClosingLegacyProblem[];
  /** 元の数字から元の式で出した月の売上積算・件数合計（千円・件） */
  legacy: { sales: number; count: number };
  /** Qaito の部署 × 月（取り込んだ月は legacy の値・並行の月は Qaito の値）。部署が無ければ null */
  qaito: { sales: number; count: number; legacy: boolean } | null;
  /** 売上の差（Qaito − 元）。0.1 千円を超えたら within = false */
  salesDiff: number | null;
  within: boolean | null;
  /** autoKeys で対応を渡した欄の、日ごとの件数の差（差のある日だけ） */
  days: ClosingLegacyDayDiff[];
};
