import { WORKING_FACILITY_HEADER } from "@qaito/schemas/facilities";
import type {
  ApiResponse,
} from "./types.js";
import { QaitoOAuth } from "./auth.js";
import { QaitoError } from "./error.js";
import { dataUrlToBlob } from "./serialize.js";
import type { ListEnvelope, SdkTransport } from "./transport.js";
import { createAppsNamespace, createModulesNamespace, createToolsNamespace } from "./meta.js";
import { createAlertsNamespace, createAnalyticsNamespace } from "./modules/analytics.js";
import { createAssessmentNamespace } from "./modules/assessment.js";
import { createCareplanNamespace, createPdfNamespace, createTrainingPlanNamespace, createDayservicePlanNamespace, createHomecarePlanNamespace, createEquipmentPlanNamespace, createNursingPlanNamespace, createRehabPlanNamespace } from "./modules/care-plan.js";
import { createTrainingNamespace, createVitalsNamespace, createContactnoteNamespace, createCarerecordNamespace } from "./modules/care-record.js";
import { createCareplanLinkNamespace } from "./modules/careplan-link.js";
import { createAnnouncementNamespace } from "./modules/announcement.js";
import { createMessageNamespace } from "./modules/message.js";
import { createLibraryNamespace } from "./modules/library.js";
import { createCalendarNamespace } from "./modules/calendar.js";
import { createMedicalInstitutionNamespace } from "./modules/medical-institution.js";
import { createCareOfficeNamespace } from "./modules/care-office.js";
import { createContactNamespace } from "./modules/contact.js";
import { createPhoneNamespace } from "./modules/phone.js";
import { createVideoAnalysisNamespace } from "./modules/video-analysis.js";
import { createPhoneRecordingNamespace } from "./modules/phone-recording.js";
import { createMeetingNamespace } from "./modules/meeting.js";
import { createDailyClosingNamespace } from "./modules/daily-closing.js";
import { createDailyClosingBudgetNamespace } from "./modules/daily-closing-budget.js";
import { createMeetingRecordingNamespace } from "./modules/meeting-recording.js";
import { createMedicationNamespace } from "./modules/medication.js";
import { createReferenceNamespace } from "./modules/reference.js";
import { createFormsNamespace } from "./modules/forms.js";
import { createClaimsNamespace } from "./modules/claims.js";
import { createRiyohyoNamespace } from "./modules/riyohyo.js";
import { createClientNamespace, createInsuranceNamespace, createCustomerNamespace, createIntakeNamespace } from "./modules/client.js";
import { createContractsNamespace } from "./modules/client-billing.js";
import { createClinicalRecordNamespace } from "./modules/clinical-record.js";
import { createNursingNamespace } from "./modules/nursing.js";
import { createDayserviceDailyNamespace } from "./modules/dayservice.js";
import { createEquipmentRentalNamespace } from "./modules/equipment-rental.js";
import { createCompanyNamespace, createFacilityNamespace } from "./modules/facility.js";
import { createLifeNamespace } from "./modules/life.js";
import { createMediaLogNamespace } from "./modules/media.js";
import { createDirectiveNamespace } from "./modules/directive.js";
import { createFeedbackNamespace } from "./modules/feedback.js";
import { createMonitoringNamespace, createEvaluationNamespace } from "./modules/plan-review.js";
import { createScheduleNamespace } from "./modules/schedule.js";
import { createShiftNamespace } from "./modules/shift.js";
import { createJobRoleNamespace, createStaffNamespace } from "./modules/staff.js";
import { createTransportPlanNamespace, createTransportLogNamespace } from "./modules/transport.js";
import { createDeviceNamespace, createOAuthNamespace } from "./platform/auth.js";
import { createLlmNamespace, createChatNamespace } from "./platform/chat.js";
import { createTalkNamespace, createDevicesNamespace } from "./platform/device.js";
import { createStorageNamespace } from "./platform/storage.js";
import { createAccessControlNamespace } from "./platform/access-control.js";
import { createOrganizationNamespace } from "./platform/organization.js";
import { createMapNamespace } from "./platform/map.js";
import { createUsageNamespace } from "./platform/usage-billing.js";
import { createVoiceNamespace } from "./platform/voice.js";
import { createIntegrationNamespace } from "./platform/integration.js";

