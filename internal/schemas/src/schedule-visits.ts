import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const visitServiceCategoryValues = [
  "kaigo_hoken",
  "shogai_fukushi",
  "sogo_jigyo",
  "iryo_hoken",
] as const;
export type VisitServiceCategory = (typeof visitServiceCategoryValues)[number];

export const visitServiceTypeCodeValues = ["11", "13", "63", "14", "64", "A2"] as const;
export type VisitServiceTypeCode = (typeof visitServiceTypeCodeValues)[number];

export const visitKindValues = [
  "body",
  "life",
  "body_life",
  "tsuin_josho",
  "body02",
  "nurse",
  "pt_ot_st",
  "rehab",
  "a2_visit",
] as const;
export type VisitKind = (typeof visitKindValues)[number];

/** 訪問区分の表示名（ツールの enum の説明・Qaito カレンダーの重ね表示が使う） */
export const VISIT_KIND_LABELS: Record<VisitKind, string> = {
  body: "身体介護",
  life: "生活援助",
  body_life: "身体介護＋生活援助",
  tsuin_josho: "通院等乗降介助",
  body02: "身体02",
  nurse: "看護師等",
  pt_ot_st: "PT/OT/ST",
  rehab: "リハビリ",
  a2_visit: "総合事業・訪問型",
};

export const VISIT_KIND_BY_SERVICE_TYPE: Record<VisitServiceTypeCode, readonly VisitKind[]> = {
  "11": ["body", "life", "body_life", "tsuin_josho", "body02"],
  "13": ["nurse", "pt_ot_st"],
  "63": ["nurse", "pt_ot_st"],
  "14": ["rehab"],
  "64": ["rehab"],
  A2: ["a2_visit"],
};

/**
 * 訪問看護（13・63）の理学療法士等（PT・OT・ST）の訪問は 20 分で 1 回（訪問看護費(Ⅰ)5 は 1 回 20 分以上）。
 * 予定の時間を 20 分ごとに選ばせる画面と、請求の回数の数え方が同じ値を引く。
 */
export const NURSING_REHAB_UNIT_MINUTES = 20;

/**
 * 理学療法士等の訪問の分 → 回数。1 回 20 分以上で、20 分ごとに 1 回（40 分 = 2 回・60 分 = 3 回）。端数は数えない（最低 1 回）。
 * 請求（claims の kangoVisitUnits）と訪問看護の確かめ・画面の回数が同じ数え方を引く。ここ以外に式を書かない。
 */
export function nursingRehabUnitsOf(minutes: number): number {
  return Math.max(1, Math.floor(minutes / NURSING_REHAB_UNIT_MINUTES));
}

/** serviceTypeCode に対して visitKind が制度上許容されるか（handler の更新時再検証にも使う） */
export function isValidVisitKind(serviceTypeCode: string, visitKind: string): boolean {
  const allowed = VISIT_KIND_BY_SERVICE_TYPE[serviceTypeCode as VisitServiceTypeCode];
  return Array.isArray(allowed) && (allowed as readonly string[]).includes(visitKind);
}

export const visitSourceValues = ["regular", "substitute", "spot", "trial"] as const;
export const visitStatusValues = ["scheduled", "provided", "cancelled"] as const;
export const visitProviderRoleValues = [
  "primary",
  "second",
  "accompany_saseki",
  "accompany_expert",
  "assistant",
] as const;
export const visitProviderQualificationValues = [
  "nurse",
  "associate_nurse",
  "pt",
  "ot",
  "st",
  "care_worker",
  "visiting_care_worker",
  "saseki",
  "nursing_assistant",
  "doctor",
  "other",
] as const;
export const VISIT_MONTH_WEEKS_ALL = [1, 2, 3, 4, 5] as const;
/** 月の第何週か（1〜5・重複なし・1 つ以上） */
export const visitMonthWeeksSchema = z
  .array(z.number().int().min(1).max(5))
  .min(1)
  .max(5)
  .refine((weeks) => new Set(weeks).size === weeks.length);

/** 昇順・重複なしにそろえる。空・未指定は毎週（保存の前に通す） */
export function normalizeMonthWeeks(monthWeeks?: readonly number[] | null): number[] {
  const weeks = [...new Set(monthWeeks ?? [])].filter((n) => Number.isInteger(n) && n >= 1 && n <= 5).sort((a, b) => a - b);
  return weeks.length ? weeks : [...VISIT_MONTH_WEEKS_ALL];
}

