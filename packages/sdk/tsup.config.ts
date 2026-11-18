import { defineConfig } from "tsup";

// 社内のパッケージ（internal/ の @qaito/schemas・@qaito/vocabulary）は中に取り込む。
// 外に残すのは package.json の dependencies だけ。型も tsconfig の paths で internal/ を指して中に取り込む
// （paths が無いと、型の定義に `@qaito/schemas` への import が残り、使う側で型が解けない）。
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "app-auth/index": "src/app-auth/index.ts",
    "app-auth/session-guard": "src/app-auth/session-guard.ts",
    "verify/index": "src/verify/index.ts",
  },
  format: ["esm"],
  dts: { resolve: true },
  noExternal: [/^@qaito\//],
  tsconfig: "tsconfig.json",
  target: "es2020",
  clean: true,
  sourcemap: false,
});
