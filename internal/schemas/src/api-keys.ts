import { z } from "zod";
import { isGrantableScope } from "./scopes";

export const createApiKeySchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  scopes: z
    .array(z.string().refine(isGrantableScope, "許可されていないスコープです"))
    .min(1, "1つ以上のスコープを選択してください"),
  expires_at: z.string().datetime().optional(),
  allowed_redirect_uris: z.array(z.string().url("有効なURLを入力してください")).optional(),
  facility_ids: z
    .array(z.string().uuid("事業所の指定が不正です"))
    .min(1, "制限する場合は 1 つ以上の事業所を選択してください")
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
