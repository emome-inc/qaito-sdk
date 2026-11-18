
import type {
  AlertItem,
  AlertSettingItem,
  AnalyticsClientTimelineQuery,
  AnalyticsClientTrend,
  AnalyticsClientTrendQuery,
  AnalyticsCoverage,
  AnalyticsCoverageQuery,
  AnalyticsInsight,
  AnalyticsRecord,
  AnalyticsRecordClient,
  AnalyticsRecordPage,
  AnalyticsRecordsSummary,
  AnalyticsRecordsSummaryQuery,
  AnalyticsTodayObservations,
  AnalyticsTodayQuery,
  DraftAnalyticsClientInsightInput,
  DraftAnalyticsFacilityInsightInput,
  ListAnalyticsRecordsQuery,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createAlertsNamespace(tx: SdkTransport) {
  return {
    items: {
      /** 要対応アラート一覧（?contexts=suite,monthly 等・facility_id。判定はサーバ側で都度評価） */
      list: (params?: { contexts?: string[]; facility_id?: string }) => {
        const qs = new URLSearchParams();
        if (params?.contexts && params.contexts.length > 0) qs.set("contexts", params.contexts.join(","));
        if (params?.facility_id) qs.set("facility_id", params.facility_id);
        const q = qs.toString();
        return tx.request<AlertItem[]>("GET", `/analytics/alerts${q ? `?${q}` : ""}`);
      },
    },
    settings: {
      /** アラート種別カタログ + org 別 ON/OFF 設定の一覧（B改・§8.5） */
      list: () => tx.request<AlertSettingItem[]>("GET", "/analytics/alerts/settings"),
      /** PUT /analytics/alerts/settings/:kind — アラート種別の ON/OFF を設定（analytics:write） */
      update: (kind: string, input: { enabled: boolean }) =>
        tx.request<{ kind: string; enabled: boolean }>("PUT", `/analytics/alerts/settings/${pathParam(kind, "kind")}`, input),
    },
  };
}

export function createAnalyticsNamespace(tx: SdkTransport) {
  return {
    records: {
      /** GET /analytics/records — 記録 4 種の横断一覧（期間必須・種別 / 利用者 / 事業所で絞る・ページング） */
      list: (params: ListAnalyticsRecordsQuery) =>
        tx.request<AnalyticsRecordPage>("GET", `/analytics/records${buildQueryString(params)}`),
      /** GET /analytics/records/clients — 記録分析の対象の利用者一覧 */
      clients: () => tx.request<AnalyticsRecordClient[]>("GET", "/analytics/records/clients"),
      /** GET /analytics/records/summary — 期間内の利用者ごとの記録件数（運営指導用） */
      summary: (params: AnalyticsRecordsSummaryQuery) =>
        tx.request<AnalyticsRecordsSummary>("GET", `/analytics/records/summary${buildQueryString(params)}`),
    },
    clients: {
      /** GET /analytics/clients/:client_id/timeline — 1 人の記録の時系列 */
      timeline: (clientId: string, params: AnalyticsClientTimelineQuery) =>
        tx.request<AnalyticsRecord[]>("GET", `/analytics/clients/${pathParam(clientId, "clientId")}/timeline${buildQueryString(params)}`),
      /** GET /analytics/clients/:client_id/trend — 1 人の推移の材料（バイタル・食事・水分・Barthel・訓練・職員の自由記述） */
      trend: (clientId: string, params?: AnalyticsClientTrendQuery) =>
        tx.request<AnalyticsClientTrend>("GET", `/analytics/clients/${pathParam(clientId, "clientId")}/trend${buildQueryString(params)}`),
      /** POST /analytics/clients/:client_id/insight — 1 人の推移から気づきの支援を AI で作る（保存しない・記録が無ければ 422 NO_RECORDS） */
      draftInsight: (clientId: string, input?: DraftAnalyticsClientInsightInput) =>
        tx.request<AnalyticsInsight>("POST", `/analytics/clients/${pathParam(clientId, "clientId")}/insight`, input ?? {}),
    },
    coverage: {
      /** GET /analytics/coverage — 記入状況（月 × 利用者 × 記録種別・加算の裏付け・LIFE 提出） */
      get: (params: AnalyticsCoverageQuery) =>
        tx.request<AnalyticsCoverage>("GET", `/analytics/coverage${buildQueryString(params)}`),
    },
    today: {
      /** GET /analytics/today — その日の要観察者（直前 30 日のベースラインから外れた人・優先度順） */
      get: (params: AnalyticsTodayQuery) =>
        tx.request<AnalyticsTodayObservations>("GET", `/analytics/today${buildQueryString(params)}`),
    },
    facility: {
      /** POST /analytics/facility-insight — 事業所の集計値から気づきの支援を AI で作る（保存しない・氏名や自由記述は使わない） */
      draftInsight: (input?: DraftAnalyticsFacilityInsightInput) =>
        tx.request<AnalyticsInsight>("POST", "/analytics/facility-insight", input ?? {}),
    },
  };
}
