
import type {
  AttachCareplanLinkServiceOfficeFacilityInput,
  CareplanLinkServiceOffice,
  CreateCareplanLinkServiceOfficeInput,
  CreateRiyohyoMonthInput,
  ListCareplanLinkServiceOfficesQuery,
  ListRiyohyoMonthsQuery,
  RegisterCareplanLinkFacilityServiceOfficeInput,
  RiyohyoMonth,
  RiyohyoMonthDetail,
  RiyohyoMonthOpInput,
  UpdateRiyohyoMonthInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createRiyohyoNamespace(tx: SdkTransport) {
  return {
    months: {
      /** GET /care-plan/riyohyo/months — サービス利用票（月次）の一覧（clientId・status・targetMonth・offset） */
      list: (params?: ListRiyohyoMonthsQuery) =>
        tx.request<RiyohyoMonth[]>("GET", `/care-plan/riyohyo/months${buildQueryString(params)}`),
      /** GET /care-plan/riyohyo/months/:id — 利用票 1 件（明細・日ごとの回数・別表つき） */
      get: (monthId: string) =>
        tx.request<RiyohyoMonthDetail>("GET", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}`),
      /** POST /care-plan/riyohyo/months — 月ヘッダを作成（下書き） */
      create: (input: CreateRiyohyoMonthInput) =>
        tx.request<RiyohyoMonth>("POST", "/care-plan/riyohyo/months", input),
      /** PATCH /care-plan/riyohyo/months/:id — 月ヘッダを更新（下書きのときだけ・送った項目だけ） */
      update: (monthId: string, input: UpdateRiyohyoMonthInput) =>
        tx.request<RiyohyoMonth>("PATCH", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}`, input),
      /** DELETE /care-plan/riyohyo/months/:id — 下書きの利用票を論理削除 */
      delete: (monthId: string) =>
        tx.request<null>("DELETE", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}`),
      /** POST /care-plan/riyohyo/months/:id/deliver — 交付 */
      deliver: (monthId: string, input?: RiyohyoMonthOpInput) =>
        tx.request<RiyohyoMonth>("POST", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}/deliver`, input),
      /** POST /care-plan/riyohyo/months/:id/record-actuals — 実績の受領 */
      recordActuals: (monthId: string, input?: RiyohyoMonthOpInput) =>
        tx.request<RiyohyoMonth>("POST", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}/record-actuals`, input),
      /** POST /care-plan/riyohyo/months/:id/fix — 締め */
      fix: (monthId: string, input?: RiyohyoMonthOpInput) =>
        tx.request<RiyohyoMonth>("POST", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}/fix`, input),
      /** POST /care-plan/riyohyo/months/:id/redeliver — 再交付 */
      redeliver: (monthId: string, input?: RiyohyoMonthOpInput) =>
        tx.request<RiyohyoMonth>("POST", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}/redeliver`, input),
      /** POST /care-plan/riyohyo/months/:id/reopen — 開き直し（承認した職員の ID が要る） */
      reopen: (monthId: string, input?: RiyohyoMonthOpInput) =>
        tx.request<RiyohyoMonth>("POST", `/care-plan/riyohyo/months/${pathParam(monthId, "monthId")}/reopen`, input),
    },
    serviceOffices: {
      /** GET /careplan-link/service-offices — 第6/7表に載せるサービス提供事業所の名簿（facilityId・officeNumber・unlinked で絞り込み） */
      list: (params?: ListCareplanLinkServiceOfficesQuery) =>
        tx.request<CareplanLinkServiceOffice[]>("GET", `/careplan-link/service-offices${buildQueryString(params)}`),
      /** POST /careplan-link/service-offices — サービス提供事業所の登録（同じ番号 + 枝番は 409） */
      create: (input: CreateCareplanLinkServiceOfficeInput) =>
        tx.request<CareplanLinkServiceOffice>("POST", "/careplan-link/service-offices", input),
      /** POST /careplan-link/service-offices/register-facility — 自社の事業所を台帳の事業所番号と名前で名簿に登録する（番号が無ければ 422・同じ番号 + 枝番は 409） */
      registerFacility: (input: RegisterCareplanLinkFacilityServiceOfficeInput) =>
        tx.request<CareplanLinkServiceOffice>("POST", "/careplan-link/service-offices/register-facility", input),
      /** POST /careplan-link/service-offices/:id/facility — 他社として入っている名簿の行を自社の事業所に結ぶ（結ばれている行は 409） */
      attachFacility: (serviceOfficeId: string, input: AttachCareplanLinkServiceOfficeFacilityInput) =>
        tx.request<CareplanLinkServiceOffice>("POST", `/careplan-link/service-offices/${pathParam(serviceOfficeId, "serviceOfficeId")}/facility`, input),
    },
  };
}
