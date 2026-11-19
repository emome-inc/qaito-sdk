import { z } from "zod";
import { serviceCategoryValues } from "./shared-options";
import { partialForUpdate } from "./partial-for-update";
export { serviceCategoryOptions, serviceCategoryValues } from "./shared-options";

/**
 * 曜日（ISO weekday: 1=月〜7=日）
 * service_days カラムは smallint[] で格納
 */
export const weekdayOptions = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 7, label: "日" },
] as const;

export const planCreationKindValues = ["1", "2", "3"] as const;
export const planCreationKindOptions = [
  { value: "1", label: "居宅介護支援事業所作成" },
  { value: "2", label: "自己作成" },
  { value: "3", label: "介護予防支援（受託）" },
] as const;

/**
 * 同一建物減算の区分（訪問看護 13/63。契約の同一建物居住 same_building_residence がチェックされているときだけ選ぶ）。
 * 区分と減算率の対応はここ 1 か所（請求の engine と画面が同じものを読む）。
 *   - rate10: 事業所と同一敷地内・隣接敷地内の建物・同一建物の居住者、または同一建物に 1 月あたり 20 人以上 → 所定単位数の 90/100（-10%）
 *   - rate15: 同一敷地内建物等のうち、利用者が 1 月あたり 50 人以上居住する建物の居住者 → 85/100（-15%）
 *   - none: 同一建物だが減算の対象にならない（敷地外で 20 人未満など）
 * 根拠: 平12厚告19 別表 訪問看護費 注8・平12老企36 第二の4（（介護予防）平18厚労告127 別表 注7・平18老計発0317001 第二の3(11)）。
 * 人数は 1 月の利用者数の日ごとの平均（小数点以下切り捨て）。どれに当たるかは人が選ぶ（数えない）。
 */
export const sameBuildingClassValues = ["none", "rate10", "rate15"] as const;
export type SameBuildingClass = (typeof sameBuildingClassValues)[number];

/** 減算率（千分率）。none は 0。マスタの率の行（4111 = 100 / 4112 = 150）と同じ値 */
export const SAME_BUILDING_CLASS_PERMILLE: Readonly<Record<SameBuildingClass, number>> = { none: 0, rate10: 100, rate15: 150 };

const SAME_BUILDING_READING_SERVICE_TYPES: ReadonlySet<string> = new Set(["15", "78", "A5", "A6", "16", "66", "43", "46", "13", "63"]);
const SAME_BUILDING_NOT_READING_SERVICE_TYPES: ReadonlySet<string> = new Set(["11", "A2", "14", "64", "17", "67"]);

export function contractReadsSameBuilding(serviceTypeCode: string | null | undefined): boolean {
  if (!serviceTypeCode) return true;
  if (SAME_BUILDING_READING_SERVICE_TYPES.has(serviceTypeCode)) return true;
  return !SAME_BUILDING_NOT_READING_SERVICE_TYPES.has(serviceTypeCode);
}

export const createClientServicePlanSchema = z.object({
  facility_id: z.string().uuid().optional().nullable(),

  contract_date: z.string().date().optional().nullable(),
  valid_from: z.string().date().optional().nullable(),
  valid_until: z.string().date().optional().nullable(),

  service_category: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  service_type_code: z
    .string()
    .max(2, "サービス種別コードは 2 文字以内です")
    .optional()
    .nullable(),

  plan_creation_kind: z.enum(planCreationKindValues).optional().nullable(),

  service_days: z.array(z.number().int().min(1).max(7)).optional().nullable(),
  unit_price: z.number().int().min(0).optional().nullable(),

  has_takeout_bento: z.boolean().default(false),
  uses_mobile_supermarket: z.boolean().default(false),
  mobile_supermarket_note: z.string().optional(),

  nutrition_assessment: z.boolean().default(false),
  oral_care_link: z.boolean().default(false),
  life_function_link: z.boolean().default(false),

  dayservice_plan_date: z.string().date().optional().nullable(),
  rehab_plan_date: z.string().date().optional().nullable(),
  notes: z.string().optional(),
});

export const updateClientServicePlanSchema = partialForUpdate(createClientServicePlanSchema);

export const clientServicePlanIdParam = z.object({
  client_id: z.string().uuid(),
  plan_id: z.string().uuid(),
});

/** 提供時間の形（`"HH:MM"` / `"HH:MM:SS"`）。 */
const SERVICE_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const SERVICE_SCHEDULE_REQUIRED_FIELDS = [
  { key: "start_time", label: "提供時間（開始）" },
  { key: "end_time", label: "提供時間（終了）" },
] as const;

/**
 * 利用曜日・提供時間の組の検査（Zod と core が同じ規則を使う）。
 * 利用曜日が 1 つ以上なら開始・終了の両方が要り、開始 < 終了。曜日が空（休み）なら時間は任意で、
 * 入っているなら開始 < 終了。戻り値は足りない・おかしい項目のキー（無ければ空）。
 */
