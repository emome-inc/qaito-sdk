import { z } from "zod";
import { partialForUpdate } from "../partial-for-update";
import {
  nursingServiceCategories,
  nursingPtJointTypes,
  nursingPlanStatuses,
  nursingReportStatuses,
  nursingProblemRowSchema,
  nursingDayMarksSchema,
  nursingPlannedStaffTypes,
  nursingRehabOccupations,
  NURSING_REPORT_REHAB_CONTENT_MAX,
  NURSING_REPORT_REHAB_TEXT_MAX,
} from "../nursing-plan";
import { bedriddenValues, dementiaValues } from "../clinical-record";
import { nursingReportRecipients } from "../nursing-report-statuses";
import {
  NURSING_INTAKE_LIMITS,
  NURSING_INTAKE_PRINT_LIMITS,
  NURSING_PLAN_LIMITS,
  NURSING_PLAN_PRINT_LIMITS,
  NURSING_REPORT_LIMITS,
  NURSING_REPORT_PRINT_LIMITS,
  totalChars,
} from "../nursing-paper-limits";

/** 報告書の作成者の職種（様式の「職種：看護師・保健師」）。帳票は選んだ方に丸を付ける */
export const NURSING_REPORT_AUTHOR_OCCUPATIONS = ["看護師", "保健師"] as const;
export type NursingReportAuthorOccupation = (typeof NURSING_REPORT_AUTHOR_OCCUPATIONS)[number];

/** 計画書の問題点・解決策と評価は全行を 1 つの欄に印字する。合計の字数で見る（`nursing-paper-limits.ts`） */
function checkServiceContentTotals(rows: { problem: string; solution?: string; evaluation?: string }[], ctx: z.RefinementCtx) {
  if (totalChars(rows.flatMap((r) => [r.problem, r.solution])) > NURSING_PLAN_LIMITS.problemSolutionTotal)
    ctx.addIssue({ code: "custom", message: `問題点・解決策は合わせて${NURSING_PLAN_LIMITS.problemSolutionTotal}字以内` });
  if (totalChars(rows.map((r) => r.evaluation)) > NURSING_PLAN_LIMITS.evaluationTotal)
    ctx.addIssue({ code: "custom", message: `評価は合わせて${NURSING_PLAN_LIMITS.evaluationTotal}字以内` });
}

/** 記録書Ⅰの「保健・福祉サービス等の利用状況」と備考は同じ欄に印字する。両方あるときは合計で見る */
function checkIntakeServicesMemo(v: { memo?: string; baselineSnapshot?: { printDetails?: { services?: string } } }, ctx: z.RefinementCtx) {
  if (totalChars([v.memo, v.baselineSnapshot?.printDetails?.services]) > NURSING_INTAKE_LIMITS.servicesMemoTotal)
    ctx.addIssue({ code: "custom", path: ["memo"], message: `保健・福祉サービス等の利用状況と備考は合わせて${NURSING_INTAKE_LIMITS.servicesMemoTotal}字以内` });
}

