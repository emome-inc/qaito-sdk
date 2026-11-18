
import type {
  AddClosingMonthInput,
  ClosingBudget,
  ClosingDivisionResult,
  ClosingMonth,
  ClosingPriceChange,
  ClosingUnitField,
  ClosingUnitFieldInput,
  ClosingUnitPlan,
  ClosingUnitPlanInput,
  UpdateClosingMonthInput,
  UpsertClosingBudgetsInput,
  UpsertClosingDivisionResultInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createDailyClosingBudgetNamespace(tx: SdkTransport) {
  return {
    /** 欄の定義と単価 */
    fields: {
      /** 欄の定義と単価 GET /daily-closing-budget/units/:id/fields */
      list: (id: string) =>
        tx.request<ClosingUnitField[]>("GET", `/daily-closing-budget/units/${pathParam(id, "id")}/fields`),
      /** 欄を作る・直す PUT /daily-closing-budget/units/:id/fields */
      upsert: (id: string, input: ClosingUnitFieldInput) =>
        tx.request<ClosingUnitField>("PUT", `/daily-closing-budget/units/${pathParam(id, "id")}/fields`, input),
      /** 欄を消す PATCH /daily-closing-budget/units/:id/fields/:fieldKey/delete */
      delete: (id: string, fieldKey: string) =>
        tx.request<null>("PATCH", `/daily-closing-budget/units/${pathParam(id, "id")}/fields/${pathParam(fieldKey, "fieldKey")}/delete`),
    },
    /** 単価の履歴 */
    priceHistory: {
      /** 単価の履歴 GET /daily-closing-budget/units/:id/price-history */
      list: (id: string) =>
        tx.request<ClosingPriceChange[]>("GET", `/daily-closing-budget/units/${pathParam(id, "id")}/price-history`),
    },
    /** 部署の計画 */
    plans: {
      /** 部署の計画 GET /daily-closing-budget/units/:id/plan */
      get: (id: string) =>
        tx.request<ClosingUnitPlan>("GET", `/daily-closing-budget/units/${pathParam(id, "id")}/plan`),
      /** 部署の計画を書く PUT /daily-closing-budget/units/:id/plan */
      upsert: (id: string, input: ClosingUnitPlanInput) =>
        tx.request<ClosingUnitPlan>("PUT", `/daily-closing-budget/units/${pathParam(id, "id")}/plan`, input),
    },
    /** 締めの月 */
    months: {
      /** 締めの月 GET /daily-closing-budget/months */
      list: () => tx.request<ClosingMonth[]>("GET", "/daily-closing-budget/months"),
      /** 月を足す POST /daily-closing-budget/months */
      add: (input: AddClosingMonthInput) =>
        tx.request<ClosingMonth>("POST", "/daily-closing-budget/months", input),
      /** 月の季節係数を直す（確定した月は 409）PATCH /daily-closing-budget/months/:month */
      update: (month: string, input: UpdateClosingMonthInput) =>
        tx.request<ClosingMonth>("PATCH", `/daily-closing-budget/months/${pathParam(month, "month")}`, input),
      /** 月を確定する（日次締めの写しも作る）POST /daily-closing-budget/months/:month/lock */
      lock: (month: string) =>
        tx.request<ClosingMonth>("POST", `/daily-closing-budget/months/${pathParam(month, "month")}/lock`),
      /** 確定を解除する POST /daily-closing-budget/months/:month/unlock */
      unlock: (month: string) =>
        tx.request<ClosingMonth>("POST", `/daily-closing-budget/months/${pathParam(month, "month")}/unlock`),
    },
    /** 予算 */
    budgets: {
      /** 予算 GET /daily-closing-budget/months/:month/budgets */
      list: (month: string) =>
        tx.request<ClosingBudget[]>("GET", `/daily-closing-budget/months/${pathParam(month, "month")}/budgets`),
      /** 予算のまとめ書き（確定した月は 409）PUT /daily-closing-budget/months/:month/budgets */
      upsert: (month: string, input: UpsertClosingBudgetsInput) =>
        tx.request<ClosingBudget[]>("PUT", `/daily-closing-budget/months/${pathParam(month, "month")}/budgets`, input),
    },
    /** 事業部の確定値 */
    divisionResults: {
      /** 事業部の確定値 GET /daily-closing-budget/months/:month/division-results */
      list: (month: string) =>
        tx.request<ClosingDivisionResult[]>("GET", `/daily-closing-budget/months/${pathParam(month, "month")}/division-results`),
      /** 事業部の確定値を書く PUT /daily-closing-budget/division-results */
      upsert: (input: UpsertClosingDivisionResultInput) =>
        tx.request<ClosingDivisionResult>("PUT", "/daily-closing-budget/division-results", input),
    },
  };
}
