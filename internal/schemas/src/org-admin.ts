import { z } from "zod";
import { orgSlugSchema } from "./org-registration";

export const createOrgAsAdminSchema = z.object({
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
});

export type CreateOrgAsAdminInput = z.infer<typeof createOrgAsAdminSchema>;

export const adminAddMemberSchema = z.object({
  login_id: z
    .string()
    .min(2, "ログインIDは2文字以上で入力してください")
    .max(50)
    .regex(
      /^[a-z0-9_-]+$/,
      "ログインIDは小文字英数字・ハイフン・アンダースコアのみ使用できます",
    ),
  name: z.string().min(1, "名前を入力してください").max(100),
  email: z.string().email("メールアドレスの形式が正しくありません"),
});

export type AdminAddMemberInput = z.infer<typeof adminAddMemberSchema>;

export const updateOrgProfileSchema = z.object({
  name: z.string().min(1, "組織名は必須です").max(100, "組織名は100文字以内で入力してください"),
  slug: orgSlugSchema,
  portalEnabled: z.boolean(),
  deviceLivenessMode: z.enum(["hmac", "rekognition"], {
    error: "デバイス認証モードは hmac または rekognition を指定してください",
  }),
  deviceConfidenceThreshold: z
    .number()
    .int()
    .min(80, "信頼スコア下限は80以上で指定してください")
    .max(99, "信頼スコア下限は99以下で指定してください"),
  deviceLockMaxAttempts: z
    .number()
    .int()
    .min(1, "失敗ロック試行回数は1以上で指定してください")
    .max(10, "失敗ロック試行回数は10以下で指定してください"),
  deviceLockDurationMin: z.union([
    z.literal(5),
    z.literal(15),
    z.literal(30),
    z.literal(60),
  ], { error: "ロック時間は 5 / 15 / 30 / 60 のいずれかを指定してください" }),
});

export type UpdateOrgProfileInput = z.infer<typeof updateOrgProfileSchema>;

export const memberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member"], {
    error: "ロールは owner / admin / member のいずれかを指定してください",
  }),
});

export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
