import { z } from "zod";

/**
 * 戻り値の型。
 *
 * ⚠️ `z.ZodObject<z.ZodRawShape>` で返してはいけない。shape が消えて
 * `parsed.data.facilityId` が `unknown` になり、**呼び出し側の型検査が丸ごと無効化**される
 * （実際 client/core/service-plans.ts が `unknown` を受けて typecheck が落ちていた）。
 * `.default()` を剥がしても**出力型は内側と同じ**なので、optional を被せた形で表現できる。
 */
type PartialShape<T extends z.ZodObject<z.ZodRawShape>> = z.ZodObject<{
  [K in keyof T["shape"]]: z.ZodOptional<T["shape"][K]>;
}>;

export function partialForUpdate<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
): PartialShape<T> {
  const next: Record<string, z.ZodType> = {};
  for (const [key, value] of Object.entries(schema.shape)) {
    let inner: unknown = value;
    while (
      typeof inner === "object" &&
      inner !== null &&
      "_zod" in inner &&
      ((inner as { _zod: { def: { type: string } } })._zod.def.type === "default" ||
        (inner as { _zod: { def: { type: string } } })._zod.def.type === "prefault")
    ) {
      inner = (inner as { _zod: { def: { innerType: unknown } } })._zod.def.innerType;
    }
    next[key] = (inner as z.ZodType).optional();
  }
  return z.object(next) as unknown as PartialShape<T>;
}
