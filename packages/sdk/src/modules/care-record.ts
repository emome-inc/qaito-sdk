
import type {
  BulkDailyChecksResult,
  BulkRowsInput,
  BulkSetDailyChecksInput,
  BulkWriteSummary,
  CareRecord,
  ContactNote,
  ContactNotePhotoUrl,
  ContactNoteTemplate,
  ContactNoteUploadUrl,
  ContactNoteUploadUrlInput,
  CreateCareRecordInput,
  CreateContactNoteInput,
  CreateContactNoteTemplateInput,
  CreateHandoverEntryInput,
  CreateRecordTemplateInput,
  CreateTrainingRecordInput,
  CreateVitalInput,
  DayHandoverEntry,
  DayMedicationAdministration,
  DayRecreations,
  DayRecreationsQuery,
  DayRecreationsWriteResult,
  HandoverEntry,
  JudgeVitalRecheckInput,
  ListCareRecordsQuery,
  ListContactNoteTemplatesQuery,
  ListContactNotesQuery,
  ListDayHandoverEntriesQuery,
  ListDayMedicationAdministrationsQuery,
  ListHandoverEntriesQuery,
  ListVitalsQuery,
  MealAmountsSummary,
  QueueServiceConferenceAudioInput,
  RecordTemplate,
  ServiceConference,
  ServiceConferenceAudioJob,
  ServiceConferenceInput,
  SetDayRecreationsInput,
  SetMealAmountsInput,
  SoftDeleteCareRecordInput,
  TrainingRecord,
  UpdateCareRecordInput,
  UpdateContactNoteInput,
  UpdateContactNoteTemplateInput,
  UpdateRecordTemplateInput,
  UpdateTrainingRecordInput,
  UpdateVitalInput,
  UpsertFamilyReplyInput,
  VitalRecheckJudgement,
  VitalRecord,
  WeightTrend,
  WeightTrendQuery,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString, toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createVitalsNamespace(tx: SdkTransport) {
  return {
    /**
     * バイタル測定一覧（期間絞り込み対応）
     * GET /care-record/vitals/clients/:clientId/vitals
     */
    list: (clientId: string, params?: ListVitalsQuery) => {
      const qs = new URLSearchParams();
      if (params?.from) qs.set("from", params.from);
      if (params?.to) qs.set("to", params.to);
      if (params?.limit != null) qs.set("limit", String(params.limit));
      const q = qs.toString();
      return tx.request<VitalRecord[]>("GET", `/care-record/vitals/clients/${clientId}/vitals${q ? `?${q}` : ""}`);
    },
    /**
     * 体重の推移（月ごと・既定は今月まで 12 か月）
     * GET /care-record/vitals/clients/:clientId/weight-trend?months=&to=YYYY-MM
     */
    weightTrend: (clientId: string, params?: WeightTrendQuery) =>
      tx.request<WeightTrend>("GET", `/care-record/vitals/clients/${pathParam(clientId, "clientId")}/weight-trend${buildQueryString(params)}`),
    /** GET /care-record/vitals/clients/:clientId/vitals/:id */
    get: (clientId: string, id: string) =>
      tx.request<VitalRecord>("GET", `/care-record/vitals/clients/${pathParam(clientId, "clientId")}/vitals/${pathParam(id, "id")}`),
    /** POST /care-record/vitals/clients/:clientId/vitals */
    create: (input: CreateVitalInput) =>
      tx.request<VitalRecord>("POST", `/care-record/vitals/clients/${input.clientId}/vitals`, toApiCamel(input as Record<string, unknown>)),
    /** PATCH /care-record/vitals/clients/:clientId/vitals/:id */
    update: (clientId: string, id: string, input: UpdateVitalInput) =>
      tx.request<VitalRecord>("PATCH", `/care-record/vitals/clients/${pathParam(clientId, "clientId")}/vitals/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
    /** DELETE /care-record/vitals/clients/:clientId/vitals/:id（論理削除） */
    delete: (clientId: string, id: string) =>
      tx.request<void>("DELETE", `/care-record/vitals/clients/${pathParam(clientId, "clientId")}/vitals/${pathParam(id, "id")}`),
    /**
     * バイタルの一括登録（POST /care-record/vitals/bulk）
     * 1 コール = 1 承認で「20 人分をまとめて」を成立させる入口。**部分成功**
     * （1 行の失敗で全体を落とさない）— 行ごとの成否は results に入る。最大 100 行。
     */
    bulkCreate: (input: BulkRowsInput<CreateVitalInput>) =>
      tx.request<BulkWriteSummary>("POST", "/care-record/vitals/bulk", {
        rows: input.rows.map((row) => toApiCamel(row as Record<string, unknown>)),
      }),
    judgeRecheck: (input: JudgeVitalRecheckInput) =>
      tx.request<VitalRecheckJudgement[]>("POST", "/care-record/vitals/recheck-judgement", input as unknown as Record<string, unknown>),
  };
}

/** 介護記録（1日1行ワイド型、法定保存 5 年）*/
export function createCarerecordNamespace(tx: SdkTransport) {
  return {
    conferences: {
      list: (clientId: string) =>
        tx.request<ServiceConference[]>("GET", `/care-record/clients/${pathParam(clientId, "clientId")}/service-conferences`),
      create: (clientId: string, input: ServiceConferenceInput) =>
        tx.request<{ id: string }>("POST", `/care-record/clients/${pathParam(clientId, "clientId")}/service-conferences`, input),
      update: (clientId: string, id: string, input: ServiceConferenceInput) =>
        tx.request<{ id: string }>("PATCH", `/care-record/clients/${pathParam(clientId, "clientId")}/service-conferences/${pathParam(id, "id")}`, input),
      audio: {
        /** マイドライブの本人の会議の音声から、担当者会議の記録の下書きを作る処理を受け付ける（同意が要る）。文字起こしと下書きは毎分のジョブが進める。状態は conferences.audio.get で読む */
        queue: (clientId: string, input: QueueServiceConferenceAudioInput) =>
          tx.request<{ id: string }>("POST", `/care-record/clients/${pathParam(clientId, "clientId")}/service-conferences/audio`, input),
        /** 受け付けた会議の音声の状態と記録の下書き（受け付けた本人だけ・1 日で消える） */
        get: (clientId: string, id: string, facilityId: string) =>
          tx.request<ServiceConferenceAudioJob>("GET", `/care-record/clients/${pathParam(clientId, "clientId")}/service-conferences/audio/${pathParam(id, "id")}${buildQueryString({ facilityId })}`),
      },
    },
    records: {
      /**
       * 介護記録一覧（日付・利用者・種別でフィルタ）
       * GET /care-record/records
       */
      list: (params?: ListCareRecordsQuery) => {
        const qs = new URLSearchParams();
        if (params?.client_id) qs.set("clientId", params.client_id);
        if (params?.facility_id) qs.set("facilityId", params.facility_id);
        if (params?.service_date) qs.set("serviceDate", params.service_date);
        if (params?.date_from) qs.set("dateFrom", params.date_from);
        if (params?.date_to) qs.set("dateTo", params.date_to);
        if (params?.record_type) qs.set("recordType", params.record_type);
        if (params?.include_deleted != null) qs.set("includeDeleted", String(params.include_deleted));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<CareRecord[]>("GET", `/care-record/records${q ? `?${q}` : ""}`);
      },
      /** GET /care-record/records/:id */
      get: (id: string) => tx.request<CareRecord>("GET", `/care-record/records/${pathParam(id, "id")}`),
      /**
       * 介護記録作成（1日1行ワイド型）
       * 同日・同種別が既存の場合は 409（existingId 付き）を返す。
       * POST /care-record/records
       */
      create: (input: CreateCareRecordInput) =>
        tx.request<CareRecord>("POST", "/care-record/records", toApiCamel(input as Record<string, unknown>)),
      /**
       * 介護記録の一括作成（POST /care-record/records/bulk）
       * 1 コール = 1 承認で「今日の 20 人分」を成立させる入口。**部分成功**
       * （1 行の失敗で全体を落とさない）。1日1行ワイド型のため、同 client + 同 date +
       * 同 record_type の既存行がある行は「重複」として失敗扱い（上書きしない）。最大 100 行。
       */
      bulkCreate: (input: BulkRowsInput<CreateCareRecordInput>) =>
        tx.request<BulkWriteSummary>("POST", "/care-record/records/bulk", {
          rows: input.rows.map((row) => toApiCamel(row as Record<string, unknown>)),
        }),
      /**
       * 選んだ利用者の食事量（主食・副食）をまとめて入れる / 消す（POST /care-record/records/meal-amounts）
       * その日の介護記録があれば更新し、無ければ作る。主食・副食とも null で消す（未入力に戻す）。
       * **部分成功**（利用者ごとの成否は results に入る）。最大 100 人。
       */
      setMealAmounts: (input: SetMealAmountsInput) =>
        tx.request<MealAmountsSummary>("POST", "/care-record/records/meal-amounts", input),
      /**
       * 介護記録更新
       * PATCH /care-record/records/:id
       */
      update: (id: string, input: UpdateCareRecordInput) =>
        tx.request<CareRecord>("PATCH", `/care-record/records/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /**
       * 介護記録 論理削除（物理 DELETE 禁止 — 法定保存 5 年）
       * PATCH /care-record/records/:id/delete
       */
      softDelete: (id: string, input?: SoftDeleteCareRecordInput) =>
        tx.request<null>("PATCH", `/care-record/records/${pathParam(id, "id")}/delete`, input ?? {}),
    },
    dailyChecks: {
      /**
       * 実績入力の入浴・口腔ケア・個別を、来ていてまだ未入力の人にまとめて付ける（POST /care-record/daily-checks/bulk）
       * mode=revert で付けた分を戻す（口腔ケア・個別の行の論理削除は削除の権限が要る）。mode=preview（個別だけ）は書かずに計画の有無を返す。1 つの transaction。
       */
      bulkSet: (input: BulkSetDailyChecksInput) =>
        tx.request<BulkDailyChecksResult>("POST", "/care-record/daily-checks/bulk", input),
    },
    dayRecreations: {
      /**
       * その日のレク（午前・午後・イベント）の今の内容（GET /care-record/day-recreations）
       */
      get: (params: DayRecreationsQuery) =>
        tx.request<DayRecreations>("GET", `/care-record/day-recreations${buildQueryString(params)}`),
      /**
       * 出席の全員に、その日のレクを入れ直す（PUT /care-record/day-recreations）
       * 渡した枠だけが変わる。空（"" / null）はその枠のレクを外す。何度呼んでも行は増えない。
       */
      set: (input: SetDayRecreationsInput) =>
        tx.request<DayRecreationsWriteResult>("PUT", "/care-record/day-recreations", input),
    },
    templates: {
      /**
       * 記録テンプレート一覧（自 org + グローバル共通テンプレート）
       *
       * `record_type` は「どのフォーム用のテンプレートか」（`care_record` /
       * `training_record`）。**介護記録と機能訓練記録が 1 テーブルを共有している**ので、
       * 入力補助に使うときは必ず指定する（省略すると別フォームのテンプレートが混ざる）。
       * GET /care-record/templates
       */
      list: (params?: { record_type?: string }) => {
        const qs = new URLSearchParams();
        if (params?.record_type) qs.set("recordType", params.record_type);
        const q = qs.toString();
        return tx.request<RecordTemplate[]>("GET", `/care-record/templates${q ? `?${q}` : ""}`);
      },
      /** GET /care-record/templates/:id */
      get: (id: string) => tx.request<RecordTemplate>("GET", `/care-record/templates/${pathParam(id, "id")}`),
      /** POST /care-record/templates */
      create: (input: CreateRecordTemplateInput) =>
        tx.request<RecordTemplate>("POST", "/care-record/templates", toApiCamel(input as Record<string, unknown>)),
      /** PATCH /care-record/templates/:id */
      update: (id: string, input: UpdateRecordTemplateInput) =>
        tx.request<RecordTemplate>("PATCH", `/care-record/templates/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /** DELETE /care-record/templates/:id（テンプレートは法定保存対象外 = 物理削除 OK） */
      delete: (id: string) => tx.request<null>("DELETE", `/care-record/templates/${pathParam(id, "id")}`),
    },
  };
}

export function createTrainingNamespace(tx: SdkTransport) {
  return {
    records: {
      list: (params?: {
        clientId?: string;
        goalDomain?: "body_function" | "activity" | "participation";
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
      }) => {
        const qs = new URLSearchParams();
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.goalDomain) qs.set("goalDomain", params.goalDomain);
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<TrainingRecord[]>("GET", `/care-record/training/records${q ? `?${q}` : ""}`);
      },
      get: (id: string) =>
        tx.request<TrainingRecord>("GET", `/care-record/training/records/${pathParam(id, "id")}`),
      create: (input: CreateTrainingRecordInput) =>
        tx.request<TrainingRecord>("POST", "/care-record/training/records", input),
      /**
       * 機能訓練記録の一括作成（POST /care-record/training/records/bulk）
       * 1 コール = 1 承認で「20 人分をまとめて」を成立させる入口。**部分成功**
       * （1 行の失敗で全体を落とさない）— 行ごとの成否は results に入る。最大 100 行。
       */
      bulkCreate: (input: BulkRowsInput<CreateTrainingRecordInput>) =>
        tx.request<BulkWriteSummary>("POST", "/care-record/training/records/bulk", input),
      update: (id: string, input: UpdateTrainingRecordInput) =>
        tx.request<TrainingRecord>("PATCH", `/care-record/training/records/${pathParam(id, "id")}`, input),
      delete: (id: string) =>
        tx.request<void>("DELETE", `/care-record/training/records/${pathParam(id, "id")}`),
    },
  };
}

export function createContactnoteNamespace(tx: SdkTransport) {
  return {
    /**
     * 連絡帳一覧（clientId + 期間絞り込み）
     * GET /care-record/notes?clientId=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    list: (params: ListContactNotesQuery) => {
      const qs = new URLSearchParams();
      qs.set("clientId", params.clientId);
      if (params.from) qs.set("from", params.from);
      if (params.to) qs.set("to", params.to);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return tx.request<ContactNote[]>("GET", `/care-record/notes?${qs.toString()}`);
    },
    /** GET /care-record/notes/:id */
    get: (id: string) => tx.request<ContactNote>("GET", `/care-record/notes/${pathParam(id, "id")}`),
    /** POST /care-record/notes */
    create: (input: CreateContactNoteInput) => tx.request<ContactNote>("POST", "/care-record/notes", input),
    /** PATCH /care-record/notes/:id（職員サイド更新） */
    update: (id: string, input: UpdateContactNoteInput) =>
      tx.request<ContactNote>("PATCH", `/care-record/notes/${pathParam(id, "id")}`, input),
    /** PATCH /care-record/notes/:id/family-reply（家族返信更新） */
    upsertFamilyReply: (id: string, input: UpsertFamilyReplyInput) =>
      tx.request<ContactNote>("PATCH", `/care-record/notes/${pathParam(id, "id")}/family-reply`, input),
    /** DELETE /care-record/notes/:id（論理削除） */
    delete: (id: string) => tx.request<void>("DELETE", `/care-record/notes/${pathParam(id, "id")}`),
    /** POST /care-record/notes/upload-url（写真 presigned PUT URL） */
    getUploadUrl: (input: ContactNoteUploadUrlInput) =>
      tx.request<ContactNoteUploadUrl>("POST", "/care-record/notes/upload-url", input),
    /** GET /care-record/notes/:id/photo-urls（写真 signed download URL 一覧） */
    getPhotoUrls: (id: string) =>
      tx.request<ContactNotePhotoUrl[]>("GET", `/care-record/notes/${pathParam(id, "id")}/photo-urls`),
    templates: {
      /**
       * 連絡事項の定型文（組織全体 + 所属する事業所の分）
       * GET /care-record/contact-note-templates?facilityId=uuid
       */
      list: (params?: ListContactNoteTemplatesQuery) =>
        tx.request<ContactNoteTemplate[]>("GET", `/care-record/contact-note-templates${buildQueryString(params)}`),
      /** POST /care-record/contact-note-templates（facilityId を省くと組織全体・オーナー / 管理者だけ） */
      create: (input: CreateContactNoteTemplateInput) =>
        tx.request<ContactNoteTemplate>("POST", "/care-record/contact-note-templates", input),
      /** PATCH /care-record/contact-note-templates/:id */
      update: (id: string, input: UpdateContactNoteTemplateInput) =>
        tx.request<ContactNoteTemplate>("PATCH", `/care-record/contact-note-templates/${pathParam(id, "id")}`, input),
      /** DELETE /care-record/contact-note-templates/:id（論理削除） */
      delete: (id: string) =>
        tx.request<void>("DELETE", `/care-record/contact-note-templates/${pathParam(id, "id")}`),
    },
    handovers: {
      /**
       * 利用者の申し送り（新しい順。範囲を省くと今日）
       * GET /care-record/handovers?clientId=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD
       */
      list: (params: ListHandoverEntriesQuery) => {
        const qs = new URLSearchParams();
        qs.set("clientId", params.clientId);
        if (params.from) qs.set("from", params.from);
        if (params.to) qs.set("to", params.to);
        if (params.limit != null) qs.set("limit", String(params.limit));
        return tx.request<HandoverEntry[]>("GET", `/care-record/handovers?${qs.toString()}`);
      },
      /**
       * 事業所 × 日付の申し送り（申し送りボード。新しい順）
       * GET /care-record/handovers/day?facilityId=uuid&date=YYYY-MM-DD
       */
      listDay: (params: ListDayHandoverEntriesQuery) => {
        const qs = new URLSearchParams();
        qs.set("facilityId", params.facilityId);
        qs.set("date", params.date);
        return tx.request<DayHandoverEntry[]>("GET", `/care-record/handovers/day?${qs.toString()}`);
      },
      /** POST /care-record/handovers（申し送りを 1 件追記） */
      create: (input: CreateHandoverEntryInput) =>
        tx.request<HandoverEntry>("POST", "/care-record/handovers", input),
      /** DELETE /care-record/handovers/:id（自分が書いたものだけ・論理削除） */
      delete: (id: string) => tx.request<void>("DELETE", `/care-record/handovers/${pathParam(id, "id")}`),
    },
    medicationAdministrations: {
      /**
       * 事業所 × 日付の服薬の実績（窓ごと。薬名は含まない。記録は dayserviceDaily.medication.record）
       * GET /care-record/medication-administrations?facilityId=uuid&date=YYYY-MM-DD
       */
      listDay: (params: ListDayMedicationAdministrationsQuery) => {
        const qs = new URLSearchParams({ facilityId: params.facilityId, date: params.date }).toString();
        return tx.request<DayMedicationAdministration[]>("GET", `/care-record/medication-administrations?${qs}`);
      },
    },
  };
}
