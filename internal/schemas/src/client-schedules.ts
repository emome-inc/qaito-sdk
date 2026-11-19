import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { serviceCategoryValues } from "./shared-options";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "時刻は HH:MM 形式です");

export const scheduleSourceValues = [
  "regular",
  "substitute",
  "spot",
  "trial",
] as const;

export type ScheduleSource = (typeof scheduleSourceValues)[number];

export const scheduleStatusValues = [
  "scheduled",
  "attended",
  "absent",
  "cancelled",
] as const;

export type ScheduleStatus = (typeof scheduleStatusValues)[number];

export const createClientScheduleSchema = z.object({
  clientId:           z.string().uuid("client_id は UUID 形式です"),
  facilityId:         z.string().uuid("facility_id は UUID 形式です"),
  serviceDate:        z.string().date("serviceDate は YYYY-MM-DD 形式です"),

  serviceCategory:    z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode:    z.string().max(2, "serviceTypeCode は 2 文字以内です"),

  startTime:          timeString.optional().nullable(),
  endTime:            timeString.optional().nullable(),

  source:             z.enum(scheduleSourceValues).default("regular"),
  status:             z.enum(scheduleStatusValues).default("scheduled"),

  absenceReason:      z.string().max(500).optional().nullable(),
  absenceContactedAt: z.string().datetime({ offset: true }).optional().nullable(),

  substitutedForDate: z.string().date().optional().nullable(),

  note:               z.string().max(1000).optional().nullable(),
});

export type CreateClientScheduleInput = z.infer<typeof createClientScheduleSchema>;

export const updateClientScheduleSchema = partialForUpdate(
  createClientScheduleSchema.omit({ clientId: true, facilityId: true }),
);

export type UpdateClientScheduleInput = z.infer<typeof updateClientScheduleSchema>;

export const attendanceUpdateSchema = z.object({
  status: z.enum(["attended", "absent"] as const),
  absenceReason:      z.string().max(500).optional().nullable(),
  absenceContactedAt: z.string().datetime({ offset: true }).optional().nullable(),
  absenceCmNotified: z.boolean().optional().nullable(),
});

export const ABSENCE_REASON_OPTIONS = ["自己都合", "体調不良", "通院", "その他"] as const;

export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;

export const bulkAttendanceRowSchema = attendanceUpdateSchema.extend({
  scheduleId: z.string().uuid("scheduleId は UUID 形式です"),
});

export type BulkAttendanceRowInput = z.infer<typeof bulkAttendanceRowSchema>;

export const generateMonthlyScheduleSchema = z.object({
  facilityId:      z.string().uuid("facilityId は UUID 形式です"),
  yearMonth:       z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "yearMonth は YYYY-MM 形式です"),
  clientIds:       z.array(z.string().uuid()).max(200).optional(),
});

export type GenerateMonthlyScheduleInput = z.infer<typeof generateMonthlyScheduleSchema>;

export const scheduleIdParam = z.object({
  id: z.string().uuid("id は UUID 形式です"),
});

export const attendanceRecordSchema = attendanceUpdateSchema.extend({
  note: z.string().max(1000).optional().nullable(),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;

export const scheduleChangeTypeValues = ["rest", "date_change", "add", "time_change"] as const;

export type ScheduleChangeType = (typeof scheduleChangeTypeValues)[number];

/**
 * 変更エントリの作成・更新。
 *
 * 種類ごとの必須条件は superRefine で表す（統合前は Server Action に手書きの if が
 * 並んでおり、api 経路にはそもそも検証が無かった）。
 */
export const upsertScheduleChangeSchema = z
  .object({
    /** 既存行の更新なら id を渡す（省略 = 新規） */
    id:          z.string().uuid().optional().nullable(),
    clientId:    z.string().uuid("client_id は UUID 形式です"),
    facilityId:  z.string().uuid("facility_id は UUID 形式です"),
    changeType:  z.enum(scheduleChangeTypeValues),
    targetDate:  z.string().date("targetDate は YYYY-MM-DD 形式です"),
    movedToDate: z.string().date().optional().nullable(),
    startTime:   timeString.optional().nullable(),
    endTime:     timeString.optional().nullable(),
    reason:      z.string().max(1000).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.changeType === "date_change") {
      if (!v.movedToDate) {
        ctx.addIssue({ code: "custom", path: ["movedToDate"], message: "変更先の日付を入力してください。" });
      } else if (v.movedToDate === v.targetDate) {
        ctx.addIssue({ code: "custom", path: ["movedToDate"], message: "変更先は元の日付と別の日を選んでください。" });
      }
    }
    if (v.changeType === "time_change" && (!v.startTime || !v.endTime)) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "変更後の開始・終了時刻を入力してください。" });
    }
    if (v.startTime && v.endTime && v.startTime >= v.endTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "時間は開始が終了より前になるよう入力してください。" });
    }
  });

