
import type {
  AcknowledgeVisitTimeDeviationInput,
  AssignVisitStaffInput,
  AssignVisitStaffResult,
  CancelScheduleVisitInput,
  ClientSchedule,
  ClientVisitInsurance,
  ConfirmIryoVisitMonthInput,
  ContractWeekApplyResult,
  CreateScheduleTemplateInput,
  CreateScheduleVisitInput,
  CreateScheduleWeekDraftInput,
  CreateSubstituteScheduleInput,
  CreateVisitPatternInput,
  CreateVisitProviderInput,
  DuplicateScheduleTemplateInput,
  GenerateVisitScheduleInput,
  GetClientVisitInsuranceParams,
  GetVisitStaffingInput,
  InsuranceJudgeSummary,
  IryoVisitConfirmation,
  JudgeInsuranceInput,
  ListIryoVisitConfirmationsParams,
  ListMyScheduleVisitsQuery,
  ListScheduleChangesQuery,
  ListScheduleVisitsQuery,
  ListSchedulesInRangeQuery,
  ListUnrecordedEmergencyVisitsInput,
  ListVisitPatternsQuery,
  ListVisitTimeDeviationsInput,
  MoveScheduleVisitInput,
  MyScheduleVisit,
  ProvideScheduleVisitInput,
  RegisterTrialVisitInput,
  RegisteredTrialVisit,
  RemovedScheduleChange,
  SaveScheduleTemplateEntriesInput,
  SavedScheduleChange,
  ScheduleChange,
  ScheduleTemplate,
  ScheduleTemplateEntry,
  ScheduleVisit,
  ScheduleVisitPattern,
  ScheduleVisitProvider,
  ScheduleWeekApplyResult,
  ScheduleWeekDraftResult,
  ScheduleWeekPlan,
  ScheduleWeekPlanStatus,
  ScheduleWeekPlanSummary,
  ScheduleWithClient,
  SetVisitInsuranceOverrideInput,
  SetupVisitPatternsInput,
  UnrecordedEmergencyVisit,
  UpdateScheduleVisitInput,
  UpdateScheduleWeekDraftInput,
  UpdateVisitPatternInput,
  UpdateVisitProviderInput,
  UpsertScheduleChangeInput,
  VisitGenerationResult,
  VisitInsuranceOverrideResult,
  VisitStaffingData,
  VisitTimeDeviation,
  WeekPublishState,
  WeekQuery,
  WeeklyScheduleMember,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createScheduleNamespace(tx: SdkTransport) {
  return {
    staffing: {
      /** 訪問と職員の空き・要対応を最大42日分まとめて取得 */
      get: (params: GetVisitStaffingInput) =>
        tx.request<VisitStaffingData>("GET", `/schedule/visit-staffing${buildQueryString(params)}`),
      /** 緊急訪問のうち、担当の職員のシフトの実績に入っていないもの（最大62日分。シフトには書かない） */
      unrecordedEmergencyVisits: (params: ListUnrecordedEmergencyVisitsInput) =>
        tx.request<UnrecordedEmergencyVisit[]>("GET", `/schedule/unrecorded-emergency-visits${buildQueryString({ facility_id: params.facilityId, from: params.from, to: params.to })}`),
    },
    visits: {
      /** 訪問の担当を一括設定。勤務・前後15分・確定済みの警告を確認してから再送する */
      assignStaff: (input: AssignVisitStaffInput) =>
        tx.request<AssignVisitStaffResult>("POST", "/schedule/visits/assign-staff", input as unknown as Record<string, unknown>),
      /** GET /schedule/visits — 訪問一覧（snake_case クエリ） */
      list: (params?: ListScheduleVisitsQuery) =>
        tx.request<ScheduleVisit[]>("GET", `/schedule/visits${buildQueryString(params)}`),
      /** GET /schedule/visits/mine — 自分が担当の訪問（期間 62 日まで・取り消しは除く。staff:read も要る。利用者の氏名・ID は無い） */
      listMine: (params: ListMyScheduleVisitsQuery) =>
        tx.request<MyScheduleVisit[]>("GET", `/schedule/visits/mine${buildQueryString(params)}`),
      listTimeDeviations: (params: ListVisitTimeDeviationsInput) =>
        tx.request<VisitTimeDeviation[]>("GET", `/schedule/visits/time-deviations${buildQueryString(params)}`),
      acknowledgeTimeDeviation: (id: string, input: AcknowledgeVisitTimeDeviationInput) =>
        tx.request<{ acknowledged: true }>("PATCH", `/schedule/visits/${pathParam(id, "id")}/acknowledge-time-deviation`, input as unknown as Record<string, unknown>),
      /** GET /schedule/visits/:id */
      get: (id: string) => tx.request<ScheduleVisit>("GET", `/schedule/visits/${pathParam(id, "id")}`),
      /** POST /schedule/visits */
      create: (input: CreateScheduleVisitInput) =>
        tx.request<ScheduleVisit>("POST", "/schedule/visits", input as unknown as Record<string, unknown>),
      /** PATCH /schedule/visits/:id */
      update: (id: string, input: UpdateScheduleVisitInput) =>
        tx.request<ScheduleVisit>("PATCH", `/schedule/visits/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** PATCH /schedule/visits/:id/provide — 実績確定（scheduled → provided） */
      provide: (id: string, input: ProvideScheduleVisitInput) =>
        tx.request<ScheduleVisit>("PATCH", `/schedule/visits/${pathParam(id, "id")}/provide`, input as unknown as Record<string, unknown>),
      /** PATCH /schedule/visits/:id/cancel — キャンセル */
      cancel: (id: string, input?: CancelScheduleVisitInput) =>
        tx.request<ScheduleVisit>("PATCH", `/schedule/visits/${pathParam(id, "id")}/cancel`, (input ?? {}) as unknown as Record<string, unknown>),
      /** PATCH /schedule/visits/:id/restore — 中止の取り消し（cancelled → scheduled） */
      restore: (id: string) =>
        tx.request<ScheduleVisit>("PATCH", `/schedule/visits/${pathParam(id, "id")}/restore`),
      /** DELETE /schedule/visits/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/schedule/visits/${pathParam(id, "id")}`),
      /** GET /schedule/visits/:id/providers — 提供者一覧 */
      listProviders: (id: string) =>
        tx.request<ScheduleVisitProvider[]>("GET", `/schedule/visits/${pathParam(id, "id")}/providers`),
      /** POST /schedule/visits/:id/providers — 提供者を追加 */
      addProvider: (id: string, input: CreateVisitProviderInput) =>
        tx.request<ScheduleVisitProvider>("POST", `/schedule/visits/${pathParam(id, "id")}/providers`, input as unknown as Record<string, unknown>),
      move: (id: string, input: MoveScheduleVisitInput) =>
        tx.request<ScheduleVisit>("PATCH", `/schedule/visits/${pathParam(id, "id")}/move`, input as unknown as Record<string, unknown>),
    },
    visitPatterns: {
      /** 訪問パターンから作る前に、担当が入る件数と担当未定の理由を確認 */
      previewGeneration: (params: GenerateVisitScheduleInput) =>
        tx.request<VisitGenerationResult>("GET", `/schedule/visit-patterns/generate-preview${buildQueryString(params)}`),
      /** GET /schedule/visit-patterns — 週間パターン一覧（snake_case クエリ） */
      list: (params?: ListVisitPatternsQuery) =>
        tx.request<ScheduleVisitPattern[]>("GET", `/schedule/visit-patterns${buildQueryString(params)}`),
      /** GET /schedule/visit-patterns/:id */
      get: (id: string) =>
        tx.request<ScheduleVisitPattern>("GET", `/schedule/visit-patterns/${pathParam(id, "id")}`),
      /** POST /schedule/visit-patterns */
      create: (input: CreateVisitPatternInput) =>
        tx.request<ScheduleVisitPattern>("POST", "/schedule/visit-patterns", input as unknown as Record<string, unknown>),
      /** PATCH /schedule/visit-patterns/:id */
      update: (id: string, input: UpdateVisitPatternInput) =>
        tx.request<ScheduleVisitPattern>("PATCH", `/schedule/visit-patterns/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /schedule/visit-patterns/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/schedule/visit-patterns/${pathParam(id, "id")}`),
      setup: (input: SetupVisitPatternsInput) =>
        tx.request<VisitGenerationResult>("POST", "/schedule/visit-patterns/setup", input as unknown as Record<string, unknown>),
      /** POST /schedule/visit-patterns/generate — 有効パターンから当月分を展開 */
      generate: (input: GenerateVisitScheduleInput) =>
        tx.request<VisitGenerationResult>("POST", "/schedule/visit-patterns/generate", input as unknown as Record<string, unknown>),
    },
    changes: {
      /** GET /schedule/changes — 予定の変更を事業所と月で一覧（休み / 日付変更 / 追加 / 時間変更） */
      list: (params: ListScheduleChangesQuery) =>
        tx.request<ScheduleChange[]>("GET", `/schedule/changes${buildQueryString(params)}`),
      /** POST /schedule/changes — 予定の変更を登録（id があれば更新）。作成済みの週なら予定表にも反映する */
      upsert: (input: UpsertScheduleChangeInput) =>
        tx.request<SavedScheduleChange>("POST", "/schedule/changes", input as unknown as Record<string, unknown>),
      /** DELETE /schedule/changes/:id — 予定の変更を取り消す（論理削除）。作成済みの週なら予定表にも反映する */
      delete: (id: string) =>
        tx.request<RemovedScheduleChange>("DELETE", `/schedule/changes/${pathParam(id, "id")}`),
    },
    trials: {
      /** POST /schedule/trials — お試し登録（利用者を作って体験日を予定に入れる） */
      register: (input: RegisterTrialVisitInput) =>
        tx.request<RegisteredTrialVisit>("POST", "/schedule/trials", input as unknown as Record<string, unknown>),
    },
    weeks: {
      /** GET /schedule/weeks/state — 週（事業所 × 週頭）の予定の行の人数・作成日時・最終変更（印刷の版を見分ける） */
      state: (params: WeekQuery) =>
        tx.request<WeekPublishState>("GET", `/schedule/weeks/state${buildQueryString(params)}`),
      /** GET /schedule/weeks/members — 週の予定行（regular + spot） */
      members: (params: WeekQuery) =>
        tx.request<WeeklyScheduleMember[]>("GET", `/schedule/weeks/members${buildQueryString(params)}`),
    },
    weekPlans: {
      /** GET /schedule/week-plans — 事業所の週の一覧（下書き / 確定 / 編集中・新しい順） */
      list: (facilityId: string) =>
        tx.request<ScheduleWeekPlanSummary[]>("GET", `/schedule/week-plans${buildQueryString({ facility_id: facilityId })}`),
      get: (facilityId: string, weekStart: string) =>
        tx.request<ScheduleWeekPlan>("GET", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}`),
      /** GET /schedule/week-plans/:facility_id/:week_start/status — その日を含む週の状態だけ（日々の画面に出ているか） */
      status: (facilityId: string, date: string) =>
        tx.request<ScheduleWeekPlanStatus>("GET", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(date, "date")}/status`),
      /** POST /schedule/week-plans/:facility_id/:week_start/draft — 下書きを作る・入れ直す（新しく作る / テンプレートから / 過去から複製） */
      createDraft: (facilityId: string, weekStart: string, input: CreateScheduleWeekDraftInput) =>
        tx.request<ScheduleWeekDraftResult>("POST", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/draft`, input),
      /** PATCH /schedule/week-plans/:facility_id/:week_start/draft — 下書き・編集中のマスを直す（出欠を付けたマスは直せない） */
      updateDraft: (facilityId: string, weekStart: string, input: UpdateScheduleWeekDraftInput) =>
        tx.request<{ weekStart: string; updated: number }>("PATCH", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/draft`, input),
      /** DELETE /schedule/week-plans/:facility_id/:week_start/draft — 下書きを捨てる（一度も確定していない週だけ） */
      discardDraft: (facilityId: string, weekStart: string) =>
        tx.request<{ weekStart: string; state: "none" }>("DELETE", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/draft`),
      /** POST /schedule/week-plans/:facility_id/:week_start/confirm — 確定する（差分だけを予定に当てる） */
      confirm: (facilityId: string, weekStart: string) =>
        tx.request<ScheduleWeekApplyResult>("POST", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/confirm`),
      /** POST /schedule/week-plans/:facility_id/:week_start/apply-contract — 契約の利用日をこの週の今日以降に当てる（確定のあとに契約を足した人を足す） */
      applyContract: (facilityId: string, weekStart: string, input: { clientId: string }) =>
        tx.request<ContractWeekApplyResult>("POST", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/apply-contract`, input),
      /** POST /schedule/week-plans/:facility_id/:week_start/edit — 編集する（確定 → 編集中） */
      edit: (facilityId: string, weekStart: string) =>
        tx.request<{ weekStart: string; state: "editing"; cells: number }>("POST", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/edit`),
      /** POST /schedule/week-plans/:facility_id/:week_start/cancel-edit — 編集をやめる（確定したときに戻る） */
      cancelEdit: (facilityId: string, weekStart: string) =>
        tx.request<{ weekStart: string; state: "confirmed" }>("POST", `/schedule/week-plans/${pathParam(facilityId, "facilityId")}/${pathParam(weekStart, "weekStart")}/cancel-edit`),
    },
    templates: {
      /** GET /schedule/templates — 事業所の型紙の一覧（既定 → 名前順。includeSystem で先頭にシステムテンプレート「契約の利用曜日」） */
      list: (facilityId: string, includeSystem?: boolean) =>
        tx.request<ScheduleTemplate[]>("GET", `/schedule/templates${buildQueryString({ facility_id: facilityId, include_system: includeSystem ? "true" : undefined })}`),
      /** GET /schedule/templates/:template_id/entries — 型紙の中身（利用者 → 通う曜日。contract は facilityId が要る） */
      entries: (templateId: string, facilityId?: string) =>
        tx.request<ScheduleTemplateEntry[]>("GET", `/schedule/templates/${pathParam(templateId, "templateId")}/entries${buildQueryString({ facility_id: facilityId })}`),
      /** POST /schedule/templates/:template_id/duplicate — 型紙を複製する（contract の複製は facilityId 必須） */
      duplicate: (templateId: string, input: DuplicateScheduleTemplateInput) =>
        tx.request<{ id: string }>("POST", `/schedule/templates/${pathParam(templateId, "templateId")}/duplicate`, input),
      /** POST /schedule/templates — 型紙を作る（ほかの型紙・契約の通う曜日から中身を写せる） */
      create: (input: CreateScheduleTemplateInput) =>
        tx.request<{ id: string }>("POST", "/schedule/templates", input),
      /** PUT /schedule/templates/:template_id/entries — 型紙の中身を保存（変えた利用者だけ） */
      saveEntries: (templateId: string, input: SaveScheduleTemplateEntriesInput) =>
        tx.request<{ saved: number }>("PUT", `/schedule/templates/${pathParam(templateId, "templateId")}/entries`, input),
      /** PATCH /schedule/templates/:template_id — 型紙の名前を変える */
      rename: (templateId: string, name: string) =>
        tx.request<{ id: string }>("PATCH", `/schedule/templates/${pathParam(templateId, "templateId")}`, { name }),
      /** DELETE /schedule/templates/:template_id — 型紙を消す（論理削除。作成済みの予定表には影響しない） */
      delete: (templateId: string) =>
        tx.request<{ id: string }>("DELETE", `/schedule/templates/${pathParam(templateId, "templateId")}`),
    },
    schedules: {
      /** GET /schedule/schedules/range — 期間の予定（利用者名つき・最大 62 日） */
      range: (params: ListSchedulesInRangeQuery) =>
        tx.request<ScheduleWithClient[]>("GET", `/schedule/schedules/range${buildQueryString(params)}`),
      /** PATCH /schedule/schedules/:id/status — 予定の状態だけを変える（欠席理由を付けるなら client.schedules.updateAttendance） */
      setStatus: (id: string, status: "scheduled" | "attended" | "absent" | "cancelled") =>
        tx.request<ClientSchedule>("PATCH", `/schedule/schedules/${pathParam(id, "id")}/status`, { status }),
    },
    substitutes: {
      /** POST /schedule/substitutes — 振替（元の予定を欠席にして別日に作る・振替先に予定があれば 409） */
      create: (input: CreateSubstituteScheduleInput) =>
        tx.request<{ id: string }>("POST", "/schedule/substitutes", input),
    },
    insurance: {
      /** POST /schedule/insurance-judge — 事業所・月の訪問看護を介護 / 医療で判定して書き戻す（応答は件数だけ） */
      judge: (input: JudgeInsuranceInput) =>
        tx.request<InsuranceJudgeSummary>("POST", "/schedule/insurance-judge", input),
    },
    forms: {
      /** GET /schedule/forms/status-sheet — 利用者状況表（xlsx・週単位）。利用者台帳を読む権限も要る */
      statusSheet: (params: WeekQuery): Promise<Blob> =>
        tx.requestBlob("GET", `/schedule/forms/status-sheet${buildQueryString(params)}`),
    },
    visitProviders: {
      /** PATCH /schedule/visit-providers/:id */
      update: (id: string, input: UpdateVisitProviderInput) =>
        tx.request<ScheduleVisitProvider>("PATCH", `/schedule/visit-providers/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /schedule/visit-providers/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/schedule/visit-providers/${pathParam(id, "id")}`),
    },
    visitInsurance: {
      /** GET /schedule/clients/:clientId/visit-insurance — 訪問看護の月の保険（区間・訪問ごとの自動 / 手の直し / 効く値）。根拠は臨床情報を読める人にだけ返る */
      get: (clientId: string, params: GetClientVisitInsuranceParams) =>
        tx.request<ClientVisitInsurance>("GET", `/schedule/clients/${pathParam(clientId, "clientId")}/visit-insurance${buildQueryString(params)}`),
      /** PUT /schedule/visits/:id/insurance-override — 訪問の保険を手で直す（理由必須・insurance=null で自動に戻す）。医療を確定した月は 409 */
      setOverride: (visitId: string, input: SetVisitInsuranceOverrideInput) =>
        tx.request<VisitInsuranceOverrideResult>("PUT", `/schedule/visits/${pathParam(visitId, "visitId")}/insurance-override`, input as unknown as Record<string, unknown>),
    },
    iryoConfirmations: {
      /** GET /schedule/iryo-confirmations — 事業所・月の医療の確定の一覧 */
      list: (params: ListIryoVisitConfirmationsParams) =>
        tx.request<IryoVisitConfirmation[]>("GET", `/schedule/iryo-confirmations${buildQueryString(params)}`),
      /** POST /schedule/iryo-confirmations — 利用者の月の医療の実績を確定する（記録書Ⅱ未提出の実施済みの訪問があれば 409・件数つき） */
      confirm: (input: ConfirmIryoVisitMonthInput) =>
        tx.request<IryoVisitConfirmation>("POST", "/schedule/iryo-confirmations", input as unknown as Record<string, unknown>),
      /** DELETE /schedule/iryo-confirmations/:id — 医療の確定を取り消す（schedule:delete） */
      unconfirm: (id: string) =>
        tx.request<null>("DELETE", `/schedule/iryo-confirmations/${pathParam(id, "id")}`),
    },
  };
}