/** 毎週か（1〜5 が全部そろっている） */
export function isEveryWeek(monthWeeks?: readonly number[] | null): boolean {
  return normalizeMonthWeeks(monthWeeks).length === VISIT_MONTH_WEEKS_ALL.length;
}

/** 繰り返しの見出し（「毎週」「第1・3週」）。画面・帳票はこれ 1 本で書く */
export function visitMonthWeeksLabel(monthWeeks?: readonly number[] | null): string {
  return isEveryWeek(monthWeeks) ? "毎週" : `第${normalizeMonthWeeks(monthWeeks).join("・")}週`;
}

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "時刻は HH:MM 形式です");

const dateString = z.string().date("YYYY-MM-DD 形式です");
const uuidString = z.string().uuid("UUID 形式です");

/** `HH:MM` / `HH:MM:SS` → 0 時からの秒数（DB が返す `HH:MM:SS` と入力の `HH:MM` を同じ物差しで比べる） */
export function timeToSeconds(t: string): number {
  const [h, m, s] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s ?? 0);
}

/**
 * 予定の終了が開始より後か。
 * - 同時刻は常に不正（0 分、または丸 1 日になってしまう）
 * - 終了 < 開始は、翌日にまたがる（`endsNextDay === true`）ときだけ正しい
 */
export function isPlannedEndValid(start: string, end: string, endsNextDay: boolean | undefined): boolean {
  const s = timeToSeconds(start);
  const e = timeToSeconds(end);
  if (e === s) return false;
  if (e < s) return endsNextDay === true;
  return true;
}

const PLANNED_END_MESSAGE = "終了時刻は開始時刻より後にしてください";

export const createScheduleVisitSchema = z
  .object({
    scheduleId: uuidString.optional(),
    clientId: uuidString,
    facilityId: uuidString,
    serviceDate: dateString,
    serviceCategory: z.enum(visitServiceCategoryValues).default("kaigo_hoken"),
    serviceTypeCode: z.enum(visitServiceTypeCodeValues),
    visitKind: z.enum(visitKindValues),
    plannedStartTime: timeString,
    plannedEndTime: timeString.optional().nullable(),
    plannedEndsNextDay: z.boolean().default(false),
    plannedMinutes: z.number().int().min(0).max(1440).optional().nullable(),
    planDetailId: uuidString.optional().nullable(),
    source: z.enum(visitSourceValues).default("regular"),
    substitutedForVisitId: uuidString.optional().nullable(),
    emergency: z.boolean().default(false),
    emergencyBillable: z.boolean().optional().nullable(),
    emergencyRequestedAt: z.string().datetime({ offset: true }).optional().nullable(),
    emergencyRequestNote: z.string().max(1000).optional().nullable(),
    twoPersonBilling: z.boolean().default(false),
    sasekiDoko: z.boolean().default(false),
    note: z.string().max(1000).optional().nullable(),
    /** 同じ担当職員の前後 15 分以内に別の予定があるとき、確認のうえ続ける場合だけ true */
  acknowledgeNearby: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (!isValidVisitKind(val.serviceTypeCode, val.visitKind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitKind"],
        message: `visitKind '${val.visitKind}' は serviceTypeCode '${val.serviceTypeCode}' では許容されません`,
      });
    }
    if (val.plannedEndTime && !isPlannedEndValid(val.plannedStartTime, val.plannedEndTime, val.plannedEndsNextDay)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["plannedEndTime"], message: PLANNED_END_MESSAGE });
    }
    if (!val.emergency && val.emergencyBillable != null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emergencyBillable"], message: "定期訪問には算定区分を指定できません" });
    }
  });
export type CreateScheduleVisitInput = z.infer<typeof createScheduleVisitSchema>;

