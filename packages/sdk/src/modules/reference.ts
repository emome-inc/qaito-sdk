
import type {
  EefulFacilityMaster,
  EefulMasterSearchParams,
  EefulOverlayView,
  ListNationalDiseaseModifiersParams,
  ListNationalDiseasesParams,
  ListNationalInstitutionsParams,
  ListNationalMedicationsParams,
  NationalDisease,
  NationalDiseaseModifier,
  NationalInstitution,
  NationalMedication,
  SaveEefulOverlayInput,
  SavedEefulOverlay,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

/**
 * 全国マスタ（全国の医療機関・全国事業所マスタとその補正）。
 */
export function createReferenceNamespace(tx: SdkTransport) {
  return {
    /** 全国の医療機関（厚労省の共有データ） */
    nationalInstitutions: {
      /** 全国の医療機関の検索（q で名称・住所・医療機関コードの部分一致・prefecture で都道府県・offset でページ送り）GET /reference/national-institutions */
      list: (params?: ListNationalInstitutionsParams) =>
        tx.request<NationalInstitution[]>("GET", `/reference/national-institutions${buildQueryString(params)}`),
      /** 全国の医療機関 1 件 GET /reference/national-institutions/:id */
      get: (id: string) =>
        tx.request<NationalInstitution>("GET", `/reference/national-institutions/${pathParam(id, "id")}`),
    },
    /** 全国の医薬品マスター（厚労省・保険で使う医療用の薬） */
    nationalMedications: {
      /** 全国の医薬品マスターの検索（q は必須・名称・フリガナ・一般名の部分一致。有効な版だけ）GET /reference/national-medications */
      list: (params: ListNationalMedicationsParams) =>
        tx.request<NationalMedication[]>("GET", `/reference/national-medications${buildQueryString(params)}`),
    },
    /** 全国の傷病名マスター（支払基金・傷病名コードと ICD-10） */
    nationalDiseases: {
      /** 全国の傷病名マスターの検索（q は必須・名称・カナ・傷病名コード・ICD-10。有効な版だけ・廃止済みは出ない）GET /reference/national-diseases */
      list: (params: ListNationalDiseasesParams) =>
        tx.request<NationalDisease[]>("GET", `/reference/national-diseases${buildQueryString(params)}`),
    },
    /** 全国の修飾語マスター（支払基金・疑い・末期・右など傷病名に付ける語） */
    nationalDiseaseModifiers: {
      /** 全国の修飾語マスターの検索（q は省略可・position で前に付く／後ろに付くを絞る）GET /reference/national-disease-modifiers */
      list: (params?: ListNationalDiseaseModifiersParams) =>
        tx.request<NationalDiseaseModifier[]>("GET", `/reference/national-disease-modifiers${buildQueryString(params)}`),
    },
    /** 全国事業所マスタ（EEFUL ミラー） */
    eefulFacilities: {
      /** 全国事業所マスタの検索。絞り込み条件を 1 つ以上指定すること（未指定は 400）。最大 50 件 GET /reference/eeful-facilities/search */
      search: (params: EefulMasterSearchParams) =>
        tx.request<EefulFacilityMaster[]>("GET", `/reference/eeful-facilities/search${buildQueryString(params)}`),
    },
    /** 全国事業所データの Qaito 独自補正（自組織にリンクした事業所だけ） */
    eefulOverlays: {
      /** 全国事業所データ 1 件の元値・補正値・合成後の値と、自組織の紐付け状況 */
      get: (eefulFacilityId: number) =>
        tx.request<EefulOverlayView>("GET", `/reference/eeful-facilities/${pathParam(eefulFacilityId, "eefulFacilityId")}/overlay`),
      /** 補正を保存する（空文字の項目は上書き解除）。自組織に登録済みの事業所だけ・人のトークンが要る */
      save: (eefulFacilityId: number, input: SaveEefulOverlayInput) =>
        tx.request<SavedEefulOverlay>("PUT", `/reference/eeful-facilities/${pathParam(eefulFacilityId, "eefulFacilityId")}/overlay`, input),
      /** 補正をすべて外して全国データの値に戻す */
      reset: (eefulFacilityId: number) =>
        tx.request<SavedEefulOverlay>("POST", `/reference/eeful-facilities/${pathParam(eefulFacilityId, "eefulFacilityId")}/overlay/reset`),
    },
  };
}
