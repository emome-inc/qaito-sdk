# @qaito/sdk

Qaito プラットフォームの TypeScript クライアントです。
API を呼ぶ部品と、Qaito のログインを Next.js のアプリにつなぐ部品が入っています。

- [インストール](#インストール)
- [入口](#入口)
- [API クライアント（QaitoClient）](#api-クライアントqaitoclient)
- [ログインをつなぐ（@qaito/sdk/app-auth）](#ログインをつなぐqaitosdkapp-auth)
- [ログインを保つ（@qaito/sdk/app-auth/session-guard）](#ログインを保つqaitosdkapp-authsession-guard)
- [連携アプリの確認用の応答（@qaito/sdk/verify）](#連携アプリの確認用の応答qaitosdkverify)
- [権限とトークンの扱い](#権限とトークンの扱い)
- [版の方針](#版の方針)

## インストール

```sh
npm install @qaito/sdk
# または
pnpm add @qaito/sdk
```

Node.js 20 以上で動きます。ESM だけを配っています。

## 入口

| import | 中身 | 使う場所 |
|---|---|---|
| `@qaito/sdk` | API クライアント（`QaitoClient`）・エラー（`QaitoError`）・OAuth（`QaitoOAuth`）・型 | サーバー |
| `@qaito/sdk/app-auth` | Qaito のログイン（OAuth2 + PKCE）を Next.js の Route Handler につなぐ | サーバー |
| `@qaito/sdk/app-auth/session-guard` | ログインを保つ（延長・401 のときの再送・期限切れでログインへ戻す） | ブラウザ |
| `@qaito/sdk/verify` | 連携アプリの登録のときに Qaito が確かめに来る応答（`/.well-known/qaito-app`） | サーバー |

## API クライアント（QaitoClient）

### 作り方

ログインした人のトークン（`userToken`）を渡して作ります。トークンは下の
[app-auth](#ログインをつなぐqaitosdkapp-auth) の `getUserToken` で取り出せます。

```ts
import { QaitoClient } from "@qaito/sdk";

const qaito = new QaitoClient({
  baseUrl: "https://api.app.qaito.ai",
  userToken,
});

const facilities = await qaito.facility.facilities.list();
```

| 設定 | 型 | 意味 |
|---|---|---|
| `baseUrl` | `string` | Qaito API の URL。省略すると `https://api.app.qaito.ai` |
| `userToken` | `string` | ログインした人のトークン。この人の名前と権限で API を呼びます |
| `workingFacilityId` | `string` | 作業中の事業所の ID。記録を作るときに事業所を省くと、この事業所で作ります。見てよい範囲の外なら無視されます |
| `apiKey` | `string` | API キー（機械どうしの連携用）。`userToken` と一緒に渡すと「このキーで、この人として」呼びます。**秘密です。ブラウザに出さないでください** |
| `apiKeyPrefix` | `string` | 公開クライアント ID（PKCE で OAuth2 のログインをするとき） |
| `redirectUri` | `string` | OAuth2 のコールバックの URL。渡すと `qaito.auth`（`QaitoOAuth`）が使えます |
| `onTokensChanged` | `(tokens) => void` | OAuth2 のトークンが延長で入れ替わったときに呼ばれます（保存に使う） |
| `defaultHeaders` | `Record<string, string>` | すべての呼び出しに足すヘッダー。認証のヘッダーは上書きできません |

Next.js のアプリでは、自分で OAuth2 を組むより [app-auth](#ログインをつなぐqaitosdkapp-auth) を使うのが簡単です。

### エラー

API が失敗を返すと `QaitoError` を投げます。

| プロパティ | 意味 |
|---|---|
| `message` | エラーの文（画面に出してよい文） |
| `status` | HTTP のステータス（`401` = ログインが切れた / `403` = 権限が無い / `404` = 見つからない・見てよい範囲の外 / `0` = 届かなかった など） |
| `code` | エラーの種類のコード（ある場合） |
| `reason` | 細かい権限で断られた理由のコード（`403` のとき・ある場合） |
| `details` | もう一度試すときに使う情報（ある場合） |

```ts
import { QaitoClient, QaitoError } from "@qaito/sdk";

try {
  await qaito.calendar.events.get(eventId);
} catch (error) {
  if (error instanceof QaitoError && error.status === 404) {
    // 無い、または見てよい範囲の外
  } else {
    throw error;
  }
}
```

### 名前空間

API はモジュールごとの名前空間に分かれています（`qaito.{名前空間}.{リソース}.{操作}`）。
多くのリソースは `list` / `get` / `create` / `update` / `delete` を持ちます。
呼べるかどうかは、ログインした人の権限で決まります。

**台帳**

| 名前空間 | 中身 |
|---|---|
| `client` | 利用者台帳（利用者・家族・医療・書類・予定・受給者証 など） |
| `insurance` | 保険者・被保険者の情報 |
| `customer` | 顧客管理（相談から契約までの流れ） |
| `intake` | 利用者の一括取り込み |
| `contracts` | 契約と請求先 |
| `staff` | 職員台帳（資格・配置・雇用・健診 など） |
| `jobRole` | 職員の役割 |
| `facility` | 事業所・車両 |
| `company` | 会社（法人） |
| `medicalInstitution` | 医療機関 |
| `careOffice` | 居宅介護支援事業所 |
| `contact` | 関係先 |
| `medication` | 薬のマスタ |
| `reference` | 全国のマスタ |

**サービスと記録**

| 名前空間 | 中身 |
|---|---|
| `assessment` | アセスメント |
| `careplan` | ケアプラン |
| `dayservicePlan` / `trainingPlan` / `homecarePlan` / `equipmentPlan` / `nursingPlan` / `rehabPlan` | サービスごとの計画書 |
| `monitoring` / `evaluation` | 計画のモニタリング・評価 |
| `pdf` | 計画書の PDF |
| `schedule` | 利用予定 |
| `shift` | シフト |
| `transportPlan` / `transportLog` | 送迎の計画と記録 |
| `dayserviceDaily` | 通所介護の日々の記録 |
| `equipmentRental` | 福祉用具の貸与 |
| `nursing` | 訪問看護 |
| `clinicalRecord` | 臨床の情報（傷病名・医師の指示 など） |
| `careplanLink` | ケアプランデータ連携 |
| `carerecord` / `vitals` / `training` / `contactnote` | ケア記録・バイタル・訓練・連絡帳 |
| `mediaLog` | 写真・動画・録音の記録 |
| `videoAnalysis` | 映像の分析 |

**請求と分析**

| 名前空間 | 中身 |
|---|---|
| `claims` | 国保連への請求 |
| `riyohyo` | 利用票・提供票 |
| `life` | LIFE の提出 |
| `dailyClosing` / `dailyClosingBudget` | 日次締めと予算 |
| `analytics` / `alerts` | 記録の分析・要対応のお知らせ |
| `forms` | 帳票の様式と出力の履歴 |

**連絡とコミュニケーション**

| 名前空間 | 中身 |
|---|---|
| `message` | 社内メッセージ（チャンネル・投稿・リアクション・スレッド など） |
| `announcement` | お知らせ |
| `directive` | 業務連絡 |
| `feedback` | ご意見箱 |
| `calendar` | カレンダー（予定・参加者・共有・空き時間 など） |
| `library` | ライブラリ（組織の Wiki） |
| `meeting` / `meetingRecording` | 会議と会議の録音 |
| `phone` / `phoneRecording` | 電話の受付と録音 |

**基盤**

| 名前空間 | 中身 |
|---|---|
| `oauth` | ログインした本人の情報（`userinfo`） |
| `organization` | 組織の設定 |
| `accessControl` | 権限の管理 |
| `integration` | 外部アプリとの連携 |
| `storage` | ファイルの保管（Qaito ドライブ） |
| `map` | 住所と位置・郵便番号 |
| `voice` | 音声入力（音声から文字へ） |
| `usage` | 本人の AI の使用量 |
| `chat` / `llm` | AI チャット |
| `devices` / `talk` / `device` | 音声デバイス |
| `apps` / `modules` / `tools` | 棚に並ぶアプリ・モジュール・ツールの一覧 |

### よく使う呼び出し

```ts
// ログインした本人
const me = await qaito.oauth.userinfo();
console.log(me.name, me.organization_name);

// 事業所の一覧
const facilities = await qaito.facility.facilities.list();

// 利用者を名前で探す・1 件取る
const clients = await qaito.client.clients.search("山田");
const client = await qaito.client.clients.get(clients[0].id);

// 自分に紐づく職員
const staff = await qaito.staff.getMe(); // 紐づいていなければ null

// 期間の予定（JST の日付・両端を含む）
const events = await qaito.calendar.events.list({ from: "2026-11-01", to: "2026-11-30" });

// メッセージのチャンネルと投稿
const channels = await qaito.message.channels.list();
const posts = await qaito.message.messages.list(channels[0].id);
await qaito.message.messages.create(channels[0].id, { content: "おはようございます" });
```

主な型は `@qaito/sdk` から import できます（例: `import type { Client, Facility, UserInfo } from "@qaito/sdk"`）。

## ログインをつなぐ（@qaito/sdk/app-auth）

Qaito のログイン（OAuth2 + PKCE）を、Next.js（App Router）のアプリにつなぎます。

- ログインの画面は Qaito のポータルが出します。アプリはパスワードを扱いません
- トークンは**アプリ自身のドメインの HttpOnly cookie** に置きます
- 組み立ては Web 標準の `Request` → `Response` です（`next` に依存しません）
- 設定はすべて引数で渡します（SDK は環境変数を読みません）

### 1. 設定を 1 か所に書く

連携アプリ（組織が管理コンソールで登録したアプリ）は、登録のときに発行された
**OAuth クライアント ID**（`clientId`）と、登録した組織の ID（`defaultOrg`）を渡します。

```ts
// src/lib/auth.ts
import { createAppAuth } from "@qaito/sdk/app-auth";

export const auth = createAppAuth({
  app: "my-app",
  clientId: process.env.QAITO_CLIENT_ID!,
  defaultOrg: process.env.QAITO_ORG!,
  apiBaseUrl: "https://api.app.qaito.ai",
  appDomain: "app.qaito.ai",
  redirectUri: "https://my-app.example.com/api/auth/callback",
  secureCookies: process.env.NODE_ENV === "production",
  homePath: "/signin",
});
```

Qaito に組み込まれたアプリは `clientId` を渡さず、`app` に組み込みのキーを入れます。
このときクライアント ID は、組織ごとに Qaito から引きます。

| 設定 | 必須 | 意味 |
|---|---|---|
| `app` | ○ | アプリの名前（英小文字・数字・ハイフン）。cookie の名前に使います。組み込みアプリでは組み込みのキー |
| `clientId` | 連携アプリは ○ | OAuth クライアント ID。渡すとこの ID でログインします |
| `defaultOrg` | | 組織 ID の既定。`?org=` も覚えている組織も無いときに使います。連携アプリは登録した組織を入れます |
| `apiBaseUrl` | ○ | Qaito API の URL（サーバーから呼ぶ） |
| `appDomain` | ○ | Qaito のドメイン（`app.qaito.ai`）。ポータル `{組織ID}.{appDomain}` の組み立てに使います |
| `redirectUri` | ○ | このアプリのコールバックの URL。登録した URL と完全に一致させます |
| `secureCookies` | ○ | cookie に `Secure` を付けるか。本番は `true`、手元の http は `false` |
| `homePath` | | ログイン画面のパス（既定 `/`）。エラーや組織の入力が要るときに戻す先です |
| `cookiePrefix` | | cookie の名前の頭（既定 `qaito`） |
| `orgCookieName` | | 組織 ID を覚える cookie の名前 |
| `userCookieName` | | ログインした人の氏名と scope を置く cookie の名前（画面の表示用）。省くと置きません |
| `acceptBearer` | | モバイルなどから `Authorization: Bearer` で来たトークンも受けるか（既定 `false`） |

### 2. Route Handler を並べる

`/api/auth/{login,callback,refresh,session,logout}` に置きます。

```ts
// src/app/api/auth/login/route.ts
import { auth } from "@/lib/auth";
export const GET = (req: Request) => auth.login(req);
```

```ts
// src/app/api/auth/callback/route.ts
import { auth } from "@/lib/auth";
export const GET = (req: Request) => auth.callback(req);
```

```ts
// src/app/api/auth/refresh/route.ts
import { auth } from "@/lib/auth";
export const POST = (req: Request) => auth.refresh(req);
```

```ts
// src/app/api/auth/session/route.ts
import { auth } from "@/lib/auth";
export const POST = (req: Request) => auth.session(req);
```

```ts
// src/app/api/auth/logout/route.ts
import { auth } from "@/lib/auth";
export const POST = (req: Request) => auth.logout(req);
```

| パス | メソッド | すること |
|---|---|---|
| `/api/auth/login` | GET | ポータルのログインへ送ります。`?org=` で組織、`?next=` でログイン後の戻り先（相対パス） |
| `/api/auth/callback` | GET | 認可コードをトークンに替えて cookie に置き、戻り先へ |
| `/api/auth/refresh` | POST | 延長だけをします |
| `/api/auth/session` | POST | ログインが使えるかをサーバーで確かめ、要れば延長します。`200` = 使える / `401`（`code: "session_expired"`）= 延長できない / `503` = 確かめられない |
| `/api/auth/logout` | POST | トークンを失効させ、cookie を消します。応答の `signinUrl` へ画面を送ってください |

ログインに失敗すると `homePath` に `?error=` を付けて戻します。値は `APP_AUTH_ERRORS`
（`org_not_found` / `login_unavailable` / `callback_failed`）です。組織が分からないときは `?need_org=1` です。
文言はアプリで決めてください。

サインアウトのボタンの例です。

```ts
const res = await fetch("/api/auth/logout", { method: "POST" });
const { signinUrl } = (await res.json()) as { signinUrl: string };
window.location.href = signinUrl;
```

### 3. API を呼ぶ（BFF）

Route Handler や Server Component で、cookie からトークンを取り出して `QaitoClient` に渡します。

```ts
// src/app/api/facilities/route.ts
import { QaitoClient, QaitoError } from "@qaito/sdk";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const token = auth.requireUserToken(req); // 無ければ 401 の Response
  if (token instanceof Response) return token;

  const qaito = new QaitoClient({ baseUrl: "https://api.app.qaito.ai", userToken: token });
  try {
    return Response.json({ success: true, data: await qaito.facility.facilities.list() });
  } catch (error) {
    const status = error instanceof QaitoError ? error.status || 502 : 500;
    return Response.json({ success: false, error: "読み込めませんでした" }, { status });
  }
}
```

| 補助 | 返すもの |
|---|---|
| `auth.getUserToken(req)` | トークン（無ければ `undefined`） |
| `auth.requireUserToken(req)` | トークン、または 401 の `Response` |
| `auth.getOrgSlug(req)` | 覚えている組織 ID |
| `auth.portalOrigin(orgSlug)` | その組織のポータルの URL（「ポータルへ戻る」の行き先） |
| `auth.cookieNames` | cookie の名前（`access` / `refresh` / `org` など） |

Server Component では `next/headers` の cookie を `Request` にして渡せます。

```ts
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

const jar = await cookies();
const token = auth.getUserToken(new Request("http://localhost", { headers: { cookie: jar.toString() } }));
```

### 4. 未ログインを止める（proxy.ts）

`proxy.ts`（Next.js 16。15 までは `middleware.ts`）で、cookie が無ければログインへ送ります。
見るのは **cookie があるかだけ** です。トークンが正しいかは API が決めます。

```ts
// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/signin", "/.well-known/qaito-app"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/") || PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const names = auth.cookieNames;
  const hasAccess = Boolean(request.cookies.get(names.access)?.value);
  const hasRefresh = Boolean(request.cookies.get(names.refresh)?.value);
  if (hasAccess || hasRefresh) return NextResponse.next();

  // Server Action の POST はリダイレクトしない（action が 401 を返す）
  if (request.method !== "GET") return NextResponse.next();
  const params = new URLSearchParams({ next: `${pathname}${search}` });
  return NextResponse.redirect(new URL(`/api/auth/login?${params.toString()}`, request.url), 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

本番でコンテナの中で動かすときは、`request.url` のホストが外から見える名前にならないことがあります。
そのときは `Host` ヘッダー（と `X-Forwarded-Proto`）からリダイレクト先を組み立ててください。

アクセストークンが切れて、延長用のリフレッシュトークンだけが残っているときは通します。
延長は画面側で 1 か所にまとめます（次の session-guard）。

## ログインを保つ（@qaito/sdk/app-auth/session-guard）

ブラウザで使います。アクセストークンが切れても、リフレッシュトークンで裏で延長して続けます。
延長できないときだけログインへ戻します。

- 延長を、同じタブの中・別のタブどうしで重ねません（重ねると後の方が失敗するため）
- 401 を受けたら延長を試し、できたら 1 回だけ送り直します
- 通信が切れて確かめられないときは、ログインへ戻しません
- ログインへ戻す前に、書きかけの入力を退避できます

```ts
// src/lib/session-guard.ts
import { createSessionGuard, type StorageLike } from "@qaito/sdk/app-auth/session-guard";

function safeStorage(kind: "localStorage" | "sessionStorage"): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window[kind];
  } catch {
    return null;
  }
}

let guard: ReturnType<typeof createSessionGuard> | null = null;

export function getSessionGuard() {
  guard ??= createSessionGuard({
    endpoint: "/api/auth/session",
    lockKey: "my_app_session_lock",
    draftKey: "my_app_draft_after_session_expiry",
    expiredPath: "/api/auth/login",
    fetch: (input, init) => fetch(input, init),
    now: () => Date.now(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    lockStorage: safeStorage("localStorage"),
    draftStorage: safeStorage("sessionStorage"),
    navigate: (url) => {
      window.location.href = url;
    },
    tabId: crypto.randomUUID(),
  });
  return guard;
}
```

```tsx
"use client";
import { useEffect } from "react";
import { getSessionGuard } from "@/lib/session-guard";

export function SessionKeeper() {
  useEffect(() => {
    const guard = getSessionGuard();
    void guard.ensureSession(); // 開いたときに確かめる（要れば延長）
    const timer = setInterval(() => void guard.ensureSession({ maxAgeMs: 60_000 }), 60_000);
    return () => clearInterval(timer);
  }, []);
  return null;
}
```

| 関数 | すること |
|---|---|
| `ensureSession({ maxAgeMs? })` | 確かめて、要れば延長します。`"ok"` / `"expired"` / `"unknown"` を返します |
| `fetchWithSession(input, init)` | `fetch` の包み。401 なら延長して 1 回だけ送り直します（body は文字列・FormData・Blob に限る） |
| `checkBeforeSend()` | 送信の前に確かめます。送ってよければ `true` |
| `handleUnauthorized()` | 401 を受けたあとに呼びます。延長できたら `true` |
| `setDraftSource(fn)` | ログインへ戻すときに退避する「今の入力」を返す関数を登録します |
| `goToLoginExpired()` | ログインへ戻します |
| `isRedirecting()` | 戻す途中か |

戻ってきたあと、退避した入力は `takeSavedDraft(sessionStorage, draftKey)` で 1 回だけ取り出せます。

## 連携アプリの確認用の応答（@qaito/sdk/verify）

組織が管理コンソールでアプリを登録するとき、Qaito はアプリの
`GET /.well-known/qaito-app?challenge=...` を呼んで、アプリが本当に動いていて
Qaito のログインにつながっていることを確かめます。

```ts
// src/app/.well-known/qaito-app/route.ts
import { qaitoAppManifest } from "@qaito/sdk/verify";

export const GET = qaitoAppManifest({
  name: "電話の受付",
  clientId: process.env.QAITO_CLIENT_ID!, // ログインに使っている OAuth クライアント ID
});
```

- `clientId` は公開してよい識別子です（秘密ではありません）
- **このパスだけは未ログインでも開けるようにしてください**（上の `proxy.ts` の `PUBLIC_PATHS`）。ほかのパスは止めたままにします。Qaito は「未ログインでは止まること」も確かめます

## 権限とトークンの扱い

- **権限はすべて Qaito のサーバーで決まります。** SDK から呼べても、ログインした人の権限の外のデータは返りません（`403` / `404`）。画面でボタンを隠すのは見た目のためで、守りではありません
- トークンは HttpOnly cookie に置きます。**画面（ブラウザの JavaScript）に出さない・ログに出さない・URL に載せない**でください
- API キー（`apiKey`）は秘密です。サーバーの環境変数か秘密の保管庫に置き、ブラウザに渡さないでください
- サインアウトは `/api/auth/logout` で行ってください。サーバー側でトークンを失効させ、同じ端末を次に使う人が前の人のまま入らないよう、ポータルのログインも消します

## 版の方針

- [セマンティック バージョニング](https://semver.org/lang/ja/) に従います
- 1.0 になるまで（`0.x` の間）は、`0.1 → 0.2` のような版で使い方が変わることがあります。`0.1.x` のような小さな版の中では、使い方を変えないようにします
- 変更の内容は、GitHub のリポジトリのタグ（版の一覧）で確かめてください

## ライセンス

MIT