/** POST /care-plan/nursing/plans リクエストボディ（親 care_plans + details）*/
export const nursingPlanPrintDetailsSchema = z.object({
  clientNameKana: z.string().max(NURSING_PLAN_PRINT_LIMITS.clientNameKana).optional(),
  birthDate: z.string().max(NURSING_PLAN_PRINT_LIMITS.birthDate).optional(),
  careLevel: z.string().max(NURSING_PLAN_PRINT_LIMITS.careLevel).optional(),
  address: z.string().max(NURSING_PLAN_PRINT_LIMITS.address).optional(),
  planDate: z.string().max(NURSING_PLAN_PRINT_LIMITS.planDate).optional(),
  treatmentRequired: z.string().max(NURSING_PLAN_PRINT_LIMITS.treatmentRequired).optional(),
  treatment: z.string().max(NURSING_PLAN_PRINT_LIMITS.treatment).optional(),
  quantity: z.string().max(NURSING_PLAN_PRINT_LIMITS.quantity).optional(),
  authorOccupation: z.string().max(NURSING_PLAN_PRINT_LIMITS.authorOccupation).optional(),
  secondAuthor: z.string().max(NURSING_PLAN_PRINT_LIMITS.secondAuthor).optional(),
  secondOccupation: z.string().max(NURSING_PLAN_PRINT_LIMITS.secondOccupation).optional(),
  documentDate: z.string().max(NURSING_PLAN_PRINT_LIMITS.documentDate).optional(),
  managerName: z.string().max(NURSING_PLAN_PRINT_LIMITS.managerName).optional(),
  plannedStaffTypes: z.array(z.enum(nursingPlannedStaffTypes)).max(nursingPlannedStaffTypes.length).optional(),
});
export const nursingIntakePrintDetailsSchema = z.object({
  birthDate: z.string().max(NURSING_INTAKE_PRINT_LIMITS.birthDate).optional(),
  address: z.string().max(NURSING_INTAKE_PRINT_LIMITS.address).optional(),
  phone: z.string().max(NURSING_INTAKE_PRINT_LIMITS.phone).optional(),
  occupation: z.string().max(NURSING_INTAKE_PRINT_LIMITS.occupation).optional(),
  firstVisitTime: z.string().max(NURSING_INTAKE_PRINT_LIMITS.firstVisitTime).optional(),
  mainDiagnosis: z.string().max(NURSING_INTAKE_PRINT_LIMITS.mainDiagnosis).optional(),
  presentHistory: z.string().max(NURSING_INTAKE_PRINT_LIMITS.presentHistory).optional(),
  careSituation: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careSituation).optional(),
  lifeHistory: z.string().max(NURSING_INTAKE_PRINT_LIMITS.lifeHistory).optional(),
  familyNames: z.string().max(NURSING_INTAKE_PRINT_LIMITS.familyNames).optional(),
  familyAges: z.string().max(NURSING_INTAKE_PRINT_LIMITS.familyAges).optional(),
  familyRelationships: z.string().max(NURSING_INTAKE_PRINT_LIMITS.familyRelationships).optional(),
  familyJobs: z.string().max(NURSING_INTAKE_PRINT_LIMITS.familyJobs).optional(),
  mainCaregiver: z.string().max(NURSING_INTAKE_PRINT_LIMITS.mainCaregiver).optional(),
  purpose: z.string().max(NURSING_INTAKE_PRINT_LIMITS.purpose).optional(),
  careLevel: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careLevel).optional(),
  bedridden: z.string().max(NURSING_INTAKE_PRINT_LIMITS.bedridden).optional(),
  dementia: z.string().max(NURSING_INTAKE_PRINT_LIMITS.dementia).optional(),
  doctorName: z.string().max(NURSING_INTAKE_PRINT_LIMITS.doctorName).optional(),
  medicalInstitution: z.string().max(NURSING_INTAKE_PRINT_LIMITS.medicalInstitution).optional(),
  medicalAddress: z.string().max(NURSING_INTAKE_PRINT_LIMITS.medicalAddress).optional(),
  medicalPhone: z.string().max(NURSING_INTAKE_PRINT_LIMITS.medicalPhone).optional(),
  doctorEmergency: z.string().max(NURSING_INTAKE_PRINT_LIMITS.doctorEmergency).optional(),
  familyEmergency: z.string().max(NURSING_INTAKE_PRINT_LIMITS.familyEmergency).optional(),
  careManagerName: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careManagerName).optional(),
  careManagerOffice: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careManagerOffice).optional(),
  careManagerPhone: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careManagerPhone).optional(),
  careManagerEmergency: z.string().max(NURSING_INTAKE_PRINT_LIMITS.careManagerEmergency).optional(),
  agencyContacts: z.string().max(NURSING_INTAKE_PRINT_LIMITS.agencyContacts).optional(),
  agencyPeople: z.string().max(NURSING_INTAKE_PRINT_LIMITS.agencyPeople).optional(),
  agencyNotes: z.string().max(NURSING_INTAKE_PRINT_LIMITS.agencyNotes).optional(),
  services: z.string().max(NURSING_INTAKE_PRINT_LIMITS.services).optional(),
  mobility: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  eating: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  excretion: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  bathing: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  dressing: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  grooming: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
  communication: z.enum(["", "自立", "一部介助", "全面介助", "その他"]).optional(),
});
export const createNursingPlanApiSchema = z.object({
  printDetails: nursingPlanPrintDetailsSchema.optional(),
  clientId: z.string().guid(),
  source: z.enum(["internal", "external"]).default("internal"),
  careManagerName: z.string().max(200).optional(),
  careManagerOffice: z.string().max(200).optional(),
  assessmentId: z.string().guid().optional(),
  certificationId: z.string().guid().optional(),
  clientWishes: z.string().max(5000).optional(),
  familyWishes: z.string().max(5000).optional(),
  overallPolicy: z.string().max(5000).optional(),
  effectiveFrom: z.string().date().optional(),
  effectiveUntil: z.string().date().optional(),
  facilityId: z.string().guid().optional(),
  serviceCategory: z.enum(nursingServiceCategories).default("kaigo_hoken"),
  serviceTypeCode: z.string().max(2).optional(),
  medicalInstitutionId: z.string().guid().nullable().optional(),
  doctorName: z.string().max(200).optional(),
  doctorInstructionId: z.string().guid().optional(),
  nursingGoal: z.string().max(NURSING_PLAN_LIMITS.nursingGoal).optional(),
  serviceContent: z.array(nursingProblemRowSchema).max(100).superRefine(checkServiceContentTotals).optional(),
  hygieneMaterials: z.string().max(NURSING_PLAN_LIMITS.hygieneMaterials).optional(),
  ptJointType: z.enum(nursingPtJointTypes).default("none"),
  authorNurseId: z.string().guid().optional(),
  clientConsentAt: z.string().date().optional(),
  familyConsentAt: z.string().date().optional(),
  deliveredAt: z.string().date().optional(),
  submittedToDoctorAt: z.string().date().optional(),
  memo: z.string().max(NURSING_PLAN_LIMITS.memo).optional(),
});

