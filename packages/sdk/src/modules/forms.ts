
import type {
  FormOutput,
  FormTemplate,
  ListFormOutputsQuery,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createFormsNamespace(tx: SdkTransport) {
  return {
    templates: {
      /** GET /forms/templates — 帳票様式の一覧（廃止済みを除く・表示順） */
      list: () => tx.request<FormTemplate[]>("GET", "/forms/templates"),
      /** GET /forms/templates/:formId — 帳票様式 1 件（`formId` はカタログのキー） */
      get: (formId: string) =>
        tx.request<FormTemplate>("GET", `/forms/templates/${pathParam(formId, "formId")}`),
    },
    outputs: {
      /** GET /forms/outputs — 帳票の出力履歴（新しい順） */
      list: (params?: ListFormOutputsQuery) =>
        tx.request<FormOutput[]>("GET", `/forms/outputs${buildQueryString(params)}`),
    },
  };
}
