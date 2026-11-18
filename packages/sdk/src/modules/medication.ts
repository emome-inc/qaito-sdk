
import type {
  CreateMedicationInput,
  EnsureMedicationFromNationalInput,
  EnsuredMedication,
  ListMedicationsParams,
  Medication,
  UpdateMedicationInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

/**
 * 薬マスタ（組織で使う薬の名前の一覧）。
 */
export function createMedicationNamespace(tx: SdkTransport) {
  return {
    /** 薬マスタ */
    medications: {
      /** 薬マスタの一覧（削除済みを除く・かな順。q で名前・ふりがなの部分一致）GET /medication/medications */
      list: (params?: ListMedicationsParams) =>
        tx.request<Medication[]>("GET", `/medication/medications${buildQueryString(params)}`),
      /** 薬 1 件（論理削除した薬も返す。deletedAt で判別）GET /medication/medications/:id */
      get: (id: string) => tx.request<Medication>("GET", `/medication/medications/${pathParam(id, "id")}`),
      /** 薬を登録する。有効な行で名前が重なると 409 POST /medication/medications */
      create: (input: CreateMedicationInput) =>
        tx.request<Medication>("POST", "/medication/medications", input),
      /** 薬を直す（部分更新。削除済みは 404・名前が重なると 409）PATCH /medication/medications/:id */
      update: (id: string, input: UpdateMedicationInput) =>
        tx.request<Medication>("PATCH", `/medication/medications/${pathParam(id, "id")}`, input),
      /** 全国の医薬品マスターの薬を、組織の薬マスタで探すか作る（同じコード → 同じ名前の手で足した行 → 新しく作る）POST /medication/medications/from-national */
      ensureFromNational: (input: EnsureMedicationFromNationalInput) =>
        tx.request<EnsuredMedication>("POST", "/medication/medications/from-national", input),
      /** 薬を論理削除する（指している服薬の予定は残る）DELETE /medication/medications/:id */
      delete: (id: string) => tx.request<void>("DELETE", `/medication/medications/${pathParam(id, "id")}`),
    },
  };
}
