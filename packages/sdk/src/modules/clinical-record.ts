
import type {
  ApplyDiagnosisCodesInput,
  ApplyDiagnosisCodesResult,
  ClinicalConditionPeriod,
  ClinicalDiagnosis,
  ClinicalDoctorExam,
  ClinicalDoctorInstruction,
  ClinicalDocumentOcrInput,
  ClinicalDocumentOcrResult,
  ClinicalHospitalization,
  ClinicalNursingProgress,
  ClinicalRecordBundle,
  ClinicalRecordListQuery,
  ClinicalRenkeiEvent,
  ClinicalSourceDocumentLink,
  ClinicalSourceDocumentPage,
  ConditionCandidatesView,
  CreateConditionPeriodInput,
  CreateDiagnosisInput,
  CreateDoctorExamInput,
  CreateDoctorInstructionInput,
  CreateHospitalizationInput,
  CreateNursingProgressInput,
  CreateRenkeiEventInput,
  DayNursingProgress,
  DiagnosisMatchOutcome,
  DismissConditionCandidateInput,
  DismissedConditionCandidate,
  ListDayNursingProgressQuery,
  MatchDiagnosisNamesInput,
  NursingChart,
  NursingChartQuery,
  SaveDischargeGuidanceInput,
  SaveDischargeGuidanceResult,
  SetVitalRecheckThresholdsInput,
  UncodedDiagnosesView,
  UpdateConditionPeriodInput,
  UpdateDiagnosisInput,
  UpdateDoctorExamInput,
  UpdateDoctorInstructionInput,
  UpdateHospitalizationInput,
  UpdateNursingProgressInput,
  UpdateRenkeiEventInput,
  VitalRecheckThresholds,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createClinicalRecordNamespace(tx: SdkTransport) {
  return {
    ocr: {
      /** 書類の種類と項目を読み取る。記録は保存しない。 */
      analyze: (clientId: string, input: ClinicalDocumentOcrInput) =>
        tx.request<ClinicalDocumentOcrResult>("POST", `/clinical-record/ocr/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
    },
    /** 訪問看護指示書（doctor_instructions） */
    instructions: {
      /** 指示書の原本を開くための短期 URL。 */
      sourceDocuments: (clientId: string, id: string) =>
        tx.request<ClinicalSourceDocumentLink[]>("GET", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/source-documents`),
      /** 原本のページと種類だけ（URL なし）。 */
      sourcePages: (clientId: string, id: string) =>
        tx.request<ClinicalSourceDocumentPage[]>("GET", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/source-documents/pages`),
      /** GET /clinical-record/instructions/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalDoctorInstruction[]>("GET", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/instructions/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalDoctorInstruction>("GET", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/instructions/clients/:clientId */
      create: (clientId: string, input: CreateDoctorInstructionInput) =>
        tx.request<ClinicalDoctorInstruction>("POST", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/instructions/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateDoctorInstructionInput) =>
        tx.request<ClinicalDoctorInstruction>("PATCH", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/instructions/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/instructions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
    },
    /** 医療連携イベント（medical_renkei_events） */
    renkeiEvents: {
      /** 退院時共同指導の原本を開くための短期 URL。 */
      sourceDocuments: (clientId: string, id: string) =>
        tx.request<ClinicalSourceDocumentLink[]>("GET", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/source-documents`),
      /** 原本のページと種類だけ（URL なし）。 */
      sourcePages: (clientId: string, id: string) =>
        tx.request<ClinicalSourceDocumentPage[]>("GET", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/source-documents/pages`),
      /** GET /clinical-record/renkei-events/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalRenkeiEvent[]>("GET", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/renkei-events/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalRenkeiEvent>("GET", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/renkei-events/clients/:clientId */
      create: (clientId: string, input: CreateRenkeiEventInput) =>
        tx.request<ClinicalRenkeiEvent>("POST", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/renkei-events/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateRenkeiEventInput) =>
        tx.request<ClinicalRenkeiEvent>("PATCH", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/renkei-events/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/renkei-events/clients/:clientId/:id/confirm — 退院時共同指導の記録を確定する（足りなければ 422 と足りない項目） */
      confirm: (clientId: string, id: string) =>
        tx.request<ClinicalRenkeiEvent>("POST", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/confirm`),
      /** POST /clinical-record/renkei-events/clients/:clientId/discharge-guidance — 訪問看護の退院時共同指導を 1 回で保存する（入退院 + 記録を 1 トランザクション。confirm なら確定まで・足りなければ confirmed: false と missing） */
      saveDischargeGuidance: (clientId: string, input: SaveDischargeGuidanceInput) =>
        tx.request<SaveDischargeGuidanceResult>("POST", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/discharge-guidance`, input as unknown as Record<string, unknown>),
      /** POST /clinical-record/renkei-events/clients/:clientId/:id/unconfirm — 確定を取り消す（理由は必須） */
      unconfirm: (clientId: string, id: string, input: { reason: string }) =>
        tx.request<ClinicalRenkeiEvent>("POST", `/clinical-record/renkei-events/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/unconfirm`, input),
    },
    bundle: {
      /** GET /clinical-record/clients/:client_id/bundle — 1 利用者の臨床記録 6 種を 1 束で */
      get: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalRecordBundle>("GET", `/clinical-record/clients/${pathParam(clientId, "clientId")}/bundle${buildQueryString(params)}`),
    },
    /** 別表7/8 該当期間（client_condition_periods） */
    conditions: {
      /** GET /clinical-record/conditions/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalConditionPeriod[]>("GET", `/clinical-record/conditions/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/conditions/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalConditionPeriod>("GET", `/clinical-record/conditions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/conditions/clients/:clientId */
      create: (clientId: string, input: CreateConditionPeriodInput) =>
        tx.request<ClinicalConditionPeriod>("POST", `/clinical-record/conditions/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/conditions/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateConditionPeriodInput) =>
        tx.request<ClinicalConditionPeriod>("PATCH", `/clinical-record/conditions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/conditions/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/conditions/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** GET /clinical-record/clients/:client_id/condition-candidates — 別表7/8 の候補（傷病名・指示書から計算。確定はしない） */
      listCandidates: (clientId: string) =>
        tx.request<ConditionCandidatesView>("GET", `/clinical-record/clients/${pathParam(clientId, "clientId")}/condition-candidates`),
      /** POST /clinical-record/clients/:client_id/condition-candidates/dismiss — 候補を「あたらない」と外す（理由を残す） */
      dismissCandidate: (clientId: string, input: DismissConditionCandidateInput) =>
        tx.request<DismissedConditionCandidate>("POST", `/clinical-record/clients/${pathParam(clientId, "clientId")}/condition-candidates/dismiss`, input as unknown as Record<string, unknown>),
    },
    /** 傷病名（clinical_diagnoses） */
    diagnoses: {
      /** GET /clinical-record/diagnoses/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalDiagnosis[]>("GET", `/clinical-record/diagnoses/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/diagnoses/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalDiagnosis>("GET", `/clinical-record/diagnoses/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/diagnoses/clients/:clientId */
      create: (clientId: string, input: CreateDiagnosisInput) =>
        tx.request<ClinicalDiagnosis>("POST", `/clinical-record/diagnoses/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/diagnoses/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateDiagnosisInput) =>
        tx.request<ClinicalDiagnosis>("PATCH", `/clinical-record/diagnoses/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/diagnoses/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/diagnoses/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/diagnoses/match — 傷病名の名前（20 件まで）を支払基金のマスターに当てる。記録は書かない */
      match: (input: MatchDiagnosisNamesInput) =>
        tx.request<DiagnosisMatchOutcome>("POST", `/clinical-record/diagnoses/match`, input as unknown as Record<string, unknown>),
      /** GET /clinical-record/diagnoses/uncoded — コードの無い傷病名をマスターに当てて 3 区画で返す（記録は書かない） */
      listUncoded: () => tx.request<UncodedDiagnosesView>("GET", `/clinical-record/diagnoses/uncoded`),
      /** POST /clinical-record/diagnoses/apply-codes — コードの無い傷病名にコードをまとめて付ける（名前・精神疾患の印は変えない。違う行は飛ばして件数で返す） */
      applyCodes: (input: ApplyDiagnosisCodesInput) =>
        tx.request<ApplyDiagnosisCodesResult>("POST", `/clinical-record/diagnoses/apply-codes`, input as unknown as Record<string, unknown>),
    },
    /** 入退院エピソード（hospitalization_episodes） */
    hospitalizations: {
      /** GET /clinical-record/hospitalizations/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalHospitalization[]>("GET", `/clinical-record/hospitalizations/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/hospitalizations/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalHospitalization>("GET", `/clinical-record/hospitalizations/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/hospitalizations/clients/:clientId */
      create: (clientId: string, input: CreateHospitalizationInput) =>
        tx.request<ClinicalHospitalization>("POST", `/clinical-record/hospitalizations/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/hospitalizations/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateHospitalizationInput) =>
        tx.request<ClinicalHospitalization>("PATCH", `/clinical-record/hospitalizations/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/hospitalizations/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/hospitalizations/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
    },
    /** 医師診療日イベント（doctor_examination_events） */
    doctorExams: {
      /** GET /clinical-record/doctor-exams/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalDoctorExam[]>("GET", `/clinical-record/doctor-exams/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /clinical-record/doctor-exams/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalDoctorExam>("GET", `/clinical-record/doctor-exams/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/doctor-exams/clients/:clientId */
      create: (clientId: string, input: CreateDoctorExamInput) =>
        tx.request<ClinicalDoctorExam>("POST", `/clinical-record/doctor-exams/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/doctor-exams/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateDoctorExamInput) =>
        tx.request<ClinicalDoctorExam>("PATCH", `/clinical-record/doctor-exams/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/doctor-exams/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/doctor-exams/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
    },
    /** 看護経過記録（nursing_progress_records・通所の看護経過ボード） */
    nursingProgress: {
      /** GET /clinical-record/nursing-progress/clients/:clientId */
      list: (clientId: string, params?: ClinicalRecordListQuery) =>
        tx.request<ClinicalNursingProgress[]>("GET", `/clinical-record/nursing-progress/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /**
       * 事業所 × 日付の看護経過記録（看護経過ボード）
       * GET /clinical-record/nursing-progress/day?facilityId=uuid&date=YYYY-MM-DD
       */
      listDay: (params: ListDayNursingProgressQuery) => {
        const qs = new URLSearchParams({ facilityId: params.facilityId, date: params.date }).toString();
        return tx.request<DayNursingProgress[]>("GET", `/clinical-record/nursing-progress/day?${qs}`);
      },
      /**
       * 1 利用者の看護経過表（行 = 日・新しい順）と前回の処置
       * GET /clinical-record/clients/:clientId/nursing-chart?from=&to=
       */
      chart: (clientId: string, params?: NursingChartQuery) =>
        tx.request<NursingChart>("GET", `/clinical-record/clients/${pathParam(clientId, "clientId")}/nursing-chart${buildQueryString(params)}`),
      /** GET /clinical-record/nursing-progress/clients/:clientId/:id */
      get: (clientId: string, id: string) =>
        tx.request<ClinicalNursingProgress>("GET", `/clinical-record/nursing-progress/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** POST /clinical-record/nursing-progress/clients/:clientId */
      create: (clientId: string, input: CreateNursingProgressInput) =>
        tx.request<ClinicalNursingProgress>("POST", `/clinical-record/nursing-progress/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      /** PATCH /clinical-record/nursing-progress/clients/:clientId/:id */
      update: (clientId: string, id: string, input: UpdateNursingProgressInput) =>
        tx.request<ClinicalNursingProgress>("PATCH", `/clinical-record/nursing-progress/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/nursing-progress/clients/:clientId/:id */
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/clinical-record/nursing-progress/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
    },
    vitalRecheckThresholds: {
      /** GET /clinical-record/clients/:client_id/vital-recheck-thresholds — null なら個別の基準は無い（全体の基準） */
      get: (clientId: string) =>
        tx.request<VitalRecheckThresholds | null>("GET", `/clinical-record/clients/${pathParam(clientId, "clientId")}/vital-recheck-thresholds`),
      /** PUT /clinical-record/clients/:client_id/vital-recheck-thresholds — 送った項目だけ変える（null で全体の基準） */
      set: (clientId: string, input: SetVitalRecheckThresholdsInput) =>
        tx.request<VitalRecheckThresholds>("PUT", `/clinical-record/clients/${pathParam(clientId, "clientId")}/vital-recheck-thresholds`, input as unknown as Record<string, unknown>),
      /** DELETE /clinical-record/clients/:client_id/vital-recheck-thresholds — 全体の基準に戻す */
      delete: (clientId: string) =>
        tx.request<null>("DELETE", `/clinical-record/clients/${pathParam(clientId, "clientId")}/vital-recheck-thresholds`),
    },
  };
}
