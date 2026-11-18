# @qaito/sdk

Qaito プラットフォームの TypeScript クライアントです。

```sh
npm install @qaito/sdk
```

## 入口

| import | 中身 |
|---|---|
| `@qaito/sdk` | API クライアント（`QaitoClient`）と OAuth（`QaitoOAuth`） |
| `@qaito/sdk/app-auth` | Qaito のログインを Next.js のアプリに配線する（OAuth2 + PKCE、アプリ自身の HttpOnly cookie） |
| `@qaito/sdk/app-auth/session-guard` | ログインの状態を保つ画面側の部品 |
| `@qaito/sdk/verify` | Qaito に連携アプリとして登録するときの確認用の応答（`/.well-known/qaito-app`） |

## 使い方

```ts
import { QaitoClient } from "@qaito/sdk";

// userToken は @qaito/sdk/app-auth のログインで受け取ったユーザーのトークン
const qaito = new QaitoClient({ baseUrl: process.env.QAITO_API_BASE_URL!, userToken });
const facilities = await qaito.facility.facilities.list();
```

権限の判定はすべて Qaito のサーバー側で行います。SDK から呼べても、ログインした人の権限の外のデータは返りません。