export function serviceScheduleIssues(
  days: readonly number[],
  start: string | null | undefined,
  end: string | null | undefined,
): { missing: ("start_time" | "end_time")[]; badRange: boolean } {
  const s = start && start.trim() ? start.trim() : null;
  const e = end && end.trim() ? end.trim() : null;
  const missing: ("start_time" | "end_time")[] = [];
  if (days.length > 0) {
    if (!s) missing.push("start_time");
    if (!e) missing.push("end_time");
  }
  const pad = (t: string) => (t.length === 5 ? `${t}:00` : t);
  const badRange = Boolean(s && e && pad(s) >= pad(e));
  return { missing, badRange };
}

/**
 * 未入力の提供時間の**項目名**（利用曜日が空なら常に空）。画面とサーバの Server Action が
 * 同じ一覧で `MESSAGES.validation.requiredMissing` を組む。
 */
export function missingServiceScheduleFields(
  days: readonly number[],
  start: string | null | undefined,
  end: string | null | undefined,
): string[] {
  const { missing } = serviceScheduleIssues(days, start, end);
  return SERVICE_SCHEDULE_REQUIRED_FIELDS.filter((f) => missing.includes(f.key)).map((f) => f.label);
}

/** 曜日ごとの提供時間のキー（ISO 曜日の文字列。JSON のキーになるので文字列）。 */
const WEEKDAY_KEYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

export const serviceDayTimesSchema = z.partialRecord(
  z.enum(WEEKDAY_KEYS),
  z.object({ start: z.string().regex(SERVICE_TIME_RE), end: z.string().regex(SERVICE_TIME_RE) }),
);
export type ServiceDayTimes = z.infer<typeof serviceDayTimesSchema>;

/** 曜日ごとの時間で開始 < 終了になっていない曜日（ISO 曜日）。 */
export function serviceDayTimesBadRange(dayTimes: ServiceDayTimes | null | undefined): number[] {
  const pad = (t: string) => (t.length === 5 ? `${t}:00` : t);
  return Object.entries(dayTimes ?? {})
    .filter(([, t]) => t && pad(t.start) >= pad(t.end))
    .map(([k]) => Number(k));
}

/**
 * 曜日ごとの時間を、利用曜日に入っている曜日・共通の時間と違うものだけに絞る（保存の前に画面とサーバが同じ形にそろえる）。
 * 何も残らなければ null（= 全曜日が共通の時間）。
 */
export function normalizeServiceDayTimes(
  days: readonly number[],
  dayTimes: ServiceDayTimes | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
): ServiceDayTimes | null {
  const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
  const out: ServiceDayTimes = {};
  for (const [k, t] of Object.entries(dayTimes ?? {})) {
    if (!t || !days.includes(Number(k))) continue;
    if (hm(t.start) === hm(start) && hm(t.end) === hm(end)) continue;
    out[k as (typeof WEEKDAY_KEYS)[number]] = { start: hm(t.start)!, end: hm(t.end)! };
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** その曜日（ISO 1〜7）の提供時間。曜日ごとの時間があればそれ、無ければ共通の時間。 */
export function serviceTimeOnWeekday(
  weekday: number,
  start: string | null,
  end: string | null,
  dayTimes: ServiceDayTimes | null | undefined,
): { startTime: string | null; endTime: string | null } {
  const t = dayTimes?.[String(weekday) as (typeof WEEKDAY_KEYS)[number]];
  return t ? { startTime: t.start, endTime: t.end } : { startTime: start, endTime: end };
}

export const setClientServiceScheduleSchema = z
  .object({
    days: z.array(z.number().int().min(1).max(7)).max(7),
    start_time: z.string().regex(SERVICE_TIME_RE).nullable().optional(),
    end_time: z.string().regex(SERVICE_TIME_RE).nullable().optional(),
    facility_id: z.string().uuid().nullable().optional(),
    day_times: serviceDayTimesSchema.nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (serviceDayTimesBadRange(v.day_times).length > 0) {
      ctx.addIssue({ code: "custom", path: ["day_times"], message: "曜日ごとの提供時間は開始が終了より前です" });
    }
    const { missing, badRange } = serviceScheduleIssues(v.days, v.start_time, v.end_time);
    for (const key of missing) {
      ctx.addIssue({ code: "custom", path: [key], message: "利用曜日を入れたときは提供時間が必要です" });
    }
    if (badRange) {
      ctx.addIssue({ code: "custom", path: ["end_time"], message: "提供時間は開始が終了より前です" });
    }
  });
export type SetClientServiceScheduleInput = z.infer<typeof setClientServiceScheduleSchema>;

/** GET /client/service-days クエリ（`facility_id` は画面の絞り込みで、認可の境界ではない）。 */
export const serviceDaysQuerySchema = z.object({
  facility_id: z.string().uuid().optional(),
});
