
export const alertKindValues = [
  /** 保険者登録・負担割合証・公費の期限（client 3 テーブル）。 */
  "cert_expiry",
  /** 要介護認定の期限（30/60日）。 */
  "care_cert_expiry",
  /** 通所介護計画書・個別機能訓練計画書の期限。 */
  "plan_expiry",
  /** 月次モニタリング未実施。 */
  "monitoring_due",
  /** 出欠未入力日。 */
  "attendance_gap",
  /** LIFE 提出期限。 */
  "life_deadline",
  /** S1: 請求締切（毎月10日23:30）。 */
  "billing_deadline",
  /** S2: 消滅時効。 */
  "statute_of_limitations",
  /** S4: 指定6年更新期限。 */
  "designation_expiry",
  /** S5: 過誤申立・再審査期限。 */
  "kago_or_review_deadline",
  /** S6: 処遇改善届出期限。 */
  "shogu_filing",
  /** S7: 規模区分届出期限。 */
  "scale_filing",
  /** S7: 加算算定開始待ち（届出済みで billable_from 未到来）。 */
  "addition_filing_gate",
  /** その日に測った血圧（収縮期・拡張期）が本人の普段値から 2σ 以上ずれた（記録分析の「今日の要観察」と同じ判定）。 */
  "vital_bp_deviation",
] as const;

export type AlertKind = (typeof alertKindValues)[number];

/** アラート重要度。critical=重大 / warning=注意 / info=情報。 */
export const alertSeverityValues = ["info", "warning", "critical"] as const;

export type AlertSeverity = (typeof alertSeverityValues)[number];

export type AlertItem = {
  kind: AlertKind;
  severity: AlertSeverity;
  /** 種別ラベルを上書きしたい場合の見出し（省略時はカタログの種別ラベルを使う）。 */
  title?: string;
  /** 表示対象の主体（利用者名・「事業所全体」等）。 */
  subject: string;
  client_id?: string | null;
  /** 期限日（'YYYY-MM-DD'）。集計系アラート（count のみ）では省略可。 */
  due_date?: string | null;
  /** 残日数（負値 = 期限超過）。due_date が無い集計系アラートでは省略可。 */
  days_left?: number | null;
  /** 件数（集計系アラート用。例: 出欠未入力の日数）。 */
  count?: number | null;
  /** 遷移先（所有モジュール画面への絶対 URL、または同一モジュール内の相対パス）。 */
  link: string;
  /** 遷移先モジュールの slug（deeplink の宛先モジュール）。 */
  module_slug: string;
};

/**
 * 判定 1 件の**下書き**。alerts モジュールの解体（2026-09-09）で、期限・未実施の判定は
 * 「判定対象データを所有するモジュール」の `functions/` へ配った。
 *
 * その判定関数は **DB も環境変数も触らない純関数**なので、`AlertItem.link`（絶対 URL）を
 * 組み立てられない（`buildModuleDeeplink` は `QAITO_APP_DOMAIN` / `NODE_ENV` に依存する
 * 表示層の関心事）。そこで判定側は「どのアプリの・どのパスへ飛ばすか」だけを返し、
 * URL 化は横断一覧を組む側（`@qaito/modules/analytics` の `functions/alerts`）が行う。
 *
 * `module_slug` は**判定の所有モジュール**（誰の権限で出す情報か）、`link_app` は
 * **遷移先アプリ**（例: 利用者台帳の判定 → 顧客管理アプリの利用者カルテ）で、両者は一致しない。
 */
export type AlertDraft = Omit<AlertItem, "link"> & {
  /** 遷移先アプリの slug（deeplink のホスト部になる） */
  link_app: string;
  /** 遷移先アプリ内のパス（先頭 `/`） */
  link_path: string;
};