/** PATCH /care-plan/nursing/plans/:id リクエストボディ（親 + details）*/
export const updateNursingPlanApiSchema = partialForUpdate(
  createNursingPlanApiSchema.omit({ clientId: true }),
).extend({ expectedUpdatedAt: z.iso.datetime({ offset: true }).optional() });

/** PATCH /care-plan/nursing/plans/:id/status */
export const updateNursingPlanStatusApiSchema = z.object({
  status: z.enum(nursingPlanStatuses),
  /** 開いたときの更新日時（別の画面で直されていたら CONFLICT）。省略すると確かめない */
  expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
});

const barthelThree = z.enum(["independent", "partial", "full"]);
export const nursingReportBarthelSchema = z.object({
  eating: barthelThree.optional(),
  transfer: z.enum(["independent", "supervised", "sitOnly", "full"]).optional(),
  grooming: barthelThree.optional(),
  toilet: barthelThree.optional(),
  bathing: barthelThree.optional(),
  walking: z.enum(["independent", "walker", "wheelchair", "full"]).optional(),
  stairs: barthelThree.optional(),
  dressing: barthelThree.optional(),
  bowel: barthelThree.optional(),
  bladder: barthelThree.optional(),
});
const rehabText = z.string().max(NURSING_REPORT_REHAB_TEXT_MAX);
export const nursingReportRehabDetailSchema = z.object({
  /** 日常生活自立度（寝たきり度）。指示書と同じ値（＋自立） */
  bedridden: z.enum(["independent", ...bedriddenValues]).optional(),
  /** 認知症の状況（指示書と同じ値。`independent` = 自立） */
  dementia: z.enum(dementiaValues).optional(),
  /** 行った訪問看護・家族等への指導・リスク管理等の内容 */
  content: z.string().max(NURSING_REPORT_REHAB_CONTENT_MAX).optional(),
  barthel: nursingReportBarthelSchema.optional(),
  communication: rehabText.optional(),
  homeRole: rehabText.optional(),
  leisure: rehabText.optional(),
  community: rehabText.optional(),
  afterGoal: rehabText.optional(),
  /** 看護職員との連携状況、看護の視点からの利用者の評価 */
  nurseCollaboration: rehabText.optional(),
  specialNotes: rehabText.optional(),
  authorStaffId: z.string().guid().optional(),
  /** 作成者の氏名（保存時点の写し） */
  authorName: z.string().max(100).optional(),
  authorOccupation: z.enum(nursingRehabOccupations).optional(),
});
export type NursingReportRehabDetail = z.infer<typeof nursingReportRehabDetailSchema>;

