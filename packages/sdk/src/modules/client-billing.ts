
import type {
  ClientBankAccount,
  ClientBilling,
  ClientServiceDays,
  ClientServiceDaysQuery,
  ClientServicePlan,
  ClientServiceSchedule,
  ContractDefinition,
  CreateClientServicePlanInput,
  RevealBankAccountResult,
  SetClientServiceScheduleInput,
  UpdateClientServicePlanInput,
  UpsertClientBillingInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString, toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createContractsNamespace(tx: SdkTransport) {
  return {
    list: () => tx.request<Record<string, ContractDefinition>>("GET", "/contracts"),
    get: (resource: string) =>
      tx.request<ContractDefinition>("GET", `/contracts/${pathParam(resource, "resource")}`),
    serviceSchedule: {
      /** GET /client/clients/:client_id/service-schedule — 有効契約の利用曜日・提供時間 */
      get: (clientId: string) =>
        tx.request<ClientServiceSchedule>("GET", `/client/clients/${pathParam(clientId, "clientId")}/service-schedule`),
      /** PUT /client/clients/:client_id/service-schedule — 利用曜日と提供時間をセット（利用曜日を入れるなら提供時間は必須）。有効契約が無ければ最小の契約を作る */
      set: (clientId: string, input: SetClientServiceScheduleInput) =>
        tx.request<void>("PUT", `/client/clients/${pathParam(clientId, "clientId")}/service-schedule`, input),
    },
    serviceDays: {
      /** GET /client/service-days — 利用者ごとの現在の利用曜日（有効な契約が無い利用者は載らない） */
      list: (params?: ClientServiceDaysQuery) =>
        tx.request<ClientServiceDays[]>("GET", `/client/service-days${buildQueryString(params)}`),
    },
    /** 通所契約（contracts:read / contracts:write）*/
    servicePlans: {
      list: (clientId: string) =>
        tx.request<ClientServicePlan[]>("GET", `/client/clients/${pathParam(clientId, "clientId")}/service-plans`),
      get: (clientId: string, id: string) =>
        tx.request<ClientServicePlan>("GET", `/client/clients/${pathParam(clientId, "clientId")}/service-plans/${pathParam(id, "id")}`),
      /** 今日有効な通所契約（無ければ null）。GET /client/clients/:client_id/service-plans/active */
      active: (clientId: string) =>
        tx.request<ClientServicePlan | null>("GET", `/client/clients/${pathParam(clientId, "clientId")}/service-plans/active`),
      create: (clientId: string, input: CreateClientServicePlanInput) =>
        tx.request<ClientServicePlan>("POST", `/client/clients/${pathParam(clientId, "clientId")}/service-plans`, toApiCamel(input as Record<string, unknown>)),
      update: (clientId: string, id: string, input: UpdateClientServicePlanInput) =>
        tx.request<ClientServicePlan>("PATCH", `/client/clients/${pathParam(clientId, "clientId")}/service-plans/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      delete: (clientId: string, id: string) =>
        tx.request<void>("DELETE", `/client/clients/${pathParam(clientId, "clientId")}/service-plans/${pathParam(id, "id")}`),
    },
    /** 請求先（contracts:billing）*/
    billing: {
      get: (clientId: string) =>
        tx.request<ClientBilling | null>("GET", `/client-billing/clients/${pathParam(clientId, "clientId")}/billing`),
      upsert: (clientId: string, input: UpsertClientBillingInput) =>
        tx.request<ClientBilling>("PUT", `/client-billing/clients/${pathParam(clientId, "clientId")}/billing`, toApiCamel(input as Record<string, unknown>)),
    },
    /** 利用者口座マスタ（金融 PII・contracts:billing / reveal は AAL2 + audit）*/
    bankAccount: {
      get: (clientId: string) =>
        tx.request<ClientBankAccount | null>("GET", `/client-billing/clients/${pathParam(clientId, "clientId")}/bank-account`),
      upsert: (clientId: string, input: Record<string, unknown>) =>
        tx.request<ClientBankAccount>("PUT", `/client-billing/clients/${pathParam(clientId, "clientId")}/bank-account`, toApiCamel(input)),
      transitionMandate: (id: string, input: Record<string, unknown>) =>
        tx.request<ClientBankAccount>("PATCH", `/client-billing/bank-accounts/${pathParam(id, "id")}/mandate`, toApiCamel(input)),
      /** 口座番号 reveal（AAL2 必須・audit=bank_account_decrypt）*/
      reveal: (id: string) =>
        tx.request<RevealBankAccountResult>("POST", `/client-billing/bank-accounts/${pathParam(id, "id")}/reveal`),
    },
  };
}
