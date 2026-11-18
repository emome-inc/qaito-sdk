import { z } from "zod";
import { ALL_SCOPES_SENTINEL, isHumanGrantableScope } from "./scopes";

const permissionSetFields = z.object({
  name: z.string().min(1, "名前は必須です"),
  description: z.string().optional(),
  scopes: z
    .array(z.string().refine(isHumanGrantableScope, "許可されていないスコープです"))
    .transform((arr) =>
      arr.includes(ALL_SCOPES_SENTINEL) ? [ALL_SCOPES_SENTINEL] : arr,
    ),
  appIds: z.array(z.string().uuid()).max(200).optional(),
  externalAppIds: z.array(z.string().uuid()).max(200).optional(),
});

/** スコープかアプリのどちらかが 1 つ以上ある（アプリだけの権限セットも作れる） */
export const createPermissionSetSchema = permissionSetFields.refine(
  (d) => d.scopes.length > 0 || (d.appIds?.length ?? 0) > 0 || (d.externalAppIds?.length ?? 0) > 0,
  { message: "スコープかアプリを1つ以上選択してください", path: ["scopes"] },
);

/**
 * 更新。scope とアプリが 1 つ以上かは、入力だけでは決められない（アプリを省くと今のアプリのまま）ので、
 * ここでは見ない。保存のあとの中身で確かめる（access-control の updatePermissionSet）
 */
export const updatePermissionSetSchema = permissionSetFields;

export type CreatePermissionSetInput = z.infer<typeof createPermissionSetSchema>;
export type UpdatePermissionSetInput = z.infer<typeof updatePermissionSetSchema>;

/** DB 行型（全カラム） */
export type PermissionSetRow = {
  id: string;
  name: string;
  description: string | null;
  scopes: string[];
  created_at: string;
};
