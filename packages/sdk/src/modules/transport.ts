
import type {
  ApplyTransportTripTimesInput,
  ApplyTransportTripTimesResult,
  AssignTransportSheetEntryInput,
  CheckInTransportLogInput,
  ClientTransportCompatibility,
  ClientTransportCompatibilityRecord,
  ClientTransportRestriction,
  ClientTransportSettings,
  ConfirmTransportSheetInput,
  ConfirmTransportSheetResult,
  CreateClientTransportRestrictionInput,
  CreateTransportLogInput,
  CreateTransportRouteInput,
  CreateTransportRouteStopInput,
  CreateTransportSheetDraftInput,
  CreateTransportSheetDraftResult,
  CreateTransportTemplateFromDayInput,
  CreateTransportTemplateInput,
  DuplicateTransportTemplateInput,
  GenerateTransportSheetInput,
  GenerateTransportSheetResult,
  GenerateTransportTemplateInput,
  GenerateTransportTemplateResult,
  ListTransportLogsQuery,
  ListTransportRoutesQuery,
  RecordTransportLegForDayInput,
  RecordTransportSheetActualInput,
  RemoveTransportSheetEntryQuery,
  ReorderTransportRouteStopsInput,
  ReplaceTransportTemplateEntriesInput,
  SaveTransportSheetEntriesInput,
  SaveTransportSheetEntriesResult,
  SetTransportSheetCancelInput,
  SuggestTransportTripTimesForRowsInput,
  TransportDraftStop,
  TransportLog,
  TransportRoute,
  TransportRouteDetail,
  TransportRouteStop,
  TransportSheet,
  TransportSheetDayInput,
  TransportSheetDayQuery,
  TransportSheetHistoryItem,
  TransportSheetQuery,
  TransportSheetRecordResult,
  TransportSheetStateResult,
  TransportTemplate,
  TransportTemplateBoard,
  TransportTemplateDraftResult,
  TransportTemplateEntry,
  TransportTemplateListQuery,
  TransportTemplateTripTimesQuery,
  TransportTemplateTripTimesSuggestion,
  TransportTripTimesQuery,
  TransportTripTimesSuggestion,
  UpdateTransportLogInput,
  UpdateTransportRouteInput,
  UpdateTransportRouteStopInput,
  UpdateTransportSheetEntryInput,
  UpdateTransportTemplateInput,
  UpsertClientTransportCompatibilityInput,
  UpsertClientTransportSettingsInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString, toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

/** 送迎ルート管理 */
export function createTransportPlanNamespace(tx: SdkTransport) {
  return {
    routes: {
      /** GET /transport/routes — ルート一覧 */
      list: (params?: ListTransportRoutesQuery) => {
        const qs = new URLSearchParams();
        if (params?.facilityId) qs.set("facility_id", params.facilityId);
        if (params?.isActive !== undefined) qs.set("is_active", String(params.isActive));
        const q = qs.toString();
        return tx.request<TransportRoute[]>("GET", `/transport/routes${q ? `?${q}` : ""}`);
      },
      /** GET /transport/routes/:routeId — ルート詳細（停留所含む） */
      get: (routeId: string) =>
        tx.request<TransportRouteDetail>("GET", `/transport/routes/${pathParam(routeId, "routeId")}`),
      /** POST /transport/routes — ルート作成 */
      create: (input: CreateTransportRouteInput) =>
        tx.request<TransportRoute>("POST", "/transport/routes", toApiCamel(input as Record<string, unknown>)),
      /** PATCH /transport/routes/:routeId — ルート更新 */
      update: (routeId: string, input: UpdateTransportRouteInput) =>
        tx.request<TransportRoute>("PATCH", `/transport/routes/${pathParam(routeId, "routeId")}`, toApiCamel(input as Record<string, unknown>)),
      /** DELETE /transport/routes/:routeId — ルート無効化（is_active=false） */
      deactivate: (routeId: string) =>
        tx.request<void>("DELETE", `/transport/routes/${pathParam(routeId, "routeId")}`),
      /** POST /transport/routes/draft-from-schedules — 日課スケジュールから下書き生成 */
      draftFromSchedules: (input: { facility_id: string; service_date: string }) =>
        tx.request<TransportDraftStop[]>("POST", "/transport/routes/draft-from-schedules", input),
      stops: {
        /** GET /transport/routes/:routeId/stops — 停留所一覧 */
        list: (routeId: string) =>
          tx.request<TransportRouteStop[]>("GET", `/transport/routes/${pathParam(routeId, "routeId")}/stops`),
        /** POST /transport/routes/:routeId/stops — 停留所作成 */
        create: (routeId: string, input: CreateTransportRouteStopInput) =>
          tx.request<TransportRouteStop>("POST", `/transport/routes/${pathParam(routeId, "routeId")}/stops`, toApiCamel(input as Record<string, unknown>)),
        /** PATCH /transport/routes/:routeId/stops/:stopId — 停留所更新 */
        update: (routeId: string, stopId: string, input: UpdateTransportRouteStopInput) =>
          tx.request<TransportRouteStop>("PATCH", `/transport/routes/${pathParam(routeId, "routeId")}/stops/${pathParam(stopId, "stopId")}`, toApiCamel(input as Record<string, unknown>)),
        /** DELETE /transport/routes/:routeId/stops/:stopId — 停留所無効化 */
        deactivate: (routeId: string, stopId: string) =>
          tx.request<void>("DELETE", `/transport/routes/${pathParam(routeId, "routeId")}/stops/${pathParam(stopId, "stopId")}`),
        /** PUT /transport/routes/:routeId/stops/reorder — 停留所順序一括更新 */
        reorder: (routeId: string, input: ReorderTransportRouteStopsInput) =>
          tx.request<void>("PUT", `/transport/routes/${pathParam(routeId, "routeId")}/stops/reorder`, input),
      },
    },
    /** 利用者別 送迎設定（旧 client.transportSettings から移管・client-module-split.md §1）*/
    settings: {
      get: (clientId: string) =>
        tx.request<ClientTransportSettings | null>("GET", `/transport/clients/${pathParam(clientId, "clientId")}/transport`),
      /** PUT /transport/clients/:client_id/transport — 送迎設定を保存（車いす・普段の取り決め・停車位置は送らなければ今の値を残す） */
      upsert: (clientId: string, input: UpsertClientTransportSettingsInput) =>
        tx.request<ClientTransportSettings>("PUT", `/transport/clients/${pathParam(clientId, "clientId")}/transport`, toApiCamel(input as Record<string, unknown>)),
      restrictions: {
        list: (clientId: string) =>
          tx.request<ClientTransportRestriction[]>("GET", `/transport/clients/${pathParam(clientId, "clientId")}/transport/restrictions`),
        create: (clientId: string, input: CreateClientTransportRestrictionInput) =>
          tx.request<ClientTransportRestriction>("POST", `/transport/clients/${pathParam(clientId, "clientId")}/transport/restrictions`, toApiCamel(input as Record<string, unknown>)),
        delete: (clientId: string, id: string) =>
          tx.request<void>("DELETE", `/transport/clients/${pathParam(clientId, "clientId")}/transport/restrictions/${pathParam(id, "id")}`),
      },
      compatibility: {
        /** GET /transport/clients/:client_id/transport/compatibility — 同乗の相性一覧（起点の利用者から見た相手） */
        list: (clientId: string) =>
          tx.request<ClientTransportCompatibility[]>("GET", `/transport/clients/${pathParam(clientId, "clientId")}/transport/compatibility`),
        /** PUT /transport/clients/:client_id/transport/compatibility — 同乗の相性を登録（同じ組があれば上書き） */
        upsert: (clientId: string, input: UpsertClientTransportCompatibilityInput) =>
          tx.request<ClientTransportCompatibilityRecord>("PUT", `/transport/clients/${pathParam(clientId, "clientId")}/transport/compatibility`, toApiCamel(input as Record<string, unknown>)),
        /** DELETE /transport/clients/:client_id/transport/compatibility/:other_client_id — 同乗の相性を削除（相手の利用者 ID で組を指す） */
        delete: (clientId: string, otherClientId: string) =>
          tx.request<void>("DELETE", `/transport/clients/${pathParam(clientId, "clientId")}/transport/compatibility/${pathParam(otherClientId, "otherClientId")}`),
      },
    },
    /** 送迎表の確定した日（「過去から複製する」の写し元） */
    confirmations: {
      /** GET /transport/confirmed-days — その方向の確定した日（YYYY-MM-DD）を新しい順に */
      listDays: (facilityId: string, direction: "pickup" | "dropoff") =>
        tx.request<string[]>("GET", `/transport/confirmed-days?facility_id=${encodeURIComponent(facilityId)}&direction=${direction}`),
    },
    /** 送迎表のテンプレート（方向ごと）。**迎えと送りは別物** */
    templates: {
      /** GET /transport/templates — 事業所 × 方向のテンプレート一覧 */
      list: (params: TransportTemplateListQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          direction: params.direction,
        }).toString();
        return tx.request<TransportTemplate[]>("GET", `/transport/templates?${qs}`);
      },
      /** POST /transport/templates — テンプレートを作る（中身は空） */
      create: (input: CreateTransportTemplateInput) =>
        tx.request<TransportTemplate>("POST", "/transport/templates", input),
      /** PATCH /transport/templates/:template_id — 名前を変える */
      update: (templateId: string, input: UpdateTransportTemplateInput) =>
        tx.request<TransportTemplate>("PATCH", `/transport/templates/${pathParam(templateId, "templateId")}`, input),
      /** POST /transport/templates/:template_id/duplicate — 中身ごと複製する（名前を省くと「〇〇のコピー」） */
      duplicate: (templateId: string, input: DuplicateTransportTemplateInput) =>
        tx.request<TransportTemplate>("POST", `/transport/templates/${pathParam(templateId, "templateId")}/duplicate`, input),
      /** POST /transport/templates/from-day — 過去の確定した日（同じ方向）の行を写したテンプレートを作る */
      fromDay: (input: CreateTransportTemplateFromDayInput) =>
        tx.request<TransportTemplateDraftResult>("POST", "/transport/templates/from-day", input),
      /** POST /transport/templates/generate — 曜日の契約の利用曜日から、事業所の車両・運転者で AI で組んだテンプレートを作る */
      generate: (input: GenerateTransportTemplateInput) =>
        tx.request<GenerateTransportTemplateResult>("POST", "/transport/templates/generate", input),
      /** GET /transport/templates/board — テンプレートの盤面の材料（この事業所の利用者・車両・所属する職員） */
      board: (facilityId: string) =>
        tx.request<TransportTemplateBoard>("GET", `/transport/templates/board${buildQueryString({ facility_id: facilityId })}`),
      /** DELETE /transport/templates/:template_id — 消す（`transport:delete`） */
      delete: (templateId: string) =>
        tx.request<{ id: string }>("DELETE", `/transport/templates/${pathParam(templateId, "templateId")}`),
      /** GET /transport/templates/:template_id/entries — 中身（便・並び順） */
      entries: (templateId: string) =>
        tx.request<TransportTemplateEntry[]>("GET", `/transport/templates/${pathParam(templateId, "templateId")}/entries`),
      /** PUT /transport/templates/:template_id/entries — 中身をその方向だけ置き換える */
      replaceEntries: (templateId: string, input: ReplaceTransportTemplateEntriesInput) =>
        tx.request<{ templateId: string; written: number }>("PUT", `/transport/templates/${pathParam(templateId, "templateId")}/entries`, input),
      /** GET /transport/templates/:template_id/trip-times — テンプレートの車 1 台の時刻の案（契約の提供時間・何も書かない） */
      tripTimes: (templateId: string, params: TransportTemplateTripTimesQuery) =>
        tx.request<TransportTemplateTripTimesSuggestion>("GET", `/transport/templates/${pathParam(templateId, "templateId")}/trip-times${buildQueryString(params)}`),
    },
    sheets: {
      /** GET /transport/sheets — その日の送迎表（名簿・方向ごとの状態と行・確定した行・車両・運転者・同乗させない組） */
      get: (params: TransportSheetQuery) =>
        tx.request<TransportSheet>("GET", `/transport/sheets${buildQueryString(params)}`),
      /**
       * POST /transport/sheets/draft — 下書きを作る（未作成）・入れ直す（下書き・編集中）。
       * 作り方は blank / template / copy。その日の利用予定に無い人は入れず skipped に返す。
       */
      createDraft: (input: CreateTransportSheetDraftInput) =>
        tx.request<CreateTransportSheetDraftResult>("POST", "/transport/sheets/draft", input),
      /** DELETE /transport/sheets/draft — 下書きを捨てる（未作成に戻す・transport:delete） */
      discardDraft: (params: TransportSheetDayQuery) =>
        tx.request<TransportSheetStateResult>("DELETE", `/transport/sheets/draft${buildQueryString(params)}`),
      /** POST /transport/sheets/confirm — 確定する（rows を付けると保存してから確定。走れない割当が残っていたら 400） */
      confirm: (input: ConfirmTransportSheetInput) =>
        tx.request<ConfirmTransportSheetResult>("POST", "/transport/sheets/confirm", input),
      /** POST /transport/sheets/actual — 車両運行記録: 利用者宅に着いた実測の時刻を書く（確定した日だけ・null で消す） */
      recordActual: (input: RecordTransportSheetActualInput) =>
        tx.request<TransportSheetRecordResult>("POST", "/transport/sheets/actual", input),
      /** POST /transport/sheets/cancel — 車両運行記録: キャンセルにする（理由つき）・取り消す（確定した日だけ） */
      setCancel: (input: SetTransportSheetCancelInput) =>
        tx.request<TransportSheetRecordResult>("POST", "/transport/sheets/cancel", input),
      /** POST /transport/sheets/edit — 編集する（確定 → 編集中） */
      startEdit: (input: TransportSheetDayInput) =>
        tx.request<TransportSheetStateResult>("POST", "/transport/sheets/edit", input),
      /** POST /transport/sheets/cancel-edit — 編集をやめる（確定したときの行に戻す） */
      cancelEdit: (input: TransportSheetDayInput) =>
        tx.request<TransportSheetStateResult>("POST", "/transport/sheets/cancel-edit", input),
      /** GET /transport/sheets/history — 作成済みの送迎表の履歴（新しい順・最大 100 件） */
      history: (facilityId: string) =>
        tx.request<TransportSheetHistoryItem[]>("GET", `/transport/sheets/history${buildQueryString({ facility_id: facilityId })}`),
      /** POST /transport/sheets/entries — 利用者をフレーム（車両 × 運転者）に割り当てる（既にあれば付け替え） */
      assignEntry: (input: AssignTransportSheetEntryInput) =>
        tx.request<null>("POST", "/transport/sheets/entries", input),
      /** PATCH /transport/sheets/entries — 割当済みの行の便目・時刻・並び順・メモを直す */
      updateEntry: (input: UpdateTransportSheetEntryInput) =>
        tx.request<null>("PATCH", "/transport/sheets/entries", input),
      /** DELETE /transport/sheets/entries — 割当の解除（下書き・編集中の行を消して未割当に戻す・transport:write） */
      removeEntry: (params: RemoveTransportSheetEntryQuery) =>
        tx.request<null>("DELETE", `/transport/sheets/entries${buildQueryString(params)}`),
      /** PUT /transport/sheets/entries — 盤面をまとめて保存（下書き・編集中のその方向の行を丸ごと置き換える） */
      saveEntries: (input: SaveTransportSheetEntriesInput) =>
        tx.request<SaveTransportSheetEntriesResult>("PUT", "/transport/sheets/entries", input),
      /** POST /transport/sheets/generate — AI で組む（その方向の下書きを入れ替える。確定した方向は 409） */
      generate: (input: GenerateTransportSheetInput) =>
        tx.request<GenerateTransportSheetResult>("POST", "/transport/sheets/generate", input),
      /** GET /transport/sheets/trip-times — 車 1 台の時刻の案（並び順は変えない・何も書かない） */
      tripTimes: (params: TransportTripTimesQuery) =>
        tx.request<TransportTripTimesSuggestion>("GET", `/transport/sheets/trip-times${buildQueryString(params)}`),
      /** POST /transport/sheets/trip-times/suggest — 渡した行（画面の下書きの便・並び）で車 1 台の時刻の案を出す（何も書かない） */
      tripTimesForRows: (input: SuggestTransportTripTimesForRowsInput) =>
        tx.request<TransportTripTimesSuggestion>("POST", "/transport/sheets/trip-times/suggest", input),
      /** POST /transport/sheets/trip-times — 案のうち選んだ行の時刻を反映する（下書き・編集中だけ・確定は 409） */
      applyTripTimes: (input: ApplyTransportTripTimesInput) =>
        tx.request<ApplyTransportTripTimesResult>("POST", "/transport/sheets/trip-times", input),
    },
  };
}

