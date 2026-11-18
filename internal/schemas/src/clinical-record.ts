import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { serviceCategoryValues } from "./shared-options";
import { recordFacilityIdField } from "./api/record-facility";
import { instructionDiagnosesSchema } from "./diagnosis-codes";

const uuid = (name: string) => z.string().uuid(`${name} は UUID 形式です`);
const jsonbNullable = z.record(z.string(), z.unknown()).optional().nullable();

const jsonbArrayOrRecordNullable = z
  .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
  .optional()
  .nullable();

export const instructionTypeValues = [
  "futsu",
  "tokubetsu",
  "seishinka",
  "seishinka_tokubetsu",
  "tenteki",
] as const;
export const instructionDocumentStatusValues = ["requested", "received"] as const;

/** 寝たきり度（障害高齢者の日常生活自立度）。様式16 の○の選択 */
export const bedriddenValues = ["J1", "J2", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
/** 認知症の状況（認知症高齢者の日常生活自立度）。○が無いときは自立 */
export const dementiaValues = ["independent", "I", "IIa", "IIb", "IIIa", "IIIb", "IV", "M"] as const;
/** 褥瘡の深さの分類（none = 褥瘡なし） */
export const pressureUlcerScaleValues = ["none", "designR2020", "npuap"] as const;
export const pressureUlcerDepthValues = ["D3", "D4", "D5", "III", "IV"] as const;
/** 装着・使用医療機器等の番号（様式16 の 1〜13） */
export const INSTRUCTION_DEVICE_CODES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

const formText = (max: number) => z.string().max(max).optional().nullable();
/** 読み取った欄の印。要確認の理由が残っている間は受領済みにできない */
const ocrMarksSchema = z.record(z.string(), z.object({ needsReview: z.string().max(200).optional() })).optional();
const hasNameSchema = z.object({ has: z.boolean(), name: formText(200) }).optional().nullable();

/** 様式16（訪問看護指示書・在宅患者訪問点滴注射指示書）の欄。どれも省略できる */
export const instructionForm16Schema = z.object({
  version: z.literal("form16"),
  /** 傷病名コード（傷病名そのものは clinical_diagnoses に持つ） */
  diagnosisCodes: z.array(z.string().max(7)).max(3).optional(),
  condition: formText(2000),
  medications: z.array(z.object({ name: z.string().min(1).max(200), dosage: formText(200) })).max(6).optional(),
  bedridden: z.enum(bedriddenValues).optional().nullable(),
  dementia: z.enum(dementiaValues).optional().nullable(),
  pressureUlcer: z.object({
    scale: z.enum(pressureUlcerScaleValues),
    depth: z.enum(pressureUlcerDepthValues).optional().nullable(),
  }).optional().nullable(),
  devices: z.array(z.object({ code: z.number().int().min(1).max(13), detail: formText(200) })).max(13).optional(),
  lifeNotes: formText(2000),
  rehab: z.object({
    minutesPerDay: z.number().int().min(1).max(600).optional().nullable(),
    timesPerWeek: z.number().int().min(1).max(21).optional().nullable(),
  }).optional().nullable(),
  ulcerCare: formText(2000),
  deviceCare: formText(2000),
  otherCare: formText(2000),
  infusion: formText(2000),
  emergencyContact: formText(500),
  absenceResponse: formText(500),
  specialNotes: formText(2000),
  otherStation: hasNameSchema,
  suctionAgency: hasNameSchema,
  ocr: ocrMarksSchema,
});

/** 様式18（特別訪問看護指示書・在宅患者訪問点滴注射指示書）の欄 */
export const instructionForm18Schema = z.object({
  version: z.literal("form18"),
  condition: formText(2000),
  frequentReason: formText(2000),
  lifeNotes: formText(2000),
  infusion: formText(2000),
  emergencyContact: formText(500),
  ocr: ocrMarksSchema,
});

export const instructionFormDataSchema = z.discriminatedUnion("version", [instructionForm16Schema, instructionForm18Schema]);
export type InstructionForm16 = z.infer<typeof instructionForm16Schema>;
export type InstructionForm18 = z.infer<typeof instructionForm18Schema>;
export type InstructionFormData = z.infer<typeof instructionFormDataSchema>;

/** 指示書の種類から様式の版を決める（特別指示は様式18・ほかは様式16。点滴注射は○の付いた様式に合わせる） */
export function instructionFormVersion(type: string, current?: string | null): InstructionFormData["version"] {
  if (type === "tokubetsu" || type === "seishinka_tokubetsu") return "form18";
  if (type === "tenteki" && (current === "form16" || current === "form18")) return current;
  return "form16";
}

/** 受領済みに要る項目（並びは画面の並び）。 */
export const INSTRUCTION_REQUIRED_KEYS = [
  "instructionType", "validFrom", "validUntil", "issueDate", "issuingInstitutionId", "issuingDoctorName",
  "diagnoses", "condition", "frequentReason",
] as const;
export type InstructionRequiredKey = (typeof INSTRUCTION_REQUIRED_KEYS)[number];

type InstructionLike = {
  instructionType?: unknown; validFrom?: unknown; validUntil?: unknown; issueDate?: unknown;
  issuingInstitutionId?: unknown; issuingDoctorName?: unknown; formData?: unknown;
};
const filled = (v: unknown) => typeof v === "string" ? v.trim() !== "" : v != null;

/**
 * 受領済みにするのに足りない項目。様式16 は主たる傷病名（1 つ以上）、
 * 様式18 は傷病名の欄が無いので病状・主訴と頻回に必要な理由を求める。
 * 精神科（様式17）は欄の型が未定なので、種類・期間・交付日・医療機関・医師だけを求める。
 */
export function instructionMissingForReceived(row: InstructionLike, hasDiagnosis: boolean): InstructionRequiredKey[] {
  const type = typeof row.instructionType === "string" ? row.instructionType : "";
  const form = (row.formData && typeof row.formData === "object" ? row.formData : {}) as Record<string, unknown>;
  const missing: InstructionRequiredKey[] = [];
  if (!filled(type)) missing.push("instructionType");
  for (const key of ["validFrom", "validUntil", "issueDate", "issuingInstitutionId", "issuingDoctorName"] as const)
    if (!filled(row[key])) missing.push(key);
  if (type === "seishinka") return missing;
  const version = instructionFormVersion(type, typeof form.version === "string" ? form.version : null);
  if (version === "form16") {
    if (!hasDiagnosis) missing.push("diagnoses");
  } else {
    if (!filled(form.condition)) missing.push("condition");
    if (!filled(form.frequentReason)) missing.push("frequentReason");
  }
  return missing;
}

/** 要確認の印が残っている欄（読み取った値をまだ確かめていない） */
export function instructionReviewKeys(formData: unknown): string[] {
  if (!formData || typeof formData !== "object") return [];
  const ocr = (formData as { ocr?: unknown }).ocr;
  if (!ocr || typeof ocr !== "object") return [];
  return Object.entries(ocr as Record<string, { needsReview?: unknown }>)
    .filter(([, mark]) => typeof mark?.needsReview === "string" && mark.needsReview !== "")
    .map(([key]) => key);
}

/**
 * 指示書の交付の上限（foundation §2.1 の逐語転記）。期間の日数は開始日を含めて数える。
 *   普通・精神科 = 6 月まで / 特別・精神科特別 = 14 日まで（月の交付回数: 原則 1 回・別表8 分類1 該当なら 2 回）/ 点滴注射 = 7 日まで
 * 保存の口・画面・保険の判定・請求の検査 V17 が同じ表を引く（二重に持たない）。
 */
export const INSTRUCTION_VALIDITY_LIMITS: Record<
  (typeof instructionTypeValues)[number],
  { maxDays: number | null; maxMonths: number | null; maxIssuesPerMonth?: number; maxIssuesPerMonthBesshi8Class1?: number }
> = {
  futsu: { maxDays: null, maxMonths: 6 },
  seishinka: { maxDays: null, maxMonths: 6 },
  tokubetsu: { maxDays: 14, maxMonths: null, maxIssuesPerMonth: 1, maxIssuesPerMonthBesshi8Class1: 2 },
  seishinka_tokubetsu: { maxDays: 14, maxMonths: null, maxIssuesPerMonth: 1 },
  tenteki: { maxDays: 7, maxMonths: null },
};

/** 指示書の種類ごとの期間の上限（日）。日数で決まらない種類は null */
export function instructionMaxDays(type: string): number | null {
  return (INSTRUCTION_VALIDITY_LIMITS as Record<string, { maxDays: number | null } | undefined>)[type]?.maxDays ?? null;
}

/**
 * 1 枚の原本で「訪問看護」と「点滴注射」の両方に○があるとき、点滴注射の指示書をもう 1 件作るための入力
 * （新しく作るときだけ。交付日・医療機関・医師・原本は 1 件目と同じ）。設計 nursing-doctor-instruction-form.md §2
 */
export const infusionInstructionSchema = z.object({
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です"),
  validUntil: z.string().date("validUntil は YYYY-MM-DD 形式です"),
});
export type InfusionInstructionInput = z.infer<typeof infusionInstructionSchema>;

export const createDoctorInstructionSchema = z.object({
  clientId: uuid("clientId"),
  instructionType: z.enum(instructionTypeValues),
  documentStatus: z.enum(instructionDocumentStatusValues).default("received"),
  issuingInstitutionId: uuid("issuingInstitutionId").optional().nullable(),
  issuingDoctorName: z.string().max(120).optional().nullable(),
  issueDate: z.string().date("issueDate は YYYY-MM-DD 形式です").optional().nullable(),
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です").optional().nullable(),
  validUntil: z.string().date("validUntil は YYYY-MM-DD 形式です").optional().nullable(),
  contentSummary: z.string().max(4000).optional().nullable(),
  formData: instructionFormDataSchema.optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
  /**
   * 指示書に足す傷病名（名前・コード・ICD-10・修飾語。20 件まで）。作成でも更新でも、モジュールが指示書と同じ流れ
   * （同じトランザクション）で傷病名の記録を作る。同じ名前の今の傷病名があれば作らない（コードなしの行にはコードを埋める）。
   * コードの無いものは名前だけで作る。指示書の列には持たない
   */
  diagnoses: instructionDiagnosesSchema.optional(),
});
export type CreateDoctorInstructionInput = z.infer<typeof createDoctorInstructionSchema>;
export const updateDoctorInstructionSchema = partialForUpdate(
  createDoctorInstructionSchema.omit({ clientId: true }),
);
export type UpdateDoctorInstructionInput = z.infer<typeof updateDoctorInstructionSchema>;

export const conditionCategoryValues = ["besshi7", "besshi8", "judo_ryoyo"] as const;

export const createConditionPeriodSchema = z.object({
  clientId: uuid("clientId"),
  category: z.enum(conditionCategoryValues),
  conditionCode: z.string().min(1).max(8, "conditionCode は 8 文字以内です"),
  conditionLabel: z.string().min(1).max(200),
  validFrom: z.string().date("validFrom は YYYY-MM-DD 形式です"),
  validUntil: z.string().date("validUntil は YYYY-MM-DD 形式です").optional().nullable(),
  basisDiagnosisId: uuid("basisDiagnosisId").optional().nullable(),
  basisNote: z.string().max(2000).optional().nullable(),
});
export type CreateConditionPeriodInput = z.infer<typeof createConditionPeriodSchema>;
export const updateConditionPeriodSchema = createConditionPeriodSchema.omit({ clientId: true }).partial();
export type UpdateConditionPeriodInput = z.infer<typeof updateConditionPeriodSchema>;

export const diagnosisOutcomeValues = ["continuing", "cured", "died", "stopped"] as const;

export const createDiagnosisSchema = z.object({
  clientId: uuid("clientId"),
  diseaseCode: z.string().max(7, "diseaseCode は 7 文字以内です").optional().nullable(),
  diseaseName: z.string().min(1).max(200),
  icd10Code: z.string().max(7, "icd10Code は 7 文字以内です").optional().nullable(),
  /** 修飾語マスター（支払基金）のコード（4 桁）。傷病名の前後に付ける順。名前（diseaseName）は書き換えない。省略は付けない（更新で省略すると今の値のまま） */
  modifierCodes: z.array(z.string().regex(/^\d{4}$/, "modifierCodes は 4 桁の数字です")).max(5).optional(),
  isPrimary: z.boolean().default(false),
  isPsychiatric: z.boolean().default(false),
  onsetDate: z.string().date("onsetDate は YYYY-MM-DD 形式です").optional().nullable(),
  outcome: z.enum(diagnosisOutcomeValues).optional().nullable(),
  endDate: z.string().date("endDate は YYYY-MM-DD 形式です").optional().nullable(),
  clientMedicalId: uuid("clientMedicalId").optional().nullable(),
});
export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;
export const updateDiagnosisSchema = partialForUpdate(
  createDiagnosisSchema.omit({ clientId: true }),
);
export type UpdateDiagnosisInput = z.infer<typeof updateDiagnosisSchema>;

export const episodeKindValues = ["nyuin", "nyusho"] as const;

export const createHospitalizationSchema = z.object({
  clientId: uuid("clientId"),
  episodeKind: z.enum(episodeKindValues),
  institutionId: uuid("institutionId").optional().nullable(),
  institutionNameSnapshot: z.string().max(200).optional().nullable(),
  admissionDate: z.string().date("admissionDate は YYYY-MM-DD 形式です"),
  dischargeDate: z.string().date("dischargeDate は YYYY-MM-DD 形式です").optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
});
export type CreateHospitalizationInput = z.infer<typeof createHospitalizationSchema>;
export const updateHospitalizationSchema = createHospitalizationSchema.omit({ clientId: true }).partial();
export type UpdateHospitalizationInput = z.infer<typeof updateHospitalizationSchema>;

export const renkeiEventTypeValues = [
  "nyuin_joho_teikyo",
  "taiin_joho_juryo",
  "taiin_conference",
  "tsuin_doseki",
  "kinkyu_conference",
  "kango_kaigo_renkei",
  "terminal_consent",
] as const;
export const renkeiMethodValues = ["visit", "conference", "online", "phone", "document"] as const;

/** 訪問看護のサービス種類コード（この項目の決まりを当てる範囲） */
export const TAIIN_KYODO_SERVICE_TYPES = ["13", "63"] as const;

/** 退院時共同指導の記録か（13・63 の taiin_conference） */
export function isTaiinKyodoShido(v: { eventType?: unknown; serviceTypeCode?: unknown }): boolean {
  return v.eventType === "taiin_conference" && (TAIIN_KYODO_SERVICE_TYPES as readonly unknown[]).includes(v.serviceTypeCode);
}

export const taiinKyodoSideValues = ["hospital", "own", "client"] as const;
export const taiinKyodoJobValues = [
  "doctor", "nurse", "jun_nurse", "pt_ot_st", "msw", "care_manager", "self", "family", "other",
] as const;
/** 加算の要件の「看護師等（准看護師を除く）」に当たる職種（看護師・保健師・助産師・PT/OT/ST） */
export const TAIIN_KYODO_QUALIFIED_JOBS = ["nurse", "pt_ot_st"] as const;
/** 退院時共同指導として認める方法（病院で・会議・オンライン） */
export const TAIIN_KYODO_METHODS = ["visit", "conference", "online"] as const;

export const taiinKyodoParticipantSchema = z.object({
  side: z.enum(taiinKyodoSideValues),
  name: z.string().max(100),
  job: z.enum(taiinKyodoJobValues),
  staffId: uuid("staffId").optional().nullable(),
});
export type TaiinKyodoParticipant = z.infer<typeof taiinKyodoParticipantSchema>;

export const taiinKyodoExtraSchema = z.object({
  /** 指導した相手（本人・家族） */
  instructedTo: z.array(z.enum(["self", "family"])).max(2).optional(),
  /** 内容の渡し方 */
  handover: z.enum(["document", "email", "other"]).optional().nullable(),
  /** メールで渡したとき、受け取ったことを本人・家族に確かめたか */
  receiptConfirmed: z.boolean().optional(),
  place: z.string().max(200).optional().nullable(),
  /** 元にした資料のメモ（例: 「カンファの要約から」） */
  sourceNote: z.string().max(200).optional().nullable(),
  /** カンファの記録（議事録・Markdown） */
  minutes: z.string().max(20000).optional().nullable(),
});
export type TaiinKyodoExtra = z.infer<typeof taiinKyodoExtraSchema>;

/** 13・63 の taiin_conference の参加者・項目の形を検査する（作成・更新で共通） */
export function taiinKyodoShapeIssues(v: { participants?: unknown; extraData?: unknown }): ("participants" | "extraData")[] {
  const issues: ("participants" | "extraData")[] = [];
  if (v.participants != null && !z.array(taiinKyodoParticipantSchema).max(30).safeParse(v.participants).success) issues.push("participants");
  if (v.extraData != null && !taiinKyodoExtraSchema.safeParse(v.extraData).success) issues.push("extraData");
  return issues;
}

/** 議事録に残っている「要確認」の数 */
export function countYoKakunin(minutes: string | null | undefined): number {
  return minutes ? (minutes.match(/要確認/g) ?? []).length : 0;
}

export function taiinKyodoMissing(r: {
  hospitalizationEpisodeId?: unknown;
  eventDate?: unknown;
  method?: unknown;
  institutionId?: unknown;
  counterpart?: unknown;
  participants?: unknown;
  body?: unknown;
  extraData?: unknown;
}): string[] {
  const missing: string[] = [];
  const text = (v: unknown) => typeof v === "string" && v.trim() !== "";
  const participants = z.array(taiinKyodoParticipantSchema).safeParse(r.participants ?? []);
  const extra = taiinKyodoExtraSchema.safeParse(r.extraData ?? {});
  const ex: TaiinKyodoExtra = extra.success ? extra.data : {};
  if (!r.hospitalizationEpisodeId) missing.push("入退院");
  if (!text(r.eventDate)) missing.push("実施日");
  if (!(TAIIN_KYODO_METHODS as readonly unknown[]).includes(r.method)) missing.push("方法");
  if (!r.institutionId) missing.push("相手の医療機関");
  const people = participants.success ? participants.data : [];
  if (!people.some((p) => p.side === "hospital")) missing.push("参加者（病院側）");
  if (!people.some((p) => p.side === "own" && Boolean(p.staffId) && (TAIIN_KYODO_QUALIFIED_JOBS as readonly string[]).includes(p.job)))
    missing.push("参加者（当事業所側の看護師等。准看護師だけでは足りません）");
  if (!ex.instructedTo || ex.instructedTo.length === 0) missing.push("指導した相手");
  if (!text(r.body)) missing.push("本人・家族への指導内容と反応");
  if (!ex.handover) missing.push("内容の渡し方");
  else if (ex.handover === "email" && ex.receiptConfirmed !== true) missing.push("受け取りの確認（メールのとき）");
  return missing;
}

/** 確定の取り消し（理由は必須） */
export const unconfirmRenkeiEventSchema = z.object({
  reason: z.string().trim().min(1, "理由を入力してください").max(500),
});

export const createRenkeiEventSchema = z.object({
  clientId: uuid("clientId"),
  facilityId: recordFacilityIdField,
  serviceCategory: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode: z.string().min(1).max(2, "serviceTypeCode は 2 文字以内です"),
  eventType: z.enum(renkeiEventTypeValues),
  eventDate: z.string().date("eventDate は YYYY-MM-DD 形式です"),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "eventTime は HH:MM 形式です").optional().nullable(),
  institutionId: uuid("institutionId").optional().nullable(),
  hospitalizationEpisodeId: uuid("hospitalizationEpisodeId").optional().nullable(),
  method: z.enum(renkeiMethodValues).optional().nullable(),
  counterpart: z.string().max(200).optional().nullable(),
  participants: jsonbArrayOrRecordNullable,
  body: z.string().max(8000).optional().nullable(),
  extraData: jsonbNullable,
}).superRefine((v, ctx) => {
  const needsEpisode = v.eventType === "nyuin_joho_teikyo" || v.eventType === "taiin_joho_juryo" || v.eventType === "taiin_conference";
  if (needsEpisode && !isTaiinKyodoShido(v) && !v.hospitalizationEpisodeId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hospitalizationEpisodeId"], message: "入退院系イベントは入退院エピソードの選択が必要です" });
  }
  if (isTaiinKyodoShido(v)) {
    for (const key of taiinKyodoShapeIssues(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: "退院時共同指導の項目の形が正しくありません" });
    }
  }
});
export type CreateRenkeiEventInput = z.infer<typeof createRenkeiEventSchema>;
const renkeiEventShape = z.object({
  serviceCategory: z.enum(serviceCategoryValues),
  serviceTypeCode: z.string().min(1).max(2),
  eventType: z.enum(renkeiEventTypeValues),
  eventDate: z.string().date(),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional().nullable(),
  institutionId: uuid("institutionId").optional().nullable(),
  hospitalizationEpisodeId: uuid("hospitalizationEpisodeId").optional().nullable(),
  method: z.enum(renkeiMethodValues).optional().nullable(),
  counterpart: z.string().max(200).optional().nullable(),
  participants: jsonbArrayOrRecordNullable,
  body: z.string().max(8000).optional().nullable(),
  extraData: jsonbNullable,
});
export const updateRenkeiEventSchema = renkeiEventShape.partial();
export type UpdateRenkeiEventInput = z.infer<typeof updateRenkeiEventSchema>;