export type UpsertScheduleChangeInput = z.infer<typeof upsertScheduleChangeSchema>;

/** 利用曜日（ISO weekday 1..7）。空配列 = 休み（通わない）。 */
const templateDaysSchema = z
  .array(z.number().int().min(1, "曜日は 1〜7 です").max(7, "曜日は 1〜7 です"))
  .max(7, "曜日は 7 つまでです");

export const scheduleTemplateDayTimeSchema = z
  .object({
    day:       z.number().int().min(1, "曜日は 1〜7 です").max(7, "曜日は 1〜7 です"),
    startTime: timeString.nullable(),
    endTime:   timeString.nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.startTime && v.endTime && v.startTime >= v.endTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "時間は開始が終了より前になるよう入力してください。" });
    }
  });
export type ScheduleTemplateDayTime = z.infer<typeof scheduleTemplateDayTimeSchema>;

export const createScheduleTemplateSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  name:       z.string().trim().min(1, "テンプレート名を入力してください").max(60, "テンプレート名は 60 文字までです"),
  /** 元にするテンプレート（中身をまるごと写す）。省略すると空 or 契約の曜日から作る */
  copyFromTemplateId: z.string().uuid("copyFromTemplateId は UUID 形式です").optional().nullable(),
  /** テンプレートが空のとき、利用者の契約の通う曜日を初期値として写すか */
  copyFromServicePlans: z.boolean().optional(),
  copyFromWeekStart: z.string().date("copyFromWeekStart は YYYY-MM-DD 形式です").optional().nullable(),
}).superRefine((v, ctx) => {
  const sources = [Boolean(v.copyFromTemplateId), Boolean(v.copyFromWeekStart), Boolean(v.copyFromServicePlans)];
  if (sources.filter(Boolean).length > 1) {
    ctx.addIssue({ code: "custom", path: ["copyFromWeekStart"], message: "元にするものは 1 つだけ選んでください。" });
  }
});

export type CreateScheduleTemplateInput = z.infer<typeof createScheduleTemplateSchema>;

export const renameScheduleTemplateSchema = z.object({
  templateId: z.string().uuid("templateId は UUID 形式です"),
  name:       z.string().trim().min(1, "テンプレート名を入力してください").max(60, "テンプレート名は 60 文字までです"),
});

export type RenameScheduleTemplateInput = z.infer<typeof renameScheduleTemplateSchema>;

export const saveScheduleTemplateEntriesSchema = z.object({
  templateId: z.string().uuid("templateId は UUID 形式です"),
  /**
   * 変えた利用者だけ渡す（days が null = その利用者を未設定に戻す＝通う曜日を空にする）。
   * times は曜日ごとの時間（渡すとその利用者の時間を丸ごと置き換える。省くと今の時間を残す
   * ＝通わなくなった曜日の時間だけ落とす）。
   */
  entries: z
    .array(
      z.object({
        clientId: z.string().uuid("clientId は UUID 形式です"),
        days: templateDaysSchema.nullable(),
        times: z.array(scheduleTemplateDayTimeSchema).max(7, "時間は 7 曜日までです").optional(),
      }),
    )
    .max(500, "一度に保存できるのは 500 人までです"),
});

export type SaveScheduleTemplateEntriesInput = z.infer<typeof saveScheduleTemplateEntriesSchema>;

export const scheduleTemplateIdSchema = z.object({
  templateId: z.string().uuid("templateId は UUID 形式です"),
});

export const listScheduleTemplatesSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  /**
   * 一覧の先頭にシステムテンプレート「契約の利用曜日」（id = `contract`）を出すか。
   * 既定は出さない（旧の週間予定の画面は型紙の ID を UUID として扱うため）。新しい週間予定の画面は true で呼ぶ
   */
  includeSystem: z.boolean().optional(),
});

export const SYSTEM_SCHEDULE_TEMPLATE_ID = "contract" as const;

/** テンプレートの指定（事業所のテンプレートの UUID か、システムテンプレート `contract`）。 */
export const scheduleTemplateRefSchema = z.union([
  z.literal(SYSTEM_SCHEDULE_TEMPLATE_ID),
  z.string().uuid("templateId は UUID 形式か contract です"),
]);

/**
 * テンプレートの中身を読む。システムテンプレート（`contract`）は事業所ごとに中身が違うので
 * `facilityId` が要る（事業所のテンプレートなら省略してよい）。
 */
