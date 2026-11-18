
import type {
  CreateMedicalInstitutionMasterInput,
  ExternalMasterImportInput,
  ExternalMasterImportResult,
  ListExternalMasterParams,
  MedicalInstitutionDuplicateGroup,
  MedicalInstitutionMaster,
  MergeExternalMasterInput,
  PhonePartyMatch,
  UpdateMedicalInstitutionMasterInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMedicalInstitutionNamespace(tx: SdkTransport) {
  return {
    /** 医療機関（組織ごとの行） */
    institutions: {
      /** 医療機関の一覧（削除済みを除く）GET /medical-institution/institutions */
      list: (params?: ListExternalMasterParams) =>
        tx.request<MedicalInstitutionMaster[]>("GET", `/medical-institution/institutions${buildQueryString(params)}`),
      /** 重なりの候補（名前 × 診療科が同じで別の行になっている組。統合の前の確認用）GET /medical-institution/institutions/duplicates */
      duplicates: () =>
        tx.request<MedicalInstitutionDuplicateGroup[]>("GET", "/medical-institution/institutions/duplicates"),
      /** 医療機関 1 件（削除済みも deletedAt つきで返す）GET /medical-institution/institutions/:id */
      get: (id: string) =>
        tx.request<MedicalInstitutionMaster>("GET", `/medical-institution/institutions/${pathParam(id, "id")}`),
      /** 医療機関を登録する POST /medical-institution/institutions */
      create: (input: CreateMedicalInstitutionMasterInput) =>
        tx.request<MedicalInstitutionMaster>("POST", "/medical-institution/institutions", input),
      /** 医療機関を直す（部分更新）PATCH /medical-institution/institutions/:id */
      update: (id: string, input: UpdateMedicalInstitutionMasterInput) =>
        tx.request<MedicalInstitutionMaster>("PATCH", `/medical-institution/institutions/${pathParam(id, "id")}`, input),
      /** 医療機関を削除する（論理削除）DELETE /medical-institution/institutions/:id */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/medical-institution/institutions/${pathParam(id, "id")}`),
      /** 重なった医療機関を統合する（id は統合済みとして削除し、統合先を返す）POST /medical-institution/institutions/:id/merge */
      merge: (id: string, input: MergeExternalMasterInput) =>
        tx.request<MedicalInstitutionMaster>("POST", `/medical-institution/institutions/${pathParam(id, "id")}/merge`, input),
      /** 医療機関の CSV 一括取込（dryRun=true は下見・エラーの行があると登録しない）POST /medical-institution/institutions/import */
      import: (input: ExternalMasterImportInput) =>
        tx.request<ExternalMasterImportResult>("POST", "/medical-institution/institutions/import", input),
    },
    /** 電話番号の逆引き（医療機関・最大 20 件。区切り・全角・+81 の違いは吸収）GET /medical-institution/phone-lookup?numbers= */
    findByPhone: (numbers: string[]) =>
      tx.request<PhonePartyMatch[]>("GET", `/medical-institution/phone-lookup${buildQueryString({ numbers: numbers.join(",") })}`),
  };
}