/** POST /care-plan/nursing/reports */
export const createNursingReportApiSchema = z.object({
  clientId: z.string().guid(),
  facilityId: z.string().guid().optional(),
  carePlanId: z.string().guid().optional(),
  reportMonth: z.string().regex(/^\d{4}-\d{2}$/),
  medicalInstitutionId: z.string().guid().optional(),
  careManagerId: z.string().guid().optional(),
  doctorName: z.string().max(200).optional(),
  dayMarks: nursingDayMarksSchema.optional(),
  conditionProgress: z.string().max(NURSING_REPORT_LIMITS.conditionProgress).optional(),
  nursingContent: z.string().max(NURSING_REPORT_LIMITS.nursingContent).optional(),
  homeCareStatus: z.string().max(NURSING_REPORT_LIMITS.homeCareStatus).optional(),
  hygieneMaterialsUsage: z.string().max(NURSING_REPORT_LIMITS.hygieneMaterialsUsage).optional(),
  /** 原本様式の補足入力。発行後は本文と同じく凍結。extra_data.printDetails に保存する。 */
  printDetails: z.object({
    clientNameKana: z.string().max(NURSING_REPORT_PRINT_LIMITS.clientNameKana).optional(),
    birthDate: z.string().max(NURSING_REPORT_PRINT_LIMITS.birthDate).optional(),
    address: z.string().max(NURSING_REPORT_PRINT_LIMITS.address).optional(),
    careLevel: z.string().max(NURSING_REPORT_PRINT_LIMITS.careLevel).optional(),
    hygieneMaterialsChanges: z.string().max(NURSING_REPORT_PRINT_LIMITS.hygieneMaterialsChanges).optional(),
    informationProvision: z.string().max(NURSING_REPORT_PRINT_LIMITS.informationProvision).optional(),
    reportDate: z.string().max(NURSING_REPORT_PRINT_LIMITS.reportDate).optional(),
    facilityName: z.string().max(NURSING_REPORT_PRINT_LIMITS.facilityName).optional(),
    managerName: z.string().max(NURSING_REPORT_PRINT_LIMITS.managerName).optional(),
    /** 作成者の職種（帳票の「職種：看護師・保健師」のどちらに丸を付けるか）。無ければ看護師 */
    authorOccupation: z.enum(NURSING_REPORT_AUTHOR_OCCUPATIONS).optional(),
  }).optional(),
  /** 別添（リハ職・別紙様式2-(1)）。送ると `extra_data.rehabDetail` を丸ごと置き換える（ほかのキーは残る） */
  rehabDetail: nursingReportRehabDetailSchema.optional(),
  authorNurseId: z.string().guid().optional(),
  memo: z.string().max(NURSING_REPORT_LIMITS.memo).optional(),
});

/** PATCH /care-plan/nursing/reports/:id（issued は不可 = 凍結後は編集拒否）*/
export const updateNursingReportApiSchema = createNursingReportApiSchema
  .omit({ clientId: true, reportMonth: true })
  .partial();