export { QaitoError };

export type QaitoClientOptions = {
  /**
   * 通常（confidential client）モード: raw API キー。
   * public client（PKCE）モードでは apiKeyPrefix を使うため不要。
   * いずれか一方が必須（両方 undefined は constructor でエラー）。
   */
  apiKey?: string;
  /**
   * public client モード: key_prefix のみ（raw キー不要）。
   * 組み込みの外部アプリが `oauth.client(app, orgSlug)`（GET /auth/oauth/client）で取得した client_id を渡す。
   * PKCE（code_verifier）が必須なため secret なしで安全に動作する（RFC 7636）。
   */
  apiKeyPrefix?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  /**
   * 作業中の事業所。業務の記録を事業所を省いて作ったとき、この事業所で作る（`X-Qaito-Facility-Id` で送る）。
   * 見てよい範囲の外なら api が無視する。記録ごとに決めるなら作成の入力の `facility_id` / `facilityId` を使う（そちらが優先）
   */
  workingFacilityId?: string;
  userToken?: string;
  /**
   * @deprecated portalUrl は getAuthorizationUrl の引数 `portalBaseUrl` に移動した。
   * 後方互換のため残すが、OAuth2 フローには使われない（各 getAuthorizationUrl 呼び出しで動的に渡す）。
   */
  portalUrl?: string;
  redirectUri?: string;
  /** トークン更新時の永続化フック（QaitoOAuthOptions.onTokensChanged 参照） */
  onTokensChanged?: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }) => void;
};

export class QaitoClient {
  /** confidential client の raw API キー（後方互換・SDK の request ヘッダに使用）*/
  /** 全リクエストに載せる追加ヘッダ（内部呼び出し元の名乗り。`QaitoClientOptions.defaultHeaders`） */
  private defaultHeaders: Record<string, string> | undefined;
  /** 作業中の事業所（`QaitoClientOptions.workingFacilityId`） */
  private workingFacilityId: string | undefined;
  private apiKey: string | undefined;
  /** public client の key_prefix*/
  private apiKeyPrefix: string | undefined;
  private baseUrl: string;
  private userToken: string | undefined;
  private oauthAuth: QaitoOAuth | undefined;

  auth: QaitoOAuth | undefined;

  /**
   * 名前空間へ渡す通信の口（`src/transport.ts`）。
   *
   * ⚠️ **宣言順が意味を持つ。** 下の `client = createClientNamespace(this.tx)` などは
   * クラスフィールドの初期化子で、宣言順に走る。`tx` はそれらより前で初期化する必要がある。
   * また `baseUrl` / `apiKey` / `oauthAuth` は**コンストラクタ本体**で代入され、
   * クラスフィールドの初期化子はそれより先に走るため、値ではなく**関数**で包んで
   * 参照を呼び出し時まで遅延させる（値で持つと `undefined` を焼き込む）。
   */
  private readonly tx: SdkTransport = {
    getBaseUrl: () => this.baseUrl,
    request: <T,>(method: string, path: string, body?: unknown): Promise<T> =>
      this.request<T>(method, path, body),
    requestBinary: <T,>(method: string, path: string, body: ArrayBuffer | Uint8Array): Promise<T> =>
      this.requestBinary<T>(method, path, body),
    requestMultipart: <T,>(path: string, formData: FormData): Promise<T> =>
      this.requestMultipart<T>(path, formData),
    requestEnvelope: <T>(method: string, path: string, body?: unknown): Promise<ListEnvelope<T>> =>
      this.requestEnvelope<T>(method, path, body),
    requestStream: (method: string, path: string, body?: unknown): Promise<ReadableStream> =>
      this.requestStream(method, path, body),
    requestBlob: (method: string, path: string, body?: unknown): Promise<Blob> =>
      this.requestBlob(method, path, body),
    authHeaders: () => this.getAuthHeaders(),
    bearerToken: () => this.userToken ?? this.oauthAuth?.getAccessToken(),
    getApiKey: () => this.apiKey,
  };

