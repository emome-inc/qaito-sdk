import { z } from "zod";

/**
 * 組織ID（slug）のバリデーションスキーマ
 *
 * 規則:
 * - 3〜30 文字
 * - 小文字英字で開始・終了
 * - 英数字・ハイフンのみ
 * - 連続ハイフン禁止
 */
export const orgSlugSchema = z
  .string()
  .min(3, "組織IDは3文字以上で入力してください")
  .max(30, "組織IDは30文字以内で入力してください")
  .regex(
    /^[a-z][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]{3,30}$/,
    "組織IDは小文字英数字とハイフンのみ使用できます（先頭・末尾は英数字）",
  )
  .refine((s) => !s.includes("--"), "連続したハイフンは使用できません");

/**
 * **受け取るとき**の組織 ID の形（cookie・URL のクエリ・サブドメインから来た値）。
 *
 * 作るときの決まり（上の `orgSlugSchema`）より広い ── 既存の組織の ID をすべて通すため。
 * 値はポータルの URL のホスト（`{org}.{appDomain}`）にそのまま入るので、`evil.com#`・`a/b`・`a@b` で
 * ホストを差し替えられない形（英小文字・数字・ハイフン、先頭と末尾は英数字、63 文字まで）に絞る。
 * web・QaitoChat・ピアッザ・SDK はすべてこれを使う（正規表現を各所に書かない）。
 */
export function isOrgSlug(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
}

export const createOrgWithOwnerSchema = z
  .object({
    org_name: z.string().min(1, "組織名を入力してください").max(100),
    org_slug: orgSlugSchema,
    owner_login_id: z
      .string()
      .min(2, "ログインIDは2文字以上で入力してください")
      .max(50)
      .regex(
        /^[a-z0-9_-]+$/,
        "ログインIDは小文字英数字・ハイフン・アンダースコアのみ使用できます",
      ),
    owner_name: z.string().min(1, "名前を入力してください").max(100),
    owner_email: z.string().email("メールアドレスの形式が正しくありません"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .max(72),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "パスワードが一致しません",
    path: ["password_confirm"],
  });

export type CreateOrgWithOwnerInput = z.infer<typeof createOrgWithOwnerSchema>;
