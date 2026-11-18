

/** 操作は 3 つだけ。**これ以外の scope は作らない**（別軸は廃止済み — 冒頭 ⚠️ 参照） */
export const SCOPE_OPERATIONS = ["read", "write", "delete"] as const;
export type ScopeOperation = (typeof SCOPE_OPERATIONS)[number];

/**
 * scope を持つモジュールの slug（45 本）。
 *
 * 棚に並ぶ**アプリ**（customer / hr 等）はここに入らない — アプリが持つのは**表示権**だけで、
 * それは scope ではなくグループの表示権レコード（`shared.group_app_access`）。実業務データへの
 * 権限は常にモジュールの scope が持つ。
 * **基盤**（auth / chat / storage 等）も入らない — 柱・org 機能・外部アプリで守る。
 */
export const SENSITIVE_MODULES = [
  "clinical-record",
  "client-sensitive",
  "client-billing",
  "staff-sensitive",
  "phone-recording",
  "meeting-recording",
  "nursing",
] as const;

export const SCOPED_MODULES = [
  "analytics",
  "announcement",
  "assessment",
  "billing-profile",
  "calendar",
  "care-office",
  "care-plan",
  "care-record",
  "careplan-link",
  "claims",
  "client",
  "client-billing",
  "client-sensitive",
  "clinical-record",
  "contact",
  "daily-closing",
  "daily-closing-budget",
  "dayservice",
  "directive",
  "equipment-rental",
  "facility",
  "feedback",
  "forms",
  "library",
  "life",
  "media",
  "medical-institution",
  "meeting",
  "meeting-recording",
  "medication",
  "message",
  "nursing",
  "phone",
  "phone-recording",
  "plan-review",
  "kyotaku-plan",
  "reference",
  "riyohyo",
  "schedule",
  "shift",
  "staff",
  "staff-sensitive",
  "transport",
  "user-billing",
  "video-analysis",
] as const;

export type ScopedModule = (typeof SCOPED_MODULES)[number];

/**
 * あるモジュールの scope 一覧を返す。**DB の `shared.modules.scopes` 列の代わり。**
 *
 * 【なぜ列を持たないか】
 * カタログ（存在しうる scope）と付与（誰が持つか）は別物で、置き場も分ける:
 *   カタログ → **コード**（このファイル）。権限モデルの変更が PR の diff に出てレビューを通る
 *   付与    → **DB**（`permission_sets.scopes`）。org ごとに変わる運用データ
 *
 * 同じ値を DB の列にも持つと二重管理になり、実際「コードには有るが DB に無い」が起きていた。
 * `shared.modules` に `scopes` 列は置かず、表示が要るときはこの関数から引く。
 */
export function scopesOfModule(slug: string): string[] {
  if (!(SCOPED_MODULES as readonly string[]).includes(slug)) return [];
  return operationsOfModule(slug).map((op) => `${slug}:${op}`);
}

export const MODULE_OPERATIONS: Readonly<Record<string, readonly ScopeOperation[]>> = {
  analytics: ["read", "write"],
  "careplan-link": ["read", "write"],
  forms: ["read"],
  reference: ["read", "write"],
};

/** そのモジュールが持つ操作（宣言が無ければ全操作）。 */
export function operationsOfModule(slug: string): readonly ScopeOperation[] {
  return MODULE_OPERATIONS[slug] ?? SCOPE_OPERATIONS;
}

/**
 * すべての有効スコープ。**モジュール一覧 × 操作から導出する**（手書きしない）。
 *
 * 手書きだった頃は「モジュールを足したのに scope を足し忘れる」「旧モジュールの scope が
 * 残り続ける」が常態化していた（2026-09-09 の再編時、44 接頭辞のうち 31 が実体を失っていた）。
 */
export const ACTIVE_SCOPES = SCOPED_MODULES.flatMap((m) =>
  operationsOfModule(m).map((op) => `${m}:${op}`),
);

export type Scope = (typeof ACTIVE_SCOPES)[number];

/** REST メソッド（scope 導出の入力） */
export type ScopeHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * モジュール × HTTP メソッドから要求 scope を導出する **単一 SoT**。
 *
 * 【なぜ導出にするか】
 *   従来は API の `requireScope("x:write")` と `@qaito/tools` の `scope: "x:write"` を
 *   人が別々に手書きしており、両方合わせて 1,000 箇所超が「書き忘れ・書き間違い」の余地だった。
 *   契約テストは間違いを**検出**できるが、間違える機会そのものは消せない。
 *   同じ関数から導出すれば **API とツールのドリフトは原理的に起こらない**。
 *
 * 【規則】
 *   - GET                              → `{module}:read`
 *   - DELETE、または末尾 `/delete`     → `{module}:delete`（論理削除は PATCH /…/delete で表現する）
 *   - それ以外（POST/PUT/PATCH）       → `{module}:write`
 *
 * 【例外の扱い】
 *   write 代行（`/client/intake/*` の口 → `client:write`）や、
 *   柱ゲートのモジュール（chat / storage / talk / devices）は導出に合わない。
 *   これらは呼び出し側で **明示的に override** する（黙って導出値を使わない）。
 */
export function scopeFor(
  module: string,
  method: ScopeHttpMethod,
  path: string,
): string {
  if (method === "GET") return `${module}:read`;
  if (method === "DELETE" || path.endsWith("/delete")) return `${module}:delete`;
  return `${module}:write`;
}

