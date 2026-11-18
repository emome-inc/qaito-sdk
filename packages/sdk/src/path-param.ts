/**
 * path-param.ts — 生成した口がパスに差し込む引数を、区間 1 つに閉じ込める（`scripts/render-surface.ts` が呼びを書く）。
 *
 * 値で URL の形を変えさせない（`../channels/x` や `..` で別の口に化けると、承認した操作と実際に呼ぶ口がずれる）。
 * エンコードし、`.` / `..` は拒否する。拒否のしかたは `tools.execute`（`surface/meta.ts`）と同じ。
 */
import { QaitoError } from "./error.js";

export function pathParam(value: string | number, name: string): string {
  const raw = String(value);
  if (raw === "." || raw === "..") {
    throw new QaitoError(`Invalid path parameter: ${name}`, 400);
  }
  return encodeURIComponent(raw);
}
