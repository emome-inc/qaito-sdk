
import type {
  AddClaimsScaleClassificationInput,
  AddClaimsSelfPayLineResult,
  AnalyzeClaimsProvisionSheetInput,
  ApplyClaimsManualNoticeMatchInput,
  ApplyClaimsProvisionPlanBulkInput,
  ApproveClaimsAdjustmentCaseInput,
  AssignClaimsTransmissionAgentInput,
  CalculateClaimsMonthResult,
  ClaimsAdditionFiling,
  ClaimsAnnualFiscalYearInput,
  ClaimsBatch,
  ClaimsBatchCsvDownload,
  ClaimsBatchDetail,
  ClaimsBatchFinding,
  ClaimsBatchPerformance,
  ClaimsBillingProgress,
  ClaimsBillingSettingsFacility,
  ClaimsComplianceDeclaration,
  ClaimsCompliancePeriod,
  ClaimsDashboardBatchProgress,
  ClaimsDashboardFacilityBatch,
  ClaimsDashboardOutstandingSummary,
  ClaimsDashboardReconciliationSummary,
  ClaimsDashboardReturnAssessRate,
  ClaimsEquipmentRentalStatement,
  ClaimsErrorCodeInfo,
  ClaimsFacilityAdditionList,
  ClaimsFacilityBillingContext,
  ClaimsFacilityMonthQuery,
  ClaimsFacilitySummary,
  ClaimsFormOutput,
  ClaimsFormOutputQuery,
  ClaimsImportPreview,
  ClaimsInvoiceDetail,
  ClaimsKyufuMonth,
  ClaimsMasterVersion,
  ClaimsMonthlyBatchStatus,
  ClaimsNursingBillingConfirmResult,
  ClaimsNursingBillingQuery,
  ClaimsNursingBillingRow,
  ClaimsNursingBillingUnconfirmResult,
  ClaimsPaperFormKind,
  ClaimsPaperFormsPdfQuery,
  ClaimsPaymentNotice,
  ClaimsProvisionConfirmResult,
  ClaimsProvisionListRow,
  ClaimsProvisionOcrDraft,
  ClaimsProvisionPlanBulkApplied,
  ClaimsProvisionPlanBulkEdit,
  ClaimsProvisionPlanBulkPreview,
  ClaimsProvisionPlanBulkUndoResult,
  ClaimsProvisionQuery,
  ClaimsProvisionSheet,
  ClaimsProvisionWriteResult,
  ClaimsReceipt,
  ClaimsReceivable,
  ClaimsReceivingAccount,
  ClaimsReconciliationCandidate,
  ClaimsRegionalUnitPriceTable,
  ClaimsResult,
  ClaimsSelfPayItem,
  ClaimsSelfPayLineInput,
  ClaimsSelfPayPurchaseNotice,
  ClaimsSelfPayPurchaseNoticeQuery,
  ClaimsServiceCode,
  ClaimsStatement,
  ClaimsStatementCandidate,
  ClaimsStatementDetail,
  ClaimsTeigenBoard,
  ClaimsTeigenBoardQuery,
  ClaimsTransmissionOverview,
  ClaimsTransmissionSettings,
  ClaimsUnreconcilePreview,
  ClaimsUnreconcileResult,
  ClaimsUserInvoice,
  ClaimsUserPayment,
  CloseClaimsCompliancePeriodInput,
  ComputeClaimsScaleEvidenceInput,
  ConfirmClaimsBatchInput,
  ConfirmClaimsBatchResult,
  ConfirmClaimsNursingBillingInput,
  ConfirmClaimsProvisionSheetInput,
  ConfirmClaimsScaleClassificationInput,
  CreateClaimsAdjustmentCaseInput,
  CreateClaimsBatchInput,
  CreateClaimsBatchResult,
  CreateClaimsDirectDebitBatchInput,
  CreateClaimsReceivingAccountInput,
  CreateClaimsSelfPayItemInput,
  CreateClaimsStatementLineOverrideInput,
  CreateClaimsStatementRevisionInput,
  CreateClaimsStatementRevisionResult,
  EndClaimsAdditionFilingInput,
  ExportClaimsBatchResult,
  GenerateClaimsInvoicesForMonthInput,
  GenerateClaimsInvoicesResult,
  ImportClaimsNoticeInput,
  IssueClaimsReceiptInput,
  ListClaimsBatchesQuery,
  ListClaimsComplianceDeclarationsQuery,
  ListClaimsInvoicesQuery,
  ListClaimsKyufuMonthsQuery,
  ListClaimsProvisionPlanBulkEditsQuery,
  ListClaimsReceivablesQuery,
  ListClaimsReceivingAccountsQuery,
  ListClaimsReconciliationCandidatesQuery,
  ListClaimsSelfPayItemsQuery,
  ListClaimsStatementsQuery,
  OpenClaimsCompliancePeriodInput,
  PreviewClaimsProvisionPlanBulkInput,
  RecalculateClaimsStatementResult,
  ReconcileClaimsPaymentsInput,
  RecordClaimsBatchSubmittedInput,
  RecordClaimsKagoDecisionInput,
  RecordClaimsStatementStatusInput,
  RecordClaimsUserPaymentInput,
  RecordClaimsUserPaymentResult,
  ReleaseClaimsTeigenAssignmentQuery,
  ReturnClaimsProvisionSheetInput,
  RunClaimsBatchCalculationResult,
  SaveClaimsAdditionFilingInput,
  SaveClaimsBillingProfileInput,
  SaveClaimsProvisionActualsInput,
  SaveClaimsProvisionPlanInput,
  SaveClaimsStatementEditsInput,
  SaveClaimsStatementEditsResult,
  SearchClaimsServiceCodesQuery,
  SetClaimsInvoiceDueDateInput,
  SubmitClaimsKagoClaimInput,
  SyncClaimsSelfPayPurchasesResult,
  TransitionClaimsShoguFilingInput,
  UpdateClaimsAdditionFilingInput,
  UpdateClaimsAdditionFilingResult,
  UpdateClaimsDirectDebitProfileInput,
  UpdateClaimsPaymentNoticeInput,
  UpdateClaimsReceivingAccountInput,
  UpdateClaimsSelfPayItemInput,
  UpdateClaimsStatementNoteInput,
  UpdateClaimsStatementNoteResult,
  UpsertClaimsComplianceDeclarationInput,
  UpsertClaimsTeigenAssignmentInput,
  UpsertClaimsTeigenAssignmentsInput,
  UpsertClaimsTeigenMonthlyInput,
  ValidateClaimsBatchResult,
  VoidClaimsBatchInput,
  VoidClaimsPaymentNoticeInput,
  WaiveClaimsFindingResult,
  WithdrawClaimsBatchSubmissionInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createClaimsNamespace(tx: SdkTransport) {
  return {
    batches: {
      /** GET /claims/batches — 月次請求バッチ一覧（絞り込み: status / facilityId） */
      list: (params?: ListClaimsBatchesQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.facilityId) qs.set("facilityId", params.facilityId);
        const q = qs.toString();
        return tx.request<ClaimsBatch[]>("GET", `/claims/batches${q ? `?${q}` : ""}`);
      },
      /** GET /claims/batches/:batchId — バッチ詳細（配下明細書サマリ含む） */
      get: (batchId: string) =>
        tx.request<ClaimsBatchDetail>("GET", `/claims/batches/${pathParam(batchId, "batchId")}`),
      /** POST /claims/batches — createBatch（初回計算で draft statement を自動割当） */
      create: (input: CreateClaimsBatchInput) =>
        tx.request<CreateClaimsBatchResult>("POST", "/claims/batches", input),
      calculateMonth: (input: CreateClaimsBatchInput) =>
        tx.request<CalculateClaimsMonthResult>("POST", "/claims/batches/calculate-month", input),
      importPreview: (params: { facilityId: string; billingYearMonth: string }) => {
        const q = new URLSearchParams({ facilityId: params.facilityId, billingYearMonth: params.billingYearMonth }).toString();
        return tx.request<ClaimsImportPreview>("GET", `/claims/batches/import-preview?${q}`);
      },
      /** POST /claims/batches/:batchId/calculate — runBatchCalculation（open のみ・再計算） */
      calculate: (batchId: string) =>
        tx.request<RunClaimsBatchCalculationResult>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/calculate`),
      /** POST /claims/batches/:batchId/validate — validateBatch（V ルール実行 + 状態遷移） */
      validate: (batchId: string) =>
        tx.request<ValidateClaimsBatchResult>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/validate`),
      /** POST /claims/batches/:batchId/confirm — confirmBatch（一括確定 + open→locked。error>0 はサーバ側でも拒否） */
      confirm: (batchId: string, input?: ConfirmClaimsBatchInput) =>
        tx.request<ConfirmClaimsBatchResult>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/confirm`, {
          waivedFindingIds: input?.waivedFindingIds ?? [],
        }),
      /** POST /claims/batches/:batchId/submitted — recordBatchSubmitted（Phase A 手動記録） */
      recordSubmitted: (batchId: string, input: RecordClaimsBatchSubmittedInput) =>
        tx.request<{ batchId: string }>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/submitted`, input),
      /** POST /claims/batches/:batchId/assign — assignStatementsToBatch（月遅れ/再請求の割当） */
      assignStatements: (batchId: string, statementIds: string[]) =>
        tx.request<{ assignedCount: number }>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/assign`, statementIds),
      /** POST /claims/batches/:batchId/void — voidBatch（取消・exported 前のみ） */
      void: (batchId: string, input: VoidClaimsBatchInput) =>
        tx.request<{ batchId: string }>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/void`, input),
      /** POST /claims/batches/:batchId/withdraw-submission — 提出の取り下げ（submitted の月締めと配下の明細書を取り消す） */
      withdrawSubmission: (batchId: string, input: WithdrawClaimsBatchSubmissionInput) =>
        tx.request<{ batchId: string; voidedStatementCount: number }>("POST", `/claims/batches/${pathParam(batchId, "batchId")}/withdraw-submission`, input),
      /** POST /claims/exports/:batchId/export — exportBatchCsv（CSV を作って保存し、locked → exported にする） */
      exportCsv: (batchId: string) =>
        tx.request<ExportClaimsBatchResult>("POST", `/claims/exports/${pathParam(batchId, "batchId")}/export`),
      /** GET /claims/exports/:batchId/csv — 再ダウンロード用 pre-signed URL（300 秒・何度でも再取得可） */
      getCsvDownloadUrl: (batchId: string) =>
        tx.request<ClaimsBatchCsvDownload>("GET", `/claims/exports/${pathParam(batchId, "batchId")}/csv`),
      /** GET /claims/batches/:batchId/findings — バッチ配下の検証結果（error / warning）。確定前の確認用 */
      listFindings: (batchId: string) =>
        tx.request<ClaimsBatchFinding[]>("GET", `/claims/batches/${pathParam(batchId, "batchId")}/findings`),
      /** GET /claims/batches/:batchId/performance — 実績確認（利用者別の出席日数・算定加算・警告の有無） */
      getPerformance: (batchId: string) =>
        tx.request<ClaimsBatchPerformance>("GET", `/claims/batches/${pathParam(batchId, "batchId")}/performance`),
    },
    statements: {
      /** GET /claims/statements — 明細書一覧（status / clientId / facilityId / unassigned） */
      list: (params?: ListClaimsStatementsQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.facilityId) qs.set("facilityId", params.facilityId);
        if (params?.unassigned != null) qs.set("unassigned", String(params.unassigned));
        const q = qs.toString();
        return tx.request<ClaimsStatement[]>("GET", `/claims/statements${q ? `?${q}` : ""}`);
      },
      /** GET /claims/statements/:statementId — 詳細（明細行/日次根拠/集計/検証/計算履歴） */
      get: (statementId: string) =>
        tx.request<ClaimsStatementDetail>("GET", `/claims/statements/${pathParam(statementId, "statementId")}`),
      /** POST /claims/statements/:statementId/recalculate — draft のみ再計算可 */
      recalculate: (statementId: string) =>
        tx.request<RecalculateClaimsStatementResult>("POST", `/claims/statements/${pathParam(statementId, "statementId")}/recalculate`),
      /** POST /claims/statements/:statementId/transition — recordStatementStatus（前方遷移のみ） */
      recordStatus: (statementId: string, input: RecordClaimsStatementStatusInput) =>
        tx.request<ClaimsStatement>("POST", `/claims/statements/${pathParam(statementId, "statementId")}/transition`, input),
      /** POST /claims/statements/:statementId/revise — createRevision（returned/voided のみ・revision+1 複製） */
      createRevision: (statementId: string, input?: CreateClaimsStatementRevisionInput) =>
        tx.request<CreateClaimsStatementRevisionResult>("POST", `/claims/statements/${pathParam(statementId, "statementId")}/revise`, input ?? {}),
      /** PATCH /claims/statements/:statementId/note — 明細書の備考（500 字まで・null で消す） */
      updateNote: (statementId: string, input: UpdateClaimsStatementNoteInput) =>
        tx.request<UpdateClaimsStatementNoteResult>("PATCH", `/claims/statements/${pathParam(statementId, "statementId")}/note`, input),
      /** POST /claims/statements/findings/:findingId/waive — waiveFinding（warning のみ承認可） */
      waiveFinding: (findingId: string) =>
        tx.request<WaiveClaimsFindingResult>("POST", `/claims/statements/findings/${pathParam(findingId, "findingId")}/waive`),
      /** GET /claims/statements/search?q= — 利用者の氏名の一部で明細書を探す（最大 30 件） */
      search: (q: string) =>
        tx.request<ClaimsStatementCandidate[]>("GET", `/claims/statements/search${buildQueryString({ q })}`),
      /** GET /claims/statements/equipment-rental?clientId= — 利用者 1 人の福祉用具貸与（17）を含む明細書 */
      listEquipmentRental: (clientId: string) =>
        tx.request<ClaimsEquipmentRentalStatement[]>("GET", `/claims/statements/equipment-rental${buildQueryString({ clientId })}`),
      overrides: {
        /** GET /claims/statements/:statementId/overrides — 明細書の加算オーバーライド一覧 */
        list: (statementId: string) =>
          tx.request<Record<string, unknown>[]>("GET", `/claims/statements/${pathParam(statementId, "statementId")}/overrides`),
        /** POST /claims/statements/:statementId/overrides — 明細書の加算オーバーライドの作成（理由必須・open バッチのみ） */
        create: (statementId: string, input: CreateClaimsStatementLineOverrideInput) =>
          tx.request<Record<string, unknown>>("POST", `/claims/statements/${pathParam(statementId, "statementId")}/overrides`, input),
        /** DELETE /claims/statements/:statementId/overrides/:overrideId — 明細書の加算オーバーライドの取消 */
        delete: (statementId: string, overrideId: string) =>
          tx.request<Record<string, unknown>>("DELETE", `/claims/statements/${pathParam(statementId, "statementId")}/overrides/${pathParam(overrideId, "overrideId")}`),
      },
      /** POST /claims/statements/:statementId/edits — 明細書の編集の保存（調整・備考 → その明細書を計算 → 検証） */
      saveEdits: (statementId: string, input: SaveClaimsStatementEditsInput) =>
        tx.request<SaveClaimsStatementEditsResult>("POST", `/claims/statements/${pathParam(statementId, "statementId")}/edits`, input),
      /** GET /claims/statements/:statementId/provision-sheet/pdf — サービス提供票（第7表）PDF の短期ダウンロード URL */
      provisionSheetPdf: (statementId: string) =>
        tx.request<{ downloadUrl: string }>("GET", `/claims/statements/${pathParam(statementId, "statementId")}/provision-sheet/pdf`),
      /** GET /claims/statements/:statementId/provision-sheet-beppyo/pdf — サービス提供票別表（第7表別表）PDF の短期ダウンロード URL */
      provisionSheetBeppyoPdf: (statementId: string) =>
        tx.request<{ downloadUrl: string }>("GET", `/claims/statements/${pathParam(statementId, "statementId")}/provision-sheet-beppyo/pdf`),
    },
    invoices: {
      /** POST /claims/invoices/generate/:batchId — generateInvoicesForBatch（batch 単位一括生成） */
      generateForBatch: (batchId: string) =>
        tx.request<GenerateClaimsInvoicesResult>("POST", `/claims/invoices/generate/${pathParam(batchId, "batchId")}`),
      /** POST /claims/invoices/generate-month/:yearMonth — generateInvoicesForMonth（請求年月 'YYYY-MM' で、その月の確定済みの月締め処理ごとに一括生成。input.facilityId でその事業所だけ） */
      generateForMonth: (yearMonth: string, input?: GenerateClaimsInvoicesForMonthInput) =>
        tx.request<GenerateClaimsInvoicesResult>("POST", `/claims/invoices/generate-month/${pathParam(yearMonth, "yearMonth")}`, input),
      /** GET /claims/invoices — 一覧（status / clientId / facilityId / billingYearMonth） */
      list: (params?: ListClaimsInvoicesQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.facilityId) qs.set("facilityId", params.facilityId);
        if (params?.billingYearMonth) qs.set("billingYearMonth", params.billingYearMonth);
        const q = qs.toString();
        return tx.request<ClaimsUserInvoice[]>("GET", `/claims/invoices${q ? `?${q}` : ""}`);
      },
      /** GET /claims/invoices/:invoiceId — 詳細（明細行 + 領収書一覧） */
      get: (invoiceId: string) =>
        tx.request<ClaimsInvoiceDetail>("GET", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}`),
      /** POST /claims/invoices/:invoiceId/self-pay-lines — upsertSelfPayLine（draft のみ・kind 固定 self_pay） */
      addSelfPayLine: (invoiceId: string, input: ClaimsSelfPayLineInput) =>
        tx.request<AddClaimsSelfPayLineResult>("POST", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/self-pay-lines`, input),
      /** POST /claims/invoices/:invoiceId/self-pay-purchases/sync — syncInvoiceSelfPayPurchases（下書きのみ。自費購入の行を購入の今の値に合わせる） */
      syncSelfPayPurchases: (invoiceId: string) =>
        tx.request<SyncClaimsSelfPayPurchasesResult>("POST", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/self-pay-purchases/sync`),
      /** GET /claims/invoices/self-pay-purchase-notice — getSelfPayPurchaseNotice（請求年月の下書きごとの自費購入とのずれ・請求書に入っていない購入の数） */
      selfPayPurchaseNotice: (params: ClaimsSelfPayPurchaseNoticeQuery) => {
        const qs = new URLSearchParams();
        qs.set("billingYearMonth", params.billingYearMonth);
        if (params.facilityId) qs.set("facilityId", params.facilityId);
        return tx.request<ClaimsSelfPayPurchaseNotice>("GET", `/claims/invoices/self-pay-purchase-notice?${qs.toString()}`);
      },
      /** POST /claims/invoices/:invoiceId/issue — issueInvoice（draft→issued） */
      issue: (invoiceId: string) =>
        tx.request<ClaimsUserInvoice>("POST", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/issue`),
      /** PATCH /claims/invoices/:invoiceId/due-date — 支払期日（下書き・発行済み。null で空にする） */
      setDueDate: (invoiceId: string, input: SetClaimsInvoiceDueDateInput) =>
        tx.request<{ id: string; dueDate: string | null }>("PATCH", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/due-date`, input),
      /** POST /claims/invoices/:invoiceId/receipt — issueReceipt（issued のみ・再発行は reissueReason 必須） */
      issueReceipt: (invoiceId: string, input?: IssueClaimsReceiptInput) =>
        tx.request<ClaimsReceipt>("POST", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/receipt`, input),
      /** GET /claims/invoices/:invoiceId/pdf?kind=invoice|receipt — 利用者請求書・領収書の PDF（application/pdf） */
      pdf: (invoiceId: string, kind: "invoice" | "receipt"): Promise<Blob> =>
        tx.requestBlob("GET", `/claims/invoices/${pathParam(invoiceId, "invoiceId")}/pdf?kind=${kind}`),
      /** GET /claims/invoices/pdf?ids= — 選んだ利用者請求書を 1 本の PDF に（発行済みだけ・100 件まで・application/pdf） */
      pdfBundle: (invoiceIds: string[]): Promise<Blob> =>
        tx.requestBlob("GET", `/claims/invoices/pdf?ids=${invoiceIds.map((id) => encodeURIComponent(id)).join(",")}`),
    },
    payments: {
      /** GET /claims/payments/reconciliation-candidates — 国保連入金の消込候補 */
      reconciliationCandidates: (params: ListClaimsReconciliationCandidatesQuery) =>
        tx.request<ClaimsReconciliationCandidate[]>("GET", `/claims/payments/reconciliation-candidates${buildQueryString(params)}`),
      notices: {
        /** POST /claims/payments/notices/:paymentNoticeId/reconcile — 国保連入金の消込（差分は是正キューへ） */
        reconcile: (paymentNoticeId: string, input: ReconcileClaimsPaymentsInput) =>
          tx.request<Record<string, unknown>>("POST", `/claims/payments/notices/${pathParam(paymentNoticeId, "paymentNoticeId")}/reconcile`, input),
        /** PATCH /claims/payments/notices/:paymentNoticeId — 支払通知の変更（消込の結果がある通知・取消済みは 409） */
        update: (paymentNoticeId: string, input: UpdateClaimsPaymentNoticeInput) =>
          tx.request<ClaimsPaymentNotice>("PATCH", `/claims/payments/notices/${pathParam(paymentNoticeId, "paymentNoticeId")}`, input),
        /** POST /claims/payments/notices/:paymentNoticeId/void — 支払通知の取消（論理・理由必須。消込の結果がある通知は 409） */
        void: (paymentNoticeId: string, input: VoidClaimsPaymentNoticeInput) =>
          tx.request<ClaimsPaymentNotice>("POST", `/claims/payments/notices/${pathParam(paymentNoticeId, "paymentNoticeId")}/void`, input),
        /** GET /claims/payments/notices/:paymentNoticeId/unreconcile-preview — 消込の取り消しの下見（戻す明細書・取り下げる是正・断る理由） */
        unreconcilePreview: (paymentNoticeId: string) =>
          tx.request<ClaimsUnreconcilePreview>("GET", `/claims/payments/notices/${pathParam(paymentNoticeId, "paymentNoticeId")}/unreconcile-preview`),
        /** POST /claims/payments/notices/:paymentNoticeId/unreconcile — 消込の取り消し（消込で支払済みにした明細書を受理済みに戻し、検知のままの是正を取り下げる） */
        unreconcile: (paymentNoticeId: string) =>
          tx.request<ClaimsUnreconcileResult>("POST", `/claims/payments/notices/${pathParam(paymentNoticeId, "paymentNoticeId")}/unreconcile`),
      },
    },
    dashboard: {
      /** GET /claims/dashboard/batch-progress — 今月（請求年月）のバッチ状態別件数と請求額の合計 */
      batchProgress: () =>
        tx.request<ClaimsDashboardBatchProgress>("GET", "/claims/dashboard/batch-progress"),
      /** GET /claims/dashboard/facility-batches — 今月の事業所別バッチ内訳 */
      facilityBatches: () =>
        tx.request<ClaimsDashboardFacilityBatch[]>("GET", "/claims/dashboard/facility-batches"),
      /** GET /claims/dashboard/return-assess-rate — 直近 6 か月の返戻・査定の件数 */
      returnAssessRate: () =>
        tx.request<ClaimsDashboardReturnAssessRate>("GET", "/claims/dashboard/return-assess-rate"),
      /** GET /claims/dashboard/reconciliation-summary — 国保連入金消込の件数・決定額 */
      reconciliationSummary: () =>
        tx.request<ClaimsDashboardReconciliationSummary>("GET", "/claims/dashboard/reconciliation-summary"),
      /** GET /claims/dashboard/outstanding-summary — 利用者請求の未収金の件数・合計 */
      outstandingSummary: () =>
        tx.request<ClaimsDashboardOutstandingSummary>("GET", "/claims/dashboard/outstanding-summary"),
      /** GET /claims/dashboard/billing-progress — ホームの進行表（請求月 × 工程）・次にやること・止まっているもの */
      billingProgress: () => tx.request<ClaimsBillingProgress>("GET", "/claims/dashboard/billing-progress"),
    },
    kyufu: {
      /** GET /claims/kyufu/months — 確定済みの給付管理票（利用者×月）。出力に渡す monthId を引く */
      listMonths: (params?: ListClaimsKyufuMonthsQuery) =>
        tx.request<ClaimsKyufuMonth[]>("GET", `/claims/kyufu/months${buildQueryString(params)}`),
      /** GET /claims/kyufu/months/:monthId/pdf — 給付管理票（様式第十一）1 利用者分の PDF の短期ダウンロード URL */
      monthPdf: (monthId: string) =>
        tx.request<{ downloadUrl: string }>("GET", `/claims/kyufu/months/${pathParam(monthId, "monthId")}/pdf`),
    },
    provision: {
      /** GET /claims/provision/clients/:clientId — 利用者 1 人・1 か月のサービス提供票 */
      get: (clientId: string, params?: ClaimsProvisionQuery) =>
        tx.request<ClaimsProvisionSheet>("GET", `/claims/provision/clients/${pathParam(clientId, "clientId")}${buildQueryString(params)}`),
      /** GET /claims/provision/clients/:clientId/forms/teikyouhyou_7 — サービス提供票（様式第7表）の Excel。提供票の画面の予定・実績から作る */
      formXlsx: (clientId: string, yearMonth: string, facilityId?: string): Promise<Blob> =>
        tx.requestBlob("GET", `/claims/provision/clients/${pathParam(clientId, "clientId")}/forms/teikyouhyou_7?yearMonth=${encodeURIComponent(yearMonth)}${facilityId ? `&facilityId=${encodeURIComponent(facilityId)}` : ""}`),
      /** GET /claims/provision/clients — サービス提供票の一覧（利用者 × 月・予定と実績の日・回・単位と手続きの段） */
      list: (params?: ClaimsProvisionQuery) =>
        tx.request<ClaimsProvisionListRow[]>("GET", `/claims/provision/clients${buildQueryString(params)}`),
      /** PUT /claims/provision/clients/:clientId/plan — サービス提供票の予定（自分の事業所の行）を保存 */
      savePlan: (clientId: string, input: SaveClaimsProvisionPlanInput) =>
        tx.request<ClaimsProvisionWriteResult>("PUT", `/claims/provision/clients/${pathParam(clientId, "clientId")}/plan`, input),
      /** POST /claims/provision/ocr — 居宅から届いた提供票を読み取り、予定の下書きを返す（保存しない） */
      analyze: (input: AnalyzeClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionOcrDraft>("POST", `/claims/provision/ocr`, input),
      /** PUT /claims/provision/clients/:clientId/actuals — サービス提供票の実績（自分の事業所の行）を保存（確定の前だけ） */
      saveActuals: (clientId: string, input: SaveClaimsProvisionActualsInput) =>
        tx.request<ClaimsProvisionWriteResult>("PUT", `/claims/provision/clients/${pathParam(clientId, "clientId")}/actuals`, input),
      /** POST /claims/provision/clients/:clientId/plan/confirm — サービス提供票の予定を確定 */
      confirmPlan: (clientId: string, input: ReturnClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionWriteResult>("POST", `/claims/provision/clients/${pathParam(clientId, "clientId")}/plan/confirm`, input),
      /** POST /claims/provision/clients/:clientId/plan/unconfirm — サービス提供票の予定の確定を解除 */
      unconfirmPlan: (clientId: string, input: ReturnClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionWriteResult>("POST", `/claims/provision/clients/${pathParam(clientId, "clientId")}/plan/unconfirm`, input),
      /** POST /claims/provision/clients/:clientId/confirm — サービス提供票の実績を確定（保存していなければ見込みを写してから）。確定のときのチェック（check）を返す。dryRun ならチェックだけ */
      confirm: (clientId: string, input: ConfirmClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionConfirmResult>("POST", `/claims/provision/clients/${pathParam(clientId, "clientId")}/confirm`, input),
      /** POST /claims/provision/clients/:clientId/unconfirm — サービス提供票の実績の確定を取り消す（返送の印も外す） */
      unconfirm: (clientId: string, input: ReturnClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionWriteResult>("POST", `/claims/provision/clients/${pathParam(clientId, "clientId")}/unconfirm`, input),
      /** POST /claims/provision/clients/:clientId/return — サービス提供票を返送（確定した実績を返した印） */
      return: (clientId: string, input: ReturnClaimsProvisionSheetInput) =>
        tx.request<ClaimsProvisionWriteResult>("POST", `/claims/provision/clients/${pathParam(clientId, "clientId")}/return`, input),
      /** GET /claims/provision/plan-bulk — 提供票の一括設定の記録（事業所 × 提供年月・新しい順） */
      bulkEdits: (params: ListClaimsProvisionPlanBulkEditsQuery) =>
        tx.request<ClaimsProvisionPlanBulkEdit[]>("GET", `/claims/provision/plan-bulk${buildQueryString(params)}`),
      /** POST /claims/provision/plan-bulk/dry-run — 提供票の一括設定の下見（書かない。変わる人数・行数と対象外の人数） */
      previewBulk: (input: PreviewClaimsProvisionPlanBulkInput) =>
        tx.request<ClaimsProvisionPlanBulkPreview>("POST", `/claims/provision/plan-bulk/dry-run`, input),
      /** POST /claims/provision/plan-bulk — 提供票の一括設定の実行（expected = 下見の counts。違えば 409） */
      applyBulk: (input: ApplyClaimsProvisionPlanBulkInput) =>
        tx.request<ClaimsProvisionPlanBulkApplied>("POST", `/claims/provision/plan-bulk`, input),
      /** POST /claims/provision/plan-bulk/:bulkEditId/undo — 提供票の一括設定を取り消す（直されていない人だけを戻す） */
      undoBulk: (bulkEditId: string) =>
        tx.request<ClaimsProvisionPlanBulkUndoResult>("POST", `/claims/provision/plan-bulk/${pathParam(bulkEditId, "bulkEditId")}/undo`),
      /** GET /claims/provision/monthly-status — 事業所ごとの月次請求バッチの状態（未作成は status=null） */
      monthlyStatus: (params?: ClaimsProvisionQuery) =>
        tx.request<ClaimsMonthlyBatchStatus[]>("GET", `/claims/provision/monthly-status${buildQueryString(params)}`),
    },
    nursingBilling: {
      /** GET /claims/nursing-billing — 訪問看護の実績の確定（事業所 × 月の利用者ごとの介護・医療の確定の状態・記録書Ⅱ・注意） */
      list: (params: ClaimsNursingBillingQuery) =>
        tx.request<ClaimsNursingBillingRow[]>("GET", `/claims/nursing-billing${buildQueryString(params)}`),
      /** POST /claims/nursing-billing/clients/:clientId/confirm — 介護（提供票）と医療（医療の月の確定）をまとめて確定。dryRun ならチェックだけ */
      confirm: (clientId: string, input: ConfirmClaimsNursingBillingInput) =>
        tx.request<ClaimsNursingBillingConfirmResult>("POST", `/claims/nursing-billing/clients/${pathParam(clientId, "clientId")}/confirm`, input),
      /** DELETE /claims/nursing-billing/clients/:clientId/confirm — 介護と医療の確定をまとめて取り消す */
      unconfirm: (clientId: string, params: ClaimsNursingBillingQuery) =>
        tx.request<ClaimsNursingBillingUnconfirmResult>("DELETE", `/claims/nursing-billing/clients/${pathParam(clientId, "clientId")}/confirm${buildQueryString(params)}`),
    },
    formOutput: {
      /** GET /claims/form-output — 様式出力（事業所 × 請求年月）の区画ごとのサービス提供月と件数・月次請求の状態 */
      get: (params: ClaimsFormOutputQuery) =>
        tx.request<ClaimsFormOutput>("GET", `/claims/form-output${buildQueryString(params)}`),
      /** GET /claims/form-output/:billingYearMonth/:kind/pdf — 紙の様式（区画 × サービス提供月）の PDF の短期ダウンロード URL */
      pdf: (billingYearMonth: string, kind: ClaimsPaperFormKind, params: ClaimsPaperFormsPdfQuery) =>
        tx.request<{ downloadUrl: string }>("GET", `/claims/form-output/${pathParam(billingYearMonth, "billingYearMonth")}/${kind}/pdf${buildQueryString(params)}`),
    },
    transmissionOverview: {
      /** GET /claims/transmission-overview — 伝送管理（事業所 × 請求年月）の様式確定状況・手で提出した記録・事業所の都道府県 */
      get: (params: ClaimsFormOutputQuery) =>
        tx.request<ClaimsTransmissionOverview>("GET", `/claims/transmission-overview${buildQueryString(params)}`),
    },
    results: {
      /** GET /claims/results — 支払確定・査定・保留・返戻の明細書 + 直近の通知 */
      list: () => tx.request<ClaimsResult[]>("GET", "/claims/results"),
      /** GET /claims/results/error-codes — 国保連エラーコード辞書（コード → 表題・原因・対処） */
      errorCodes: () => tx.request<Record<string, ClaimsErrorCodeInfo>>("GET", "/claims/results/error-codes"),
    },
    masters: {
      /** GET /claims/masters/versions — 介護報酬マスタの版レジストリ */
      versions: () => tx.request<ClaimsMasterVersion[]>("GET", "/claims/masters/versions"),
      /** GET /claims/masters/service-codes — サービスコード辞書（active 版・?search=&category=&service_type_code=&codes=&provision_addable=&limit=&offset=。応答の has_more が続きの有無） */
      serviceCodes: (params?: SearchClaimsServiceCodesQuery) =>
        tx.request<ClaimsServiceCode[]>("GET", `/claims/masters/service-codes${buildQueryString(params)}`),
      /** GET /claims/masters/unit-prices — 地域区分の単価表（いまの版の 級地 × 人件費割合） */
      unitPrices: () => tx.request<ClaimsRegionalUnitPriceTable>("GET", "/claims/masters/unit-prices"),
    },
    facilities: {
      /** GET /claims/facilities/:facilityId/summary — 事業所サマリー（計算に使う前提・届出・算定した加算・請求の合計） */
      summary: (facilityId: string, params: ClaimsFacilityMonthQuery) =>
        tx.request<ClaimsFacilitySummary>("GET", `/claims/facilities/${pathParam(facilityId, "facilityId")}/summary${buildQueryString(params)}`),
      /** GET /claims/facilities/:facilityId/additions — 加算一覧（単位・届出・その月の算定） */
      additions: (facilityId: string, params: ClaimsFacilityMonthQuery) =>
        tx.request<ClaimsFacilityAdditionList>("GET", `/claims/facilities/${pathParam(facilityId, "facilityId")}/additions${buildQueryString(params)}`),
    },
    teigen: {
      /** GET /claims/teigen-assignments/board — 居宅介護支援の逓減の割当ボード（facility × month） */
      board: (params: ClaimsTeigenBoardQuery) =>
        tx.request<ClaimsTeigenBoard>("GET", `/claims/teigen-assignments/board${buildQueryString(params)}`),
      /** PUT /claims/teigen-assignments/assignments — 逓減段の一括確定（1 人でも不可なら全体を拒否） */
      upsertAssignments: (input: UpsertClaimsTeigenAssignmentsInput) =>
        tx.request<{ ids: string[] }>("PUT", "/claims/teigen-assignments/assignments", input),
      /** PUT /claims/teigen-assignments/assignment — 利用者別の逓減段の手動確定 */
      upsertAssignment: (input: UpsertClaimsTeigenAssignmentInput) =>
        tx.request<Record<string, unknown>>("PUT", "/claims/teigen-assignments/assignment", input),
      /** DELETE /claims/teigen-assignments/assignment — 利用者別の逓減段の割当の解除 */
      releaseAssignment: (params: ReleaseClaimsTeigenAssignmentQuery) =>
        tx.request<Record<string, unknown>>("DELETE", `/claims/teigen-assignments/assignment${buildQueryString(params)}`),
      /** PUT /claims/teigen-assignments/monthly — 事業所別の逓減区分と取扱件数の確定 */
      upsertMonthly: (input: UpsertClaimsTeigenMonthlyInput) =>
        tx.request<Record<string, unknown>>("PUT", "/claims/teigen-assignments/monthly", input),
    },
    adjustments: {
      /** POST /claims/adjustments — 是正の手動起票（detected_by は起票経路が決める） */
      create: (input: CreateClaimsAdjustmentCaseInput) =>
        tx.request<Record<string, unknown>>("POST", "/claims/adjustments", input),
      /** POST /claims/adjustments/:caseId/approve — 是正の承認（重厚操作。明細書の複製・差替請求書の下書きを同時に行う） */
      approve: (caseId: string, input: ApproveClaimsAdjustmentCaseInput) =>
        tx.request<Record<string, unknown>>("POST", `/claims/adjustments/${pathParam(caseId, "caseId")}/approve`, input),
      /** POST /claims/adjustments/:caseId/settle — 是正の解消（approved → settled） */
      settle: (caseId: string) =>
        tx.request<Record<string, unknown>>("POST", `/claims/adjustments/${pathParam(caseId, "caseId")}/settle`),
    },
    kago: {
      /** POST /claims/kago — 過誤申立（paid → kago_pending） */
      submit: (input: SubmitClaimsKagoClaimInput) =>
        tx.request<{ kagoClaim: Record<string, unknown>; statement: Record<string, unknown> }>("POST", "/claims/kago", input),
      /** POST /claims/kago/:kagoClaimId/decision — 過誤申立の決定の反映（承認 / 却下） */
      recordDecision: (kagoClaimId: string, input: RecordClaimsKagoDecisionInput) =>
        tx.request<Record<string, unknown>>("POST", `/claims/kago/${pathParam(kagoClaimId, "kagoClaimId")}/decision`, input),
    },
    annual: {
      scale: {
        /** POST /claims/annual/scale — 規模区分の手動登録（即確定・upsert） */
        add: (input: AddClaimsScaleClassificationInput) =>
          tx.request<Record<string, unknown>>("POST", "/claims/annual/scale", input),
        /** POST /claims/annual/scale/:id/confirm — 規模区分の提案の人手確定 */
        confirm: (id: string, input?: ConfirmClaimsScaleClassificationInput) =>
          tx.request<Record<string, unknown>>("POST", `/claims/annual/scale/${pathParam(id, "id")}/confirm`, input),
        /** POST /claims/annual/scale/compute — 1 事業所の規模区分の根拠の試算（保存しない） */
        compute: (input: ComputeClaimsScaleEvidenceInput) =>
          tx.request<Record<string, unknown>>("POST", "/claims/annual/scale/compute", input),
        /** POST /claims/annual/scale/recompute — 年度の規模区分の提案の一括再計算 */
        recompute: (input: ClaimsAnnualFiscalYearInput) =>
          tx.request<Record<string, unknown>>("POST", "/claims/annual/scale/recompute", input),
      },
      shoguFilings: {
        /** POST /claims/annual/shogu-filings/ensure — 年度の処遇改善届出の行の用意と期限超過の判定 */
        ensure: (input: ClaimsAnnualFiscalYearInput) =>
          tx.request<Record<string, unknown>>("POST", "/claims/annual/shogu-filings/ensure", input),
        /** POST /claims/annual/shogu-filings/:id/transition — 処遇改善届出の状態遷移（提出済み・受理・期限超過） */
        transition: (id: string, input: TransitionClaimsShoguFilingInput) =>
          tx.request<Record<string, unknown>>("POST", `/claims/annual/shogu-filings/${pathParam(id, "id")}/transition`, input),
      },
    },
    notices: {
      /** POST /claims/notices/import — 国保連の通知帳票ファイルの取込（staged upload の staged_id。原本の保全と突合まで・明細書の状態は動かさない） */
      import: (input: ImportClaimsNoticeInput) =>
        tx.request<Record<string, unknown>>("POST", "/claims/notices/import", input),
      /** GET /claims/notices/:noticeId/original — 国保連の通知の原本の短期ダウンロード URL（attachment） */
      original: (noticeId: string) =>
        tx.request<{ downloadUrl: string }>("GET", `/claims/notices/${pathParam(noticeId, "noticeId")}/original`),
      /** POST /claims/notices/:noticeId/items/:itemId/match — 通知帳票の明細の手動突合 */
      applyMatch: (noticeId: string, itemId: string, input: ApplyClaimsManualNoticeMatchInput) =>
        tx.request<Record<string, unknown>>("POST", `/claims/notices/${pathParam(noticeId, "noticeId")}/items/${pathParam(itemId, "itemId")}/match`, input),
    },
    userPayments: {
      /** GET /claims/user-payments/receivables — 利用者入金の一覧（発行済みの請求書ごとの入金の状況。status / facilityId / yearMonth / offset） */
      receivables: (params?: ListClaimsReceivablesQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.facilityId) qs.set("facilityId", params.facilityId);
        if (params?.yearMonth) qs.set("yearMonth", params.yearMonth);
        if (params?.offset !== undefined) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<ClaimsReceivable[]>("GET", `/claims/user-payments/receivables${q ? `?${q}` : ""}`);
      },
      /** GET /claims/user-payments?invoiceId= — 請求書 1 枚の入金の記録 */
      list: (invoiceId: string) =>
        tx.request<ClaimsUserPayment[]>("GET", `/claims/user-payments?invoiceId=${encodeURIComponent(invoiceId)}`),
      /** POST /claims/user-payments — 入金を記録する（発行済みの請求書だけ。返金はマイナス） */
      record: (input: RecordClaimsUserPaymentInput) =>
        tx.request<RecordClaimsUserPaymentResult>("POST", "/claims/user-payments", input),
      /** DELETE /claims/user-payments/:paymentId — 利用者入金記録の取消 */
      delete: (paymentId: string) =>
        tx.request<Record<string, unknown>>("DELETE", `/claims/user-payments/${pathParam(paymentId, "paymentId")}`),
    },
    directDebit: {
      profiles: {
        /** PATCH /claims/direct-debit/profiles/:id — 口座振替の提出先の変更（送った項目だけ。生成済み・提出済みの依頼があるあいだはファイルに入る項目を変えられない） */
        update: (id: string, input: UpdateClaimsDirectDebitProfileInput) =>
          tx.request<{ id: string }>("PATCH", `/claims/direct-debit/profiles/${pathParam(id, "id")}`, input),
        /** POST /claims/direct-debit/profiles/:id/deactivate — 口座振替の提出先を無効にする（行は残る・新しい依頼で選べなくなる） */
        deactivate: (id: string) =>
          tx.request<{ id: string; active: false }>("POST", `/claims/direct-debit/profiles/${pathParam(id, "id")}/deactivate`),
      },
      batches: {
        /** POST /claims/direct-debit/batches — 口座振替の依頼バッチ（下書き）の作成 */
        create: (input: CreateClaimsDirectDebitBatchInput) =>
          tx.request<Record<string, unknown>>("POST", "/claims/direct-debit/batches", input),
        /** POST /claims/direct-debit/batches/:id/generate — 口座振替の依頼データの生成（件数・金額・ハッシュ。口座番号は返さない） */
        generate: (id: string) =>
          tx.request<Record<string, unknown>>("POST", `/claims/direct-debit/batches/${pathParam(id, "id")}/generate`),
        /** POST /claims/direct-debit/batches/:id/submit — 口座振替バッチを銀行へ提出済みにする（生成済みのバッチだけ） */
        submit: (id: string) =>
          tx.request<Record<string, unknown>>("POST", `/claims/direct-debit/batches/${pathParam(id, "id")}/submit`),
        /** POST /claims/direct-debit/batches/:id/close — 口座振替バッチを完了にする（結果の取込済みのバッチだけ） */
        close: (id: string) =>
          tx.request<Record<string, unknown>>("POST", `/claims/direct-debit/batches/${pathParam(id, "id")}/close`),
        /** GET /claims/direct-debit/batches/:id/file — 口座振替の依頼ファイル（全銀・SJIS）の受け取り。生成済み以降のバッチだけ。口座番号を含むので AI のツールには出さない */
        file: async (id: string): Promise<ArrayBuffer> =>
          (await tx.requestBlob("GET", `/claims/direct-debit/batches/${pathParam(id, "id")}/file`)).arrayBuffer(),
        /** DELETE /claims/direct-debit/batches/:id — 下書きの口座振替バッチの削除 */
        delete: (id: string) =>
          tx.request<Record<string, unknown>>("DELETE", `/claims/direct-debit/batches/${pathParam(id, "id")}`),
      },
    },
    receivingAccounts: {
      /** GET /claims/receiving-accounts — 入金口座の一覧（口座振替の入金先・振込先。口座番号は末尾 4 桁だけ） */
      list: (params?: ListClaimsReceivingAccountsQuery) =>
        tx.request<ClaimsReceivingAccount[]>("GET", `/claims/receiving-accounts${buildQueryString(params)}`),
      /** GET /claims/receiving-accounts/:id — 入金口座 1 件 */
      get: (id: string) =>
        tx.request<ClaimsReceivingAccount>("GET", `/claims/receiving-accounts/${pathParam(id, "id")}`),
      /** POST /claims/receiving-accounts — 入金口座の登録（AI からはできない） */
      create: (input: CreateClaimsReceivingAccountInput) =>
        tx.request<ClaimsReceivingAccount>("POST", "/claims/receiving-accounts", input),
      /** PATCH /claims/receiving-accounts/:id — 入金口座の変更（送った項目だけ。依頼ファイルを作成済みの提出先の口座は銀行・口座番号を変えられない） */
      update: (id: string, input: UpdateClaimsReceivingAccountInput) =>
        tx.request<ClaimsReceivingAccount>("PATCH", `/claims/receiving-accounts/${pathParam(id, "id")}`, input),
      /** DELETE /claims/receiving-accounts/:id — 入金口座の削除（口座振替の提出先が入金先にしている口座は消せない） */
      delete: (id: string) =>
        tx.request<{ id: string }>("DELETE", `/claims/receiving-accounts/${pathParam(id, "id")}`),
    },
    selfPayItems: {
      /** GET /claims/self-pay-items — 自費の項目の一覧（事業所ごと・使わなくしたものは出ない） */
      list: (params?: ListClaimsSelfPayItemsQuery) =>
        tx.request<ClaimsSelfPayItem[]>("GET", `/claims/self-pay-items${buildQueryString(params)}`),
      /** GET /claims/self-pay-items/:id — 自費の項目 1 件 */
      get: (id: string) =>
        tx.request<ClaimsSelfPayItem>("GET", `/claims/self-pay-items/${pathParam(id, "id")}`),
      /** POST /claims/self-pay-items — 自費の項目の登録 */
      create: (input: CreateClaimsSelfPayItemInput) =>
        tx.request<ClaimsSelfPayItem>("POST", "/claims/self-pay-items", input),
      /** PATCH /claims/self-pay-items/:id — 自費の項目の変更（送った項目だけ。作った請求書の明細は変わらない） */
      update: (id: string, input: UpdateClaimsSelfPayItemInput) =>
        tx.request<ClaimsSelfPayItem>("PATCH", `/claims/self-pay-items/${pathParam(id, "id")}`, input),
      /** DELETE /claims/self-pay-items/:id — 自費の項目を使わなくする（論理削除） */
      delete: (id: string) =>
        tx.request<{ id: string }>("DELETE", `/claims/self-pay-items/${pathParam(id, "id")}`),
    },
    billingSettings: {
      /** GET /claims/billing-settings/facilities — 事業所ごとの請求設定（billing-profile 所有） */
      listFacilities: () =>
        tx.request<ClaimsBillingSettingsFacility[]>("GET", "/claims/billing-settings/facilities"),
      /** GET /claims/billing-settings/facilities/:facilityId — 1 事業所の請求設定（導出値・単価つき） */
      getFacility: (facilityId: string) =>
        tx.request<ClaimsFacilityBillingContext>("GET", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}`),
      /** PUT /claims/billing-settings/facilities/:facilityId/profile — 請求プロファイルの保存（送ったキーだけ更新） */
      saveProfile: (facilityId: string, input: SaveClaimsBillingProfileInput) =>
        tx.request<Record<string, unknown>>("PUT", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/profile`, input),
      /** GET /claims/billing-settings/facilities/:facilityId/addition-filings — 体制届出の履歴 */
      listAdditionFilings: (facilityId: string) =>
        tx.request<ClaimsAdditionFiling[]>("GET", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/addition-filings`),
      /** POST /claims/billing-settings/facilities/:facilityId/addition-filings — 体制届出の登録（算定開始月はサーバが導出） */
      saveAdditionFiling: (facilityId: string, input: SaveClaimsAdditionFilingInput) =>
        tx.request<{ id: string; billableFrom: string }>("POST", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/addition-filings`, input),
      /** PATCH /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId — 体制届出の変更（届出日・受理日・メモ。受理日を変えると算定開始月を作り直す） */
      updateAdditionFiling: (facilityId: string, filingId: string, input: UpdateClaimsAdditionFilingInput) =>
        tx.request<UpdateClaimsAdditionFilingResult>("PATCH", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/addition-filings/${pathParam(filingId, "filingId")}`, input),
      /** POST /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId/end — 体制届出の終了（算定終了月の末日で閉じる・行は残る） */
      endAdditionFiling: (facilityId: string, filingId: string, input: EndClaimsAdditionFilingInput) =>
        tx.request<{ id: string; billableUntil: string }>("POST", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/addition-filings/${pathParam(filingId, "filingId")}/end`, input),
      /** DELETE /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId — 算定がまだ始まっていない体制届出の取り下げ（届出を消す・一度も算定しない。始まっていれば 409） */
      withdrawAdditionFiling: (facilityId: string, filingId: string) =>
        tx.request<{ id: string }>("DELETE", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/addition-filings/${pathParam(filingId, "filingId")}`),
      /** GET /claims/billing-settings/facilities/:facilityId/compliance-periods — 月次コンプライアンス申告の期間 */
      listCompliancePeriods: (facilityId: string) =>
        tx.request<ClaimsCompliancePeriod[]>("GET", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-periods`),
      /** POST /claims/billing-settings/facilities/:facilityId/compliance-periods — 期間の開始（同種別の継続中があれば 409） */
      openCompliancePeriod: (facilityId: string, input: OpenClaimsCompliancePeriodInput) =>
        tx.request<{ periodId: string }>("POST", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-periods`, input),
      /** POST /claims/billing-settings/facilities/:facilityId/compliance-periods/:periodId/close — 期間の終了 */
      closeCompliancePeriod: (facilityId: string, periodId: string, input: CloseClaimsCompliancePeriodInput) =>
        tx.request<{ periodId: string }>("POST", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-periods/${pathParam(periodId, "periodId")}/close`, input),
      /** GET /claims/billing-settings/facilities/:facilityId/compliance-declarations?from=YYYY-MM&to=YYYY-MM — BCP・虐待防止の月ごとの申告 */
      listComplianceDeclarations: (facilityId: string, params?: ListClaimsComplianceDeclarationsQuery) =>
        tx.request<ClaimsComplianceDeclaration[]>("GET", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-declarations${buildQueryString(params)}`),
      /** PUT /claims/billing-settings/facilities/:facilityId/compliance-declarations — 月 × 種別の申告（上書き）。不適合なら翌月 1 日から減算の期間を作り、適合なら閉じる */
      upsertComplianceDeclaration: (facilityId: string, input: UpsertClaimsComplianceDeclarationInput) =>
        tx.request<{ declarationId: string; periodChange: "opened" | "closed" | "none" }>("PUT", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-declarations`, input),
      /** PATCH /claims/billing-settings/facilities/:facilityId/compliance-declarations/:id/delete — 申告の論理削除（減算の期間には触らない） */
      deleteComplianceDeclaration: (facilityId: string, id: string) =>
        tx.request<{ declarationId: string }>("PATCH", `/claims/billing-settings/facilities/${pathParam(facilityId, "facilityId")}/compliance-declarations/${pathParam(id, "id")}/delete`),
      /** GET /claims/billing-settings/transmission — 伝送代理人の一覧と事業所ごとの割付 */
      getTransmission: () =>
        tx.request<ClaimsTransmissionSettings>("GET", "/claims/billing-settings/transmission"),
      /** PUT /claims/billing-settings/transmission/agent — 伝送代理人の割付（agentId: null で解除） */
      assignTransmissionAgent: (input: AssignClaimsTransmissionAgentInput) =>
        tx.request<{ facilityId: string; agentId: string | null }>("PUT", "/claims/billing-settings/transmission/agent", input),
    },
  };
}