export const updateScheduleVisitSchema = partialForUpdate(
  z.object({
    planConfirmed: z.boolean(),
    acknowledgeConfirmed: z.boolean(),
    expectedUpdatedAt: z.string().datetime({ offset: true }),
    serviceCategory: z.enum(visitServiceCategoryValues),
    serviceTypeCode: z.enum(visitServiceTypeCodeValues),
    visitKind: z.enum(visitKindValues),
    plannedStartTime: timeString,
    plannedEndTime: timeString.nullable(),
    plannedEndsNextDay: z.boolean(),
    plannedMinutes: z.number().int().min(0).max(1440).nullable(),
    planDetailId: uuidString.nullable(),
    source: z.enum(visitSourceValues),
    substitutedForVisitId: uuidString.nullable(),
    emergency: z.boolean(),
    emergencyBillable: z.boolean().nullable(),
    emergencyRequestedAt: z.string().datetime({ offset: true }).nullable(),
    emergencyRequestNote: z.string().max(1000).nullable(),
    twoPersonBilling: z.boolean(),
    sasekiDoko: z.boolean(),
    note: z.string().max(1000).nullable(),
    acknowledgeShift: z.boolean(),
    acknowledgeNearby: z.boolean(),
  }),
).superRefine((val, ctx) => {
  if (val.plannedStartTime == null || val.plannedEndTime == null) return;
  const bad = val.plannedEndsNextDay === undefined
    ? timeToSeconds(val.plannedEndTime) === timeToSeconds(val.plannedStartTime)
    : !isPlannedEndValid(val.plannedStartTime, val.plannedEndTime, val.plannedEndsNextDay);
  if (bad) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["plannedEndTime"], message: PLANNED_END_MESSAGE });
});
export type UpdateScheduleVisitInput = z.infer<typeof updateScheduleVisitSchema>;

export const provideScheduleVisitSchema = z.object({
  actualStartTime: timeString,
  /** 省略は維持、null は削除。予定と実績が異なる理由。 */
  actualTimeReason: z.string().max(500).nullable().optional(),
  actualEndTime: timeString.optional().nullable(),
  actualEndsNextDay: z.boolean().default(false),
}).superRefine((val, ctx) => {
  if (val.actualEndTime && !isPlannedEndValid(val.actualStartTime, val.actualEndTime, val.actualEndsNextDay)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["actualEndTime"], message: PLANNED_END_MESSAGE });
  }
});
export type ProvideScheduleVisitInput = z.infer<typeof provideScheduleVisitSchema>;

export const moveScheduleVisitSchema = z.object({
  /** expectedStaffId に一致する担当を変更。省略時は維持し、null は担当未定へ戻す。 */
  targetStaffId: z.string().uuid().nullable().optional(),
  expectedStaffId: z.string().uuid().nullable().optional(),
  targetQualification: z.enum(visitProviderQualificationValues).optional(),
  acknowledgeShift: z.boolean().optional(),
  acknowledgeNearby: z.boolean().optional(),
  acknowledgeConfirmed: z.boolean().optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
  plannedMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  serviceDate: dateString,
  plannedStartTime: timeString,
  plannedEndTime: timeString.optional().nullable(),
  plannedEndsNextDay: z.boolean().default(false),
}).superRefine((val, ctx) => {
  if (val.plannedEndTime && !isPlannedEndValid(val.plannedStartTime, val.plannedEndTime, val.plannedEndsNextDay)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["plannedEndTime"], message: PLANNED_END_MESSAGE });
  }
});
export type MoveScheduleVisitInput = z.infer<typeof moveScheduleVisitSchema>;

export const cancelScheduleVisitSchema = z.object({
  cancelReason: z.string().max(500).optional().nullable(),
});
export type CancelScheduleVisitInput = z.infer<typeof cancelScheduleVisitSchema>;

export const createVisitProviderSchema = z
  .object({
    staffId: uuidString.optional().nullable(),
    staffName: z.string().max(200).optional().nullable(),
    role: z.enum(visitProviderRoleValues).default("primary"),
    qualification: z.enum(visitProviderQualificationValues),
    startTime: timeString.optional().nullable(),
    endTime: timeString.optional().nullable(),
    note: z.string().max(1000).optional().nullable(),
    /** 同じ職員の前後 15 分以内に別の予定があるとき、確認のうえ続ける場合だけ true */
    acknowledgeShift: z.boolean().optional(),
  acknowledgeNearby: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.staffId && !(val.staffName && val.staffName.trim().length > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["staffName"],
        message: "提供者は staffId または staffName のいずれかが必要です",
      });
    }
  });
