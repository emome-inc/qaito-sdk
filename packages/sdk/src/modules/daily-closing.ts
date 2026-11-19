
import type {
  ClosingCompanyParams,
  ClosingCompanySummary,
  ClosingDayFlash,
  ClosingDayNoteSaved,
  ClosingDivision,
  ClosingDivisionInput,
  ClosingEntriesSaved,
  ClosingExport,
  ClosingInitiative,
  ClosingInitiativesParams,
  ClosingLegacyImportResult,
  ClosingLegacyReconcileResult,
  ClosingMissingEntries,
  ClosingSnapshotResult,
  ClosingUnit,
  ClosingUnitList,
  ClosingUnitMonth,
  CreateClosingInitiativeInput,
  CreateClosingUnitInput,
  ImportClosingLegacyInput,
  ReconcileClosingLegacyInput,
  SaveClosingDayNoteInput,
  SaveClosingEntriesInput,
  UpdateClosingDivisionInput,
  UpdateClosingInitiativeInput,
  UpdateClosingUnitInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createDailyClosingNamespace(tx: SdkTransport) {
  return {
    /** 部署（1 事業所 1 部署） */
    units: {
      /** 部署の一覧と、部署をまだ作っていない事業所 GET /daily-closing/units */
      list: () => tx.request<ClosingUnitList>("GET", "/daily-closing/units"),
      /** 部署を作る（1 事業所 1 部署）POST /daily-closing/units */
      create: (input: CreateClosingUnitInput) =>
        tx.request<ClosingUnit>("POST", "/daily-closing/units", input),
      /** 部署を直す（事業部・並び・元の名前）PATCH /daily-closing/units/:id */
      update: (id: string, input: UpdateClosingUnitInput) =>
        tx.request<ClosingUnit>("PATCH", `/daily-closing/units/${pathParam(id, "id")}`, input),
      /** 部署を消す（論理削除）PATCH /daily-closing/units/:id/delete */
      delete: (id: string) => tx.request<null>("PATCH", `/daily-closing/units/${pathParam(id, "id")}/delete`),
    },
    /** 部署 × 月 */
    months: {
      /** 部署 × 月の日別の行 GET /daily-closing/units/:id/months/:month */
      get: (id: string, month: string) =>
        tx.request<ClosingUnitMonth>("GET", `/daily-closing/units/${pathParam(id, "id")}/months/${pathParam(month, "month")}`),
      /** 補正のまとめ書き（count: null で外す）PUT /daily-closing/units/:id/months/:month/entries */
      saveEntries: (id: string, month: string, input: SaveClosingEntriesInput) =>
        tx.request<ClosingEntriesSaved>("PUT", `/daily-closing/units/${pathParam(id, "id")}/months/${pathParam(month, "month")}/entries`, input),
      /** 備考（空で外す）PUT /daily-closing/units/:id/notes/:date */
      saveNote: (id: string, date: string, input: SaveClosingDayNoteInput) =>
        tx.request<ClosingDayNoteSaved>("PUT", `/daily-closing/units/${pathParam(id, "id")}/notes/${pathParam(date, "date")}`, input),
      /** 月の自動の値を写す（確定の前・確定済みの月は 409）POST /daily-closing/months/:month/snapshot */
      snapshot: (month: string) =>
        tx.request<ClosingSnapshotResult>("POST", `/daily-closing/months/${pathParam(month, "month")}/snapshot`),
    },
    /** 締まっていない日 */
    missing: {
      /** 締まっていない日（部署ごと）GET /daily-closing/missing?month=YYYY-MM */
      list: (month: string) =>
        tx.request<ClosingMissingEntries>("GET", `/daily-closing/missing${buildQueryString({ month })}`),
    },
    /** その日の速報 */
    dayFlash: {
      /** その日の速報（暫定売上。単価が無ければ null）GET /daily-closing/day-flash?facility_id=&date= */
      get: (facilityId: string, date: string) =>
        tx.request<ClosingDayFlash | null>("GET", `/daily-closing/day-flash${buildQueryString({ facility_id: facilityId, date })}`),
    },
    /** 事業部 */
    divisions: {
      /** 事業部の一覧 GET /daily-closing/divisions */
      list: () => tx.request<ClosingDivision[]>("GET", "/daily-closing/divisions"),
      /** 事業部を作る POST /daily-closing/divisions */
      create: (input: ClosingDivisionInput) =>
        tx.request<ClosingDivision>("POST", "/daily-closing/divisions", input),
      /** 事業部を直す PATCH /daily-closing/divisions/:id */
      update: (id: string, input: UpdateClosingDivisionInput) =>
        tx.request<ClosingDivision>("PATCH", `/daily-closing/divisions/${pathParam(id, "id")}`, input),
      /** 事業部を消す（論理削除）PATCH /daily-closing/divisions/:id/delete */
      delete: (id: string) =>
        tx.request<null>("PATCH", `/daily-closing/divisions/${pathParam(id, "id")}/delete`),
    },
    /** 施策 */
    initiatives: {
      /** 施策の一覧 GET /daily-closing/initiatives?month=&unitId= */
      list: (params: ClosingInitiativesParams) =>
        tx.request<ClosingInitiative[]>("GET", `/daily-closing/initiatives${buildQueryString(params)}`),
      /** 施策を作る POST /daily-closing/initiatives */
      create: (input: CreateClosingInitiativeInput) =>
        tx.request<ClosingInitiative>("POST", "/daily-closing/initiatives", input),
      /** 施策を直す PATCH /daily-closing/initiatives/:id */
      update: (id: string, input: UpdateClosingInitiativeInput) =>
        tx.request<ClosingInitiative>("PATCH", `/daily-closing/initiatives/${pathParam(id, "id")}`, input),
      /** 施策を消す（論理削除）PATCH /daily-closing/initiatives/:id/delete */
      delete: (id: string) =>
        tx.request<null>("PATCH", `/daily-closing/initiatives/${pathParam(id, "id")}/delete`),
    },
    /** 全社・事業部の集計 */
    company: {
      /** 全社・事業部の集計 GET /daily-closing/company?month=&divisionId= */
      get: (params: ClosingCompanyParams) =>
        tx.request<ClosingCompanySummary>("GET", `/daily-closing/company${buildQueryString(params)}`),
    },
    /** 過去分の取り込みと突き合わせ */
    legacy: {
      /** 過去分の取り込み（部署 × 月の塊・dryRun つき）POST /daily-closing/legacy/import */
      import: (input: ImportClosingLegacyInput) =>
        tx.request<ClosingLegacyImportResult>("POST", "/daily-closing/legacy/import", input),
      /** 突き合わせ（読むだけ）POST /daily-closing/legacy/reconcile */
      reconcile: (input: ReconcileClosingLegacyInput) =>
        tx.request<ClosingLegacyReconcileResult>("POST", "/daily-closing/legacy/reconcile", input),
    },
    /** 書き出し */
    export: {
      /** 明細の CSV GET /daily-closing/export?month= */
      get: (month: string) =>
        tx.request<ClosingExport>("GET", `/daily-closing/export${buildQueryString({ month })}`),
    },
  };
}
