
import type {
  AttachNursingVisitRecordFileInput,
  CountNursingOncallRecordsQuery,
  CountNursingOncallUnreadQuery,
  CreateNursingOncallCommentInput,
  CreateNursingOncallEmergencyVisitInput,
  CreateNursingOncallRecordInput,
  CreateNursingVisitRecordInput,
  GetNursingHomeQuery,
  ListNursingOncallRecordsQuery,
  ListNursingRosterQuery,
  ListNursingVisitRecordStatusesQuery,
  ListNursingVisitRecordingsQuery,
  ListNursingVisitRecordsQuery,
  NursingClientSummary,
  NursingClientSummaryInput,
  NursingHome,
  NursingOncallComment,
  NursingOncallCounts,
  NursingOncallEmergencyVisitResult,
  NursingOncallRecord,
  NursingOncallRecordDetail,
  NursingOncallRecordSaved,
  NursingOncallUnreadCount,
  NursingRecordingTranscript,
  NursingRehabChecks,
  NursingRehabChecksParams,
  NursingRoster,
  NursingVisitRecord,
  NursingVisitRecordStatus,
  NursingVisitRecordingRegistration,
  NursingVisitRecordings,
  RegisterNursingVisitRecordingFromDriveInput,
  SaveNursingVisitRecordInput,
  SetNursingOncallFavoriteInput,
  UpdateNursingOncallRecordInput,
  UpdateNursingVisitRecordInput,
  UpdateSaveNursingVisitRecordInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createNursingNamespace(tx: SdkTransport) {
  return {
    /** 訪問の録音（nursing_visit_recordings・音声はマイドライブのファイルを指す。文字起こしは短期保持。AI は記録書Ⅱの下書きだけを作る） */
    visitRecordings: {
      /** 録音の一覧（訪問・利用者・事業所で絞る。どれも任意）。録音の行はマイドライブのファイルを指し、`source.state` で元のファイルの今の状態（available / trashed / deleted）が分かる。`serviceDate` は職員が schedule:read を持つときだけ埋まる。 */
      list: (params?: ListNursingVisitRecordingsQuery) =>
        tx.request<NursingVisitRecordings>("GET", `/nursing/visit-recordings${buildQueryString(params)}`),
      /** マイドライブの本人の音声ファイルを訪問看護の録音として登録する（指すだけ・コピーしない）。1 訪問 1 本。同じファイル・同じ訪問の再登録は既存の行を返す（created: false）。ドライブで消すと録音から再生できなくなる。 */
      registerFromDrive: (input: RegisterNursingVisitRecordingFromDriveInput) =>
        tx.request<NursingVisitRecordingRegistration>("POST", `/nursing/visit-recordings/from-drive`, input as unknown as Record<string, unknown>),
      transcript: (id: string) =>
        tx.request<NursingRecordingTranscript>("GET", `/nursing/visit-recordings/${pathParam(id, "id")}/transcript`),
      regenerate: (visitId: string) => tx.request<void>("POST", `/nursing/visit-recordings/draft`, {visitId}),
      delete: (id: string) => tx.request<void>("DELETE", `/nursing/visit-recordings/${pathParam(id, "id")}`),
      /** 自分が登録した録音を、記録書Ⅱの提出前に取り消す（nursing:write）。ほかの人の録音・提出後は delete（nursing:delete）。音声はマイドライブに残る。 */
      cancel: (id: string) =>
        tx.request<void>("POST", `/nursing/visit-recordings/${pathParam(id, "id")}/cancel`),
      /** 録音をマイドライブの別の音声ファイルに差し替える。nursing:delete が無ければ自分の提出前の録音だけ。前の文字起こしと下書きは消え、新しい録音から作り直す。 */
      replace: (id: string, input: RegisterNursingVisitRecordingFromDriveInput) =>
        tx.request<NursingVisitRecordingRegistration>("POST", `/nursing/visit-recordings/${pathParam(id, "id")}/replace`, input as unknown as Record<string, unknown>),
    },
    /** 訪問看護記録書Ⅱ（nursing_visit_records・確認したバイタル / 書類・様式の出力・バイタルとの一括保存） */
    visitRecords: {
      list: (clientId: string, params?: ListNursingVisitRecordsQuery) =>
        tx.request<NursingVisitRecord[]>("GET", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      get: (clientId: string, id: string) =>
        tx.request<NursingVisitRecord>("GET", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      create: (clientId: string, input: CreateNursingVisitRecordInput) =>
        tx.request<NursingVisitRecord>("POST", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}`, input as unknown as Record<string, unknown>),
      update: (clientId: string, id: string, input: UpdateNursingVisitRecordInput) =>
        tx.request<NursingVisitRecord>("PATCH", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      delete: (clientId: string, id: string) =>
        tx.request<null>("DELETE", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}`),
      /** GET /nursing/visit-records/clients/:clientId/:id/forms/houmon_kango_kirokusho_2 — 訪問看護記録書Ⅱを xlsx で出力（様式は画面の印刷と同じ枠） */
      downloadForm: (clientId: string, id: string): Promise<Blob> =>
        tx.requestBlob("GET", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/forms/houmon_kango_kirokusho_2`),
      addVitalRef: (clientId: string, id: string, vitalId: string) =>
        tx.request<Record<string, unknown>>("POST", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/vital-refs`, { vitalId }),
      removeVitalRef: (clientId: string, id: string, vitalId: string) =>
        tx.request<null>("DELETE", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/vital-refs/${pathParam(vitalId, "vitalId")}`),
      addDocument: (clientId: string, id: string, documentId: string) =>
        tx.request<Record<string, unknown>>("POST", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/documents`, { documentId }),
      removeDocument: (clientId: string, id: string, documentId: string) =>
        tx.request<null>("DELETE", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/documents/${pathParam(documentId, "documentId")}`),
      listStatuses: (params: ListNursingVisitRecordStatusesQuery) =>
        tx.request<NursingVisitRecordStatus[]>("GET", `/nursing/visit-record-statuses${buildQueryString(params)}`),
      save: (input: SaveNursingVisitRecordInput) =>
        tx.request<Record<string, unknown>>("POST", `/nursing/visit-records/save`, input as unknown as Record<string, unknown>),
      updateSave: (clientId: string, id: string, input: UpdateSaveNursingVisitRecordInput) =>
        tx.request<Record<string, unknown>>("PATCH", `/nursing/visit-records/clients/${pathParam(clientId, "clientId")}/${pathParam(id, "id")}/save`, input as unknown as Record<string, unknown>),
      attachFile: (input: AttachNursingVisitRecordFileInput) =>
        tx.request<Record<string, unknown>>("POST", `/nursing/visit-records/attach-file`, input as unknown as Record<string, unknown>),
    },
    /** 24時間対応の記録（nursing_oncall_records・既読 / 印 / コメント / 緊急訪問。nursing・schedule の実装） */
    oncallRecords: {
      list: (params?: ListNursingOncallRecordsQuery) =>
        tx.request<NursingOncallRecord[]>("GET", `/nursing/oncall-records${buildQueryString(params)}`),
      counts: (params?: CountNursingOncallRecordsQuery) =>
        tx.request<NursingOncallCounts>("GET", `/nursing/oncall-records/counts${buildQueryString(params)}`),
      countUnread: (params?: CountNursingOncallUnreadQuery) =>
        tx.request<NursingOncallUnreadCount>("GET", `/nursing/oncall-records/unread-count${buildQueryString(params)}`),
      get: (id: string) =>
        tx.request<NursingOncallRecordDetail>("GET", `/nursing/oncall-records/${pathParam(id, "id")}`),
      /** 入力を弾く理由は QaitoApiError の code で分かる: RESPONDER_REQUIRED（対応した職員が記録の事業所に属していない・書いた人に職員の記録が無い）/ CLIENT_NOT_IN_FACILITY（利用者がその事業所の利用者ではない）/ PHONE_CALL_UNAVAILABLE（指した受電が見られない）。emergencyStartTime を渡すと結果が緊急訪問のとき続けて緊急訪問を作り、作れなければ記録は保存したまま emergencyFailure で理由を返す */
      create: (input: CreateNursingOncallRecordInput) =>
        tx.request<NursingOncallRecordSaved>("POST", `/nursing/oncall-records`, input as unknown as Record<string, unknown>),
      /** 入力を弾く理由は QaitoApiError の code で分かる: RESPONDER_REQUIRED（対応した職員が記録の事業所に属していない・書いた人に職員の記録が無い）/ CLIENT_NOT_IN_FACILITY（利用者がその事業所の利用者ではない）/ PHONE_CALL_UNAVAILABLE（指した受電が見られない）。emergencyStartTime を渡すと結果が緊急訪問のとき続けて緊急訪問を作り、作れなければ記録は保存したまま emergencyFailure で理由を返す */
      update: (id: string, input: UpdateNursingOncallRecordInput) =>
        tx.request<NursingOncallRecordSaved>("PATCH", `/nursing/oncall-records/${pathParam(id, "id")}`, input as unknown as Record<string, unknown>),
      delete: (id: string) =>
        tx.request<null>("PATCH", `/nursing/oncall-records/${pathParam(id, "id")}/delete`),
      markRead: (id: string) =>
        tx.request<{ read: true }>("POST", `/nursing/oncall-records/${pathParam(id, "id")}/read`),
      setFavorite: (id: string, input: SetNursingOncallFavoriteInput) =>
        tx.request<{ favorite: boolean }>("PUT", `/nursing/oncall-records/${pathParam(id, "id")}/favorite`, input as unknown as Record<string, unknown>),
      createComment: (id: string, input: CreateNursingOncallCommentInput) =>
        tx.request<NursingOncallComment>("POST", `/nursing/oncall-records/${pathParam(id, "id")}/comments`, input as unknown as Record<string, unknown>),
      deleteComment: (id: string) =>
        tx.request<null>("PATCH", `/nursing/oncall-comments/${pathParam(id, "id")}/delete`),
      releaseEmergencyVisit: (id: string) =>
        tx.request<NursingOncallRecordDetail>("POST", `/nursing/oncall-records/${pathParam(id, "id")}/release-visit`),
      createEmergencyVisit: (id: string, input: CreateNursingOncallEmergencyVisitInput) =>
        tx.request<NursingOncallEmergencyVisitResult>("POST", `/nursing/oncall-records/${pathParam(id, "id")}/emergency-visit`, input as unknown as Record<string, unknown>),
    },
    /** 訪問看護のホーム（今日の訪問・今夜のオンコール・未対応の件数） */
    home: {
      get: (params: GetNursingHomeQuery) =>
        tx.request<NursingHome>("GET", `/nursing/home${buildQueryString(params)}`),
    },
    /** リハ職（PT・OT・ST）の訪問の確かめ（週の回数・２超・指示書との突き合わせ） */
    rehabChecks: {
      /** 利用者 × 月のリハ職の訪問を週ごとに数え、指示書のⅡ-1（1 日の分・週の回数）と比べる。date・startTime・endTime・qualification を渡すと、作ろうとしている訪問を足した札（週の回数・その日の回数と２超・指示書を超えるか）も返す。保存は止めない。指示書は clinical-record:read が無ければ instructionVisible=false */
      get: (clientId: string, params: NursingRehabChecksParams) =>
        tx.request<NursingRehabChecks>("GET", `/nursing/clients/${pathParam(clientId, "clientId")}/rehab-checks${buildQueryString(params)}`),
    },
    /** 利用者の直近2週間の様子（AI 要約） */
    clientSummary: {
      /** 利用者の「直近2週間の様子」「次にやること」の AI 要約。書き込まない（stale = 作り直しが要る / generating = 誰かが作り直し中）。 */
      get: (params: NursingClientSummaryInput) =>
        tx.request<NursingClientSummary>("GET", `/nursing/client-summary${buildQueryString(params)}`),
      /** 要約を作り直して保存する（AI を呼ぶ。誰かが作り直し中なら今の状態を返す）。 */
      regenerate: (input: NursingClientSummaryInput) =>
        tx.request<NursingClientSummary>("POST", `/nursing/client-summary/regenerate`, input as unknown as Record<string, unknown>),
    },
    /** 訪問看護の利用者一覧（名簿と次にやること） */
    roster: {
      /** 台帳の所属事業所で絞った看護名簿。plan_followupに契約期間・最終訪問・計画有効期間による計画書の未対応状態を返す。document_statusに計画書・記録書Ⅰの対応状況（nullは閲覧権限なし）を返す。契約のみでは対象外。事業所指定を省くと閲覧権限内の利用者を返す。 */
      list: (params: ListNursingRosterQuery) =>
        tx.request<NursingRoster>("GET", `/nursing/roster${buildQueryString(params)}`),
    },
  };
}
