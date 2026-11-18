# @qaito/barrier-free-ui

Qaito バリアフリー UI。誰でも読みやすく押しやすい画面を作るための CSS のトークンと React の部品です。

- 文字の大きさ（小・中・大）に合わせて、余白やボタンの大きさも一緒に変わります
- 明るい / 暗い、8 つのテーマ
- 押せる場所は 44px 以上、キーボードの操作とフォーカスの表示

```sh
npm install @qaito/barrier-free-ui
```

TypeScript のソースのまま配っています。Next.js では `transpilePackages` に入れてください。

```ts
// next.config.ts
export default { transpilePackages: ["@qaito/barrier-free-ui"] };
```

```tsx
import "@qaito/barrier-free-ui/css";
import { Button } from "@qaito/barrier-free-ui/react";
```