export const doctorKindValues = ["jigyosho", "gairai"] as const;

export const createDoctorExamSchema = z.object({
  clientId: uuid("clientId"),
  serviceCategory: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode: z.string().min(1).max(2, "serviceTypeCode は 2 文字以内です"),
  examinationDate: z.string().date("examinationDate は YYYY-MM-DD 形式です"),
  doctorKind: z.enum(doctorKindValues),
  doctorName: z.string().max(120).optional().nullable(),
  institutionId: uuid("institutionId").optional().nullable(),
  infoProvidedDate: z.string().date("infoProvidedDate は YYYY-MM-DD 形式です").optional().nullable(),
  doctorTrainingCompleted: z.boolean().optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
});
export type CreateDoctorExamInput = z.infer<typeof createDoctorExamSchema>;
export const updateDoctorExamSchema = partialForUpdate(
  createDoctorExamSchema.omit({ clientId: true }),
);
export type UpdateDoctorExamInput = z.infer<typeof updateDoctorExamSchema>;

/** event = 事象 / treatment = 処置（対策）/ plan = 方針 */
export const nursingProgressKindValues = ["event", "treatment", "plan"] as const;
export const NURSING_PROGRESS_KIND_LABELS: Record<(typeof nursingProgressKindValues)[number], string> = {
  event: "事象",
  treatment: "処置",
  plan: "方針",
};
/** 本文の上限（文字）。要配慮の医療情報。ログには出さない。 */
export const NURSING_PROGRESS_BODY_MAX_LENGTH = 4000;
/** 1 件に付けられる写真の数（日常の記録の写真を指す） */
export const NURSING_PROGRESS_PHOTO_MAX = 4;