export type CreateVisitProviderInput = z.infer<typeof createVisitProviderSchema>;

export const updateVisitProviderSchema = z
  .object({
    staffId: uuidString.nullable(),
    staffName: z.string().max(200).nullable(),
    role: z.enum(visitProviderRoleValues),
    qualification: z.enum(visitProviderQualificationValues),
    startTime: timeString.nullable(),
    endTime: timeString.nullable(),
    note: z.string().max(1000).nullable(),
    acknowledgeShift: z.boolean(),
    acknowledgeNearby: z.boolean(),
  })
  .partial();
export type UpdateVisitProviderInput = z.infer<typeof updateVisitProviderSchema>;

const defaultProviderSchema = z.object({
  staff_id: uuidString.optional().nullable(),
  role: z.enum(visitProviderRoleValues).optional(),
  qualification: z.enum(visitProviderQualificationValues).optional(),
});

/** 終了時刻が必須のサービス種類（訪問看護 13 / 予防訪問看護 63。予定の時間で算定区分が決まる） */
export const VISIT_PATTERN_END_REQUIRED_SERVICE_TYPES = ["13", "63"] as const;

export type VisitPatternInvariantFields = {
  readonly serviceTypeCode: string;
  readonly startTime: string;
  readonly endTime?: string | null;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string | null;
};

/**
 * 週間パターンの行として成り立つか（作成の入力と、更新の保存済み + 変更の合成の両方に当てる）。
 * 成り立たないときは原因の項目名を返す（`fail("INVALID_INPUT", field)` にそのまま載せる）。
 *
 * - 訪問看護（13 / 63）は終了時刻が必須 → `endTime`
 * - 終了時刻があれば開始より後（同時刻も不可）→ `endTime`。パターンは翌日またぎを表す列を持たず、
 *   展開した予定も翌日またぎにならないので、終了 < 開始はどのサービス種類でも成り立たない
 * - 適用終了日は適用開始日以降 → `effectiveUntil`
 */
export function visitPatternInvariantField(
  row: VisitPatternInvariantFields,
): "endTime" | "effectiveUntil" | null {
  if (!row.endTime && (VISIT_PATTERN_END_REQUIRED_SERVICE_TYPES as readonly string[]).includes(row.serviceTypeCode))
    return "endTime";
  if (row.endTime && timeToSeconds(row.endTime) <= timeToSeconds(row.startTime)) return "endTime";
  if (row.effectiveUntil && row.effectiveUntil < row.effectiveFrom) return "effectiveUntil";
  return null;
}

const VISIT_PATTERN_INVARIANT_MESSAGE = {
  endTime: "終了時刻は開始時刻より後にしてください（訪問看護は終了時刻が必要です）",
  effectiveUntil: "適用終了日は適用開始日以降にしてください",
} as const;

export const createVisitPatternSchema = z
  .object({
    clientId: uuidString,
    facilityId: uuidString,
    serviceCategory: z.enum(visitServiceCategoryValues).default("kaigo_hoken"),
    serviceTypeCode: z.enum(visitServiceTypeCodeValues),
    visitKind: z.enum(visitKindValues),
    weekday: z.number().int().min(1).max(7),
    startTime: timeString,
    endTime: timeString.optional().nullable(),
    plannedMinutes: z.number().int().min(0).max(1440).optional().nullable(),
    monthWeeks: visitMonthWeeksSchema.optional().nullable(),
    planDetailId: uuidString.optional().nullable(),
    defaultProviders: z.array(defaultProviderSchema).max(10).default([]),
    twoPersonBilling: z.boolean().default(false),
    effectiveFrom: dateString,
    effectiveUntil: dateString.optional().nullable(),
    note: z.string().max(1000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (!isValidVisitKind(val.serviceTypeCode, val.visitKind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitKind"],
        message: `visitKind '${val.visitKind}' は serviceTypeCode '${val.serviceTypeCode}' では許容されません`,
      });
    }
    const field = visitPatternInvariantField(val);
    if (field) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: VISIT_PATTERN_INVARIANT_MESSAGE[field] });
    }
  });
export type CreateVisitPatternInput = z.infer<typeof createVisitPatternSchema>;

