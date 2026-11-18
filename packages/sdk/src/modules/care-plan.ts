
import type {
  CarePlanClientServicePlanList,
  CarePlanMaterials,
  CarePlanNewPlanMaterials,
  CarePlanOverview,
  Careplan,
  CareplanAiResult,
  CareplanConference,
  CareplanDetail,
  CareplanNeed,
  CareplanOcrAnalyzeInput,
  CareplanProgressNote,
  CareplanSchedule,
  CreateCareplanConferenceInput,
  CreateCareplanInput,
  CreateCareplanNeedInput,
  CreateCareplanProgressNoteInput,
  CreateCareplanScheduleInput,
  CreateClientCarePlanInput,
  CreateDayservicePlanInput,
  CreateEquipmentPlanInput,
  CreateHomecarePlanInput,
  CreateNursingIntakeInput,
  CreateNursingPlanInput,
  CreateNursingReportFromSourcesInput,
  CreateNursingReportInput,
  CreateRehabAssessmentInput,
  CreateRehabConferenceInput,
  CreateRehabDoctorInstructionInput,
  CreateRehabPlanInput,
  CreateTrainingPlanDetailInput,
  CreatedClientCarePlan,
  DayservicePlanDraft,
  DayservicePlanWithDetails,
  DraftNursingIntakeInput,
  EquipmentPlan,
  GenerateCareplanDraftInput,
  HomecarePlan,
  HomecarePlanStatus,
  KyotakuClientPlanList,
  KyotakuOriginDocumentLink,
  ListEquipmentQuery,
  ListHomecarePlansQuery,
  ListNursingPlansQuery,
  ListNursingReportStatusesQuery,
  ListRehabPlansQuery,
  ListTrainingPlanDetailsQuery,
  MarkNursingReportSentInput,
  NursingIntakeDraftResult,
  NursingIntakeRecord,
  NursingPlan,
  NursingPlanVisitStaffTypes,
  NursingPlanVisitStaffTypesQuery,
  NursingReport,
  NursingReportRevision,
  NursingReportStatusRow,
  NursingReportWithAiStatus,
  ReceiveExternalKyotakuPlanInput,
  RehabAssessment,
  RehabConference,
  RehabDoctorInstruction,
  RehabPlan,
  ReplaceCarePlanMaterialsInput,
  ReplaceEquipmentPlanItemsInput,
  ReplaceHomecarePatternsInput,
  TrainingPlanDetail,
  TrainingPlanDetailCreateInput,
  TrainingPlanDetailRecord,
  TrainingPlanDetailUpdateInput,
  TrainingPlanDraft,
  UpdateCareplanConferenceInput,
  UpdateCareplanInput,
  UpdateCareplanNeedInput,
  UpdateCareplanProgressNoteInput,
  UpdateCareplanScheduleInput,
  UpdateCareplanStatusInput,
  UpdateDayservicePlanInput,
  UpdateDayservicePlanStatusInput,
  UpdateEquipmentPlanInput,
  UpdateHomecarePlanInput,
  UpdateNursingIntakeInput,
  UpdateNursingPlanInput,
  UpdateNursingReportInput,
  UpdateRehabAssessmentInput,
  UpdateRehabConferenceInput,
  UpdateRehabDoctorInstructionInput,
  UpdateRehabPlanInput,
  UpdateTrainingPlanDetailInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString, toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createCareplanNamespace(tx: SdkTransport) {
  return {
    plans: {
      list: (params?: { client_id?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.client_id) qs.set("client_id", params.client_id);
        if (params?.status) qs.set("status", params.status);
        const q = qs.toString();
        return tx.request<Careplan[]>("GET", `/care-plan/plans${q ? `?${q}` : ""}`);
      },
      get: (id: string) => tx.request<CareplanDetail>("GET", `/care-plan/plans/${pathParam(id, "id")}`),
      create: (input: CreateCareplanInput) => tx.request<CareplanDetail>("POST", "/care-plan/plans", input),
      update: (id: string, input: UpdateCareplanInput) =>
        tx.request<CareplanDetail>("PATCH", `/care-plan/plans/${pathParam(id, "id")}`, input),
      updateStatus: (id: string, input: UpdateCareplanStatusInput) =>
        tx.request<Careplan>("PATCH", `/care-plan/plans/${pathParam(id, "id")}/status`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/care-plan/plans/${pathParam(id, "id")}`),
      needs: {
        list: (id: string) =>
          tx.request<CareplanNeed[]>("GET", `/care-plan/plans/${pathParam(id, "id")}/needs`),
        /** POST /care-plan/plans/:id/needs — 第2表に 1 行足す（下書きの計画だけ。sortOrder を省けば末尾） */
        create: (id: string, input: CreateCareplanNeedInput) =>
          tx.request<CareplanNeed>("POST", `/care-plan/plans/${pathParam(id, "id")}/needs`, input),
        /** PATCH /care-plan/plans/:id/needs/:needId — 第2表の 1 行を直す（渡したキーだけ・空文字で消す） */
        update: (id: string, needId: string, input: UpdateCareplanNeedInput) =>
          tx.request<CareplanNeed>("PATCH", `/care-plan/plans/${pathParam(id, "id")}/needs/${pathParam(needId, "needId")}`, input),
        /** DELETE /care-plan/plans/:id/needs/:needId — 第2表の 1 行を消す（下書きの計画だけ） */
        delete: (id: string, needId: string) =>
          tx.request<null>("DELETE", `/care-plan/plans/${pathParam(id, "id")}/needs/${pathParam(needId, "needId")}`),
      },
      schedules: {
        list: (id: string) =>
          tx.request<CareplanSchedule[]>("GET", `/care-plan/plans/${pathParam(id, "id")}/schedules`),
        /** POST /care-plan/plans/:id/schedules — 第3表に 1 行足す（下書きの計画だけ） */
        create: (id: string, input: CreateCareplanScheduleInput) =>
          tx.request<CareplanSchedule>("POST", `/care-plan/plans/${pathParam(id, "id")}/schedules`, input),
        /** PATCH /care-plan/plans/:id/schedules/:scheduleId — 第3表の 1 行を直す（渡したキーだけ・空文字で消す） */
        update: (id: string, scheduleId: string, input: UpdateCareplanScheduleInput) =>
          tx.request<CareplanSchedule>("PATCH", `/care-plan/plans/${pathParam(id, "id")}/schedules/${pathParam(scheduleId, "scheduleId")}`, input),
        /** DELETE /care-plan/plans/:id/schedules/:scheduleId — 第3表の 1 行を消す（下書きの計画だけ） */
        delete: (id: string, scheduleId: string) =>
          tx.request<null>("DELETE", `/care-plan/plans/${pathParam(id, "id")}/schedules/${pathParam(scheduleId, "scheduleId")}`),
      },
      conferences: {
        /** GET /care-plan/plans/:id/conferences — サービス担当者会議の要点（第4表）の一覧（開催日の新しい順） */
        list: (id: string) =>
          tx.request<CareplanConference[]>("GET", `/care-plan/plans/${pathParam(id, "id")}/conferences`),
        /** POST /care-plan/plans/:id/conferences — サービス担当者会議の要点（第4表）を記録 */
        create: (id: string, input: CreateCareplanConferenceInput) =>
          tx.request<CareplanConference>("POST", `/care-plan/plans/${pathParam(id, "id")}/conferences`, input),
        /** PATCH /care-plan/plans/:id/conferences/:conferenceId — サービス担当者会議の要点を更新（null で空にする） */
        update: (id: string, conferenceId: string, input: UpdateCareplanConferenceInput) =>
          tx.request<CareplanConference>("PATCH", `/care-plan/plans/${pathParam(id, "id")}/conferences/${pathParam(conferenceId, "conferenceId")}`, input),
        /** DELETE /care-plan/plans/:id/conferences/:conferenceId — 論理削除（法定保存） */
        delete: (id: string, conferenceId: string) =>
          tx.request<null>("DELETE", `/care-plan/plans/${pathParam(id, "id")}/conferences/${pathParam(conferenceId, "conferenceId")}`),
      },
      progressNotes: {
        /** GET /care-plan/plans/:id/progress-notes — 居宅介護支援経過（第5表）の一覧 */
        list: (id: string) =>
          tx.request<CareplanProgressNote[]>("GET", `/care-plan/plans/${pathParam(id, "id")}/progress-notes`),
        /** POST /care-plan/plans/:id/progress-notes — 居宅介護支援経過を 1 件追記（消すのは論理削除） */
        create: (id: string, input: CreateCareplanProgressNoteInput) =>
          tx.request<CareplanProgressNote>("POST", `/care-plan/plans/${pathParam(id, "id")}/progress-notes`, input),
        /** PATCH /care-plan/plans/:id/progress-notes/:noteId — 居宅介護支援経過を更新 */
        update: (id: string, noteId: string, input: UpdateCareplanProgressNoteInput) =>
          tx.request<CareplanProgressNote>("PATCH", `/care-plan/plans/${pathParam(id, "id")}/progress-notes/${pathParam(noteId, "noteId")}`, input),
        /** DELETE /care-plan/plans/:id/progress-notes/:noteId — 論理削除（法定保存） */
        delete: (id: string, noteId: string) =>
          tx.request<null>("DELETE", `/care-plan/plans/${pathParam(id, "id")}/progress-notes/${pathParam(noteId, "noteId")}`),
      },
      generateDraft: (input: GenerateCareplanDraftInput) =>
        tx.request<CareplanAiResult>("POST", "/care-plan/plans/generate-draft", input),
      pdf: (id: string, type?: "all" | "sheet1" | "sheet2" | "sheet3") => {
        const q = type ? `?type=${type}` : "";
        return tx.request<Blob>("GET", `/care-plan/plans/${id}/pdf${q}`);
      },
    },
    clientPlans: {
      /** GET /kyotaku-plan/clients/:client_id/plans — 利用者のケアプランの版・今のケアプラン・期間の重なり（?date= 省略時は今日） */
      list: (clientId: string, params?: { date?: string }) => {
        const query = params?.date ? `?date=${encodeURIComponent(params.date)}` : "";
        return tx.request<KyotakuClientPlanList>("GET", `/kyotaku-plan/clients/${pathParam(clientId, "clientId")}/plans${query}`);
      },
      /** POST /kyotaku-plan/clients/:client_id/plans/external — 外の居宅のケアプランを受け取る（intake=ocr|manual・下書きで入る。ocr は元の書類を staging〔用途 kyotaku_plan_origin〕に置いて stagedId を渡す） */
      receiveExternal: (clientId: string, input: ReceiveExternalKyotakuPlanInput) =>
        tx.request<Careplan>("POST", `/kyotaku-plan/clients/${pathParam(clientId, "clientId")}/plans/external`, input),
      /** GET /kyotaku-plan/plans/:id/origin-document — 読み取りで受け取った元の書類の短期の署名 URL（元の書類が無い計画は 404） */
      originDocument: (planId: string) =>
        tx.request<KyotakuOriginDocumentLink>("GET", `/kyotaku-plan/plans/${pathParam(planId, "planId")}/origin-document`),
    },
    clientServicePlans: {
      /** GET /care-plan/clients/:client_id/plans — 利用者の事業所の計画書の版・元のケアプラン・見直しのきっかけ（?date= 省略時は今日） */
      list: (clientId: string, params?: { date?: string }) => {
        const query = params?.date ? `?date=${encodeURIComponent(params.date)}` : "";
        return tx.request<CarePlanClientServicePlanList>("GET", `/care-plan/clients/${pathParam(clientId, "clientId")}/plans${query}`);
      },
      /** GET /care-plan/clients/:client_id/new-plan — 作る前の材料の候補と既定（最新が確定なら次の版・下書きなら 409） */
      preview: (clientId: string, params: { plan_type: "tsusho" | "kunren"; base_care_plan_id?: string }) => {
        const q = new URLSearchParams({ plan_type: params.plan_type });
        if (params.base_care_plan_id) q.set("base_care_plan_id", params.base_care_plan_id);
        return tx.request<CarePlanNewPlanMaterials>("GET", `/care-plan/clients/${pathParam(clientId, "clientId")}/new-plan?${q.toString()}`);
      },
      /** POST /care-plan/clients/:client_id/new-plan — 材料を選んで計画書の下書きを作る（次の版なら確定の最新版を写す） */
      create: (clientId: string, input: CreateClientCarePlanInput) =>
        tx.request<CreatedClientCarePlan>("POST", `/care-plan/clients/${pathParam(clientId, "clientId")}/new-plan`, input),
    },
    overview: {
      /** GET /care-plan/overview — 利用者のケアプランと計画書の今の版の一覧（認可の範囲・引数なし） */
      list: () => tx.request<CarePlanOverview>("GET", `/care-plan/overview`),
    },
    materials: {
      /** GET /care-plan/materials/:plan_id — 計画書の版の材料・選べる材料・既定の期間（?purpose=plan|evaluation・省略時は plan） */
      get: (planId: string, params?: { purpose?: "plan" | "evaluation" }) => {
        const query = params?.purpose ? `?purpose=${encodeURIComponent(params.purpose)}` : "";
        return tx.request<CarePlanMaterials>("GET", `/care-plan/materials/${pathParam(planId, "planId")}${query}`);
      },
      /** PUT /care-plan/materials/:plan_id — その用途の材料を全部入れ替える（選べる材料に無いものは 400） */
      replace: (planId: string, input: ReplaceCarePlanMaterialsInput) =>
        tx.request<{ count: number }>("PUT", `/care-plan/materials/${pathParam(planId, "planId")}`, input),
    },
    ocr: {
      analyze: (input: CareplanOcrAnalyzeInput) =>
        tx.request<CareplanAiResult>("POST", "/care-plan/ocr/analyze", input),
    },
  };
}

export function createDayservicePlanNamespace(tx: SdkTransport) {
  return {
    plans: {
      /**
       * 通所介護計画書一覧（clientId / status でフィルタ可）
       * GET /care-plan/dayservice/plans
       */
      list: (params?: { clientId?: string; status?: string; limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.status) qs.set("status", params.status);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<DayservicePlanWithDetails[]>("GET", `/care-plan/dayservice/plans${q ? `?${q}` : ""}`);
      },
      /**
       * 通所介護計画書詳細（tsushoplan_details 含む）
       * GET /care-plan/dayservice/plans/:id
       */
      get: (id: string) =>
        tx.request<DayservicePlanWithDetails>("GET", `/care-plan/dayservice/plans/${pathParam(id, "id")}`),
      /**
       * 通所介護計画書作成（care_plans + tsushoplan_details をアトミックに投入）
       * POST /care-plan/dayservice/plans
       */
      create: (input: CreateDayservicePlanInput) =>
        tx.request<DayservicePlanWithDetails>("POST", "/care-plan/dayservice/plans", input),
      /**
       * 通所介護計画書更新
       * PATCH /care-plan/dayservice/plans/:id
       */
      update: (id: string, input: UpdateDayservicePlanInput) =>
        tx.request<DayservicePlanWithDetails>("PATCH", `/care-plan/dayservice/plans/${pathParam(id, "id")}`, input),
      /**
       * ステータス変更（draft / review / approved / active / expired / revised）
       * PATCH /care-plan/dayservice/plans/:id/status
       */
      updateStatus: (id: string, status: UpdateDayservicePlanStatusInput["status"]) =>
        tx.request<DayservicePlanWithDetails>("PATCH", `/care-plan/dayservice/plans/${pathParam(id, "id")}/status`, { status }),
      generateDraft: (id: string) =>
        tx.request<DayservicePlanDraft>("POST", `/care-plan/dayservice/plans/${pathParam(id, "id")}/draft`),
      revise: (id: string) =>
        tx.request<{ id: string }>("POST", `/care-plan/dayservice/plans/${pathParam(id, "id")}/revise`),
      /**
       * 通所介護計画書の論理削除（法定保存: deleted_at のみ設定）
       * DELETE /care-plan/dayservice/plans/:id
       */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/care-plan/dayservice/plans/${pathParam(id, "id")}`),
      needs: {
        /** GET /care-plan/dayservice/plans/:id/needs */
        list: (id: string) =>
          tx.request<Record<string, unknown>[]>("GET", `/care-plan/dayservice/plans/${pathParam(id, "id")}/needs`),
      },
    },
  };
}

export function createTrainingPlanNamespace(tx: SdkTransport) {
  return {
    /** plans — 正式 REST resource（/training-plan/plans） */
    plans: {
      /**
       * 個別機能訓練計画書一覧
       * GET /care-plan/training/plans
       */
      list: (params?: ListTrainingPlanDetailsQuery) => {
        const q = params ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ).toString() : "";
        return tx.request<TrainingPlanDetail[]>("GET", `/care-plan/training/plans${q ? `?${q}` : ""}`);
      },
      /**
       * 個別機能訓練計画書単件取得
       * GET /care-plan/training/plans/:id
       */
      get: (id: string) =>
        tx.request<TrainingPlanDetail>("GET", `/care-plan/training/plans/${pathParam(id, "id")}`),
      /**
       * 個別機能訓練計画書登録
       * POST /care-plan/training/plans
       */
      create: (input: CreateTrainingPlanDetailInput) =>
        tx.request<TrainingPlanDetail>("POST", "/care-plan/training/plans", toApiCamel(input as Record<string, unknown>)),
      /**
       * 個別機能訓練計画書更新
       * PATCH /care-plan/training/plans/:id
       */
      update: (id: string, input: UpdateTrainingPlanDetailInput) =>
        tx.request<TrainingPlanDetail>("PATCH", `/care-plan/training/plans/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /**
       * ステータス変更
       * PATCH /care-plan/training/plans/:id/status
       */
      updateStatus: (id: string, status: string) =>
        tx.request<TrainingPlanDetail>("PATCH", `/care-plan/training/plans/${pathParam(id, "id")}/status`, { status }),
      generateDraft: (id: string) =>
        tx.request<TrainingPlanDraft>("POST", `/care-plan/training/plans/${pathParam(id, "id")}/draft`),
      revise: (id: string) =>
        tx.request<{ id: string }>("POST", `/care-plan/training/plans/${pathParam(id, "id")}/revise`),
      /**
       * 個別機能訓練計画書論理削除
       * DELETE /care-plan/training/plans/:id（法定保存: deleted_at のみ設定、物理削除しない）
       */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/training/plans/${pathParam(id, "id")}`),
    },
    details: {
      list: (params?: { clientId?: string; carePlanId?: string }) => {
        const q = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString();
        return tx.request<TrainingPlanDetailRecord[]>("GET", `/care-plan/training/details${q ? `?${q}` : ""}`);
      },
      get: (detailId: string) =>
        tx.request<TrainingPlanDetailRecord>("GET", `/care-plan/training/details/${pathParam(detailId, "detailId")}`),
      create: (input: TrainingPlanDetailCreateInput) =>
        tx.request<TrainingPlanDetailRecord>("POST", "/care-plan/training/details", input),
      update: (detailId: string, input: TrainingPlanDetailUpdateInput) =>
        tx.request<TrainingPlanDetailRecord>("PATCH", `/care-plan/training/details/${pathParam(detailId, "detailId")}`, input),
      delete: (detailId: string) =>
        tx.request<void>("DELETE", `/care-plan/training/details/${pathParam(detailId, "detailId")}`),
    },
  };
}