/** POST /care-plan/nursing/reports/from-sources — 下書きの材料を集め、AI の文案を作り、保存まで 1 回で行う。 */
export const createNursingReportFromSourcesApiSchema = z.object({
  clientId: z.string().guid(),
  facilityId: z.string().guid(),
  reportMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

/** POST /care-plan/nursing/reports/:id/sent — 送付済みにする（宛先 1 つずつ）。 */
export const markNursingReportSentApiSchema = z.object({
  recipient: z.enum(nursingReportRecipients),
});

/** GET /care-plan/nursing/reports/draft */
export const draftNursingReportQueryApiSchema = z.object({
  clientId: z.string().guid(),
  reportMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  facilityId: z.string().guid(),
});

/** 記録書Ⅰの文案は保存とは別。資料と出典を限定して返す。 */
export const nursingIntakeSourceKinds = ["ledger", "conference", "carePlan", "instruction", "initialVisit"] as const;
export const draftNursingIntakeApiSchema = z.object({
  clientId: z.string().guid(), facilityId: z.string().guid(), intakeId: z.string().guid().optional(),
  asOf: z.string().date(), sources: z.array(z.enum(nursingIntakeSourceKinds)).min(1).max(5),
  /** true なら AI を呼ばず、台帳・指示書から写せる欄だけを返す（作るとき・「台帳・指示書から写す」） */
  ledgerOnly: z.boolean().optional(),
});
export type DraftNursingIntakeInput = z.infer<typeof draftNursingIntakeApiSchema>;
export const nursingIntakeDraftFieldSchema = z.object({
  text: z.string().max(10000), sources: z.array(z.string().max(100)).max(20),
  kind: z.enum(["ai", "ledger"]), needsReview: z.string().max(1000).optional(),
});
export const nursingIntakeDraftSourceSchema = z.object({
  id: z.string().max(100), kind: z.enum(nursingIntakeSourceKinds), label: z.string().max(200),
  href: z.string().max(500).regex(/^\/(?![\/\\])/),
});
export const nursingIntakeAiDraftSchema = z.object({
  generatedAt: z.string().datetime(),
  sources: z.array(nursingIntakeDraftSourceSchema).max(30),
  fields: z.record(z.string().max(80), nursingIntakeDraftFieldSchema),
});
export type NursingIntakeAiDraft = z.infer<typeof nursingIntakeAiDraftSchema>;
export type NursingIntakeDraftField = z.infer<typeof nursingIntakeDraftFieldSchema>;
export type NursingIntakeDraftResult = NursingIntakeAiDraft & {
  unavailable: Array<{ kind: typeof nursingIntakeSourceKinds[number]; reason: "forbidden" | "empty" }>;
  aiFailed?: boolean;
};

/** baselineSnapshot: 初回訪問時点の状態固定記録（既往歴・療養状況・家族状況・住環境）*/
export const nursingIntakeSnapshotSchema = z.object({
  aiDraft: nursingIntakeAiDraftSchema.nullable().optional(),
  printDetails: nursingIntakePrintDetailsSchema.optional(),
  medicalHistory: z.string().max(NURSING_INTAKE_LIMITS.medicalHistory).optional(),
  careStatus: z.string().max(NURSING_INTAKE_LIMITS.careStatus).optional(),
  familyStatus: z.string().max(NURSING_INTAKE_LIMITS.familyStatus).optional(),
  livingEnvironment: z.string().max(NURSING_INTAKE_LIMITS.livingEnvironment).optional(),
});
export type NursingIntakeSnapshot = z.infer<typeof nursingIntakeSnapshotSchema>;

/** POST /care-plan/nursing/intake-records */
const nursingIntakeFields = z.object({
  clientId: z.string().guid(),
  facilityId: z.string().guid().optional(),
  firstVisitDate: z.string().date().nullable().optional(),
  status: z.enum(["draft", "final"]).default("final"),
  baselineSnapshot: nursingIntakeSnapshotSchema.default({}),
  authorNurseId: z.string().guid().nullable().optional(),
  memo: z.string().max(NURSING_INTAKE_LIMITS.servicesMemoTotal).optional(),
});

export const createNursingIntakeApiSchema = nursingIntakeFields.refine(
  (v) => v.status === "draft" || Boolean(v.firstVisitDate),
  { path: ["firstVisitDate"], message: "正式に確定するには初回訪問日を入力してください" },
).superRefine(checkIntakeServicesMemo);

/** PATCH /care-plan/nursing/intake-records/:id */
export const updateNursingIntakeApiSchema = partialForUpdate(
  nursingIntakeFields.omit({ clientId: true }),
).superRefine(checkIntakeServicesMemo);

export type CreateNursingPlanApi = z.infer<typeof createNursingPlanApiSchema>;
export type UpdateNursingPlanApi = z.infer<typeof updateNursingPlanApiSchema>;
export type UpdateNursingPlanStatusApi = z.infer<typeof updateNursingPlanStatusApiSchema>;
export type CreateNursingReportFromSourcesApi = z.infer<typeof createNursingReportFromSourcesApiSchema>;
export type MarkNursingReportSentApi = z.infer<typeof markNursingReportSentApiSchema>;
export type CreateNursingReportApi = z.infer<typeof createNursingReportApiSchema>;
export type UpdateNursingReportApi = z.infer<typeof updateNursingReportApiSchema>;
export type CreateNursingIntakeApi = z.input<typeof createNursingIntakeApiSchema>;
export type UpdateNursingIntakeApi = z.infer<typeof updateNursingIntakeApiSchema>;

/** 訪問看護報告書 PDF の宛先。省略時は主治医。 */
export const nursingReportPdfQueryApiSchema = z.object({
  to: z.enum(["doctor", "care_manager"]).default("doctor"),
});

/** GET /care-plan/nursing/plans/:id/forms/:formId の宛先（主治医あて・ケアマネあて）。報告書の PDF と同じ */
export const nursingPlanFormQueryApiSchema = nursingReportPdfQueryApiSchema;
