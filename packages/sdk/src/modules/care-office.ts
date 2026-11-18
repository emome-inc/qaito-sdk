
import type {
  CareOffice,
  CareOfficeDuplicateGroup,
  CareOfficeManager,
  CreateCareOfficeInput,
  CreateCareOfficeManagerInput,
  ExternalMasterImportInput,
  ExternalMasterImportResult,
  ListCareOfficeManagersParams,
  ListCareOfficesParams,
  MergeExternalMasterInput,
  PhonePartyMatch,
  UpdateCareOfficeInput,
  UpdateCareOfficeManagerInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createCareOfficeNamespace(tx: SdkTransport) {
  return {
    /** 居宅介護支援事業所 */
    offices: {
      /** 居宅介護支援事業所の一覧（削除済みを除く）GET /care-office/offices */
      list: (params?: ListCareOfficesParams) =>
        tx.request<CareOffice[]>("GET", `/care-office/offices${buildQueryString(params)}`),
      /** 重なりの候補（名称が同じで別の事業所になっている組。統合の前の確認用）GET /care-office/offices/duplicates */
      duplicates: () => tx.request<CareOfficeDuplicateGroup[]>("GET", "/care-office/offices/duplicates"),
      /** 居宅介護支援事業所 1 件（削除済みも deletedAt つきで返す）GET /care-office/offices/:id */
      get: (id: string) => tx.request<CareOffice>("GET", `/care-office/offices/${pathParam(id, "id")}`),
      /** 居宅介護支援事業所を登録する POST /care-office/offices */
      create: (input: CreateCareOfficeInput) => tx.request<CareOffice>("POST", "/care-office/offices", input),
      /** 居宅介護支援事業所を直す（部分更新）PATCH /care-office/offices/:id */
      update: (id: string, input: UpdateCareOfficeInput) =>
        tx.request<CareOffice>("PATCH", `/care-office/offices/${pathParam(id, "id")}`, input),
      /** 居宅介護支援事業所を削除する（論理削除）DELETE /care-office/offices/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-office/offices/${pathParam(id, "id")}`),
      /** 重なった事業所を統合する（id の所属ケアマネを intoId へ移し、id は統合済みとして削除）POST /care-office/offices/:id/merge */
      merge: (id: string, input: MergeExternalMasterInput) =>
        tx.request<CareOffice>("POST", `/care-office/offices/${pathParam(id, "id")}/merge`, input),
      /** 居宅介護支援事業所の CSV 一括取込（dryRun=true は下見・エラーの行があると登録しない）POST /care-office/offices/import */
      import: (input: ExternalMasterImportInput) =>
        tx.request<ExternalMasterImportResult>("POST", "/care-office/offices/import", input),
    },
    /** ケアマネジャー（所属先は任意） */
    managers: {
      /** ケアマネジャーの一覧（削除済みを除く）GET /care-office/managers */
      list: (params?: ListCareOfficeManagersParams) =>
        tx.request<CareOfficeManager[]>("GET", `/care-office/managers${buildQueryString(params)}`),
      /** ケアマネジャー 1 件（削除済みも deletedAt つきで返す）GET /care-office/managers/:id */
      get: (id: string) =>
        tx.request<CareOfficeManager>("GET", `/care-office/managers/${pathParam(id, "id")}`),
      /** ケアマネジャーを登録する POST /care-office/managers */
      create: (input: CreateCareOfficeManagerInput) =>
        tx.request<CareOfficeManager>("POST", "/care-office/managers", input),
      /** ケアマネジャーを直す（部分更新）PATCH /care-office/managers/:id */
      update: (id: string, input: UpdateCareOfficeManagerInput) =>
        tx.request<CareOfficeManager>("PATCH", `/care-office/managers/${pathParam(id, "id")}`, input),
      /** ケアマネジャーを削除する（論理削除）DELETE /care-office/managers/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/care-office/managers/${pathParam(id, "id")}`),
      /** ケアマネジャーの CSV 一括取込（所属は登録済みの事業所から探す・dryRun=true は下見）POST /care-office/managers/import */
      import: (input: ExternalMasterImportInput) =>
        tx.request<ExternalMasterImportResult>("POST", "/care-office/managers/import", input),
    },
    /** 電話番号の逆引き（居宅介護支援事業所とケアマネジャー・最大 20 件。区切り・全角・+81 の違いは吸収）GET /care-office/phone-lookup?numbers= */
    findByPhone: (numbers: string[]) =>
      tx.request<PhonePartyMatch[]>("GET", `/care-office/phone-lookup${buildQueryString({ numbers: numbers.join(",") })}`),
  };
}
