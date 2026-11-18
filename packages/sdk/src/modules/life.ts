
import type {
  CreateLifeBatchInput,
  CreateLifeObligationInput,
  GenerateLifeBatchInput,
  LifeFormDef,
  LifeSubmissionBatch,
  LifeSubmissionObligation,
  ListLifeBatchesQuery,
  ListLifeObligationsQuery,
  TransitionLifeBatchStatusInput,
  UpdateLifeBatchInput,
  UpdateLifeObligationInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createLifeNamespace(tx: SdkTransport) {
  return {
    formDefs: {
      /** GET /life/form-defs — 様式定義一覧（read のみ・org write 不可） */
      list: () => tx.request<LifeFormDef[]>("GET", "/life/form-defs"),
    },
    batches: {
      /** GET /life/batches — 提出バッチ一覧 */
      list: (params?: ListLifeBatchesQuery) =>
        tx.request<LifeSubmissionBatch[]>("GET", `/life/batches${buildQueryString(params)}`),
      /** GET /life/batches/:id */
      get: (id: string) => tx.request<LifeSubmissionBatch>("GET", `/life/batches/${pathParam(id, "id")}`),
      /** POST /life/batches */
      create: (input: CreateLifeBatchInput) =>
        tx.request<LifeSubmissionBatch>("POST", "/life/batches", input as unknown as Record<string, unknown>),
      /** PATCH /life/batches/:id — メモ・提出結果の手動記録 */
      update: (id: string, input: UpdateLifeBatchInput) =>
        tx.request<LifeSubmissionBatch>("PATCH", `/life/batches/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** POST /life/batches/:id/status — 提出フローの状態遷移 */
      transitionStatus: (id: string, input: TransitionLifeBatchStatusInput) =>
        tx.request<LifeSubmissionBatch>("POST", `/life/batches/${pathParam(id, "id")}/status`, input as unknown as Record<string, unknown>),
      /** POST /life/batches/:id/generate — 様式別 CSV 生成 */
      generate: (id: string, input?: GenerateLifeBatchInput) =>
        tx.request<LifeSubmissionBatch>("POST", `/life/batches/${pathParam(id, "id")}/generate`, (input ?? {}) as unknown as Record<string, unknown>),
      /** GET /life/batches/:id/files/:formCode/download — 生成 CSV のダウンロード URL */
      downloadFile: (id: string, formCode: string) =>
        tx.request<{ url: string }>("GET", `/life/batches/${pathParam(id, "id")}/files/${pathParam(formCode, "formCode")}/download`),
      /** POST /life/batches/:id/files/:formCode/record-download — 「ダウンロード済み」を記録（生成済みのときだけ進める） */
      recordDownload: (id: string, formCode: string) =>
        tx.request<{ recorded: boolean; status: string }>("POST", `/life/batches/${pathParam(id, "id")}/files/${pathParam(formCode, "formCode")}/record-download`),
      /** DELETE /life/batches/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/life/batches/${pathParam(id, "id")}`),
    },
    obligations: {
      /** GET /life/obligations — 義務カレンダー一覧 */
      list: (params?: ListLifeObligationsQuery) =>
        tx.request<LifeSubmissionObligation[]>("GET", `/life/obligations${buildQueryString(params)}`),
      /** POST /life/obligations */
      create: (input: CreateLifeObligationInput) =>
        tx.request<LifeSubmissionObligation>("POST", "/life/obligations", input as unknown as Record<string, unknown>),
      /** PATCH /life/obligations/:id */
      update: (id: string, input: UpdateLifeObligationInput) =>
        tx.request<LifeSubmissionObligation>("PATCH", `/life/obligations/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /life/obligations/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/life/obligations/${pathParam(id, "id")}`),
    },
  };
}