export const getScheduleTemplateEntriesSchema = z
  .object({
    templateId: scheduleTemplateRefSchema,
    facilityId: z.string().uuid("facilityId は UUID 形式です").optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.templateId === SYSTEM_SCHEDULE_TEMPLATE_ID && !v.facilityId) {
      ctx.addIssue({ code: "custom", path: ["facilityId"], message: "システムテンプレートは事業所を指定してください。" });
    }
  });

const duplicateScheduleTemplateBase = z.object({
  /** 複製元（事業所のテンプレート or システムテンプレート `contract`） */
  templateId: scheduleTemplateRefSchema,
  name: z.string().trim().min(1, "テンプレート名を入力してください").max(60, "テンプレート名は 60 文字までです"),
  /** 複製先の事業所。システムテンプレートの複製では必須（事業所のテンプレートは複製元の事業所になる） */
  facilityId: z.string().uuid("facilityId は UUID 形式です").optional().nullable(),
});

const refineDuplicateTemplate = (
  v: { templateId?: string; facilityId?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (v.templateId === SYSTEM_SCHEDULE_TEMPLATE_ID && !v.facilityId) {
    ctx.addIssue({ code: "custom", path: ["facilityId"], message: "システムテンプレートの複製は事業所を指定してください。" });
  }
};

/** テンプレートを複製する（システムテンプレートの複製は契約の利用曜日を写した事業所のテンプレートになる）。 */
export const duplicateScheduleTemplateSchema = duplicateScheduleTemplateBase.superRefine(refineDuplicateTemplate);
export type DuplicateScheduleTemplateInput = z.infer<typeof duplicateScheduleTemplateSchema>;

/** REST の body（`POST /schedule/templates/:template_id/duplicate`。複製元はパスで受ける）。 */
export const duplicateScheduleTemplateBodySchema = duplicateScheduleTemplateBase.omit({ templateId: true });

/** 週の状態（画面・API の語彙）。`none` = 未作成。 */
export const scheduleWeekStateValues = ["none", "draft", "confirmed", "editing"] as const;
export type ScheduleWeekState = (typeof scheduleWeekStateValues)[number];

/**
 * 週の作り方（D2）。
 *   blank    … 新しく作る（空の下書き）
 *   template … テンプレートから作成する（`templateId` = 事業所のテンプレート or `contract`）
 *   copy     … 過去から複製する（`copyFromWeekStart` = 確定した週の月曜）
 */
export const scheduleWeekSourceValues = ["blank", "template", "copy"] as const;
export type ScheduleWeekSource = (typeof scheduleWeekSourceValues)[number];

const weekKeyFields = {
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  /** 週の月曜（月曜以外を渡すとその週の月曜へ丸める） */
  weekStart: z.string().date("weekStart は YYYY-MM-DD 形式です"),
};

/** 週を 1 つ指す（読む・確定する・編集する・編集をやめる・下書きを捨てる）。 */
export const scheduleWeekKeySchema = z.object(weekKeyFields);
export type ScheduleWeekKey = z.infer<typeof scheduleWeekKeySchema>;

export const applyScheduleWeekContractBodySchema = z.object({
  clientId: z.string().uuid("clientId は UUID 形式です"),
});
export type ApplyScheduleWeekContractInput = z.infer<typeof applyScheduleWeekContractBodySchema>;

/** 事業所の週の一覧（新しい順）。 */
export const listScheduleWeeksSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
});

const createScheduleWeekDraftFields = {
  source: z.enum(scheduleWeekSourceValues),
  templateId: scheduleTemplateRefSchema.optional().nullable(),
  copyFromWeekStart: z.string().date("copyFromWeekStart は YYYY-MM-DD 形式です").optional().nullable(),
};

const refineCreateScheduleWeekDraft = (
  v: { source: ScheduleWeekSource; templateId?: string | null; copyFromWeekStart?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (v.source === "template" && !v.templateId) {
    ctx.addIssue({ code: "custom", path: ["templateId"], message: "使うテンプレートを選んでください。" });
  }
  if (v.source === "copy" && !v.copyFromWeekStart) {
    ctx.addIssue({ code: "custom", path: ["copyFromWeekStart"], message: "写す週を選んでください。" });
  }
};

/**
 * 週の下書きを作る（未作成のとき）／下書き・編集中の中身を入れ直す（テンプレート・過去の週から）。
 * 入れ直しでは、実績（出席・欠席）が付いたマスは今のまま残す（D6）。
 */
export const createScheduleWeekDraftSchema = z
  .object({ ...weekKeyFields, ...createScheduleWeekDraftFields })
  .superRefine(refineCreateScheduleWeekDraft);
export type CreateScheduleWeekDraftInput = z.infer<typeof createScheduleWeekDraftSchema>;

/** REST の body（`POST /schedule/week-plans/:facility_id/:week_start/draft`。週はパスで受ける）。 */
export const createScheduleWeekDraftBodySchema = z
  .object(createScheduleWeekDraftFields)
  .superRefine(refineCreateScheduleWeekDraft);

/**
 * 下書きのマス 1 つの変更。`attend: true` = その日に来る（足す・時間を変える）、
 * `attend: false` = 来ない（消す）。時間は省くと契約の提供時間（無ければ直近の予定の時間）。
 */
export const scheduleWeekCellEditSchema = z
  .object({
    clientId: z.string().uuid("clientId は UUID 形式です"),
    serviceDate: z.string().date("serviceDate は YYYY-MM-DD 形式です"),
    attend: z.boolean(),
    startTime: timeString.optional().nullable(),
    endTime: timeString.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.startTime && v.endTime && v.startTime >= v.endTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "時間は開始が終了より前になるよう入力してください。" });
    }
  });