export function createTransportLogNamespace(tx: SdkTransport) {
  return {
    logs: {
      /**
       * 乗降実績一覧
       * GET /transport/logs
       */
      list: (params?: ListTransportLogsQuery) => {
        const q = params ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)]),
        ).toString() : "";
        return tx.request<TransportLog[]>("GET", `/transport/logs${q ? `?${q}` : ""}`);
      },
      /**
       * 乗降実績単件取得
       * GET /transport/logs/:id
       */
      get: (id: string) => tx.request<TransportLog>("GET", `/transport/logs/${pathParam(id, "id")}`),
      /**
       * 乗降実績登録
       * POST /transport/logs
       */
      create: (input: CreateTransportLogInput) =>
        tx.request<TransportLog>("POST", "/transport/logs", toApiCamel(input as Record<string, unknown>)),
      /**
       * 乗降実績更新
       * PATCH /transport/logs/:id
       */
      update: (id: string, input: UpdateTransportLogInput) =>
        tx.request<TransportLog>("PATCH", `/transport/logs/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /**
       * ワンタップチェックイン（乗降ステータス更新）
       * PATCH /transport/logs/:id/checkin
       */
      checkIn: (id: string, input: CheckInTransportLogInput) =>
        tx.request<TransportLog>("PATCH", `/transport/logs/${pathParam(id, "id")}/checkin`, toApiCamel(input as Record<string, unknown>)),
      /**
       * その日の送迎の片道 1 本を〇×で記録（あれば直し・無ければ作る）
       * POST /transport/logs/day-leg
       */
      recordDayLeg: (input: RecordTransportLegForDayInput) =>
        tx.request<TransportLog>("POST", `/transport/logs/day-leg`, input),
      /**
       * 乗降実績論理削除
       * DELETE /transport/logs/:id（法定保存: deleted_at のみ設定、物理削除しない）
       */
      delete: (id: string) => tx.request<null>("DELETE", `/transport/logs/${pathParam(id, "id")}`),
    },
  };
}
