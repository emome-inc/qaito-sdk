
import type {
  CreateEvaluationInput,
  CreateMonitoringInput,
  DayserviceReportDraft,
  DayserviceReportMaterial,
  DayserviceReportTarget,
  DraftDayserviceReportInput,
  DraftEvaluationInput,
  Evaluation,
  EvaluationDraft,
  Monitoring,
  MonitoringMissingCount,
  SaveEvaluationInput,
  SavedEvaluation,
  UpdateEvaluationInput,
  UpdateMonitoringInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMonitoringNamespace(tx: SdkTransport) {
  return {
    monitorings: {
      list: (params?: { care_plan_id?: string; limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        if (params?.care_plan_id) qs.set("care_plan_id", params.care_plan_id);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<Monitoring[]>("GET", `/plan-review/monitorings${q ? `?${q}` : ""}`);
      },
      /** GET /plan-review/monitorings/missing-count?year_month=YYYY-MM — その月のモニタリングが未実施の利用者数（有効な居宅サービス計画を持つ利用者が母数） */
      missingCount: (yearMonth: string) =>
        tx.request<MonitoringMissingCount>("GET", `/plan-review/monitorings/missing-count?year_month=${encodeURIComponent(yearMonth)}`),
      get: (id: string) => tx.request<Monitoring>("GET", `/plan-review/monitorings/${pathParam(id, "id")}`),
      create: (input: CreateMonitoringInput) =>
        tx.request<Monitoring>("POST", "/plan-review/monitorings", toApiCamel(input as Record<string, unknown>)),
      update: (id: string, input: UpdateMonitoringInput) =>
        tx.request<Monitoring>("PATCH", `/plan-review/monitorings/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      delete: (id: string) => tx.request<void>("DELETE", `/plan-review/monitorings/${pathParam(id, "id")}`),
    },
    dayserviceReports: {
      list: (params: { facility_id: string; month: string }) =>
        tx.request<DayserviceReportTarget[]>("GET", `/plan-review/dayservice-reports?${new URLSearchParams({ facility_id: params.facility_id, month: params.month }).toString()}`),
      /** GET /plan-review/dayservice-reports/material — 1 人分のその月の材料（バイタル・体重の推移・機能訓練・入浴・処置・連絡帳） */
      material: (params: { facility_id: string; client_id: string; month: string }) =>
        tx.request<DayserviceReportMaterial>("GET", `/plan-review/dayservice-reports/material?${new URLSearchParams({ facility_id: params.facility_id, client_id: params.client_id, month: params.month }).toString()}`),
      /** POST /plan-review/dayservice-reports/draft — その月の材料から AI で節の下書きを作る（保存しない） */
      draft: (input: DraftDayserviceReportInput) =>
        tx.request<DayserviceReportDraft>("POST", "/plan-review/dayservice-reports/draft", input),
    },
  };
}

export function createEvaluationNamespace(tx: SdkTransport) {
  return {
    evaluations: {
      list: (params?: { care_plan_id?: string }) => {
        const qs = new URLSearchParams();
        if (params?.care_plan_id) qs.set("care_plan_id", params.care_plan_id);
        const q = qs.toString();
        return tx.request<Evaluation[]>("GET", `/plan-review/evaluations${q ? `?${q}` : ""}`);
      },
      get: (id: string) => tx.request<Evaluation>("GET", `/plan-review/evaluations/${pathParam(id, "id")}`),
      create: (input: CreateEvaluationInput) =>
        tx.request<Evaluation>("POST", "/plan-review/evaluations", toApiCamel(input as Record<string, unknown>)),
      update: (id: string, input: UpdateEvaluationInput) =>
        tx.request<Evaluation>("PATCH", `/plan-review/evaluations/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      delete: (id: string) => tx.request<void>("DELETE", `/plan-review/evaluations/${pathParam(id, "id")}`),
      draft: (input: DraftEvaluationInput) =>
        tx.request<EvaluationDraft>("POST", "/plan-review/evaluations/draft", input),
      save: (input: SaveEvaluationInput) =>
        tx.request<SavedEvaluation>("POST", "/plan-review/evaluations/save", input),
    },
  };
}
