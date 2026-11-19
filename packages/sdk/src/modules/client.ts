
import type {
  ApplyInsuranceCardInput,
  AssignClientsFacilityInput,
  AssignClientsFacilityResult,
  AttendanceUpdateInput,
  BulkAttendanceRowInput,
  BulkRowsInput,
  BulkWriteSummary,
  CareCertification,
  Client,
  ClientCertificateListQuery,
  ClientCertificateSummary,
  ClientDietary,
  ClientDocument,
  ClientFamily,
  ClientHandoverDigest,
  ClientHandoverQuery,
  ClientMedical,
  ClientMedicationSchedule,
  ClientOcrAnalyzeInput,
  ClientOcrInput,
  ClientOcrResult,
  ClientPersonality,
  ClientRelationship,
  ClientSchedule,
  ClientSensitive,
  CopayCertificate,
  CreateCareCertificationInput,
  CreateClientDocumentInput,
  CreateClientFamilyInput,
  CreateClientInput,
  CreateClientMedicalInput,
  CreateClientMedicationScheduleInput,
  CreateClientScheduleInput,
  CreateCopayCertificateInput,
  CreateInsuranceRegistrationInput,
  CreateKohiCertificateInput,
  CreateRelationshipInput,
  CurrentInsuranceQuery,
  CurrentInsuranceRegistration,
  CustomerActualTimelineEvent,
  CustomerCareRecordEvent,
  CustomerCareRecordsQuery,
  CustomerCareTrend,
  CustomerCertificationAlert,
  CustomerClient,
  CustomerClientOverview,
  CustomerContractClient,
  CustomerMonitoringList,
  CustomerMonthsQuery,
  CustomerTimelineEvent,
  GenerateMonthlyScheduleInput,
  GenerateMonthlyScheduleResult,
  ImportJob,
  InsuranceRegistration,
  IntakeCommitResult,
  IntakeOverlapResolution,
  IntakeTemplateResult,
  IntakeUploadPreview,
  KohiCertificate,
  ListClientSchedulesQuery,
  ListImportJobsQuery,
  ListRecentClientsQuery,
  ListUnassignedFacilityClientsQuery,
  RecentClient,
  SaveClientDocumentOcrResultInput,
  UnassignedFacilityClient,
  UpdateCareCertificationInput,
  UpdateClientFamilyInput,
  UpdateClientInput,
  UpdateClientMedicalInput,
  UpdateClientMedicationScheduleInput,
  UpdateClientScheduleInput,
  UpdateCopayCertificateInput,
  UpdateInsuranceRegistrationInput,
  UpdateKohiCertificateInput,
  UpdatePersonalityInput,
  UploadUrlResult,
  UpsertClientDietaryInput,
  UpsertClientSensitiveInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString, toApiCamel } from "../serialize.js";
import { jstToday } from "@qaito/schemas/jst";
import type { SdkTransport } from "../transport.js";

