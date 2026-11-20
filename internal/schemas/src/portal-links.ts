import { z } from "zod";

export const PORTAL_LINK_KINDS = ["shortcut", "site"] as const;
export type PortalLinkKind = (typeof PORTAL_LINK_KINDS)[number];
export const portalLinkKindSchema = z.enum(PORTAL_LINK_KINDS);

/** 区画の呼び名（画面の見出し・確認の文言） */
export const PORTAL_LINK_KIND_LABEL: Record<PortalLinkKind, string> = {
  shortcut: "よく使う機能",
  site: "連携サイト",
};

export const PORTAL_LINK_NAME_MAX = 40;
export const PORTAL_LINK_DESCRIPTION_MAX = 80;
export const PORTAL_LINK_URL_MAX = 2048;
/** 1 区画に登録できる件数（ホームに並べる数なので多くは要らない） */
export const PORTAL_LINKS_PER_KIND_MAX = 30;
export const PORTAL_LINK_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** `https:` の絶対 URL か（ホスト必須・ユーザー情報〔`user:pass@`〕付きは不可）。 */
export function isHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.hostname.length > 0 && !url.username && !url.password;
}

/**
 * ポータルの中のパスか。`/` で始まり、`//`（プロトコル相対 = 別ホスト）と `/\`（ブラウザが `//` と読む）は不可。
 * 制御文字・空白を含むものも受けない。
 */
export function isPortalPath(value: string): boolean {
  return /^\/(?![/\\])[^\s\u0000-\u001f]*$/.test(value);
}

/** その区画で受ける URL か（よく使う機能 = https かポータルの中のパス / 連携サイト = https だけ）。 */
export function isAcceptablePortalLinkUrl(kind: PortalLinkKind, value: string): boolean {
  if (value.length > PORTAL_LINK_URL_MAX) return false;
  return isHttpsUrl(value) || (kind === "shortcut" && isPortalPath(value));
}

const optionalDescription = z
  .preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .string()
      .trim()
      .max(PORTAL_LINK_DESCRIPTION_MAX, `説明は ${PORTAL_LINK_DESCRIPTION_MAX} 文字以内で入力してください`)
      .nullable(),
  )
  .optional();

const imageInput = z
  .union([z.null(), z.object({ stagedId: z.string().uuid() })])
  .optional();

/** 登録（kind を含む）。 */
export const portalLinkCreateSchema = z
  .object({
    kind: portalLinkKindSchema,
    name: z
      .string()
      .trim()
      .min(1, "名前は必須です")
      .max(PORTAL_LINK_NAME_MAX, `名前は ${PORTAL_LINK_NAME_MAX} 文字以内で入力してください`),
    description: optionalDescription,
    url: z.string().trim().min(1, "URL は必須です"),
    image: imageInput,
  })
  .superRefine((v, ctx) => {
    if (!isAcceptablePortalLinkUrl(v.kind, v.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message:
          v.kind === "site"
            ? "https:// で始まる URL を入力してください"
            : "https:// で始まる URL か、/ で始まるポータルの中のパスを入力してください",
      });
    }
    if (v.kind !== "site" && v.image) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["image"], message: "画像は連携サイトだけに付けられます" });
    }
  });
export type PortalLinkCreateInput = z.infer<typeof portalLinkCreateSchema>;

/** 更新（kind は変えない。core が既存の行の kind で URL を検証する）。 */
export const portalLinkUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "名前は必須です")
    .max(PORTAL_LINK_NAME_MAX, `名前は ${PORTAL_LINK_NAME_MAX} 文字以内で入力してください`),
  description: optionalDescription,
  url: z.string().trim().min(1, "URL は必須です"),
  image: imageInput,
});
export type PortalLinkUpdateInput = z.infer<typeof portalLinkUpdateSchema>;

/** 並べ替え（その区画の全件を上から順に）。 */
export const portalLinkReorderSchema = z.object({
  kind: portalLinkKindSchema,
  ids: z.array(z.string().uuid()).max(PORTAL_LINKS_PER_KIND_MAX),
});
export type PortalLinkReorderInput = z.infer<typeof portalLinkReorderSchema>;
