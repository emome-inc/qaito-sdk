# Qaito SDK

Qaito プラットフォームの上でアプリを作るための部品です。

| パッケージ | 中身 |
|---|---|
| [`@qaito/sdk`](packages/sdk) | Qaito の API クライアント（`.`）と、Qaito のログイン（OAuth2 + PKCE）を Next.js に配線する部品（`./app-auth`） |
| [`@qaito/barrier-free-ui`](packages/barrier-free-ui) | Qaito バリアフリー UI。CSS のトークンと React の部品（文字の大きさ 小・中・大、ダーク、テーマ） |

```sh
npm install @qaito/sdk @qaito/barrier-free-ui
```

## このリポジトリについて

このリポジトリは、Qaito の開発用リポジトリから**自動で書き出しています**。ここで直接は直しません。
不具合や要望は Issue でお知らせください。プルリクエストは内容を確認して本体に取り込み、次の書き出しで反映します。

- どの版から書き出したかは `EXPORTED_FROM` にあります
- `internal/` は書き出しに必要な社内の型と文言です。npm には出さず、`@qaito/sdk` の中に取り込まれます

## セキュリティ

脆弱性は Issue に書かず、[SECURITY.md](SECURITY.md) の方法で知らせてください。

## ライセンス

MIT