export function createClientNamespace(tx: SdkTransport) {
  return {
    clients: {
      list: () => tx.request<Client[]>("GET", "/client/clients"),
      search: (query: string) =>
        tx.request<Client[]>("GET", `/client/clients?q=${encodeURIComponent(query)}`),
      recent: (params?: ListRecentClientsQuery) =>
        tx.request<RecentClient[]>("GET", `/client/clients/recent${buildQueryString(params)}`),
      unassignedFacility: (params?: ListUnassignedFacilityClientsQuery) =>
        tx.request<UnassignedFacilityClient[]>("GET", `/client/clients/unassigned-facility${buildQueryString(params)}`),
      assignFacility: (input: AssignClientsFacilityInput) =>
        tx.request<AssignClientsFacilityResult>("POST", "/client/clients/unassigned-facility/assign", input),
      get: (id: string) => tx.request<Client>("GET", `/client/clients/${pathParam(id, "id")}`),
      create: (input: CreateClientInput) =>
        tx.request<Client>("POST", "/client/clients", toApiCamel(input as Record<string, unknown>)),
      update: (id: string, input: UpdateClientInput) =>
        tx.request<Client>("PATCH", `/client/clients/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      applyInsuranceCard: (id: string, input: ApplyInsuranceCardInput) =>
        tx.request<Client>("POST", `/client/clients/${pathParam(id, "id")}/insurance-card`, toApiCamel(input as Record<string, unknown>)),
      delete: (id: string) => tx.request<void>("DELETE", `/client/clients/${pathParam(id, "id")}`),
      ocr: (clientId: string, input: ClientOcrInput) =>
        tx.request<ClientOcrResult>("POST", `/client/clients/${pathParam(clientId, "clientId")}/ocr`, input),
      personality: {
        get: (clientId: string) =>
          tx.request<ClientPersonality | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/personality`),
        update: (clientId: string, data: UpdatePersonalityInput) =>
          tx.request<ClientPersonality>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/personality`, data),
      },
      relationships: {
        list: (clientId: string) =>
          tx.request<ClientRelationship[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/relationships`),
        create: (clientId: string, data: CreateRelationshipInput) =>
          tx.request<ClientRelationship>("POST", `/client/clients/${pathParam(clientId, "clientId")}/relationships`, data),
        delete: (clientId: string, relId: string) =>
          tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/relationships/${pathParam(relId, "relId")}`),
      },
    },
    clientFamily: {
      list: (clientId: string) =>
        tx.request<ClientFamily[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/family`),
      create: (clientId: string, input: CreateClientFamilyInput) =>
        tx.request<ClientFamily>("POST", `/client/clients/${pathParam(clientId, "clientId")}/family`, input),
      update: (clientId: string, id: string, input: UpdateClientFamilyInput) =>
        tx.request<ClientFamily>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/family/${pathParam(id, "id")}`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/family/${pathParam(id, "id")}`),
    },
    clientMedical: {
      list: (clientId: string) =>
        tx.request<ClientMedical[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/medical`),
      create: (clientId: string, input: CreateClientMedicalInput) =>
        tx.request<ClientMedical>("POST", `/client/clients/${pathParam(clientId, "clientId")}/medical`, input),
      update: (clientId: string, id: string, input: UpdateClientMedicalInput) =>
        tx.request<ClientMedical>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/medical/${pathParam(id, "id")}`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/medical/${pathParam(id, "id")}`),
    },
    clientDocuments: {
      list: (clientId: string) =>
        tx.request<ClientDocument[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/documents`),
      /** POST /client/clients/:client_id/documents/upload-url — 書類の presigned PUT URL（sha256 = ファイルの SHA-256 の base64。置き場は Object Lock なので、渡すと署名したヘッダーに入り、PUT には同じ値の x-amz-checksum-sha256 を付ける。無いと PUT が断られる） */
      getUploadUrl: (clientId: string, params: { file_name: string; content_type: string; document_type: string; size_bytes: number; sha256?: string }) =>
        tx.request<UploadUrlResult>("POST", `/client/clients/${pathParam(clientId, "clientId")}/documents/upload-url`, params),
      create: (clientId: string, input: CreateClientDocumentInput) =>
        tx.request<ClientDocument>("POST", `/client/clients/${pathParam(clientId, "clientId")}/documents`, input),
      /** PUT /client/clients/:client_id/documents/:id/ocr-result — OCR の読み取り結果を書類に保存 */
      saveOcrResult: (clientId: string, id: string, input: SaveClientDocumentOcrResultInput) =>
        tx.request<void>("PUT", `/client/clients/${pathParam(clientId, "clientId")}/documents/${pathParam(id, "id")}/ocr-result`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/documents/${pathParam(id, "id")}`),
    },
    ocr: {
      analyze: (input: ClientOcrAnalyzeInput): Promise<ClientOcrResult> =>
        tx.request<ClientOcrResult>("POST", "/client/ocr/analyze", input),
    },
    /** 利用者 要配慮情報（Wave 1 新設 — client:sensitive スコープ）*/
    sensitive: {
      get: (clientId: string) =>
        tx.request<ClientSensitive | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/sensitive`),
      upsert: (clientId: string, input: UpsertClientSensitiveInput) =>
        tx.request<ClientSensitive>("PUT", `/client/clients/${pathParam(clientId, "clientId")}/sensitive`, toApiCamel(input as Record<string, unknown>)),
    },
    /** 服薬スケジュール（Wave 1 新設）*/
    medicationSchedules: {
      list: (clientId: string) =>
        tx.request<ClientMedicationSchedule[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/medication-schedules`),
      create: (clientId: string, input: CreateClientMedicationScheduleInput) =>
        tx.request<ClientMedicationSchedule>("POST", `/client/clients/${pathParam(clientId, "clientId")}/medication-schedules`, toApiCamel(input as Record<string, unknown>)),
      update: (clientId: string, id: string, input: UpdateClientMedicationScheduleInput) =>
        tx.request<ClientMedicationSchedule>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/medication-schedules/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/medication-schedules/${pathParam(id, "id")}`),
    },
    /** 食事プロファイル（Wave 1 新設 — 1:1）*/
    dietary: {
      get: (clientId: string) =>
        tx.request<ClientDietary | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/dietary`),
      upsert: (clientId: string, input: UpsertClientDietaryInput) =>
        tx.request<ClientDietary>("PUT", `/client/clients/${pathParam(clientId, "clientId")}/dietary`, toApiCamel(input as Record<string, unknown>)),
    },
    /** 利用者スケジュール（Wave 2 新設 — schedule モジュール）*/
    schedules: {
      /** 一覧取得（日付・月・利用者・事業所・ステータスでフィルタ可）
       * NOTE: クエリパラメータは snake_case のまま送信（toApiCamel を通さない）。
       * API は facility_id / client_id / date / month / status を snake_case で受け取る。
       */
      list: (params?: ListClientSchedulesQuery) => {
        const qs = params ? "?" + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString() : "";
        return tx.request<ClientSchedule[]>("GET", `/schedule/schedules${qs}`);
      },
      /** 今日のスケジュール一覧（date=today のショートカット）*/
      listToday: (facilityId?: string) => {
        const today = jstToday();
        const qs = new URLSearchParams({ date: today, ...(facilityId ? { facility_id: facilityId } : {}) }).toString();
        return tx.request<ClientSchedule[]>("GET", `/schedule/schedules?${qs}`);
      },
      /** 単件取得 */
      get: (id: string) => tx.request<ClientSchedule>("GET", `/schedule/schedules/${pathParam(id, "id")}`),
      /** 新規作成 */
      create: (input: CreateClientScheduleInput) =>
        tx.request<ClientSchedule>("POST", "/schedule/schedules", toApiCamel(input as Record<string, unknown>)),
      /**
       * 利用予定の一括作成（POST /schedule/schedules/bulk）
       * 「来週の予定をまとめて入れて」を 1 コール = 1 承認で成立させる入口。**部分成功**
       * （1 行の失敗で全体を落とさない）。最大 100 行。
       */
      bulkCreate: (input: BulkRowsInput<CreateClientScheduleInput>) =>
        tx.request<BulkWriteSummary>("POST", "/schedule/schedules/bulk", {
          rows: input.rows.map((row) => toApiCamel(row as Record<string, unknown>)),
        }),
      /**
       * 出欠の一括確定（PATCH /schedule/schedules/bulk-attendance）
       * 朝の出欠を 20 人分まとめて確定する現場需要向け。**部分成功**。最大 100 行。
       */
      bulkMarkAttendance: (input: BulkRowsInput<BulkAttendanceRowInput>) =>
        tx.request<BulkWriteSummary>("PATCH", "/schedule/schedules/bulk-attendance", input),
      /** 更新（ステータス・欠席理由・備考等） */
      update: (id: string, input: UpdateClientScheduleInput) =>
        tx.request<ClientSchedule>("PATCH", `/schedule/schedules/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /** 出欠確定（attended / absent）*/
      updateAttendance: (id: string, input: AttendanceUpdateInput) =>
        tx.request<ClientSchedule>("PATCH", `/schedule/schedules/${pathParam(id, "id")}/attendance`, toApiCamel(input as Record<string, unknown>)),
      /** キャンセル */
      cancel: (id: string, note?: string) =>
        tx.request<ClientSchedule>("PATCH", `/schedule/schedules/${pathParam(id, "id")}`, { status: "cancelled", ...(note ? { note } : {}) }),
      /** 削除（論理削除 — deleted_at が立つ） */
      delete: (id: string) => tx.request<void>("DELETE", `/schedule/schedules/${pathParam(id, "id")}`),
      /** 月次スケジュール一括生成（service_plans の service_days から regular 行を冪等生成）*/
      generateMonthly: (input: GenerateMonthlyScheduleInput) =>
        tx.request<GenerateMonthlyScheduleResult>("POST", "/schedule/generate", toApiCamel(input as Record<string, unknown>)),
    },
    handover: {
      /** GET /client/handover — 事業所 × 日付の利用者ごとの引き継ぎの要点（注意点・食事形態・直近 3 日の申し送り・医療の注意・今日の要観察） */
      get: (params: ClientHandoverQuery) =>
        tx.request<ClientHandoverDigest>("GET", `/client/handover${buildQueryString(params)}`),
    },
  };
}

