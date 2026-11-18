
import type {
  AssignPhoneNumberInput,
  AssignPhoneRoleInput,
  CompletePhoneGuidanceAudioUploadInput,
  CreatePhoneCallActionInput,
  CreatePhoneMenuNodeInput,
  CreatePhoneNotifyTargetInput,
  CreatePhoneNumberRuleInput,
  CreatePhoneReceptionClosureInput,
  CreatePhoneReceptionInput,
  ListPhoneCallerNotesParams,
  ListPhoneCallersParams,
  ListPhoneCallsParams,
  ListPhoneMenuNodesParams,
  ListPhoneReceptionClosuresParams,
  ListPhoneReceptionsParams,
  PhoneAssignableNumber,
  PhoneCall,
  PhoneCallAction,
  PhoneCallActionResult,
  PhoneCallDetail,
  PhoneCallItem,
  PhoneCallerIdentification,
  PhoneCallerNote,
  PhoneCallerSummary,
  PhoneChannelCredentialSummary,
  PhoneCredentialKind,
  PhoneEndpoint,
  PhoneGuidanceAudioTicket,
  PhoneLineStatus,
  PhoneMenuNode,
  PhoneNotification,
  PhoneNotifyOutcome,
  PhoneNotifyTarget,
  PhoneNotifyTestResult,
  PhoneNumberRule,
  PhonePermissionContext,
  PhoneReception,
  PhoneReceptionClosure,
  PhoneReceptionHour,
  PhoneReceptionStatus,
  PhoneRoleAssignmentView,
  PhoneRolesView,
  PhoneScriptItem,
  PhoneSetupStatus,
  PhoneStats,
  PhoneStatsParams,
  ReplacePhoneReceptionHoursInput,
  RequestPhoneGuidanceAudioUploadInput,
  ResendPhoneNotificationInput,
  SetPhoneCredentialInput,
  UpdatePhoneCallInput,
  UpdatePhoneMenuNodeInput,
  UpdatePhoneNotifyTargetInput,
  UpdatePhoneNumberRuleInput,
  UpdatePhoneReceptionInput,
  UpsertPhoneCallerNoteInput,
  UpsertPhoneScriptItemInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createPhoneNamespace(tx: SdkTransport) {
  return {
    /** 画面の出し分けの材料（管理者か・書けるか・中身を読めるか）GET /phone/permission-context */
    permissionContext: () => tx.request<PhonePermissionContext>("GET", "/phone/permission-context"),
    /** 受付（電話番号ごとの窓口） */
    receptions: {
      /** 受付の一覧（?facilityId= で事業所を絞る）GET /phone/receptions */
      list: (params?: ListPhoneReceptionsParams) =>
        tx.request<PhoneReception[]>("GET", `/phone/receptions${buildQueryString(params)}`),
      /** 受付 1 件 GET /phone/receptions/:id */
      get: (id: string) => tx.request<PhoneReception>("GET", `/phone/receptions/${pathParam(id, "id")}`),
      /** 受付を作る（管理者）POST /phone/receptions */
      create: (input: CreatePhoneReceptionInput) =>
        tx.request<PhoneReception>("POST", "/phone/receptions", input),
      /** 受付を直す（部分更新・管理者）PATCH /phone/receptions/:id */
      update: (id: string, input: UpdatePhoneReceptionInput) =>
        tx.request<PhoneReception>("PATCH", `/phone/receptions/${pathParam(id, "id")}`, input),
      /** 受付を消す（論理削除・受信口も止まる・管理者）DELETE /phone/receptions/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/receptions/${pathParam(id, "id")}`),
      /** いま受け付けているか・その理由 GET /phone/receptions/:id/status */
      status: (id: string) =>
        tx.request<PhoneReceptionStatus>("GET", `/phone/receptions/${pathParam(id, "id")}/status`),
      /** 受信口（番号・LINE の口。LINE の口のトークンは管理者にだけ返る）GET /phone/receptions/:id/endpoints */
      endpoints: (id: string) =>
        tx.request<PhoneEndpoint[]>("GET", `/phone/receptions/${pathParam(id, "id")}/endpoints`),
      /** 受付に選べる番号（Qaito の在庫・電話受付の管理者）GET /phone/assignable-numbers */
      assignableNumbers: () => tx.request<PhoneAssignableNumber[]>("GET", "/phone/assignable-numbers"),
      /** 在庫の番号を受付に割り当てる（受付 1 つに 1 番号・電話受付の管理者）PUT /phone/receptions/:id/number */
      assignNumber: (id: string, input: AssignPhoneNumberInput) =>
        tx.request<PhoneEndpoint>("PUT", `/phone/receptions/${pathParam(id, "id")}/number`, input),
      /** 受付の番号を外す（90 日はほかの組織に渡らない・電話受付の管理者）DELETE /phone/receptions/:id/number */
      unassignNumber: (id: string) =>
        tx.request<null>("DELETE", `/phone/receptions/${pathParam(id, "id")}/number`),
      /** LINE の口のトークンを作り直す（古い URL は使えなくなる・管理者）POST /phone/receptions/:id/line-endpoint */
      regenerateLineEndpoint: (id: string) =>
        tx.request<PhoneEndpoint>("POST", `/phone/receptions/${pathParam(id, "id")}/line-endpoint`),
    },
    /** 受付時間（曜日 × 枠。丸ごと入れ直す） */
    hours: {
      /** 受付時間 GET /phone/receptions/:id/hours */
      list: (receptionId: string) =>
        tx.request<PhoneReceptionHour[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/hours`),
      /** 受付時間を丸ごと入れ直す（管理者）PUT /phone/receptions/:id/hours */
      replace: (receptionId: string, input: ReplacePhoneReceptionHoursInput) =>
        tx.request<PhoneReceptionHour[]>("PUT", `/phone/receptions/${pathParam(receptionId, "receptionId")}/hours`, input),
    },
    /** 日付の例外（終日休み・その日だけの時間） */
    closures: {
      /** 日付の例外 GET /phone/receptions/:id/closures?from=YYYY-MM-DD */
      list: (receptionId: string, params?: ListPhoneReceptionClosuresParams) =>
        tx.request<PhoneReceptionClosure[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/closures${buildQueryString(params)}`),
      /** 日付の例外を足す（管理者）POST /phone/receptions/:id/closures */
      create: (receptionId: string, input: CreatePhoneReceptionClosureInput) =>
        tx.request<PhoneReceptionClosure>("POST", `/phone/receptions/${pathParam(receptionId, "receptionId")}/closures`, input),
      /** 日付の例外を取り消す（管理者）DELETE /phone/closures/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/closures/${pathParam(id, "id")}`),
    },
    /** 分岐（2 段まで） */
    menuNodes: {
      /** 分岐（includeDeleted=true で削除済みも）GET /phone/receptions/:id/menu-nodes */
      list: (receptionId: string, params?: ListPhoneMenuNodesParams) =>
        tx.request<PhoneMenuNode[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/menu-nodes${buildQueryString(params)}`),
      /** 分岐を足す（管理者）POST /phone/receptions/:id/menu-nodes */
      create: (receptionId: string, input: CreatePhoneMenuNodeInput) =>
        tx.request<PhoneMenuNode>("POST", `/phone/receptions/${pathParam(receptionId, "receptionId")}/menu-nodes`, input),
      /** 分岐を直す（管理者）PATCH /phone/menu-nodes/:id */
      update: (id: string, input: UpdatePhoneMenuNodeInput) =>
        tx.request<PhoneMenuNode>("PATCH", `/phone/menu-nodes/${pathParam(id, "id")}`, input),
      /** 分岐を消す（論理削除・下の段も・管理者）DELETE /phone/menu-nodes/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/menu-nodes/${pathParam(id, "id")}`),
    },
    /** 読み上げ文言（既定から変えたもの） */
    scriptItems: {
      /** 読み上げ文言 GET /phone/receptions/:id/script-items */
      list: (receptionId: string) =>
        tx.request<PhoneScriptItem[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/script-items`),
      /** 読み上げ文言を入れる・直す（管理者）PUT /phone/receptions/:id/script-items */
      upsert: (receptionId: string, input: UpsertPhoneScriptItemInput) =>
        tx.request<PhoneScriptItem>("PUT", `/phone/receptions/${pathParam(receptionId, "receptionId")}/script-items`, input),
      /** 既定に戻す（管理者）DELETE /phone/script-items/:id */
      reset: (id: string) => tx.request<null>("DELETE", `/phone/script-items/${pathParam(id, "id")}`),
      /** 肉声音声の送り先（署名付き PUT・300 秒・管理者）POST /phone/script-items/:id/audio/upload-url */
      audioUploadUrl: (id: string, input: RequestPhoneGuidanceAudioUploadInput) =>
        tx.request<PhoneGuidanceAudioTicket>("POST", `/phone/script-items/${pathParam(id, "id")}/audio/upload-url`, input),
      /** 肉声音声の完了（形式・大きさ・中身を確かめて行に付ける・管理者）POST /phone/script-items/:id/audio/complete */
      completeAudio: (id: string, input: CompletePhoneGuidanceAudioUploadInput) =>
        tx.request<PhoneScriptItem>("POST", `/phone/script-items/${pathParam(id, "id")}/audio/complete`, input),
      /** 肉声音声を外す（文の読み上げに戻る・管理者）DELETE /phone/script-items/:id/audio */
      removeAudio: (id: string) =>
        tx.request<PhoneScriptItem>("DELETE", `/phone/script-items/${pathParam(id, "id")}/audio`),
    },
    /** 許可・拒否・直通の番号 */
    numberRules: {
      /** 許可・拒否・直通 GET /phone/receptions/:id/number-rules */
      list: (receptionId: string) =>
        tx.request<PhoneNumberRule[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/number-rules`),
      /** 足す（管理者）POST /phone/receptions/:id/number-rules */
      create: (receptionId: string, input: CreatePhoneNumberRuleInput) =>
        tx.request<PhoneNumberRule>("POST", `/phone/receptions/${pathParam(receptionId, "receptionId")}/number-rules`, input),
      /** 直す（管理者）PATCH /phone/number-rules/:id */
      update: (id: string, input: UpdatePhoneNumberRuleInput) =>
        tx.request<PhoneNumberRule>("PATCH", `/phone/number-rules/${pathParam(id, "id")}`, input),
      /** 消す（論理削除・管理者）DELETE /phone/number-rules/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/number-rules/${pathParam(id, "id")}`),
    },
    /** 通知先（LINE・Slack・メール・Qaito Piazza） */
    notifyTargets: {
      /** 通知先 GET /phone/receptions/:id/notify-targets */
      list: (receptionId: string) =>
        tx.request<PhoneNotifyTarget[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/notify-targets`),
      /** 足す（チャネルごとに宛先が排他・管理者）POST /phone/receptions/:id/notify-targets */
      create: (receptionId: string, input: CreatePhoneNotifyTargetInput) =>
        tx.request<PhoneNotifyTarget>("POST", `/phone/receptions/${pathParam(receptionId, "receptionId")}/notify-targets`, input),
      /** 表示名・要約を含めるか（宛先は変えない・管理者）PATCH /phone/notify-targets/:id */
      update: (id: string, input: UpdatePhoneNotifyTargetInput) =>
        tx.request<PhoneNotifyTarget>("PATCH", `/phone/notify-targets/${pathParam(id, "id")}`, input),
      /** 消す（論理削除・管理者）DELETE /phone/notify-targets/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/notify-targets/${pathParam(id, "id")}`),
      /** LINE の状況（グループの名前・人数と今月の送信の数。鍵は返さない・電話受付の管理者だけ）GET /phone/receptions/:id/line-status */
      lineStatus: (receptionId: string) =>
        tx.request<PhoneLineStatus>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/line-status`),
      /** テスト送信（固定文言・管理者）POST /phone/receptions/:id/notify-targets/:targetId/test */
      test: (receptionId: string, targetId: string) =>
        tx.request<PhoneNotifyTestResult>("POST", `/phone/receptions/${pathParam(receptionId, "receptionId")}/notify-targets/${pathParam(targetId, "targetId")}/test`),
    },
    /** 通知の鍵（書き込みのみ。値を読み出す口は無い） */
    secrets: {
      /** 鍵の要約（末尾 4 文字・更新日時。値は返らない・管理者）GET /phone/receptions/:id/credentials */
      list: (receptionId: string) =>
        tx.request<PhoneChannelCredentialSummary[]>("GET", `/phone/receptions/${pathParam(receptionId, "receptionId")}/credentials`),
      /** 鍵を登録する（サーバで暗号化して保存・書き込みのみ・管理者）PUT /phone/receptions/:id/credentials/:kind */
      set: (receptionId: string, kind: PhoneCredentialKind, input: SetPhoneCredentialInput) =>
        tx.request<PhoneChannelCredentialSummary>("PUT", `/phone/receptions/${pathParam(receptionId, "receptionId")}/credentials/${kind}`, input),
      /** 鍵を消す（管理者）DELETE /phone/credentials/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/credentials/${pathParam(id, "id")}`),
    },
    /** 受電（メタ・処理の状態。要約は phone-recording:read を持つ人だけ） */
    calls: {
      /** 受電の一覧（新しい順）GET /phone/calls */
      list: (params?: ListPhoneCallsParams) =>
        tx.request<PhoneCallItem[]>("GET", `/phone/calls${buildQueryString(params)}`),
      /** 受電の CSV（メタのみ・text/csv）GET /phone/calls/export */
      export: (params?: ListPhoneCallsParams): Promise<Blob> =>
        tx.requestBlob("GET", `/phone/calls/export${buildQueryString(params)}`),
      /** 受電 1 件（通知の記録つき）GET /phone/calls/:id */
      get: (id: string) => tx.request<PhoneCallDetail>("GET", `/phone/calls/${pathParam(id, "id")}`),
      /** 着いた分岐を直す（事業所は分岐から決まり直す）PATCH /phone/calls/:id */
      update: (id: string, input: UpdatePhoneCallInput) =>
        tx.request<PhoneCall>("PATCH", `/phone/calls/${pathParam(id, "id")}`, input),
      /** 受電を消す（中身があれば phone-recording:delete も要る）DELETE /phone/calls/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/calls/${pathParam(id, "id")}`),
      /** 対応の経緯（状況・担当・メモの追記のみ） */
      actions: {
        /** 対応の経緯 GET /phone/calls/:id/actions */
        list: (callId: string) =>
          tx.request<PhoneCallAction[]>("GET", `/phone/calls/${pathParam(callId, "callId")}/actions`),
        /** 対応を追記する（状況・担当・メモ）POST /phone/calls/:id/actions */
        add: (callId: string, input: CreatePhoneCallActionInput) =>
          tx.request<PhoneCallActionResult>("POST", `/phone/calls/${pathParam(callId, "callId")}/actions`, input),
      },
    },
    /** 通知の記録・再送・確認 */
    notifications: {
      /** 通知の記録 GET /phone/calls/:id/notifications */
      list: (callId: string) =>
        tx.request<PhoneNotification[]>("GET", `/phone/calls/${pathParam(callId, "callId")}/notifications`),
      /** 再送（targetId なし = 失敗した通知先すべて）POST /phone/calls/:id/notifications/resend */
      resend: (callId: string, input?: ResendPhoneNotificationInput) =>
        tx.request<PhoneNotifyOutcome>("POST", `/phone/calls/${pathParam(callId, "callId")}/notifications/resend`, input ?? {}),
      /** 通知の失敗を確認済みにする（確認済みにした件数） PATCH /phone/notifications/:id/resolve */
      resolve: (id: string) =>
        tx.request<number>("PATCH", `/phone/notifications/${pathParam(id, "id")}/resolve`),
    },
    /** 着信した相手・発信者の逆引き */
    callers: {
      /** 着信した相手（番号ごとの件数・最終着信。?facilityId= で事業所を絞る）GET /phone/callers */
      list: (params?: ListPhoneCallersParams) =>
        tx.request<PhoneCallerSummary[]>("GET", `/phone/callers${buildQueryString(params)}`),
      /** 発信者の逆引き（読める台帳だけ・最大 200 件）GET /phone/callers/identify?numbers= */
      identify: (numbers: string[]) =>
        tx.request<PhoneCallerIdentification[]>("GET", `/phone/callers/identify${buildQueryString({ numbers: numbers.join(",") })}`),
    },
    /** 番号のメモ（台帳に当たらない番号に付ける。名前は台帳で当てる） */
    callerNotes: {
      /** 番号のメモの一覧（?facilityId= / ?number= で絞る）GET /phone/caller-notes */
      list: (params?: ListPhoneCallerNotesParams) =>
        tx.request<PhoneCallerNote[]>("GET", `/phone/caller-notes${buildQueryString(params)}`),
      /** 番号にメモを付ける・書き替える（事業所 × 番号で 1 つ）PUT /phone/caller-notes */
      upsert: (input: UpsertPhoneCallerNoteInput) =>
        tx.request<PhoneCallerNote>("PUT", "/phone/caller-notes", input),
      /** 番号のメモを消す DELETE /phone/caller-notes/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/phone/caller-notes/${pathParam(id, "id")}`),
    },
    /** はじめの設定の状況（受付ごとの手順の済み・未。LINE の鍵は管理者にだけ確かめる）GET /phone/setup-status */
    setupStatus: (params?: { facilityId?: string }) =>
      tx.request<PhoneSetupStatus>("GET", `/phone/setup-status${buildQueryString(params)}`),
    /** 集計（?from=YYYY-MM&to=YYYY-MM&facilityId=）GET /phone/stats */
    stats: (params?: PhoneStatsParams) =>
      tx.request<PhoneStats>("GET", `/phone/stats${buildQueryString(params)}`),
    /** 電話受付の役（電話受付の管理者）の割り当て。電話受付の管理者だけが使える */
    roles: {
      /** 電話受付の役の一覧（割り当て・常に管理者の人・追加の候補。電話受付の管理者だけ）GET /phone/roles */
      list: () => tx.request<PhoneRolesView>("GET", "/phone/roles"),
      /** 人かグループに電話受付の管理者の役を付ける（電話受付の管理者だけ）POST /phone/roles */
      assign: (input: AssignPhoneRoleInput) =>
        tx.request<PhoneRoleAssignmentView>("POST", "/phone/roles", input),
      /** 役の割り当てを外す（電話受付の管理者だけ）DELETE /phone/roles/:id */
      unassign: (id: string) => tx.request<{ id: string }>("DELETE", `/phone/roles/${pathParam(id, "id")}`),
    },
  };
}
