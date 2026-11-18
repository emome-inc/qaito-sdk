
/** 計画書の本文（`nursing-plan-layout.json`）。問題点・解決策と評価は全行を 1 つの欄にまとめるので合計で見る */
export const NURSING_PLAN_LIMITS = {
  nursingGoal: 160,
  /** 問題点 + 解決策の全行の合計（行の番号と行の間の空行のぶんを引いてある） */
  problemSolutionTotal: 548,
  /** 評価の全行の合計 */
  evaluationTotal: 191,
  hygieneMaterials: 80,
  memo: 90,
} as const;

/** 計画書の補足項目（`printDetails`） */
export const NURSING_PLAN_PRINT_LIMITS = {
  clientNameKana: 16,
  birthDate: 39,
  careLevel: 34,
  address: 34,
  planDate: 201,
  treatmentRequired: 11,
  treatment: 28,
  quantity: 45,
  authorOccupation: 23,
  secondAuthor: 7,
  secondOccupation: 23,
  /** 様式の左下（13pt・4 列幅）。「令和8年10月29日」で 10 字 */
  documentDate: 12,
  /** 様式の右下「管理者氏名　」の後ろ（事業所名の下の 1 行） */
  managerName: 16,
} as const;

/** 記録書Ⅰの本文。備考は 2 枚目の「保健・福祉サービス等の利用状況」と同じ欄に入るので合計で見る */
export const NURSING_INTAKE_LIMITS = {
  medicalHistory: 270,
  careStatus: 270,
  familyStatus: 55,
  livingEnvironment: 110,
  /** 保健・福祉サービス等の利用状況（`printDetails.services`）+ 備考（`memo`）の合計 */
  servicesMemoTotal: 450,
} as const;

/** 記録書Ⅰの補足項目（`baselineSnapshot.printDetails`）。`services` は上の合計で見る */
export const NURSING_INTAKE_PRINT_LIMITS = {
  birthDate: 55,
  address: 35,
  phone: 55,
  occupation: 55,
  firstVisitTime: 110,
  mainDiagnosis: 150,
  presentHistory: 270,
  careSituation: 270,
  lifeHistory: 270,
  familyNames: 90,
  familyAges: 55,
  familyRelationships: 55,
  familyJobs: 55,
  mainCaregiver: 110,
  purpose: 150,
  careLevel: 75,
  bedridden: 55,
  dementia: 55,
  doctorName: 75,
  medicalInstitution: 70,
  medicalAddress: 75,
  medicalPhone: 70,
  doctorEmergency: 110,
  familyEmergency: 220,
  careManagerName: 75,
  careManagerOffice: 65,
  careManagerPhone: 35,
  careManagerEmergency: 70,
  agencyContacts: 130,
  agencyPeople: 100,
  agencyNotes: 100,
  services: 450,
} as const;

/**
 * 記録書Ⅱ（`nursing-visit-paper-layout.ts`）。利用者の状態は S・O・A・P をまとめた 1 つの文、
 * 実施した看護・リハの内容は 6 欄を 1 つの欄に並べるので合計で見る（見出しの行のぶんを引いてある）
 */
export const NURSING_VISIT_RECORD_LIMITS = {
  condition: 700,
  careTotal: 700,
  comment: 650,
} as const;

/** 報告書の本文（`nursing-report-layout.json`） */
export const NURSING_REPORT_LIMITS = {
  conditionProgress: 320,
  nursingContent: 220,
  homeCareStatus: 220,
  hygieneMaterialsUsage: 180,
  memo: 100,
} as const;

/** 報告書の補足項目（`printDetails`） */
export const NURSING_REPORT_PRINT_LIMITS = {
  clientNameKana: 12,
  birthDate: 38,
  address: 130,
  careLevel: 90,
  hygieneMaterialsChanges: 180,
  informationProvision: 180,
  reportDate: 12,
  facilityName: 19,
  managerName: 18,
} as const;

/** 1 つの欄にまとめて印字する複数の入力の合計の字数 */
export function totalChars(values: readonly (string | null | undefined)[]): number {
  return values.reduce((sum, v) => sum + (v ?? "").length, 0);
}