export type ScheduleWeekCellEdit = z.infer<typeof scheduleWeekCellEditSchema>;

const updateScheduleWeekDraftFields = {
  /** 変えたマスだけ渡す（同じマスは後勝ち） */
  cells: z.array(scheduleWeekCellEditSchema).min(1, "変えるマスを 1 つ以上渡してください").max(500, "一度に直せるのは 500 マスまでです"),
};

/** 下書き・編集中のマスを直す（足す・消す・時間を変える）。実績の付いたマスは直せない（D6）。 */
export const updateScheduleWeekDraftSchema = z.object({ ...weekKeyFields, ...updateScheduleWeekDraftFields });
export type UpdateScheduleWeekDraftInput = z.infer<typeof updateScheduleWeekDraftSchema>;

/** REST の body（`PATCH /schedule/week-plans/:facility_id/:week_start/draft`）。 */
export const updateScheduleWeekDraftBodySchema = z.object(updateScheduleWeekDraftFields);

/**
 * REST の body（`PATCH /schedule/templates/:template_id` / `PUT /schedule/templates/:template_id/entries`）。
 * 型紙 ID はパスで受けるので body からは外す（ルータがパスの ID を足して上の口の形に戻す）。
 */
export const renameScheduleTemplateBodySchema = renameScheduleTemplateSchema.omit({ templateId: true });
export const saveScheduleTemplateEntriesBodySchema = saveScheduleTemplateEntriesSchema.omit({ templateId: true });

export const setScheduleStatusSchema = z.object({
  status: z.enum(scheduleStatusValues),
});

export const judgeInsuranceForMonthSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month は YYYY-MM 形式です"),
});

export const createSubstituteScheduleSchema = z.object({
  sourceScheduleId: z.string().uuid("sourceScheduleId は UUID 形式です"),
  newServiceDate:   z.string().date("newServiceDate は YYYY-MM-DD 形式です"),
  facilityId:       z.string().uuid("facilityId は UUID 形式です"),
  note:             z.string().max(1000).optional().nullable(),
});

export type CreateSubstituteScheduleInput = z.infer<typeof createSubstituteScheduleSchema>;

export const markDayAttendedSchema = z.object({
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  date:       z.string().date("date は YYYY-MM-DD 形式です"),
});

export type MarkDayAttendedInput = z.infer<typeof markDayAttendedSchema>;

export const registerTrialVisitSchema = z
  .object({
    familyName:     z.string().trim().min(1, "姓は必須です").max(100),
    givenName:      z.string().trim().max(100).optional().nullable(),
    familyNameKana: z.string().trim().max(100).optional().nullable(),
    givenNameKana:  z.string().trim().max(100).optional().nullable(),
    /** YYYY-MM-DD */
    birthDate:      z.string().date().optional().nullable(),
    gender:         z.enum(["male", "female", "other"]).optional().nullable(),
    postalCode:     z.string().trim().max(10).optional().nullable(),
    prefecture:     z.string().trim().max(20).optional().nullable(),
    city:           z.string().trim().max(100).optional().nullable(),
    addressLine:    z.string().trim().max(200).optional().nullable(),
    phone:          z.string().trim().max(20).optional().nullable(),
    /** 担当事業所（体験日の予定もこの事業所に入る） */
    facilityId:     z.string().uuid("facilityId は UUID 形式です"),
    /** 体験日（YYYY-MM-DD） */
    trialDate:      z.string().date("trialDate は YYYY-MM-DD 形式です"),
    startTime:      timeString.optional().nullable(),
    endTime:        timeString.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.startTime && v.endTime && v.startTime >= v.endTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "開始は終了より前にしてください。" });
    }
  });
export type RegisterTrialVisitInput = z.infer<typeof registerTrialVisitSchema>;
