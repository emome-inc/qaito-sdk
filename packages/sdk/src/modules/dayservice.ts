
import type {
  BulkSetDayserviceExerciseChecksInput,
  BulkSetStatusFlagsInput,
  BulkSetStatusFlagsResult,
  ClearDayserviceDrinkOrderQuery,
  ConfirmDailyRecordsInput,
  CreateDayserviceDailyJobInput,
  CreateDayserviceSeatingChartInput,
  CreateDayserviceSelfPayPurchaseInput,
  CreateDayserviceSelfPayPurchaseWithNewItemInput,
  DayserviceBathBoard,
  DayserviceBoardDeleted,
  DayserviceBoardSetting,
  DayserviceBoardVersion,
  DayserviceContactSheet,
  DayserviceDailyChecks,
  DayserviceDailyConfirmation,
  DayserviceDailyConfirmationQuery,
  DayserviceDailyConfirmationResult,
  DayserviceDailyConfirmedDay,
  DayserviceDailyJob,
  DayserviceDailyJobCheck,
  DayserviceDailyJobsQuery,
  DayserviceDailyRecords,
  DayserviceDailyTask,
  DayserviceDrinkBoard,
  DayserviceDrinkMenu,
  DayserviceDrinkMenusQuery,
  DayserviceDrinkOrder,
  DayserviceExerciseBoard,
  DayserviceExerciseChecksBulkResult,
  DayserviceExerciseMenu,
  DayserviceExerciseMenusQuery,
  DayserviceExerciseProgress,
  DayserviceFacilityDayQuery,
  DayserviceFacilityQuery,
  DayserviceMealBoard,
  DayserviceMedicationBoard,
  DayserviceRecordDay,
  DayserviceSeatingBoard,
  DayserviceSeatingChart,
  DayserviceSeatingChartListItem,
  DayserviceSeatingPlacement,
  DayserviceSeatingRule,
  DayserviceSeatingRuleSaved,
  DayserviceSelfPayItemOption,
  DayserviceSelfPayPurchase,
  DayserviceSelfPayPurchaseList,
  DayserviceSelfPayPurchasesQuery,
  DayserviceStatusRecord,
  DayserviceVitalsBoard,
  GenerateAllContactSheetNotesInput,
  GenerateAllContactSheetNotesSummary,
  GenerateContactSheetNoteInput,
  GeneratedContactSheetNote,
  ListDayserviceDailyTasksQuery,
  ListDayserviceStatusRecordsQuery,
  MedicationAdministration,
  PlaceDayserviceSeatingClientInput,
  ProofreadContactSheetNoteInput,
  ProofreadContactSheetNoteResult,
  RecordMedicationInput,
  ReflectNursingToContactSheetInput,
  ReflectNursingToContactSheetResult,
  SaveDayserviceDrinkMenuInput,
  SaveDayserviceExerciseMenuInput,
  SaveDayserviceSeatingDesksInput,
  SaveDayserviceSeatingRuleInput,
  SetAllContactSheetNotesInput,
  SetAllContactSheetNotesSummary,
  SetDayserviceBoardSettingInput,
  SetDayserviceClientExerciseMenusInput,
  SetDayserviceDailyJobCheckInput,
  SetDayserviceDrinkOrderInput,
  SetDayserviceExerciseChecksInput,
  UpdateDayserviceDailyJobInput,
  UpdateDayserviceSelfPayPurchaseInput,
  UpdateDayserviceStatusRecordInput,
  UpsertDayserviceStatusRecordInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createDayserviceDailyNamespace(tx: SdkTransport) {
  return {
    boards: {
      /**
       * GET /dayservice/boards/bath — 入浴ボード（入浴の対象・バイタル済みか・入浴済みか・写真）。
       * `client:read` が無ければ氏名は null。
       */
      bath: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceBathBoard>("GET", `/dayservice/boards/bath?${qs}`);
      },
      /** GET /dayservice/boards/meal — 食事ボード（主食・副食の量・歯磨き・写真） */
      meal: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceMealBoard>("GET", `/dayservice/boards/meal?${qs}`);
      },
      /** GET /dayservice/boards/vitals — バイタルボード（その日のバイタル・再検査・写真） */
      vitals: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceVitalsBoard>("GET", `/dayservice/boards/vitals?${qs}`);
      },
      /**
       * GET /dayservice/boards/medication — 服薬入力・服薬ボードの素材（利用者ごとの窓〔時間範囲〕× 服薬状況・
       * その日の名簿・時間範囲が未設定の人）。窓の薬名は clinical-record:read を持つときだけ入る。
       */
      medication: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceMedicationBoard>("GET", `/dayservice/boards/medication?${qs}`);
      },
      /**
       * GET /dayservice/board-version — 掲示ボードの版（中身の分からない文字列）。
       * 前に読んだ版と同じなら、1 日分を読み直さなくてよい。
       */
      version: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceBoardVersion>("GET", `/dayservice/board-version?${qs}`);
      },
    },
    medication: {
      /**
       * POST /dayservice/medication/records — 服薬を記録する。窓（windowStart〜windowEnd）がその利用者の服薬管理に
       * あるかを確かめてから、その日の窓の実績を find-or-create する（冪等）。取り消しは status=pending。
       */
      record: (input: RecordMedicationInput) =>
        tx.request<MedicationAdministration>("POST", "/dayservice/medication/records", input),
    },
    confirmations: {
      /** GET /dayservice/confirmations — その日が確定済みか（未確定なら null） */
      get: (params: DayserviceDailyConfirmationQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceDailyConfirmation | null>(
          "GET",
          `/dayservice/confirmations?${qs}`,
        );
      },
      /** GET /dayservice/confirmed-days — 確定済みの日（YYYY-MM-DD）を新しい順に */
      listDays: (facilityId: string) =>
        tx.request<string[]>("GET", `/dayservice/confirmed-days?facility_id=${encodeURIComponent(facilityId)}`),
      /**
       * PUT /dayservice/confirmations — その日の実績を締める（冪等）。
       * 出勤 / 欠勤をシフト実績へ写してから締める。実績そのものはコピーしない。
       */
      confirm: (input: ConfirmDailyRecordsInput) =>
        tx.request<DayserviceDailyConfirmedDay>("PUT", "/dayservice/confirmations", input),
      /** DELETE /dayservice/confirmations — 確定を解除する（`dayservice:delete`） */
      release: (params: DayserviceDailyConfirmationQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceDailyConfirmationResult>(
          "DELETE",
          `/dayservice/confirmations?${qs}`,
        );
      },
    },
    contactSheets: {
      /**
       * GET /dayservice/contact-sheet — 今日の連絡票（定型欄・連絡事項・生成の素材・載せる写真の合成）。
       * パスは単数（複数形の `/contact-sheets/*` は AI 生成の口）。
       */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceContactSheet>("GET", `/dayservice/contact-sheet?${qs}`);
      },
      /**
       * POST /dayservice/contact-sheets/generate — 1 名の連絡事項を AI で作り直して連絡帳に保存する（上書き）。
       * 書き込みは連絡帳の所有モジュールのゲート（`care-record:write`）。AI が混んでいれば 429。
       */
      generate: (input: GenerateContactSheetNoteInput) =>
        tx.request<GeneratedContactSheetNote>("POST", "/dayservice/contact-sheets/generate", input),
      /** POST /dayservice/contact-sheets/generate-all — その日の全員分を AI で作る（既定は未入力の人だけ・`overwrite: true` で書いてある人も作り直す） */
      generateAll: (input: GenerateAllContactSheetNotesInput) =>
        tx.request<GenerateAllContactSheetNotesSummary>("POST", "/dayservice/contact-sheets/generate-all", input),
      /** POST /dayservice/contact-sheets/set-all — その日の全員に同じ文章を入れる（`mode`: fill_empty〔既定・未入力の人だけ〕/ overwrite / append） */
      setAll: (input: SetAllContactSheetNotesInput) =>
        tx.request<SetAllContactSheetNotesSummary>("POST", "/dayservice/contact-sheets/set-all", input),
      reflectNursing: (input: ReflectNursingToContactSheetInput) =>
        tx.request<ReflectNursingToContactSheetResult>("POST", "/dayservice/contact-sheet/reflect-nursing", input),
      /** POST /dayservice/contact-sheets/proofread — 連絡事項の文を AI で校正して返す（保存しない） */
      proofread: (input: ProofreadContactSheetNoteInput) =>
        tx.request<ProofreadContactSheetNoteResult>("POST", "/dayservice/contact-sheets/proofread", input),
    },
    dailyRecords: {
      /**
       * GET /dayservice/daily-records — 今日の実績（実績表・フロアボードの材料）。
       * 出欠・バイタル・入浴・食事・歯磨き・運動・再検・その日の 1 枚を利用者ごとに（薬は boards.medication）。
       */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceDailyRecords>("GET", `/dayservice/daily-records?${qs}`);
      },
    },
    recordDays: {
      /** GET /dayservice/record-days — 実績表のある日（週間予定を確定して予定が入った日・新しい順・人数つき） */
      list: (facilityId: string) =>
        tx.request<DayserviceRecordDay[]>("GET", `/dayservice/record-days${buildQueryString({ facility_id: facilityId })}`),
    },
    statusRecords: {
      /** GET /dayservice/status-records — 事業所 × 日の一覧（client_id で絞込可） */
      list: (params: ListDayserviceStatusRecordsQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
          ...(params.client_id ? { client_id: params.client_id } : {}),
        }).toString();
        return tx.request<DayserviceStatusRecord[]>(
          "GET",
          `/dayservice/status-records?${qs}`,
        );
      },
      /**
       * PUT /dayservice/status-records — 利用者 × 日で 1 行の upsert。
       * 省略したフィールドは既存値を保持する（＝部分更新）。
       */
      upsert: (input: UpsertDayserviceStatusRecordInput) =>
        tx.request<DayserviceStatusRecord>("PUT", "/dayservice/status-records", input),
      /**
       * POST /dayservice/status-records/bulk-flags — 弁当・おやつを、来ていてまだ付いていない人にまとめて付ける。
       * mode=revert で付けた分を外す。
       */
      bulkSetFlags: (input: BulkSetStatusFlagsInput) =>
        tx.request<BulkSetStatusFlagsResult>("POST", "/dayservice/status-records/bulk-flags", input),
      /** PATCH /dayservice/status-records/:record_id — 既存行の部分更新 */
      update: (recordId: string, input: UpdateDayserviceStatusRecordInput) =>
        tx.request<DayserviceStatusRecord>("PATCH", `/dayservice/status-records/${pathParam(recordId, "recordId")}`, input),
    },
    tasks: {
      /** GET /dayservice/tasks — 当日タスク一覧（client_id で絞込可） */
      list: (params: ListDayserviceDailyTasksQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
          ...(params.client_id ? { client_id: params.client_id } : {}),
        }).toString();
        return tx.request<DayserviceDailyTask[]>("GET", `/dayservice/tasks?${qs}`);
      },
      /** PATCH /dayservice/tasks/:task_id — 完了状態を明示 set */
      setDone: (taskId: string, done: boolean) =>
        tx.request<DayserviceDailyTask>("PATCH", `/dayservice/tasks/${pathParam(taskId, "taskId")}`, { done }),
    },
    dailyJobs: {
      /** GET /dayservice/daily-jobs — 事業所の日次業務（並び → 時刻 → 名前）。include_archived で非表示の業務も */
      list: (params: DayserviceDailyJobsQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          ...(params.include_archived ? { include_archived: "true" } : {}),
        }).toString();
        return tx.request<DayserviceDailyJob[]>("GET", `/dayservice/daily-jobs?${qs}`);
      },
      /** POST /dayservice/daily-jobs — 日次業務を作る（同じ業務名と時刻の有効な行があれば 409） */
      create: (input: CreateDayserviceDailyJobInput) =>
        tx.request<DayserviceDailyJob>("POST", "/dayservice/daily-jobs", input),
      /** PATCH /dayservice/daily-jobs/:id — 日次業務を直す（送った項目だけ） */
      update: (id: string, input: UpdateDayserviceDailyJobInput) =>
        tx.request<DayserviceDailyJob>("PATCH", `/dayservice/daily-jobs/${pathParam(id, "id")}`, input),
      /** DELETE /dayservice/daily-jobs/:id — 日次業務を非表示にする（`dayservice:delete`。過去の完了の業務名は残る） */
      archive: (id: string, params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceBoardDeleted>("DELETE", `/dayservice/daily-jobs/${pathParam(id, "id")}?${qs}`);
      },
    },
    dailyChecks: {
      /** GET /dayservice/daily-checks — その日の日次チェック（日次業務ごとの完了・完了した人と時刻。時刻順） */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceDailyChecks>("GET", `/dayservice/daily-checks?${qs}`);
      },
      /** PUT /dayservice/daily-checks — その日の日次業務の完了・取り消し（冪等） */
      set: (input: SetDayserviceDailyJobCheckInput) =>
        tx.request<DayserviceDailyJobCheck>("PUT", "/dayservice/daily-checks", input),
    },
    drinkBoard: {
      /**
       * GET /dayservice/drink-board — ドリンクボード（名簿 + 注文 + メニュー + メニューごとの個数）。
       * `client:read` が無ければ氏名は null。
       */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceDrinkBoard>("GET", `/dayservice/drink-board?${qs}`);
      },
      /** GET /dayservice/drink-board/menus — メニューの一覧（並び順）。include_archived で非表示のメニューも */
      menus: (params: DayserviceDrinkMenusQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          ...(params.include_archived ? { include_archived: "true" } : {}),
        }).toString();
        return tx.request<DayserviceDrinkMenu[]>("GET", `/dayservice/drink-board/menus?${qs}`);
      },
      /** PUT /dayservice/drink-board/menus — メニューを作る（id なし・name 必須）/ 直す（id あり）。砂糖・ミルクを選べるかもここ */
      saveMenu: (input: SaveDayserviceDrinkMenuInput) =>
        tx.request<DayserviceDrinkMenu>("PUT", "/dayservice/drink-board/menus", input),
      /** DELETE /dayservice/drink-board/menus/:id — メニューを非表示にする（`dayservice:delete`。過去の注文は名前が残る） */
      archiveMenu: (id: string, params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceBoardDeleted>("DELETE", `/dayservice/drink-board/menus/${pathParam(id, "id")}?${qs}`);
      },
      /** PUT /dayservice/drink-board/orders — その人のその日の注文を置き換える（1 人 1 日 1 ドリンク） */
      setOrder: (input: SetDayserviceDrinkOrderInput) =>
        tx.request<DayserviceDrinkOrder[]>("PUT", "/dayservice/drink-board/orders", input),
      /** DELETE /dayservice/drink-board/orders — その人のその日の注文を全部取り消す（`dayservice:delete`） */
      clearOrder: (params: ClearDayserviceDrinkOrderQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
          client_id: params.client_id,
        }).toString();
        return tx.request<{ clientId: string; date: string }>("DELETE", `/dayservice/drink-board/orders?${qs}`);
      },
    },
    selfPay: {
      /** GET /dayservice/self-pay-items — 自費購入で選べる品目（事業所の使っている物・並び順。単価 null = 都度入れる品目） */
      items: (params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceSelfPayItemOption[]>("GET", `/dayservice/self-pay-items?${qs}`);
      },
      /** GET /dayservice/self-pay-purchases — その日（date）かその月（ym）の自費購入と合計（client_id で利用者に絞れる） */
      list: (params: DayserviceSelfPayPurchasesQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          ...(params.date ? { date: params.date } : {}),
          ...(params.ym ? { ym: params.ym } : {}),
          ...(params.client_id ? { client_id: params.client_id } : {}),
        }).toString();
        return tx.request<DayserviceSelfPayPurchaseList>("GET", `/dayservice/self-pay-purchases?${qs}`);
      },
      /** POST /dayservice/self-pay-purchases — 自費購入を足す（マスタの品目か、その 1 回限りの名前。発行済みの月は 409） */
      create: (input: CreateDayserviceSelfPayPurchaseInput) =>
        tx.request<DayserviceSelfPayPurchase>("POST", "/dayservice/self-pay-purchases", input),
      /** POST /dayservice/self-pay-purchases/with-new-item — 品目をその場でマスタに登録して買う（登録は user-billing:write の人だけ） */
      createWithNewItem: (input: CreateDayserviceSelfPayPurchaseWithNewItemInput) =>
        tx.request<DayserviceSelfPayPurchase>("POST", "/dayservice/self-pay-purchases/with-new-item", input),
      /** PATCH /dayservice/self-pay-purchases/:id — 数量・単価・一言を直す（発行済みの月は 409） */
      update: (id: string, input: UpdateDayserviceSelfPayPurchaseInput) =>
        tx.request<DayserviceSelfPayPurchase>("PATCH", `/dayservice/self-pay-purchases/${pathParam(id, "id")}`, input),
      /** DELETE /dayservice/self-pay-purchases/:id — 取り消す（論理削除・dayservice:delete。発行済みの月は 409） */
      delete: (id: string) =>
        tx.request<null>("DELETE", `/dayservice/self-pay-purchases/${pathParam(id, "id")}`),
    },
    boardSettings: {
      /** GET /dayservice/board-settings — 利用者ごとのボードの設定の一覧（入浴しない・食事をとらないのどちらかが立っている人） */
      list: (params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceBoardSetting[]>("GET", `/dayservice/board-settings?${qs}`);
      },
      /** PUT /dayservice/board-settings — その人の設定を直す（無ければ作る・省いた項目は触らない） */
      set: (input: SetDayserviceBoardSettingInput) =>
        tx.request<DayserviceBoardSetting>("PUT", "/dayservice/board-settings", input),
    },
    exerciseBoard: {
      /**
       * GET /dayservice/exercise-board — 機能訓練ボード（名簿 + 割り当て + その日のチェック + 進み具合 + メニュー）。
       * `client:read` が無ければ氏名は null。
       */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceExerciseBoard>("GET", `/dayservice/exercise-board?${qs}`);
      },
      /** GET /dayservice/exercise-board/menus — 運動メニューの一覧（並び順）。include_archived で非表示のメニューも */
      menus: (params: DayserviceExerciseMenusQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          ...(params.include_archived ? { include_archived: "true" } : {}),
        }).toString();
        return tx.request<DayserviceExerciseMenu[]>("GET", `/dayservice/exercise-board/menus?${qs}`);
      },
      /** GET /dayservice/exercise-board/assignments — 利用者 1 人に割り当てた運動メニュー（非表示を除く・並び順） */
      assignments: (params: { facility_id: string; client_id: string }) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id, client_id: params.client_id }).toString();
        return tx.request<{ clientId: string; menuIds: string[] }>("GET", `/dayservice/exercise-board/assignments?${qs}`);
      },
      /** PUT /dayservice/exercise-board/menus — 運動メニューを作る（id なし・name 必須）/ 直す（id あり） */
      saveMenu: (input: SaveDayserviceExerciseMenuInput) =>
        tx.request<DayserviceExerciseMenu>("PUT", "/dayservice/exercise-board/menus", input),
      /** DELETE /dayservice/exercise-board/menus/:id — 運動メニューを非表示にする（`dayservice:delete`。過去のチェックは名前が残る） */
      archiveMenu: (id: string, params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceBoardDeleted>("DELETE", `/dayservice/exercise-board/menus/${pathParam(id, "id")}?${qs}`);
      },
      /** PUT /dayservice/exercise-board/assignments — その人に割り当てるメニューを置き換える（並びは配列の順） */
      setAssignments: (input: SetDayserviceClientExerciseMenusInput) =>
        tx.request<{ clientId: string; menuIds: string[] }>("PUT", "/dayservice/exercise-board/assignments", input),
      /** PUT /dayservice/exercise-board/checks — その人のその日のチェックを置き換える（割り当てたメニューだけ・進み具合を返す） */
      setChecks: (input: SetDayserviceExerciseChecksInput) =>
        tx.request<{ clientId: string; date: string; menuIds: string[]; progress: DayserviceExerciseProgress }>("PUT", "/dayservice/exercise-board/checks", input),
      /** PUT /dayservice/exercise-board/checks/bulk — 何人分かのチェックを足す・外す（割り当てていないメニューは付けない・動かさなかった人は理由つき） */
      bulkSetChecks: (input: BulkSetDayserviceExerciseChecksInput) =>
        tx.request<DayserviceExerciseChecksBulkResult>("PUT", "/dayservice/exercise-board/checks/bulk", input),
    },
    seating: {
      /**
       * GET /dayservice/seating — その日の座席表（座席表 + 名簿 + 相性 + 送迎の相性〔参考〕 + 相性の違反）。
       * 座席表が無い日は chart が null（開いただけでは作らない）。`client:read` が無ければ氏名は null。
       */
      get: (params: DayserviceFacilityDayQuery) => {
        const qs = new URLSearchParams({
          facility_id: params.facility_id,
          date: params.date,
        }).toString();
        return tx.request<DayserviceSeatingBoard>("GET", `/dayservice/seating?${qs}`);
      },
      /** GET /dayservice/seating/charts — 過去の座席表の一覧（新しい順） */
      charts: (params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceSeatingChartListItem[]>("GET", `/dayservice/seating/charts?${qs}`);
      },
      /** POST /dayservice/seating/charts — 座席表を作る（copyFromDate を渡すとその日の机と配置を写す） */
      createChart: (input: CreateDayserviceSeatingChartInput) =>
        tx.request<DayserviceSeatingChart>("POST", "/dayservice/seating/charts", input),
      /** PUT /dayservice/seating/desks — 机の一括保存（座席表の机を desks の通りにそろえる） */
      saveDesks: (input: SaveDayserviceSeatingDesksInput) =>
        tx.request<DayserviceSeatingChart>("PUT", "/dayservice/seating/desks", input),
      /** PUT /dayservice/seating/placements — 利用者を席に置く・移す・外す（deskId と seatNo を省くと外す） */
      place: (input: PlaceDayserviceSeatingClientInput) =>
        tx.request<DayserviceSeatingPlacement[]>("PUT", "/dayservice/seating/placements", input),
      /** GET /dayservice/seating/rules — 座席の相性の一覧（相手の氏名つき） */
      rules: (params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceSeatingRule[]>("GET", `/dayservice/seating/rules?${qs}`);
      },
      /** PUT /dayservice/seating/rules — 座席の相性を登録・直す（ペアの向きは問わない） */
      saveRule: (input: SaveDayserviceSeatingRuleInput) =>
        tx.request<DayserviceSeatingRuleSaved>("PUT", "/dayservice/seating/rules", input),
      /** DELETE /dayservice/seating/rules/:id — 座席の相性を消す（`dayservice:delete`） */
      deleteRule: (id: string, params: DayserviceFacilityQuery) => {
        const qs = new URLSearchParams({ facility_id: params.facility_id }).toString();
        return tx.request<DayserviceBoardDeleted>("DELETE", `/dayservice/seating/rules/${pathParam(id, "id")}?${qs}`);
      },
    },
  };
}