  constructor(options: QaitoClientOptions) {
    this.defaultHeaders = options.defaultHeaders;
    this.workingFacilityId = options.workingFacilityId;
    this.apiKey = options.apiKey;
    this.apiKeyPrefix = options.apiKeyPrefix;
    this.baseUrl = options.baseUrl ?? "https://api.app.qaito.ai";
    this.userToken = options.userToken;

    if (options.redirectUri) {
      if (!options.apiKey && !options.apiKeyPrefix) {
        throw new Error("QaitoClient: OAuth2 フローには apiKey または apiKeyPrefix が必要です");
      }
      this.oauthAuth = new QaitoOAuth({
        apiKey: options.apiKey,
        apiKeyPrefix: options.apiKeyPrefix,
        baseUrl: this.baseUrl,
        redirectUri: options.redirectUri,
        onTokensChanged: options.onTokensChanged,
      });
      this.auth = this.oauthAuth;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    return (await this.requestJson<T>(method, path, body)).data;
  }

  private async requestEnvelope<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ListEnvelope<T>> {
    const json = await this.requestJson<T>(method, path, body);
    const extra = json as unknown as { total?: unknown; has_more?: unknown };
    return {
      data: json.data,
      ...(typeof extra.total === "number" ? { total: extra.total } : {}),
      ...(typeof extra.has_more === "boolean" ? { has_more: extra.has_more } : {}),
    };
  }

  /** 成功した応答の本文（`{ success: true, data, ... }`）。`request` / `requestEnvelope` の共通の中身 */
  private async requestJson<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ success: true; data: T }> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    this.applyAuthHeaders(headers);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new QaitoError(e instanceof Error ? e.message : "Network error", 0);
    }

    let json: ApiResponse<T>;
    try {
      json = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new QaitoError("Invalid JSON response from server", response.status);
    }

    if (!json.success && response.status === 401 && this.oauthAuth) {
      const refreshed = await this.oauthAuth.refreshToken();
      if (refreshed) {
        const newToken = this.oauthAuth.getAccessToken();
        if (!newToken) throw new QaitoError("Token refresh succeeded but no token available", 401);
        this.applyAuthHeaders(headers, newToken);
        const retryResponse = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        let retryJson: ApiResponse<T>;
        try {
          retryJson = (await retryResponse.json()) as ApiResponse<T>;
        } catch {
          throw new QaitoError("Invalid JSON response from server", retryResponse.status);
        }
        if (!retryJson.success) {
          throw new QaitoError(retryJson.error, retryResponse.status, retryJson.code, retryJson.reason, retryJson.details);
        }
        return retryJson;
      }
    }

    if (!json.success) {
      throw new QaitoError(json.error, response.status, json.code, json.reason, json.details);
    }

    return json;
  }

  private applyAuthHeaders(headers: Record<string, string>, overrideToken?: string): void {
    if (this.defaultHeaders) {
      for (const [k, v] of Object.entries(this.defaultHeaders)) headers[k] = v;
    }
    if (this.workingFacilityId) headers[WORKING_FACILITY_HEADER] = this.workingFacilityId;
    const token = overrideToken ?? this.userToken ?? this.oauthAuth?.getAccessToken();
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      if (token) headers["X-User-Token"] = token;
    } else {
      if (this.apiKeyPrefix) headers["X-Api-Key-Prefix"] = this.apiKeyPrefix;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    this.applyAuthHeaders(headers);
    return headers;
  }

  /**
   * 生のバイト列を投げる（`application/octet-stream`）。
   *
   * JSON 化できない body 専用（音声入力の PCM）。**body をログに出さない**
   * ＝ 失敗時も status と code だけを載せる（PII が音声そのものだから）。
   * 401 のリフレッシュ再送は `request` と同じ（送り直すのは同じバイト列）。
   */
  private async requestBinary<T>(
    method: string,
    path: string,
    body: ArrayBuffer | Uint8Array
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };
    this.applyAuthHeaders(headers);

    let response: Response;
    try {
      response = await fetch(url, { method, headers, body: body as BodyInit });
    } catch (e) {
      throw new QaitoError(e instanceof Error ? e.message : "Network error", 0);
    }

    let json: ApiResponse<T>;
    try {
      json = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new QaitoError("Invalid JSON response from server", response.status);
    }

    if (!json.success && response.status === 401 && this.oauthAuth) {
      const refreshed = await this.oauthAuth.refreshToken();
      if (refreshed) {
        const newToken = this.oauthAuth.getAccessToken();
        if (!newToken) throw new QaitoError("Token refresh succeeded but no token available", 401);
        this.applyAuthHeaders(headers, newToken);
        const retryResponse = await fetch(url, { method, headers, body: body as BodyInit });
        let retryJson: ApiResponse<T>;
        try {
          retryJson = (await retryResponse.json()) as ApiResponse<T>;
        } catch {
          throw new QaitoError("Invalid JSON response from server", retryResponse.status);
        }
        if (!retryJson.success) {
          throw new QaitoError(retryJson.error, retryResponse.status, retryJson.code, retryJson.reason, retryJson.details);
        }
        return retryJson.data;
      }
    }

    if (!json.success) {
      throw new QaitoError(json.error, response.status, json.code, json.reason, json.details);
    }

    return json.data;
  }

  /** Data URL → Blob 変換（実体は `src/serialize.ts`。公開 static は後方互換で残す）*/
  static dataUrlToBlob(dataUrl: string): Blob {
    return dataUrlToBlob(dataUrl);
  }

  private async requestMultipart<T>(
    path: string,
    formData: FormData
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getAuthHeaders();

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch (e) {
      throw new QaitoError(e instanceof Error ? e.message : "Network error", 0);
    }

    let json: ApiResponse<T>;
    try {
      json = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new QaitoError("Invalid JSON response from server", response.status);
    }

    if (!json.success && response.status === 401 && this.oauthAuth) {
      const refreshed = await this.oauthAuth.refreshToken();
      if (refreshed) {
        const newToken = this.oauthAuth.getAccessToken();
        if (!newToken) throw new QaitoError("Token refresh succeeded but no token available", 401);
        this.applyAuthHeaders(headers, newToken);
        const retryResponse = await fetch(url, {
          method: "POST",
          headers,
          body: formData,
        });
        let retryJson: ApiResponse<T>;
        try {
          retryJson = (await retryResponse.json()) as ApiResponse<T>;
        } catch {
          throw new QaitoError("Invalid JSON response from server", retryResponse.status);
        }
        if (!retryJson.success) {
          throw new QaitoError(retryJson.error, retryResponse.status, retryJson.code, retryJson.reason, retryJson.details);
        }
        return retryJson.data;
      }
    }

    if (!json.success) {
      throw new QaitoError(json.error, response.status, json.code, json.reason, json.details);
    }

    return json.data;
  }

  private async requestStream(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ReadableStream> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    this.applyAuthHeaders(headers);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let message = "Request failed";
      let code: string | undefined;
      try {
        const json = (await response.json()) as { error: string; code?: string };
        message = json.error;
        code = json.code;
      } catch {}
      throw new QaitoError(message, response.status, code);
    }

    if (!response.body) {
      throw new QaitoError("No response body", 500);
    }

    return response.body;
  }

  private async requestBlob(
    method: string,
    path: string,
    body?: unknown
  ): Promise<Blob> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getAuthHeaders();
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      throw new QaitoError(e instanceof Error ? e.message : "Network error", 0);
    }

    if (!response.ok && response.status === 401 && this.oauthAuth) {
      const refreshed = await this.oauthAuth.refreshToken();
      if (refreshed) {
        const newToken = this.oauthAuth.getAccessToken();
        if (!newToken) throw new QaitoError("Token refresh succeeded but no token available", 401);
        this.applyAuthHeaders(headers, newToken);
        const retryResponse = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (!retryResponse.ok) {
          let message = "Request failed";
          let code: string | undefined;
          try {
            const json = (await retryResponse.json()) as { error: string; code?: string };
            message = json.error;
            code = json.code;
          } catch {}
          throw new QaitoError(message, retryResponse.status, code);
        }
        return retryResponse.blob();
      }
    }

    if (!response.ok) {
      let message = "Request failed";
      let code: string | undefined;
      try {
        const json = (await response.json()) as { error: string; code?: string };
        message = json.error;
        code = json.code;
      } catch {}
      throw new QaitoError(message, response.status, code);
    }

    return response.blob();
  }

  client = createClientNamespace(this.tx);
  insurance = createInsuranceNamespace(this.tx);
  customer = createCustomerNamespace(this.tx);
  intake = createIntakeNamespace(this.tx);

  contracts = createContractsNamespace(this.tx);

  assessment = createAssessmentNamespace(this.tx);

  clinicalRecord = createClinicalRecordNamespace(this.tx);
  nursing = createNursingNamespace(this.tx);

  facility = createFacilityNamespace(this.tx);
  company = createCompanyNamespace(this.tx);

  schedule = createScheduleNamespace(this.tx);

  monitoring = createMonitoringNamespace(this.tx);
  evaluation = createEvaluationNamespace(this.tx);

  shift = createShiftNamespace(this.tx);

  staff = createStaffNamespace(this.tx);
  jobRole = createJobRoleNamespace(this.tx);

  vitals = createVitalsNamespace(this.tx);
  carerecord = createCarerecordNamespace(this.tx);
  training = createTrainingNamespace(this.tx);
  contactnote = createContactnoteNamespace(this.tx);

  dayserviceDaily = createDayserviceDailyNamespace(this.tx);

  careplan = createCareplanNamespace(this.tx);
  dayservicePlan = createDayservicePlanNamespace(this.tx);
  trainingPlan = createTrainingPlanNamespace(this.tx);
  homecarePlan = createHomecarePlanNamespace(this.tx);
  equipmentPlan = createEquipmentPlanNamespace(this.tx);
  nursingPlan = createNursingPlanNamespace(this.tx);
  rehabPlan = createRehabPlanNamespace(this.tx);
  pdf = createPdfNamespace(this.tx);

  transportPlan = createTransportPlanNamespace(this.tx);
  transportLog = createTransportLogNamespace(this.tx);

  equipmentRental = createEquipmentRentalNamespace(this.tx);

  life = createLifeNamespace(this.tx);

  careplanLink = createCareplanLinkNamespace(this.tx);

  announcement = createAnnouncementNamespace(this.tx);

  library = createLibraryNamespace(this.tx);
  calendar = createCalendarNamespace(this.tx);
  medicalInstitution = createMedicalInstitutionNamespace(this.tx);
  careOffice = createCareOfficeNamespace(this.tx);
  contact = createContactNamespace(this.tx);
  phone = createPhoneNamespace(this.tx);
  phoneRecording = createPhoneRecordingNamespace(this.tx);
  videoAnalysis = createVideoAnalysisNamespace(this.tx);
  meeting = createMeetingNamespace(this.tx);
  meetingRecording = createMeetingRecordingNamespace(this.tx);
  dailyClosing = createDailyClosingNamespace(this.tx);
  dailyClosingBudget = createDailyClosingBudgetNamespace(this.tx);
  medication = createMedicationNamespace(this.tx);
  reference = createReferenceNamespace(this.tx);

  message = createMessageNamespace(this.tx);

  forms = createFormsNamespace(this.tx);

  claims = createClaimsNamespace(this.tx);
  riyohyo = createRiyohyoNamespace(this.tx);

  alerts = createAlertsNamespace(this.tx);
  analytics = createAnalyticsNamespace(this.tx);

  mediaLog = createMediaLogNamespace(this.tx);

  directive = createDirectiveNamespace(this.tx);

  feedback = createFeedbackNamespace(this.tx);

  chat = createChatNamespace(this.tx);
  llm = createLlmNamespace(this.tx);

  talk = createTalkNamespace(this.tx);
  devices = createDevicesNamespace(this.tx);

  device = createDeviceNamespace(this.tx);
  oauth = createOAuthNamespace(this.tx);

  storage = createStorageNamespace(this.tx);

  accessControl = createAccessControlNamespace(this.tx);

  organization = createOrganizationNamespace(this.tx);

  map = createMapNamespace(this.tx);

  voice = createVoiceNamespace(this.tx);
  usage = createUsageNamespace(this.tx);

  integration = createIntegrationNamespace(this.tx);

  modules = createModulesNamespace(this.tx);
  /** 棚に並ぶアプリ（`shared.apps`）。モジュール（能力）とは別軸 — 表示権は付与行。 */
  apps = createAppsNamespace(this.tx);
  tools = createToolsNamespace(this.tx);
}