export const updateVisitPatternSchema = z
  .object({
    serviceCategory: z.enum(visitServiceCategoryValues),
    serviceTypeCode: z.enum(visitServiceTypeCodeValues),
    visitKind: z.enum(visitKindValues),
    weekday: z.number().int().min(1).max(7),
    startTime: timeString,
    endTime: timeString.nullable(),
    plannedMinutes: z.number().int().min(0).max(1440).nullable(),
    monthWeeks: visitMonthWeeksSchema,
    planDetailId: uuidString.nullable(),
    defaultProviders: z.array(defaultProviderSchema).max(10),
    twoPersonBilling: z.boolean(),
    effectiveFrom: dateString,
    effectiveUntil: dateString.nullable(),
    note: z.string().max(1000).nullable(),
  })
  .partial();
export type UpdateVisitPatternInput = z.infer<typeof updateVisitPatternSchema>;

export const generateVisitScheduleSchema = z.object({
  facilityId: uuidString,
  yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "yearMonth は YYYY-MM 形式です"),
  clientIds: z.array(uuidString).max(200).optional(),
});
export const setupVisitPatternsSchema = generateVisitScheduleSchema.pick({ facilityId: true, yearMonth: true }).extend({
  clientId: uuidString,
  effectiveFrom: dateString,
  dryRun: z.boolean().default(false),
  rows: z.array(z.object({
    weekday: z.number().int().min(1).max(7),
    startTime: timeString,
    endTime: timeString,
    serviceTypeCode: z.enum(["13", "63"]).default("13"),
    monthWeeks: visitMonthWeeksSchema.optional().nullable(),
    defaultProviders: z.array(defaultProviderSchema).max(10).default([]),
  })).min(1).max(30),
});
export type SetupVisitPatternsInput = z.input<typeof setupVisitPatternsSchema>;
export type GenerateVisitScheduleInput = z.infer<typeof generateVisitScheduleSchema>;

/** 自分が担当の訪問を引ける期間の上限（日数・両端を含む）。月の格子（42 日）が収まる 2 か月 */
export const MY_VISITS_MAX_DAYS = 62;

export const listMyVisitsSchema = z
  .object({ from: dateString, to: dateString })
  .refine((q) => q.from <= q.to, { path: ["to"] })
  .refine(
    (q) => (Date.parse(`${q.to}T00:00:00Z`) - Date.parse(`${q.from}T00:00:00Z`)) / 86_400_000 < MY_VISITS_MAX_DAYS,
    { path: ["to"] },
  );
export type ListMyVisitsQuery = z.infer<typeof listMyVisitsSchema>;

export const visitIdParam = z.object({ id: uuidString });
export const visitProviderIdParam = z.object({ id: uuidString });
export const visitPatternIdParam = z.object({ id: uuidString });

export const getVisitStaffingSchema = z.object({ facilityId: uuidString, from: dateString, to: dateString })
  .refine(q => q.from <= q.to && (Date.parse(`${q.to}T00:00:00Z`) - Date.parse(`${q.from}T00:00:00Z`)) / 86400000 < 42, { path: ["to"] });
export const assignVisitStaffSchema = z.object({
  visitIds: z.array(uuidString).min(1).max(200), staffId: uuidString.nullable(), remove: z.boolean().optional(),
  role: z.enum(["primary", "second"]), qualification: z.enum(visitProviderQualificationValues),
  expectedProviders: z.record(z.string().uuid(), z.array(z.object({staffId:uuidString.nullable(),role:z.enum(visitProviderRoleValues),qualification:z.enum(visitProviderQualificationValues)})).max(20)).optional(),
  acknowledgeShift: z.boolean().optional(), acknowledgeNearby: z.boolean().optional(), acknowledgeConfirmed: z.boolean().optional(),
});
export const previewVisitGenerationSchema = generateVisitScheduleSchema;
export const listUnrecordedEmergencyVisitsSchema = z.object({ facilityId: uuidString, from: dateString, to: dateString })
  .refine(q => q.from <= q.to && (Date.parse(`${q.to}T00:00:00Z`) - Date.parse(`${q.from}T00:00:00Z`)) / 86400000 < 62, { path: ["to"] });
