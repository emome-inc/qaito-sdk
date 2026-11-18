
import type {
  ContactParty,
  CreateContactPartyInput,
  ListContactPartiesParams,
  MergeExternalMasterInput,
  PhonePartyMatch,
  UpdateContactPartyInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createContactNamespace(tx: SdkTransport) {
  return {
    /** 関係先（法人・団体の下に担当者を 1 段） */
    parties: {
      /** 関係先の一覧（削除済みを除く）GET /contact/parties */
      list: (params?: ListContactPartiesParams) =>
        tx.request<ContactParty[]>("GET", `/contact/parties${buildQueryString(params)}`),
      /** 関係先 1 件（削除済みも deletedAt つきで返す）GET /contact/parties/:id */
      get: (id: string) => tx.request<ContactParty>("GET", `/contact/parties/${pathParam(id, "id")}`),
      /** 関係先を登録する POST /contact/parties */
      create: (input: CreateContactPartyInput) => tx.request<ContactParty>("POST", "/contact/parties", input),
      /** 関係先を直す（部分更新）PATCH /contact/parties/:id */
      update: (id: string, input: UpdateContactPartyInput) =>
        tx.request<ContactParty>("PATCH", `/contact/parties/${pathParam(id, "id")}`, input),
      /** 関係先を削除する（論理削除）DELETE /contact/parties/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/contact/parties/${pathParam(id, "id")}`),
      /** 重なった関係先を統合する（同じ種類どうし・統合先を返す）POST /contact/parties/:id/merge */
      merge: (id: string, input: MergeExternalMasterInput) =>
        tx.request<ContactParty>("POST", `/contact/parties/${pathParam(id, "id")}/merge`, input),
    },
    /** 電話番号の逆引き（関係先・最大 20 件。区切り・全角・+81 の違いは吸収）GET /contact/phone-lookup?numbers= */
    findByPhone: (numbers: string[]) =>
      tx.request<PhonePartyMatch[]>("GET", `/contact/phone-lookup${buildQueryString({ numbers: numbers.join(",") })}`),
  };
}