/** スペース区切り文字列（OAuth2 scope パラメータ用） */
export const ACTIVE_SCOPES_STRING = ACTIVE_SCOPES.join(" ");

/** 「閲覧のみ」（READ_ONLY_SCOPES）に混ぜないモジュール。 */
const READ_ONLY_EXCLUDED_MODULES: readonly string[] = ["phone-recording", "meeting-recording", "video-analysis"];

export const READ_ONLY_SCOPES = ACTIVE_SCOPES.filter(
  (s) => s.endsWith(":read") && !READ_ONLY_EXCLUDED_MODULES.some((m) => s.startsWith(`${m}:`)),
) as readonly string[];

/**
 * 書込みスコープ + delete（フルアクセス permission set 用）。
 * ⚠️ `:delete` は「フルアクセス」の定義に含める。削除だけ与えたくない権限セットは
 *    WRITE_SCOPES を使わず、コンソールの権限セット画面で個別に外す（2026-08-07 CRUD 分離）。
 */
export const WRITE_SCOPES = ACTIVE_SCOPES.filter(
  (s) => s.endsWith(":write") || s.endsWith(":delete"),
) as readonly string[];

/**
 * モジュールスコープ全体（ACTIVE_SCOPES と同一）。
 * chat / llm / talk は scope ではなく、QaitoChat は外部アプリ権限・talk は org 機能のゲートで守るため含まない。
 * permission_sets.scopes に登録する際の参照用。
 */
export const MODULE_ONLY_SCOPES: readonly string[] = ACTIVE_SCOPES;

export const DEFAULT_OWNER_SCOPES: readonly string[] = ACTIVE_SCOPES.filter(
  (s) => !s.startsWith("client-billing:"),
);

/**
 * 「全権限」を表す特殊値。permission_sets.scopes（および由来する api_keys.scopes /
 * user_tokens.scopes）に単独で `["*"]` として格納される。
 *
 * 意図: 権限セットの scopes は作成時点の列挙で固定されるため、後から追加した
 * モジュールのスコープが自動付与されない（「全権限のつもり」が新モジュールで権限不足）。
 * `"*"` を格納した権限セットは、解決時に常に最新の ACTIVE_SCOPES 全体へ展開する
 * （root バイパスと同じく「常に全モジュール最新」を実現する）。
 *
 * DB には `"*"` の 1 要素だけを保存し（列挙を焼き込まない）、展開は認可解決点で行う。
 */
export const ALL_SCOPES_SENTINEL = "*";

export const DEVICE_SCOPES: readonly string[] = ["device:auth"];

export const GRANTABLE_SCOPES: readonly string[] = [
  ...ACTIVE_SCOPES,
  ...DEVICE_SCOPES,
  ALL_SCOPES_SENTINEL,
];

const GRANTABLE_SCOPE_SET = new Set(GRANTABLE_SCOPES);

/** その scope 文字列を **API キー**（機械の資格）に保存してよいか。 */
export function isGrantableScope(scope: string): boolean {
  return GRANTABLE_SCOPE_SET.has(scope);
}

const HUMAN_GRANTABLE_SCOPE_SET = new Set<string>(
  GRANTABLE_SCOPES.filter((s) => !DEVICE_SCOPES.includes(s)),
);

export function isHumanGrantableScope(scope: string): boolean {
  return HUMAN_GRANTABLE_SCOPE_SET.has(scope);
}

/** scopes 配列に全権限センチネル `"*"` が含まれるか。 */
export function isAllScopes(scopes: readonly string[] | null | undefined): boolean {
  return Array.isArray(scopes) && scopes.includes(ALL_SCOPES_SENTINEL);
}

/**
 * 認可解決点で scopes を実効スコープ集合へ展開する。
 *   - `"*"`（全権限センチネル）を含む → 現時点の ACTIVE_SCOPES 全体を返す
 *     （＝以後追加されたモジュールのスコープも自動包含）。
 *   - 含まない → 入力をそのまま返す。
 *   - null / undefined / 空配列 → `[]`。
 *
 * getServerAuth / auth-jwt / auth-api-key / auth-user-token など、
 * permission_sets 由来の scopes を認可判定に使う全解決点で必ず通す。
 */
export function expandScopes(scopes: readonly string[] | null | undefined): string[] {
  if (!scopes || scopes.length === 0) return [];
  if (scopes.includes(ALL_SCOPES_SENTINEL)) return [...ACTIVE_SCOPES];
  return [...scopes];
}

/**
 * もう認可に使われないスコープ文字列。**付与されていても意味を持たない。**
 *
 * chat / llm / talk は柱・システムのアプリ・外部アプリ付与（権限セットのアプリ）で守るので
 * scope を持たない。旧モジュール（vitals / carerecord / monitoring / …）の scope は
 * 2026-09-09 の再編で統合先へ写し替え済み（migration 0290 が権限セット・API キー・
 * トークンから**除去**する）ため、ここには列挙しない
 * ── 列挙すると seed が dev の API キーに死んだ文字列を焼き戻してしまう。
 *
 * ⚠️ `transport:read` をここに置いてはいけない。旧「送迎表統合アプリ」の scope だったが、
 *    `transport` は再編で**現役モジュール**（送迎 = 計画 + 実績）になった。
 */
export const DEPRECATED_SCOPES = [
  "chat:read",
  "chat:write",
  "llm:read",
  "llm:write",
  "talk:read",
  "talk:write",
] as const;
