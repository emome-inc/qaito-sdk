
import type {
  CreateEquipmentCatalogItemInput,
  CreateEquipmentCatalogPriceInput,
  CreateEquipmentExceptionApprovalInput,
  CreateEquipmentMonitoringInput,
  CreateEquipmentRentalContractInput,
  EquipmentCatalogItem,
  EquipmentCatalogPrice,
  EquipmentDefaultPrice,
  EquipmentDefaultPriceQuery,
  EquipmentExceptionApproval,
  EquipmentMonitoring,
  EquipmentRentalContract,
  ListEquipmentQuery,
  SupersedeEquipmentRentalContractInput,
  UpdateEquipmentCatalogItemInput,
  UpdateEquipmentCatalogPriceInput,
  UpdateEquipmentExceptionApprovalInput,
  UpdateEquipmentMonitoringInput,
  UpdateEquipmentRentalContractInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createEquipmentRentalNamespace(tx: SdkTransport) {
  return {
    catalog: {
      /** GET /equipment-rental/catalog — カタログ item 一覧 */
      list: (params?: ListEquipmentQuery) =>
        tx.request<EquipmentCatalogItem[]>("GET", `/equipment-rental/catalog${buildQueryString(params)}`),
      /** GET /equipment-rental/catalog/:id */
      get: (id: string) =>
        tx.request<EquipmentCatalogItem>("GET", `/equipment-rental/catalog/${pathParam(id, "id")}`),
      /** GET /equipment-rental/catalog/:id/default-price — 事業所別定価の解決（契約の月額の初期値） */
      getDefaultPrice: (id: string, params: EquipmentDefaultPriceQuery) =>
        tx.request<EquipmentDefaultPrice>("GET", `/equipment-rental/catalog/${pathParam(id, "id")}/default-price${buildQueryString(params)}`),
      /** POST /equipment-rental/catalog */
      create: (input: CreateEquipmentCatalogItemInput) =>
        tx.request<EquipmentCatalogItem>("POST", "/equipment-rental/catalog", input as unknown as Record<string, unknown>),
      /** PATCH /equipment-rental/catalog/:id */
      update: (id: string, input: UpdateEquipmentCatalogItemInput) =>
        tx.request<EquipmentCatalogItem>("PATCH", `/equipment-rental/catalog/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /equipment-rental/catalog/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/equipment-rental/catalog/${pathParam(id, "id")}`),
      /** POST /equipment-rental/catalog/:id/prices — 事業所別定価を追加 */
      addPrice: (id: string, input: CreateEquipmentCatalogPriceInput) =>
        tx.request<EquipmentCatalogPrice>("POST", `/equipment-rental/catalog/${pathParam(id, "id")}/prices`, input as unknown as Record<string, unknown>),
    },
    prices: {
      /** PATCH /equipment-rental/prices/:priceId */
      update: (priceId: string, input: UpdateEquipmentCatalogPriceInput) =>
        tx.request<EquipmentCatalogPrice>("PATCH", `/equipment-rental/prices/${pathParam(priceId, "priceId")}`, input as unknown as Record<string, unknown>),
      /** DELETE /equipment-rental/prices/:priceId */
      delete: (priceId: string) =>
        tx.request<null>("DELETE", `/equipment-rental/prices/${pathParam(priceId, "priceId")}`),
    },
    contracts: {
      /** GET /equipment-rental/contracts — 貸与契約一覧（単位数の源泉） */
      list: (params?: ListEquipmentQuery) =>
        tx.request<EquipmentRentalContract[]>("GET", `/equipment-rental/contracts${buildQueryString(params)}`),
      /** GET /equipment-rental/contracts/:id */
      get: (id: string) =>
        tx.request<EquipmentRentalContract>("GET", `/equipment-rental/contracts/${pathParam(id, "id")}`),
      /** POST /equipment-rental/contracts */
      create: (input: CreateEquipmentRentalContractInput) =>
        tx.request<EquipmentRentalContract>("POST", "/equipment-rental/contracts", input as unknown as Record<string, unknown>),
      /** PATCH /equipment-rental/contracts/:id（凍結列は変更不可） */
      update: (id: string, input: UpdateEquipmentRentalContractInput) =>
        tx.request<EquipmentRentalContract>("PATCH", `/equipment-rental/contracts/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** POST /equipment-rental/contracts/:id/supersede — 価格改定/商品交換（旧行 end + 新行発行） */
      supersede: (id: string, input: SupersedeEquipmentRentalContractInput) =>
        tx.request<EquipmentRentalContract>("POST", `/equipment-rental/contracts/${pathParam(id, "id")}/supersede`, input as unknown as Record<string, unknown>),
      /** DELETE /equipment-rental/contracts/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/equipment-rental/contracts/${pathParam(id, "id")}`),
    },
    exceptions: {
      /** GET /equipment-rental/exceptions — 軽度者例外給付一覧 */
      list: (params?: ListEquipmentQuery) =>
        tx.request<EquipmentExceptionApproval[]>("GET", `/equipment-rental/exceptions${buildQueryString(params)}`),
      /** POST /equipment-rental/exceptions */
      create: (input: CreateEquipmentExceptionApprovalInput) =>
        tx.request<EquipmentExceptionApproval>("POST", "/equipment-rental/exceptions", input as unknown as Record<string, unknown>),
      /** PATCH /equipment-rental/exceptions/:id */
      update: (id: string, input: UpdateEquipmentExceptionApprovalInput) =>
        tx.request<EquipmentExceptionApproval>("PATCH", `/equipment-rental/exceptions/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /equipment-rental/exceptions/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/equipment-rental/exceptions/${pathParam(id, "id")}`),
    },
    monitorings: {
      /** GET /equipment-rental/monitorings — 貸与モニタリング一覧 */
      list: (params?: ListEquipmentQuery) =>
        tx.request<EquipmentMonitoring[]>("GET", `/equipment-rental/monitorings${buildQueryString(params)}`),
      /** POST /equipment-rental/monitorings */
      create: (input: CreateEquipmentMonitoringInput) =>
        tx.request<EquipmentMonitoring>("POST", "/equipment-rental/monitorings", input as unknown as Record<string, unknown>),
      /** PATCH /equipment-rental/monitorings/:id */
      update: (id: string, input: UpdateEquipmentMonitoringInput) =>
        tx.request<EquipmentMonitoring>("PATCH", `/equipment-rental/monitorings/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      /** DELETE /equipment-rental/monitorings/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/equipment-rental/monitorings/${pathParam(id, "id")}`),
    },
  };
}