export function createHomecarePlanNamespace(tx: SdkTransport) {
  return {
    plans: {
      /** GET /care-plan/homecare/plans — 一覧（clientId / status / q でフィルタ） */
      list: (params?: ListHomecarePlansQuery) =>
        tx.request<HomecarePlan[]>("GET", `/care-plan/homecare/plans${buildQueryString(params)}`),
      /** GET /care-plan/homecare/plans/:id — 詳細（details + patterns をネスト） */
      get: (id: string) =>
        tx.request<HomecarePlan>("GET", `/care-plan/homecare/plans/${pathParam(id, "id")}`),
      /** POST /care-plan/homecare/plans — 作成（care_plans + details + patterns をアトミック投入） */
      create: (input: CreateHomecarePlanInput) =>
        tx.request<HomecarePlan>("POST", "/care-plan/homecare/plans", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/homecare/plans/:id — 親 + details 更新 */
      update: (id: string, input: UpdateHomecarePlanInput) =>
        tx.request<HomecarePlan>("PATCH", `/care-plan/homecare/plans/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/homecare/plans/:id/status — 状態遷移 */
      updateStatus: (id: string, status: HomecarePlanStatus) =>
        tx.request<HomecarePlan>("PATCH", `/care-plan/homecare/plans/${pathParam(id, "id")}/status`, { status }),
      /** PUT /care-plan/homecare/plans/:id/patterns — 週間パターン全置換 */
      replacePatterns: (id: string, input: ReplaceHomecarePatternsInput) =>
        tx.request<HomecarePlan>("PUT", `/care-plan/homecare/plans/${pathParam(id, "id")}/patterns`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/homecare/plans/:id — 論理削除（法定保存） */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/homecare/plans/${pathParam(id, "id")}`),
    },
  };
}

export function createEquipmentPlanNamespace(tx: SdkTransport) {
  return {
    plans: {
      /** GET /care-plan/equipment/plans — 貸与計画一覧（clientId / status / q でフィルタ） */
      list: (params?: ListEquipmentQuery) =>
        tx.request<EquipmentPlan[]>("GET", `/care-plan/equipment/plans${buildQueryString(params)}`),
      /** GET /care-plan/equipment/plans/:id — 詳細（details + 機種明細 items をネスト） */
      get: (id: string) =>
        tx.request<EquipmentPlan>("GET", `/care-plan/equipment/plans/${pathParam(id, "id")}`),
      /** POST /care-plan/equipment/plans */
      create: (input: CreateEquipmentPlanInput) =>
        tx.request<EquipmentPlan>("POST", "/care-plan/equipment/plans", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/equipment/plans/:id */
      update: (id: string, input: UpdateEquipmentPlanInput) =>
        tx.request<EquipmentPlan>("PATCH", `/care-plan/equipment/plans/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/equipment/plans/:id/status */
      updateStatus: (id: string, status: string) =>
        tx.request<EquipmentPlan>("PATCH", `/care-plan/equipment/plans/${pathParam(id, "id")}/status`, { status }),
      /** PUT /care-plan/equipment/plans/:id/items — 機種明細の全置換 */
      replaceItems: (id: string, input: ReplaceEquipmentPlanItemsInput) =>
        tx.request<EquipmentPlan>("PUT", `/care-plan/equipment/plans/${pathParam(id, "id")}/items`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/equipment/plans/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/equipment/plans/${pathParam(id, "id")}`),
    },
  };
}

export function createNursingPlanNamespace(tx: SdkTransport) {
  return {
    plans: {
      /** GET /care-plan/nursing/plans — 計画書一覧 */
      list: (params?: ListNursingPlansQuery) =>
        tx.request<NursingPlan[]>("GET", `/care-plan/nursing/plans${buildQueryString(params)}`),
      /** GET /care-plan/nursing/plans/:id */
      get: (id: string) => tx.request<NursingPlan>("GET", `/care-plan/nursing/plans/${pathParam(id, "id")}`),
      /** POST /care-plan/nursing/plans */
      create: (input: CreateNursingPlanInput) =>
        tx.request<NursingPlan>("POST", "/care-plan/nursing/plans", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/nursing/plans/:id */
      update: (id: string, input: UpdateNursingPlanInput) =>
        tx.request<NursingPlan>("PATCH", `/care-plan/nursing/plans/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/nursing/plans/:id/status */
      updateStatus: (id: string, status: string) =>
        tx.request<NursingPlan>("PATCH", `/care-plan/nursing/plans/${pathParam(id, "id")}/status`, { status }),
      /** DELETE /care-plan/nursing/plans/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/nursing/plans/${pathParam(id, "id")}`),
      /** GET /care-plan/nursing/plans/:id/forms/houmon_kango_keikakusho — 訪問看護計画書（別紙様式1）を原本の xlsx で出力（宛先は主治医あて・ケアマネあて） */
      downloadForm: (id: string, query?: { to?: "doctor" | "care_manager" }): Promise<Blob> =>
        tx.requestBlob("GET", `/care-plan/nursing/plans/${pathParam(id, "id")}/forms/houmon_kango_keikakusho${buildQueryString(query)}`),
    },
    visitStaffTypes: {
      /** GET /care-plan/nursing/visit-staff-types — 計画書の「訪問予定の職種」の初期値（期間の予定・実績の担当の職種） */
      get: (params: NursingPlanVisitStaffTypesQuery) =>
        tx.request<NursingPlanVisitStaffTypes>("GET", `/care-plan/nursing/visit-staff-types${buildQueryString(params)}`),
    },
    reports: {
      /** GET /care-plan/nursing/reports — 月次報告書一覧 */
      list: (params?: ListNursingPlansQuery) =>
        tx.request<NursingReport[]>("GET", `/care-plan/nursing/reports${buildQueryString(params)}`),
      /** GET /care-plan/nursing/reports/statuses — 月ごとの利用者別の報告書の進み具合（段階・次の 1 手・止まっている確認事項） */
      listStatuses: (params: ListNursingReportStatusesQuery) =>
        tx.request<NursingReportStatusRow[]>("GET", `/care-plan/nursing/reports/statuses${buildQueryString(params)}`),
      draft: (params: Record<string, unknown>) =>
        tx.request<Record<string, unknown>>("GET", `/care-plan/nursing/reports/draft${buildQueryString(params)}`),
      /** GET /care-plan/nursing/reports/:id */
      get: (id: string) =>
        tx.request<NursingReport>("GET", `/care-plan/nursing/reports/${pathParam(id, "id")}`),
      /** POST /care-plan/nursing/reports */
      create: (input: CreateNursingReportInput) =>
        tx.request<NursingReport>("POST", "/care-plan/nursing/reports", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/nursing/reports/:id（issued・確認済みは編集不可） */
      update: (id: string, input: UpdateNursingReportInput) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** GET /care-plan/nursing/reports/:id/revisions — 訂正前の版の写し（送った版。読むだけ） */
      listRevisions: (id: string) =>
        tx.request<NursingReportRevision[]>("GET", `/care-plan/nursing/reports/${pathParam(id, "id")}/revisions`),
      /** POST /care-plan/nursing/reports/from-sources — 下書きを作る（材料 + AI の文案・aiFailed つき） */
      createFromSources: (input: CreateNursingReportFromSourcesInput) =>
        tx.request<NursingReportWithAiStatus>("POST", "/care-plan/nursing/reports/from-sources", input as unknown as Record<string, unknown>),
      /** POST /care-plan/nursing/reports/:id/regenerate — AI の文案を作り直す（下書きの間だけ・manual の欄は上書きしない） */
      regenerate: (id: string) =>
        tx.request<NursingReportWithAiStatus>("POST", `/care-plan/nursing/reports/${pathParam(id, "id")}/regenerate`),
      /** PATCH /care-plan/nursing/reports/:id/review — 確認済みにする（下書きだけ） */
      review: (id: string) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/review`),
      /** PATCH /care-plan/nursing/reports/:id/unreview — 確認を取り消して下書きに戻す */
      unreview: (id: string) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/unreview`),
      /** PATCH /care-plan/nursing/reports/:id/sent — 送付済みにする（発行済みだけ・宛先 1 つずつ） */
      markSent: (id: string, input: MarkNursingReportSentInput) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/sent`, input as unknown as Record<string, unknown>),
      /** GET /care-plan/nursing/reports/:id/pdf — 宛先別の報告書 PDF */
      downloadPdf: (id: string, query?: { to?: "doctor" | "care_manager" }): Promise<Blob> =>
        tx.requestBlob("GET", `/care-plan/nursing/reports/${pathParam(id, "id")}/pdf${buildQueryString(query)}`),
      /** GET /care-plan/nursing/reports/:id/forms/houmon_kango_houkokusho — 訪問看護報告書（別紙様式2）を原本の xlsx で出力（段階は問わない） */
      downloadForm: (id: string): Promise<Blob> =>
        tx.requestBlob("GET", `/care-plan/nursing/reports/${pathParam(id, "id")}/forms/houmon_kango_houkokusho`),
      /** PATCH /care-plan/nursing/reports/:id/unissue — 発行を取り消す（まだどこにも送っていないときだけ） */
      unissue: (id: string) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/unissue`),
      /** PATCH /care-plan/nursing/reports/:id/revise — 訂正版を作る（どちらかに送付済みのときだけ） */
      revise: (id: string) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/revise`),
      /** PATCH /care-plan/nursing/reports/:id/issue — 報告書を発行（凍結。確認済みで止まる確認事項が無いときだけ） */
      issue: (id: string) =>
        tx.request<NursingReport>("PATCH", `/care-plan/nursing/reports/${pathParam(id, "id")}/issue`),
      /** DELETE /care-plan/nursing/reports/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/nursing/reports/${pathParam(id, "id")}`),
    },
    intakeRecords: {
      /** POST /care-plan/nursing/intake-records/draft — 保存せず、資料から文案を返す */
      draft: (input: DraftNursingIntakeInput) =>
        tx.request<NursingIntakeDraftResult>("POST", "/care-plan/nursing/intake-records/draft", input as unknown as Record<string, unknown>),
      /** GET /care-plan/nursing/intake-records — 記録書Ⅰ一覧 */
      list: (params?: ListNursingPlansQuery) =>
        tx.request<NursingIntakeRecord[]>("GET", `/care-plan/nursing/intake-records${buildQueryString(params)}`),
      /** GET /care-plan/nursing/intake-records/:id */
      get: (id: string) =>
        tx.request<NursingIntakeRecord>("GET", `/care-plan/nursing/intake-records/${pathParam(id, "id")}`),
      /** POST /care-plan/nursing/intake-records */
      create: (input: CreateNursingIntakeInput) =>
        tx.request<NursingIntakeRecord>("POST", "/care-plan/nursing/intake-records", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/nursing/intake-records/:id */
      update: (id: string, input: UpdateNursingIntakeInput) =>
        tx.request<NursingIntakeRecord>("PATCH", `/care-plan/nursing/intake-records/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/nursing/intake-records/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/care-plan/nursing/intake-records/${pathParam(id, "id")}`),
      /** GET /care-plan/nursing/intake-records/:id/forms/houmon_kango_kirokusho_1 — 訪問看護記録書Ⅰ（No.1・No.2）を原本の xlsx で出力 */
      downloadForm: (id: string): Promise<Blob> =>
        tx.requestBlob("GET", `/care-plan/nursing/intake-records/${pathParam(id, "id")}/forms/houmon_kango_kirokusho_1`),
    },
  };
}

export function createRehabPlanNamespace(tx: SdkTransport) {
  return {
    plans: {
      /** GET /care-plan/rehab/plans — 計画書一覧 */
      list: (params?: ListRehabPlansQuery) =>
        tx.request<RehabPlan[]>("GET", `/care-plan/rehab/plans${buildQueryString(params)}`),
      /** GET /care-plan/rehab/plans/:id（会議・評価・医師指示をネスト） */
      get: (id: string) => tx.request<RehabPlan>("GET", `/care-plan/rehab/plans/${pathParam(id, "id")}`),
      /** POST /care-plan/rehab/plans */
      create: (input: CreateRehabPlanInput) =>
        tx.request<RehabPlan>("POST", "/care-plan/rehab/plans", input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/rehab/plans/:id */
      update: (id: string, input: UpdateRehabPlanInput) =>
        tx.request<RehabPlan>("PATCH", `/care-plan/rehab/plans/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** PATCH /care-plan/rehab/plans/:id/status */
      updateStatus: (id: string, status: string) =>
        tx.request<RehabPlan>("PATCH", `/care-plan/rehab/plans/${pathParam(id, "id")}/status`, { status }),
      /** DELETE /care-plan/rehab/plans/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-plan/rehab/plans/${pathParam(id, "id")}`),
      /** POST /care-plan/rehab/plans/:id/conferences — リハ会議を追加 */
      addConference: (id: string, input: CreateRehabConferenceInput) =>
        tx.request<RehabConference>("POST", `/care-plan/rehab/plans/${pathParam(id, "id")}/conferences`, input as unknown as Record<string, unknown>),
      /** POST /care-plan/rehab/plans/:id/assessments — 経時評価を追加 */
      addAssessment: (id: string, input: CreateRehabAssessmentInput) =>
        tx.request<RehabAssessment>("POST", `/care-plan/rehab/plans/${pathParam(id, "id")}/assessments`, input as unknown as Record<string, unknown>),
      /** POST /care-plan/rehab/plans/:id/doctor-instructions — 医師の詳細指示を追加 */
      addDoctorInstruction: (id: string, input: CreateRehabDoctorInstructionInput) =>
        tx.request<RehabDoctorInstruction>("POST", `/care-plan/rehab/plans/${pathParam(id, "id")}/doctor-instructions`, input as unknown as Record<string, unknown>),
    },
    conferences: {
      /** PATCH /care-plan/rehab/conferences/:confId */
      update: (confId: string, input: UpdateRehabConferenceInput) =>
        tx.request<RehabConference>("PATCH", `/care-plan/rehab/conferences/${pathParam(confId, "confId")}`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/rehab/conferences/:confId */
      delete: (confId: string) =>
        tx.request<null>("DELETE", `/care-plan/rehab/conferences/${pathParam(confId, "confId")}`),
    },
    assessments: {
      /** PATCH /care-plan/rehab/assessments/:assessId */
      update: (assessId: string, input: UpdateRehabAssessmentInput) =>
        tx.request<RehabAssessment>("PATCH", `/care-plan/rehab/assessments/${pathParam(assessId, "assessId")}`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/rehab/assessments/:assessId */
      delete: (assessId: string) =>
        tx.request<null>("DELETE", `/care-plan/rehab/assessments/${pathParam(assessId, "assessId")}`),
    },
    doctorInstructions: {
      /** PATCH /care-plan/rehab/doctor-instructions/:diId */
      update: (diId: string, input: UpdateRehabDoctorInstructionInput) =>
        tx.request<RehabDoctorInstruction>("PATCH", `/care-plan/rehab/doctor-instructions/${pathParam(diId, "diId")}`, input as unknown as Record<string, unknown>),
      /** DELETE /care-plan/rehab/doctor-instructions/:diId */
      delete: (diId: string) =>
        tx.request<null>("DELETE", `/care-plan/rehab/doctor-instructions/${pathParam(diId, "diId")}`),
    },
  };
}

export function createPdfNamespace(tx: SdkTransport) {
  return {
    /**
     * ケアプラン PDF のダウンロード URL を生成する（fetch 不要、URL のみ）。
     * mobile では `<a href={url} download>` や WKWebView ナビゲーションで利用、
     * 認証ヘッダ込みで取得したい場合は `download()` を使う。
     */
    getDownloadUrl: (params: {
      type: string;
      planId: string;
      mode: "careplan";
    }): string => {
      const qs = new URLSearchParams();
      qs.set("type", params.type);
      qs.set("planId", params.planId);
      qs.set("mode", params.mode);
      return `${tx.getBaseUrl()}/care-plan/pdf?${qs.toString()}`;
    },
    /**
     * ケアプラン PDF を Blob として直接取得する（認証ヘッダ自動付与）。
     */
    download: (params: {
      type: string;
      planId: string;
      mode: "careplan";
    }): Promise<Blob> => {
      const qs = new URLSearchParams();
      qs.set("type", params.type);
      qs.set("planId", params.planId);
      qs.set("mode", params.mode);
      return tx.requestBlob("GET", `/care-plan/pdf?${qs.toString()}`);
    },
  };
}