export type ListUnrecordedEmergencyVisitsInput = z.infer<typeof listUnrecordedEmergencyVisitsSchema>;
/** 入れ忘れの 1 件（担当 1 人 × 訪問 1 件）。時刻は ISO 8601。氏名は返さない（画面が名簿から引く） */
export type UnrecordedEmergencyVisit = { visit_id: string; date: string; staff_id: string; starts_at: string; ends_at: string };
export type GetVisitStaffingInput = z.infer<typeof getVisitStaffingSchema>;
export type AssignVisitStaffInput = z.infer<typeof assignVisitStaffSchema>;
export type PreviewVisitGenerationInput = z.infer<typeof previewVisitGenerationSchema>;
export type StaffingShiftState = "work" | "off" | "no_shift";
export type StaffingCandidateState = "available" | "off" | "outside_hours" | "no_shift" | "nearby" | "overlap";
/** 確認画面に出す、同じ担当職員の別の訪問時間。 */
export type NearbyStaffVisit = {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  endsNextDay: boolean;
};
export type StaffingInterval = { start: number; end: number };
export type StaffingProvider = { id: string; staffId: string | null; staffName: string | null; role: string; qualification: string };
export type StaffingCandidate = { staffId: string; state: StaffingCandidateState; warnings: Exclude<StaffingCandidateState,"available" | "overlap">[]; conflicts: { id: string; clientName: string; serviceDate: string; plannedStartTime: string; plannedEndTime: string | null }[]; startTime: string | null; endTime: string | null };
export type StaffingVisit = { /** 中止の理由（未入力は null）。 */ cancelReason?: string | null; generationReason?: string | null; /** 予定の出どころ（regular=パターン・spot=臨時・substitute=振替・trial=お試し）。札の印に使う */ source?: string; /** 緊急の訪問 */ emergency?: boolean; id: string; clientId: string; clientName: string; serviceDate: string; plannedStartTime: string; plannedEndTime: string | null; plannedEndsNextDay: boolean; status: string; planConfirmed: boolean; updatedAt: string; providers: StaffingProvider[]; attention: { unassigned: boolean; offStaffIds: string[] }; candidates: StaffingCandidate[] };
/** `qualifications` は職員台帳の資格から読み替えた訪問看護の職種（`@qaito/modules/schedule/pure` の `visitQualificationsFromLicenses`）。空 = 未登録 */
export type StaffingStaff = { id: string; name: string; qualifications: ("nurse" | "associate_nurse" | "pt" | "ot" | "st")[]; visitCount: number; minutes: number; days: { date: string; state: StaffingShiftState; startTime: string | null; endTime: string | null; freeIntervals: StaffingInterval[] }[] };
/** clientsは指定事業所への台帳所属で選び、予定0件も含む。visitsはその利用者の看護予定。staffVisitsは閲覧権限内の空き判定用予定で、他利用者も含む。 */
export type VisitStaffingData = { staffVisits?: StaffingVisit[]; visits: StaffingVisit[]; staff: StaffingStaff[]; clients: { id: string; name: string; total: number; unassigned: number; off: number; hospitalized?: boolean }[] };
export type AssignVisitStaffResult = { updatedProviders: Record<string,StaffingProvider[]>; assigned: string[]; skipped: { visitId: string; reason: string }[] };
export type VisitGenerationResult = { generated: number; skipped: number; skippedHospitalized?: number; assigned: number; unassigned: { clientId: string; serviceDate: string; plannedStartTime: string; reason: string }[] };

/** 訪問看護の時間の区分の確認。値は schedule の pure が導出し、保存しない。 */
export type VisitTimeDeviation = {
  visitId: string; serviceDate: string; plannedMinutes: number; actualMinutes: number;
  plannedBracketLabel: string; actualBracketLabel: string;
};
export const listVisitTimeDeviationsSchema = z.object({
  clientId: uuidString, facilityId: uuidString, from: dateString, to: dateString,
}).refine(d => d.from <= d.to, { path: ["to"], message: "終了日は開始日以降にしてください" });
export const acknowledgeVisitTimeDeviationSchema = z.object({ expectedUpdatedAt: z.string().datetime({ offset: true }).optional() }).strict();
export type ListVisitTimeDeviationsInput = z.infer<typeof listVisitTimeDeviationsSchema>;
export type AcknowledgeVisitTimeDeviationInput = z.infer<typeof acknowledgeVisitTimeDeviationSchema>;
