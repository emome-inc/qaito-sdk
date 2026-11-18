
import type {
  Company,
  CreateCompanyInput,
  CreateFacilityInput,
  CreateFacilityVehicleInput,
  Facility,
  FacilityVehicle,
  FacilityVehicleDrivers,
  FacilityVehicleInput,
  FacilityVehicleListItem,
  ImportFacilityFromMasterInput,
  LinkFacilityToMasterInput,
  SetFacilityVehicleDriversInput,
  UpdateCompanyInput,
  UpdateFacilityInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createFacilityNamespace(tx: SdkTransport) {
  return {
    facilities: {
      list: () => tx.request<Facility[]>("GET", "/facility/facilities"),
      search: (query: string) =>
        tx.request<Facility[]>("GET", `/facility/facilities?q=${encodeURIComponent(query)}`),
      get: (id: string) => tx.request<Facility>("GET", `/facility/facilities/${pathParam(id, "id")}`),
      create: (input: CreateFacilityInput) => tx.request<Facility>("POST", "/facility/facilities", input),
      update: (id: string, input: UpdateFacilityInput) =>
        tx.request<Facility>("PATCH", `/facility/facilities/${pathParam(id, "id")}`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/facility/facilities/${pathParam(id, "id")}`),
    },
    master: {
      /** マスタ行から自 org の事業所を作成（autofill + リンク確立）。二重取込は 409 */
      import: (input: ImportFacilityFromMasterInput) =>
        tx.request<Facility>("POST", "/facility/facilities/import", input),
      /** 既にある事業所をマスタ行に紐付ける（事業所の項目は書き換えない）。紐付け済みのマスタは 409 */
      link: (id: string, input: LinkFacilityToMasterInput) =>
        tx.request<Facility>("POST", `/facility/facilities/${pathParam(id, "id")}/link-master`, input),
    },
    vehicles: {
      /** GET /facility/vehicles — 車両の一覧（担当運転者の氏名つき） */
      list: (params?: { facility_id?: string }) =>
        tx.request<FacilityVehicleListItem[]>("GET", `/facility/vehicles${buildQueryString(params)}`),
      /** POST /facility/vehicles — 車両の登録 */
      create: (input: CreateFacilityVehicleInput) =>
        tx.request<FacilityVehicle>("POST", "/facility/vehicles", input),
      /** PUT /facility/vehicles/:id — 車両の更新（全項目を書き換える。担当運転者だけは省略 = 変えない） */
      update: (id: string, input: FacilityVehicleInput) =>
        tx.request<FacilityVehicle>("PUT", `/facility/vehicles/${pathParam(id, "id")}`, input),
      /** DELETE /facility/vehicles/:id — 車両の削除（論理削除） */
      delete: (id: string) => tx.request<null>("DELETE", `/facility/vehicles/${pathParam(id, "id")}`),
      /** GET /facility/vehicles/:id/drivers — 車両を運転する職員の一覧 */
      listDrivers: (id: string) =>
        tx.request<FacilityVehicleDrivers>("GET", `/facility/vehicles/${pathParam(id, "id")}/drivers`),
      /** PUT /facility/vehicles/:id/drivers — 車両を運転する職員を設定する（一覧に置き換える） */
      setDrivers: (id: string, input: SetFacilityVehicleDriversInput) =>
        tx.request<FacilityVehicleDrivers>("PUT", `/facility/vehicles/${pathParam(id, "id")}/drivers`, input),
    },
  };
}

export function createCompanyNamespace(tx: SdkTransport) {
  return {
    list: (params?: { q?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      const q = qs.toString();
      return tx.request<Company[]>("GET", `/facility/companies${q ? `?${q}` : ""}`);
    },
    get: (id: string) => tx.request<Company>("GET", `/facility/companies/${pathParam(id, "id")}`),
    create: (input: CreateCompanyInput) => tx.request<Company>("POST", "/facility/companies", input),
    update: (id: string, input: UpdateCompanyInput) =>
      tx.request<Company>("PATCH", `/facility/companies/${pathParam(id, "id")}`, input),
    delete: (id: string) => tx.request<void>("DELETE", `/facility/companies/${pathParam(id, "id")}`),
  };
}
