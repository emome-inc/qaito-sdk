# Qaito SDK

Qaito プラットフォームの上でアプリを作るための部品です。

| パッケージ | 中身 | 説明 |
|---|---|---|
| [`@qaito/sdk`](packages/sdk) | API クライアントと、Qaito のログイン（OAuth2 + PKCE）を Next.js につなぐ部品 | [README](packages/sdk/README.md) |
| [`@qaito/barrier-free-ui`](packages/barrier-free-ui) | Qaito バリアフリー UI。CSS のトークンと React の部品（文字の大きさ 小・中・大、暗い画面、テーマの色） | [README](packages/barrier-free-ui/README.md) |

2 つは別々に使えます。

- `@qaito/sdk` は**データとログイン**を受け持ちます。どの UI でも使えます
- `@qaito/barrier-free-ui` は**見た目**を受け持ちます。Qaito の画面とそろった見た目にできます

## 最短の始め方（Next.js）

### 1. 入れる

```sh
npm install @qaito/sdk @qaito/barrier-free-ui
```

### 2. Qaito にアプリを登録する

組織の管理コンソールで連携アプリを登録し、次の 2 つを受け取ります。

- **OAuth クライアント ID**（公開してよい識別子）
- 登録した**組織 ID**

コールバックの URL（例 `https://my-app.example.com/api/auth/callback`）も登録します。

### 3. ログインをつなぐ

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
});
```

```ts
// src/app/api/auth/login/route.ts（callback・refresh・session・logout も同じ形）
import { auth } from "@/lib/auth";
export const GET = (req: Request) => auth.login(req);
```

### 4. API を呼ぶ

```ts
import { QaitoClient } from "@qaito/sdk";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const token = auth.requireUserToken(req);
  if (token instanceof Response) return token; // 未ログインなら 401

  const qaito = new QaitoClient({ baseUrl: "https://api.app.qaito.ai", userToken: token });
  return Response.json({ success: true, data: await qaito.facility.facilities.list() });
}
```

### 5. 見た目をそろえる

```ts
// next.config.ts
export default { transpilePackages: ["@qaito/barrier-free-ui"] };
```

```tsx
// src/app/layout.tsx
import "@qaito/barrier-free-ui/css";
import { Button } from "@qaito/barrier-free-ui/react";
```

くわしい手順（未ログインを止める `proxy.ts`・ログインを保つ session-guard・登録の確認の応答・
文字の大きさと暗い画面の設定）は、それぞれの README にあります。

- [@qaito/sdk の README](packages/sdk/README.md)
- [@qaito/barrier-free-ui の README](packages/barrier-free-ui/README.md)
- npm: [@qaito/sdk](https://www.npmjs.com/package/@qaito/sdk) / [@qaito/barrier-free-ui](https://www.npmjs.com/package/@qaito/barrier-free-ui)

## 権限について

権限はすべて Qaito のサーバーで決まります。SDK から呼べても、ログインした人の権限の外のデータは返りません。
トークンはアプリの HttpOnly cookie に置き、画面やログに出さないでください。

## このリポジトリについて

このリポジトリは、Qaito の開発用リポジトリから**自動で書き出しています**。ここで直接は直しません。
不具合や要望は Issue でお知らせください。プルリクエストは内容を確認して本体に取り込み、次の書き出しで反映します。

- どの版から書き出したかは `EXPORTED_FROM` にあります
- `internal/` は書き出しに必要な社内の型と文言です。npm には出さず、`@qaito/sdk` の中に取り込まれます

### 手元でビルドする

```sh
pnpm install
pnpm build      # @qaito/sdk をビルド
pnpm typecheck  # 2 つのパッケージの型を確かめる
```

## セキュリティ

脆弱性は Issue に書かず、[SECURITY.md](SECURITY.md) の方法で知らせてください。

## ライセンス

MIT