export const createNursingProgressSchema = z.object({
  clientId: uuid("clientId"),
  /** 事業所 stamp（必須。看護経過ボードは事業所 × 日付で読む） */
  facilityId: uuid("facilityId"),
  serviceDate: z.string().date("serviceDate は YYYY-MM-DD 形式です"),
  /** 発生時刻（ISO 8601・省略 = 記録した時刻） */
  occurredAt: z.string().datetime({ offset: true, message: "occurredAt は ISO 8601 形式です" }).optional(),
  kind: z.enum(nursingProgressKindValues),
  body: z.string().trim().min(1, "body は必須です").max(NURSING_PROGRESS_BODY_MAX_LENGTH),
  /** 写真（日常の記録の写真の ID。その利用者・事業所の撮影済みの写真だけ） */
  photoMediaLogIds: z.array(uuid("photoMediaLogIds")).max(NURSING_PROGRESS_PHOTO_MAX).optional(),
});
export type CreateNursingProgressInput = z.infer<typeof createNursingProgressSchema>;
export const updateNursingProgressSchema = partialForUpdate(
  createNursingProgressSchema.omit({ clientId: true, facilityId: true }),
).extend({
  contactReflected: z.boolean().optional(),
});
export type UpdateNursingProgressInput = z.infer<typeof updateNursingProgressSchema>;

/** 事業所 × 日付の看護経過記録（看護経過ボード）。 */
export const listDayNursingProgressQuery = z.object({
  facilityId: uuid("facilityId"),
  date: z.string().date("date は YYYY-MM-DD 形式です"),
});
export type ListDayNursingProgressQuery = z.infer<typeof listDayNursingProgressQuery>;

/** 1 利用者の看護経過表の期間（既定 = 今日まで 1 か月）。 */
export const NURSING_CHART_MAX_DAYS = 366;
export const listClientNursingChartQuery = z.object({
  from: z.string().date("from は YYYY-MM-DD 形式です").optional(),
  to: z.string().date("to は YYYY-MM-DD 形式です").optional(),
});
export type ListClientNursingChartQuery = z.infer<typeof listClientNursingChartQuery>;

export const clinicalRecordIdParam = z.object({
  clientId: uuid("clientId"),
  id: uuid("id"),
});
export type ClinicalRecordIdParam = z.infer<typeof clinicalRecordIdParam>;

/** 一覧クエリ（期間絞り込み・直近 N 件） */
export const listClinicalRecordQuery = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type ListClinicalRecordQuery = z.infer<typeof listClinicalRecordQuery>;
