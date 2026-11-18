
import type {
  Assessment,
  AssessmentAdl,
  AssessmentClient,
  AssessmentDetail,
  AssessmentOcrAnalyzeInput,
  AssessmentOcrAnalyzeResult,
  AssessmentScore,
  BarthelUpdateInput,
  BasicChecklist,
  CreateAssessmentInput,
  CreateAssessmentScoreInput,
  CreateBasicChecklistInput,
  CreateInterestChecklistInput,
  CreateLifeFunctionChecklistInput,
  CreateLifeSubmissionInput,
  CreateRecordingInput,
  InterestChecklist,
  LifeFunctionChecklist,
  LifeSubmission,
  Recording,
  UpdateAssessmentInput,
  UpdateAssessmentScoreInput,
  UpdateBasicChecklistInput,
  UpdateInterestChecklistInput,
  UpdateLifeFunctionChecklistInput,
  UpdateLifeSubmissionInput,
  UploadUrlResponse,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createAssessmentNamespace(tx: SdkTransport) {
  return {
    clients: {
      /** GET /assessment/clients — 見える範囲の利用者と、それぞれの最新のアセスメント実施日（未実施は null） */
      list: () => tx.request<AssessmentClient[]>("GET", "/assessment/clients"),
    },
    assessments: {
      list: (clientId: string) =>
        tx.request<Assessment[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments`),
      get: (clientId: string, id: string) =>
        tx.request<AssessmentDetail>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateAssessmentInput) =>
        tx.request<AssessmentDetail>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments`, input),
      update: (clientId: string, id: string, input: UpdateAssessmentInput) =>
        tx.request<AssessmentDetail>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/${pathParam(id, "id")}`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/${pathParam(id, "id")}`),
      compare: (clientId: string, id1: string, id2: string) =>
        tx.request<AssessmentDetail[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/compare?ids=${encodeURIComponent(id1)},${encodeURIComponent(id2)}`),
    },
    adl: {
      get: (clientId: string, id: string) =>
        tx.request<AssessmentAdl>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/${pathParam(id, "id")}/adl`),
    },
    basicChecklists: {
      list: (clientId: string) =>
        tx.request<BasicChecklist[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/basic-checklists`),
      get: (clientId: string, id: string) =>
        tx.request<BasicChecklist>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/basic-checklists/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateBasicChecklistInput) =>
        tx.request<BasicChecklist>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/basic-checklists`, input),
      update: (clientId: string, id: string, input: UpdateBasicChecklistInput) =>
        tx.request<BasicChecklist>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/basic-checklists/${pathParam(id, "id")}`, input),
    },
    interestChecklists: {
      list: (clientId: string) =>
        tx.request<InterestChecklist[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/interest-checklists`),
      get: (clientId: string, id: string) =>
        tx.request<InterestChecklist>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/interest-checklists/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateInterestChecklistInput) =>
        tx.request<InterestChecklist>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/interest-checklists`, input),
      update: (clientId: string, id: string, input: UpdateInterestChecklistInput) =>
        tx.request<InterestChecklist>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/interest-checklists/${pathParam(id, "id")}`, input),
    },
    lifeFunctionChecklists: {
      list: (clientId: string) =>
        tx.request<LifeFunctionChecklist[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/life-function-checklists`),
      get: (clientId: string, id: string) =>
        tx.request<LifeFunctionChecklist>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/life-function-checklists/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateLifeFunctionChecklistInput) =>
        tx.request<LifeFunctionChecklist>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/life-function-checklists`, input),
      update: (clientId: string, id: string, input: UpdateLifeFunctionChecklistInput) =>
        tx.request<LifeFunctionChecklist>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/life-function-checklists/${pathParam(id, "id")}`, input),
    },
    recordings: {
      /** POST /assessment/clients/:client_id/recordings/upload-url — 録音の presigned PUT URL（sha256 = ファイルの SHA-256 の base64。置き場は Object Lock なので、渡すと署名したヘッダーに入り、PUT には同じ値の x-amz-checksum-sha256 を付ける。無いと PUT が断られる） */
      getUploadUrl: (clientId: string, input: { filename: string; content_type: string; size_bytes: number; sha256?: string }) =>
        tx.request<UploadUrlResponse>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/upload-url`, input),
      create: (clientId: string, input: CreateRecordingInput) =>
        tx.request<Recording>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings`, input),
      list: (clientId: string) =>
        tx.request<Recording[]>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings`),
      /** GET /assessment/recordings — 組織全体の録音（利用者をまたぐ・新しい順に 100 件・利用者名つき） */
      listAll: () => tx.request<Recording[]>("GET", "/assessment/recordings"),
      get: (clientId: string, id: string) =>
        tx.request<Recording>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}`),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}`),
      getPlaybackUrl: (clientId: string, id: string) =>
        tx.request<{ url: string }>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}/playback-url`),
      transcribe: (clientId: string, id: string) =>
        tx.request<Recording>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}/transcribe`),
      summarize: (clientId: string, id: string) =>
        tx.request<Recording>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}/summarize`),
      link: (clientId: string, id: string, assessmentId: string) =>
        tx.request<Recording>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/recordings/${pathParam(id, "id")}/link`, { assessment_id: assessmentId }),
    },
    ocr: {
      analyze: (input: AssessmentOcrAnalyzeInput): Promise<AssessmentOcrAnalyzeResult> =>
        tx.request<AssessmentOcrAnalyzeResult>("POST", "/assessment/ocr/analyze", input),
    },
    lifeSubmissions: {
      list: (clientId: string, params?: { life_form_code?: string; submission_type?: string; status?: string }) => {
        const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>).toString() : "";
        return tx.request<LifeSubmission[]>("GET", `/assessment/clients/${clientId}/life-submissions${qs}`);
      },
      get: (clientId: string, id: string) =>
        tx.request<LifeSubmission>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/life-submissions/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateLifeSubmissionInput) =>
        tx.request<LifeSubmission>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/life-submissions`, input),
      update: (clientId: string, id: string, input: UpdateLifeSubmissionInput) =>
        tx.request<LifeSubmission>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/life-submissions/${pathParam(id, "id")}`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/assessment/clients/${pathParam(clientId, "clientId")}/life-submissions/${pathParam(id, "id")}`),
    },
    assessmentScores: {
      list: (clientId: string, params?: { score_type?: string; life_form_code?: string }) => {
        const qs = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>).toString() : "";
        return tx.request<AssessmentScore[]>("GET", `/assessment/clients/${clientId}/assessment-scores${qs}`);
      },
      get: (clientId: string, id: string) =>
        tx.request<AssessmentScore>("GET", `/assessment/clients/${pathParam(clientId, "clientId")}/assessment-scores/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateAssessmentScoreInput) =>
        tx.request<AssessmentScore>("POST", `/assessment/clients/${pathParam(clientId, "clientId")}/assessment-scores`, input),
      update: (clientId: string, id: string, input: UpdateAssessmentScoreInput) =>
        tx.request<AssessmentScore>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/assessment-scores/${pathParam(id, "id")}`, input),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/assessment/clients/${pathParam(clientId, "clientId")}/assessment-scores/${pathParam(id, "id")}`),
    },
    barthel: {
      update: (clientId: string, assessmentId: string, input: BarthelUpdateInput) =>
        tx.request<AssessmentAdl>("PATCH", `/assessment/clients/${pathParam(clientId, "clientId")}/assessments/${pathParam(assessmentId, "assessmentId")}/adl/barthel`, input),
    },
  };
}
