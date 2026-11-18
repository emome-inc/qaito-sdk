
import type {
  CloseShiftDaysInput,
  CloseShiftDaysResult,
  CreateShiftTypeInput,
  DeleteShiftSlotsInput,
  DeleteShiftSlotsResult,
  GetShiftActualQuery,
  GetShiftMonthQuery,
  ListMyShiftActualQuery,
  ListShiftPatternsQuery,
  ListShiftTypesQuery,
  PlaceShiftStandbyPlanInput,
  PlaceShiftStandbyPlanResult,
  RecordShiftStandbyActualInput,
  RecordShiftStandbyActualResult,
  ReopenShiftDaysResult,
  SaveShiftActualsInput,
  SaveShiftPatternsInput,
  SaveShiftPlansInput,
  ShiftActual,
  ShiftActualAnswer,
  ShiftCapabilities,
  ShiftMonth,
  ShiftPattern,
  ShiftPatternMonthInput,
  ShiftPatternMonthResult,
  ShiftPlan,
  ShiftPrintSheetResult,
  ShiftSheetQuery,
  ShiftStandbySummary,
  ShiftStandbySummaryQuery,
  ShiftType,
  UpdateShiftTypeInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createShiftNamespace(tx: SdkTransport) {
  return {
    types: {
      /** GET /shift/types — 種類の一覧（組織共通 + 指定の事業所専用。無効なものは include_inactive） */
      list: (params: ListShiftTypesQuery) =>
        tx.request<ShiftType[]>("GET", `/shift/types${buildQueryString(params)}`),
      /** POST /shift/types — 種類の作成（分け方は必須・作ったあとは変えられない） */
      create: (input: CreateShiftTypeInput) => tx.request<ShiftType>("POST", "/shift/types", input),
      /** PATCH /shift/types/:id — 呼び名・文字・色・並び・有効（無効化は active:false） */
      update: (typeId: string, input: UpdateShiftTypeInput) =>
        tx.request<ShiftType>("PATCH", `/shift/types/${pathParam(typeId, "typeId")}`, input),
    },
    /** シフトの予定のコマ（staff.shift_plans） */
    plans: {
      /** PUT /shift/plans — 予定のコマのまとめて保存（1 件でも断られたら全部やめる） */
      save: (input: SaveShiftPlansInput) => tx.request<ShiftPlan[]>("PUT", "/shift/plans", input),
      /** POST /shift/plans/delete — 予定のコマの削除（締めた日・実績が指している予定は 409） */
      delete: (input: DeleteShiftSlotsInput) =>
        tx.request<DeleteShiftSlotsResult>("POST", "/shift/plans/delete", input),
    },
    /** シフトの実績のコマ（staff.shift_actuals）— 予定と違った所だけ */
    actuals: {
      /** PUT /shift/actuals — 実績のコマのまとめて保存（予定を指せば置き換え・指さなければ追加） */
      save: (input: SaveShiftActualsInput) => tx.request<ShiftActual[]>("PUT", "/shift/actuals", input),
      /** POST /shift/actuals/delete — 実績のコマの削除（締めた日は 409） */
      delete: (input: DeleteShiftSlotsInput) =>
        tx.request<DeleteShiftSlotsResult>("POST", "/shift/actuals/delete", input),
    },
    /** シフトの確定（staff.shift_closes）— 事業所 × 日 */
    closes: {
      /** POST /shift/closes — 予定または実績の確定（期間の日ごとに行が入る） */
      close: (input: CloseShiftDaysInput) => tx.request<CloseShiftDaysResult>("POST", "/shift/closes", input),
      /** POST /shift/closes/reopen — 確定の解除 */
      reopen: (input: CloseShiftDaysInput) =>
        tx.request<ReopenShiftDaysResult>("POST", "/shift/closes/reopen", input),
    },
    /** シフトの実際（予定と実績を合わせた読み口）と月の表の板 */
    view: {
      /** GET /shift/actual-view — 実際（予定と実績を合わせた結果）。コマが無い日は has_input に出ない */
      actual: (params: GetShiftActualQuery) =>
        tx.request<ShiftActualAnswer>("GET", `/shift/actual-view${buildQueryString(params)}`),
      /** GET /shift/month — 月の表が 1 回で取る板（名簿・種類・予定・実績・実際・確定） */
      month: (params: GetShiftMonthQuery) =>
        tx.request<ShiftMonth>("GET", `/shift/month${buildQueryString(params)}`),
      /** GET /shift/my-actual-view — 自分の実際（62 日まで・事業所をまたぐ・本人の口） */
      mine: (params: ListMyShiftActualQuery) =>
        tx.request<ShiftActualAnswer>("GET", `/shift/my-actual-view${buildQueryString(params)}`),
    },
    /** 曜日ごとの決まり（待機の種類）と、月初の予定の入力・当番の実績 */
    patterns: {
      /** GET /shift/patterns — 事業所の曜日ごとの決まり（待機の種類 × 曜日） */
      list: (params: ListShiftPatternsQuery) =>
        tx.request<ShiftPattern[]>("GET", `/shift/patterns${buildQueryString(params)}`),
      /** PUT /shift/patterns — 枠ごとに直す（無ければ作る。送らなかった枠は残す。使わない枠は担当を空にする） */
      save: (input: SaveShiftPatternsInput) => tx.request<ShiftPattern[]>("PUT", "/shift/patterns", input),
      /** POST /shift/patterns/generate-preview — 1 か月ぶんを作るとどうなるか（書かない） */
      previewMonth: (input: ShiftPatternMonthInput) =>
        tx.request<ShiftPatternMonthResult>("POST", "/shift/patterns/generate-preview", input),
      /** POST /shift/patterns/generate — 1 か月ぶんの予定を作る（一度決めた枠・手で消した日は作り直さない） */
      generateMonth: (input: ShiftPatternMonthInput) =>
        tx.request<ShiftPatternMonthResult>("POST", "/shift/patterns/generate", input),
    },
    /** 待機（オンコール）の予定を置く・実績を入れる・月の回数 */
    standby: {
      /** POST /shift/standby/plans — 1 日分の当番を置く（その日・その種類の予定があれば担当だけ替える） */
      placePlan: (input: PlaceShiftStandbyPlanInput) =>
        tx.request<PlaceShiftStandbyPlanResult>("POST", "/shift/standby/plans", input),
      /** PUT /shift/standby/actuals — 当番の実績（交代・中止・追加・予定どおりへの取り消し） */
      recordActual: (input: RecordShiftStandbyActualInput) =>
        tx.request<RecordShiftStandbyActualResult>("PUT", "/shift/standby/actuals", input),
      /** GET /shift/standby/summary — 月（暦月）の待機（オンコール）の回数（職員ごと・夜の数・番手別。手当の金額は出さない） */
      summary: (params: ShiftStandbySummaryQuery) =>
        tx.request<ShiftStandbySummary>("GET", `/shift/standby/summary${buildQueryString(params)}`),
    },
    /** シフト表（月間）の紙の表と xlsx */
    sheet: {
      /** GET /shift/sheet/print — シフト表（月間）を組んだ表そのもの（紙の印刷ビューが描く元）。xlsx と同じ中身。mode=actual で実績表 */
      print: (params: ShiftSheetQuery) =>
        tx.request<ShiftPrintSheetResult>("GET", `/shift/sheet/print${buildQueryString(params)}`),
      /** GET /shift/sheet/xlsx — シフト表（月間・xlsx）。画面の印刷と同じ表。mode=actual で実績表 */
      xlsx: (params: ShiftSheetQuery): Promise<Blob> =>
        tx.requestBlob("GET", `/shift/sheet/xlsx${buildQueryString(params)}`),
    },
    /** 事業所のシフト機能（待機を使えるか） */
    capabilities: {
      /** GET /shift/capabilities — 事業所のシフト機能の利用可否 */
      get: (params: { facility_id: string }) => tx.request<ShiftCapabilities>("GET", `/shift/capabilities?${new URLSearchParams(params)}`),
    },
  };
}
