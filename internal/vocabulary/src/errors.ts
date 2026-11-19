/**
 * サーバとクライアントで共通に使うエラー文言（`MESSAGES.errors` の中身）。
 *
 * 公開している @qaito/sdk のログイン部品（app-auth）が使うので、文言集の全体（index）から分けて置く。
 * 画面からは従来どおり `MESSAGES.errors.*` で引く。
 */
export const ERROR_MESSAGES = {
  unauthorized: "認証が必要です",
  forbidden: "権限がありません",
  notFound: "データが見つかりません",
  /** 一意制約・状態の衝突（409）。HTTP アダプタが CONFLICT で使う */
  conflict: "この操作は現在の状態では実行できません",
  serverError: "処理中にエラーが発生しました",
  databaseError: "データベースエラーが発生しました",
  planHasReviewRecords: "モニタリング・評価の記録がある計画は削除できません",
  rateLimited: "レートリミットに達しました",
  mfaRequired: "MFA 認証が必要です",
  invalidApiKey: "APIキーが無効です",
  organizationIdRequired: "X-Organization-Id ヘッダーが必須です",
  permissionDenied: "操作が許可されていません",
  /** 見るだけの権限で開いた画面の注（入力欄と保存は無効にしてある） */
  readOnlyView: "見るだけの権限です。変更は権限のある人に頼んでください",
  sectionNoPermission: "この情報は表示権限がありません",
  /** scope ベースの権限不足メッセージ（require-scope ミドルウェア用） */
  scopeRequired: (scope: string): string => `スコープ ${scope} が必要です`,
  rateLimitExceeded: "リクエストが多すぎます。しばらく時間を置いて再度お試しください",
  aiConcurrencyLimited: "AI が混み合っています。少し待ってから再送してください",
  networkError: "通信エラーが発生しました",
  sessionExpired: "セッションの有効期限が切れました。再度ログインしてください",
  invalidToken: "認証トークンが無効です",
  userNotFound: "ユーザーが見つかりません",
  clientNotFound: "利用者が見つかりません",
  /** 記録（保険者の登録・介護記録・請求など）が付いた利用者は物理削除できない（外部キー） */
  clientHasRecords: "記録がある利用者は削除できません。利用終了にしてください。",
  /** 確定した訪問看護記録書Ⅱ（法定記録）に添付された利用者書類は消さない。日付は訪問日（YYYY-MM-DD） */
  documentInFinalNursingRecord: (visitDates: readonly string[]): string =>
    `確定した記録書Ⅱ（${visitDates.join("・")} の訪問）に添付されているため削除できません。記録書Ⅱを下書きに戻してから削除してください。`,
  /** 記録書Ⅱに添付されていて、外せなかった（記録書Ⅱの権限が無い・削除済みの記録書Ⅱ） */
  documentInNursingRecord: "記録書Ⅱに添付されているため削除できません。記録書Ⅱから外してから削除してください。",
  provisionMonthConfirmed: "提供票の実績を確定した月です。提供票の確定を取り消してから直してください",
  /** 訪問看護の担当の職種が、職員台帳の資格と合わない（schedule の `visit_provider_qualification`） */
  visitProviderQualificationMismatch: "職員台帳の資格と違う職種は入れられません。職員台帳を確認してください",
  iryoMonthConfirmed: "医療の実績を確定した月です。確定を取り消してから直してください",
  /** 実績を確定した月（医療の月の確定・提供票の実績の確定）の訪問看護記録書Ⅱは書けない。確定の取り消しが先（clinical-record） */
  nursingRecordMonthConfirmed: "実績を確定した月の記録書Ⅱです。確定を取り消してから直してください",
  /** 記録書Ⅱを提出していない実施済みの訪問がある月は、医療の実績を確定させない（件数だけ伝える） */
  iryoRecordsNotSubmitted: (count: number): string =>
    `記録書Ⅱを提出していない実施済みの訪問が ${count} 件あるため、確定できません`,
  /** 予定のままの医療の訪問がある月は確定させない（確定後はその訪問を実績にできないため。件数だけ伝える） */
  iryoVisitsStillScheduled: (count: number): string =>
    `予定のままの医療の訪問が ${count} 件あるため、確定できません。実施か中止を付けてから確定してください`,
  /** 保険の手の直しは訪問看護（13 / 63）の訪問だけ */
  visitInsuranceNotAdjustable: "保険を変更できるのは訪問看護の訪問だけです",
  createFailed: "作成に失敗しました",
  ocrFailed: "OCR処理中にエラーが発生しました",
  ocrResultUnavailable: "OCRの結果を取得できませんでした",
  ocrParseFailed: "OCR結果の解析に失敗しました",
  ocrFileTooLarge:
    "ファイルが大きすぎて読み取れません。PDF などは 20MB まで、写真は 1 枚 3.75MB までです。PDF はページを分けるか、写真で撮り直してください。",
  aiDraftFailed: "AI素案生成中にエラーが発生しました",
  aiDraftUnavailable: "AI素案の結果を取得できませんでした",
  aiDraftParseFailed: "AI素案結果の解析に失敗しました",
  aiSummaryFailed: "AI要約の作成中にエラーが発生しました",
  aiSummaryParseFailed: "AI要約の結果を読み取れませんでした",
  aiBusy: "AI の利用が集中しています。少し待って再試行してください。",
  /** 組織の AI の利用上限（日次予算・契約の月の上限）に達したとき。AI だけを止め、手での入力は続けられる */
  aiQuota: "AI の利用上限に達したため、AI は使えません。手で入力できます。",
  /** 帳票の欄に入る字数を超えた欄があるとき（訪問看護の帳票。欄の名前を「・」でつないで渡す） */
  paperCharsOver: (labels: string): string => `${labels}が帳票の欄に入る字数を超えています。短くしてから保存してください。`,
  fileTooLarge: "ファイルサイズが大きすぎます（15MB以下にしてください）",
  fileTypeNotAllowed: "許可されていないファイル形式です",
  fileMagicByteInvalid: "ファイルの形式が正しくありません",
  /** 一般的なサーバーエラー。(e as Error).message をクライアントに返す代わりに使用 */
  unexpected: "処理中にエラーが発生しました。時間をおいて再度お試しください",

  /**
   * 所有モジュールのゲート（scope / 柱 / AAL2 / 承認）で断られたときの文言。
   * 画面の Server Action がゲートの失敗コードを写すときに使う。
   * 引数はモジュールの表示名（例「介護記録モジュール」）。
   */
  moduleForbidden: (moduleName: string): string => `${moduleName}への権限がありません`,
  /** facility 認可境界で断られた書き込み（所属外の事業所への記録） */
  facilityWriteForbidden: "この事業所には記録できません",
  /** 薬マスタ: 有効な行で名前が重なった（org 内 UNIQUE） */
  medicationNameDuplicate: "同じ名前の薬がすでに登録されています",
  /** 医療機関コードが組織の中で重なった（外の相手のマスタ・medical-institution） */
  institutionCodeDuplicate: "同じ医療機関コードの医療機関がすでに登録されています",
  institutionDuplicate: "同じ名前・同じ診療科の医療機関がすでに登録されています。一覧から選んでください",
  /** 所属するケアマネが残っている居宅介護支援事業所を消そうとした（care-office） */
  careOfficeHasManagers: "この事業所に所属するケアマネジャーがいるため削除できません。先にケアマネジャーを別の事業所へ移すか、削除してください",
  /** 担当者が残っている法人・団体の関係先を消そうとした（contact） */
  contactPartyHasChildren: "この関係先に所属する担当者がいるため削除できません。先に担当者を削除するか、別の関係先へ移してください",
  /** 統合先が使えない（自分自身・削除済み・別の組織・統合済み） */
  mergeTargetInvalid: "統合先に選べない相手です（同じ相手・削除済み・すでに統合済みのものは選べません）",
  /** 服薬管理: 薬が選ばれていない・薬マスタで削除された・開始が終了より後 */
  medicationScheduleInvalid: "入力データが不正です。薬と時間の範囲（開始は終了より前）を確かめてください",
  vitalRecheckThresholdsInvalid: "入力データが不正です。基準の値が入れられる範囲か、下限が上限より小さいかを確かめてください",
} as const;