/** 証・資格情報（insurance モジュール）*/
export function createInsuranceNamespace(tx: SdkTransport) {
  return {
    /** 介護認定（旧 client.clientCertifications から移管）*/
    certifications: {
      list: (clientId: string) =>
        tx.request<CareCertification[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/certifications`),
      /** GET /client/clients/:client_id/certifications/current — その日に有効な介護認定（無ければいちばん新しい認定・0 件なら null） */
      current: (clientId: string, params?: CurrentInsuranceQuery) =>
        tx.request<CareCertification | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/certifications/current${buildQueryString(params)}`),
      create: (clientId: string, input: CreateCareCertificationInput) =>
        tx.request<CareCertification>("POST", `/client/clients/${pathParam(clientId, "clientId")}/certifications`, toApiCamel(input as Record<string, unknown>)),
      update: (clientId: string, id: string, input: UpdateCareCertificationInput) =>
        tx.request<CareCertification>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/certifications/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/certifications/${pathParam(id, "id")}`),
    },
    /**
     * 保険証（被保険者証）の期間履歴 — client.insurance_registrations
     *
     * web の upsert（validFrom 一致なら UPDATE / それ以外は INSERT）とは違い、API は
     * create / update / delete に分解されている（AI エージェントが「更新したつもりで
     * 新規行が増える」事故を防ぐため）。期間が既存と重なる create / update は 409。
     */
    registrations: {
      /** GET /client/clients/:client_id/registrations（新しい期間が先頭） */
      list: (clientId: string) =>
        tx.request<InsuranceRegistration[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/registrations`),
      /** POST /client/clients/:client_id/registrations */
      create: (clientId: string, input: CreateInsuranceRegistrationInput) =>
        tx.request<InsuranceRegistration>("POST", `/client/clients/${pathParam(clientId, "clientId")}/registrations`, input),
      /** PATCH /client/clients/:client_id/registrations/:registration_id */
      update: (clientId: string, registrationId: string, input: UpdateInsuranceRegistrationInput) =>
        tx.request<InsuranceRegistration>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/registrations/${pathParam(registrationId, "registrationId")}`, input),
      /** DELETE /client/clients/:client_id/registrations/:registration_id */
      delete: (clientId: string, registrationId: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/registrations/${pathParam(registrationId, "registrationId")}`),
      /** GET /client/clients/:client_id/registrations/current — その日に有効な被保険者証（無ければ null） */
      current: (clientId: string, params?: CurrentInsuranceQuery) =>
        tx.request<CurrentInsuranceRegistration | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/registrations/current${buildQueryString(params)}`),
      /** GET /client/registrations/current — 全利用者の、その日に有効な被保険者証（登録の無い利用者は含まない） */
      listCurrent: (params?: CurrentInsuranceQuery) =>
        tx.request<CurrentInsuranceRegistration[]>("GET", `/client/registrations/current${buildQueryString(params)}`),
    },
    /** 負担割合証 — client.copay_certificates（毎年 8/1 切替） */
    copayCertificates: {
      /** GET /client/clients/:client_id/copay-certificates */
      list: (clientId: string) =>
        tx.request<CopayCertificate[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/copay-certificates`),
      /** POST /client/clients/:client_id/copay-certificates */
      create: (clientId: string, input: CreateCopayCertificateInput) =>
        tx.request<CopayCertificate>("POST", `/client/clients/${pathParam(clientId, "clientId")}/copay-certificates`, input),
      /** PATCH /client/clients/:client_id/copay-certificates/:copay_certificate_id */
      update: (clientId: string, copayCertificateId: string, input: UpdateCopayCertificateInput) =>
        tx.request<CopayCertificate>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/copay-certificates/${pathParam(copayCertificateId, "copayCertificateId")}`, input),
      /** DELETE /client/clients/:client_id/copay-certificates/:copay_certificate_id */
      delete: (clientId: string, copayCertificateId: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/copay-certificates/${pathParam(copayCertificateId, "copayCertificateId")}`),
    },
    /** 公費受給者証（0〜3 件/人） — client.kohi_certificates */
    kohiCertificates: {
      /** GET /client/clients/:client_id/kohi-certificates */
      list: (clientId: string) =>
        tx.request<KohiCertificate[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/kohi-certificates`),
      /** POST /client/clients/:client_id/kohi-certificates */
      create: (clientId: string, input: CreateKohiCertificateInput) =>
        tx.request<KohiCertificate>("POST", `/client/clients/${pathParam(clientId, "clientId")}/kohi-certificates`, input),
      /** PATCH /client/clients/:client_id/kohi-certificates/:kohi_certificate_id */
      update: (clientId: string, kohiCertificateId: string, input: UpdateKohiCertificateInput) =>
        tx.request<KohiCertificate>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/kohi-certificates/${pathParam(kohiCertificateId, "kohiCertificateId")}`, input),
      /** DELETE /client/clients/:client_id/kohi-certificates/:kohi_certificate_id */
      delete: (clientId: string, kohiCertificateId: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/kohi-certificates/${pathParam(kohiCertificateId, "kohiCertificateId")}`),
    },
    certificates: {
      /** GET /client/certificates — 証・資格の一覧（利用者 × 4 種の要約・期限切れ間近つき） */
      list: (params?: ClientCertificateListQuery) =>
        tx.request<ClientCertificateSummary[]>("GET", `/client/certificates${buildQueryString(params)}`),
    },
  };
}

export function createCustomerNamespace(tx: SdkTransport) {
  return {
    clients: {
      list: (params?: { q?: string }) => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        const q = qs.toString();
        return tx.request<CustomerClient[]>("GET", `/client/customer/clients${q ? `?${q}` : ""}`);
      },
      getOverview: (id: string) =>
        tx.request<CustomerClientOverview>("GET", `/client/customer/clients/${pathParam(id, "id")}/overview`),
      /** GET /client/customer/clients/:id/actual-timeline — 実績タイムライン（記録 4 種 + 送迎 + モニタリング / 評価） */
      getActualTimeline: (id: string, params?: CustomerMonthsQuery) =>
        tx.request<CustomerActualTimelineEvent[]>("GET", `/client/customer/clients/${pathParam(id, "id")}/actual-timeline${buildQueryString(params)}`),
      /** GET /client/customer/clients/:id/care-trend — 要介護度 × ADL の推移 */
      getCareTrend: (id: string) =>
        tx.request<CustomerCareTrend | null>("GET", `/client/customer/clients/${pathParam(id, "id")}/care-trend`),
      /** GET /client/customer/clients/:id/certification-alert — 認定期限・再アセスメントの目安 */
      getCertificationAlert: (id: string) =>
        tx.request<CustomerCertificationAlert | null>("GET", `/client/customer/clients/${pathParam(id, "id")}/certification-alert`),
      /** GET /client/customer/clients/:id/timeline — 利用者タイムライン（介護認定・アセスメント・録音） */
      getTimeline: (id: string, params?: CustomerMonthsQuery) =>
        tx.request<CustomerTimelineEvent[]>("GET", `/client/customer/clients/${pathParam(id, "id")}/timeline${buildQueryString(params)}`),
      /** GET /client/customer/clients/:id/care-records — 支援記録一覧（記録 4 種 + 送迎） */
      listCareRecords: (id: string, params?: CustomerCareRecordsQuery) =>
        tx.request<CustomerCareRecordEvent[]>("GET", `/client/customer/clients/${pathParam(id, "id")}/care-records${buildQueryString(params)}`),
      /** GET /client/customer/clients/:id/monitorings — モニタリング・計画評価 */
      listMonitorings: (id: string, params?: CustomerMonthsQuery) =>
        tx.request<CustomerMonitoringList>("GET", `/client/customer/clients/${pathParam(id, "id")}/monitorings${buildQueryString(params)}`),
    },
    contracts: {
      /** GET /client/customer/contracts — 契約状況つき利用者一覧 */
      list: () => tx.request<CustomerContractClient[]>("GET", "/client/customer/contracts"),
    },
  };
}

export function createIntakeNamespace(tx: SdkTransport) {
  return {
    template: {
      /**
       * テンプレートダウンロード URL を取得
       * GET /client/intake/template
       */
      get: (params?: { type?: "client_wide" }) => {
        const qs = new URLSearchParams();
        if (params?.type) qs.set("type", params.type);
        const q = qs.toString();
        return tx.request<IntakeTemplateResult>(
          "GET",
          `/client/intake/template${q ? `?${q}` : ""}`,
        );
      },
      upload: (file: File | Blob, facilityId: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("facility_id", facilityId);
        return tx.requestMultipart<IntakeUploadPreview>("/client/intake/upload", formData);
      },
      commit: (file: File | Blob, facilityId: string, resolutions: IntakeOverlapResolution[] = []) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("facility_id", facilityId);
        if (resolutions.length > 0) formData.append("resolutions", JSON.stringify(resolutions));
        return tx.requestMultipart<IntakeCommitResult>("/client/intake/commit", formData);
      },
    },
    jobs: {
      /**
       * 取込ジョブ一覧
       * GET /client/intake/jobs
       */
      list: (params?: ListImportJobsQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.import_type) qs.set("importType", params.import_type);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<ImportJob[]>(
          "GET",
          `/client/intake/jobs${q ? `?${q}` : ""}`,
        );
      },
      /**
       * 取込ジョブ詳細
       * GET /client/intake/jobs/:id
       */
      get: (id: string) => tx.request<ImportJob>("GET", `/client/intake/jobs/${pathParam(id, "id")}`),
      /** POST /client/intake/jobs/:id/cancel — 進行中（pending / processing）の取込ジョブを取り消す */
      cancel: (id: string) => tx.request<void>("POST", `/client/intake/jobs/${pathParam(id, "id")}/cancel`),
    },
  };
}
