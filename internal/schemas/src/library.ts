import { z } from "zod";

/** レベル（`view < comment < edit < full`）。行に付けるのはこの 4 つ */
export const libraryLevelValues = ["view", "comment", "edit", "full"] as const;
export type LibraryGrantLevel = (typeof libraryLevelValues)[number];
/** スペースの既定のアクセス（full は配らない） */
export const libraryGeneralAccessValues = ["none", "view", "comment", "edit"] as const;
export type LibraryGeneralAccess = (typeof libraryGeneralAccessValues)[number];
export const librarySpaceKindValues = ["org", "facility"] as const;
export type LibrarySpaceKind = (typeof librarySpaceKindValues)[number];
export const libraryPrincipalKindValues = ["user", "facility", "group"] as const;
export type LibraryPrincipalKind = (typeof libraryPrincipalKindValues)[number];
export const libraryAccessModeValues = ["inherit", "restricted"] as const;
export type LibraryAccessMode = (typeof libraryAccessModeValues)[number];
/** メンバー行がどう足されたか（一覧に「管理者が自分を追加」の印を出す） */
export const librarySpaceMemberViaValues = ["member", "creator", "admin_self"] as const;
export type LibrarySpaceMemberVia = (typeof librarySpaceMemberViaValues)[number];

/** 1 回に置ける共有先の上限（メンバー・ページの共有とも） */
export const LIBRARY_PRINCIPALS_MAX = 200;

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500);
const iconName = z.string().trim().max(50);

export const createLibrarySpaceSchema = z
  .object({
    kind: z.enum(librarySpaceKindValues),
    facilityId: z.string().uuid().nullable().optional(),
    name,
    description: description.nullable().optional(),
    iconName: iconName.nullable().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    generalAccess: z.enum(libraryGeneralAccessValues).default("view"),
  })
  .refine((v) => (v.kind === "facility" ? typeof v.facilityId === "string" : v.facilityId == null), {
    message: "事業所スペースは facilityId が必須、組織スペースは持たない",
    path: ["facilityId"],
  });
export type CreateLibrarySpaceInput = z.infer<typeof createLibrarySpaceSchema>;

export const updateLibrarySpaceSchema = z
  .object({
    name: name.optional(),
    description: description.nullable().optional(),
    iconName: iconName.nullable().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    generalAccess: z.enum(libraryGeneralAccessValues).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "変える項目がありません" });
export type UpdateLibrarySpaceInput = z.infer<typeof updateLibrarySpaceSchema>;

/** 共有先 1 件（人・事業所・グループ）とレベル */
export const libraryPrincipalInputSchema = z.object({
  principalKind: z.enum(libraryPrincipalKindValues),
  id: z.string().uuid(),
  level: z.enum(libraryLevelValues),
});
export type LibraryPrincipalInput = z.infer<typeof libraryPrincipalInputSchema>;

const principals = z
  .array(libraryPrincipalInputSchema)
  .max(LIBRARY_PRINCIPALS_MAX)
  .refine((rows) => new Set(rows.map((r) => `${r.principalKind}:${r.id}`)).size === rows.length, {
    message: "同じ共有先が 2 回あります",
  });

/** スペースのメンバーを全部置き換える */
export const setLibrarySpaceMembersSchema = z.object({ members: principals });
export type SetLibrarySpaceMembersInput = z.infer<typeof setLibrarySpaceMembersSchema>;

/** ページに直接付ける共有を全部置き換える（継承している共有は含めない） */
export const setLibraryPageGrantsSchema = z.object({ grants: principals });
export type SetLibraryPageGrantsInput = z.infer<typeof setLibraryPageGrantsSchema>;

/** 制限する / 継承に戻す */
export const setLibraryPageAccessModeSchema = z.object({ mode: z.enum(libraryAccessModeValues) });
export type SetLibraryPageAccessModeInput = z.infer<typeof setLibraryPageAccessModeSchema>;

/** 確認ダイアログの「見えるようになる人 / 見えなくなる人」の数を出す変更 */
export const previewLibraryAccessChangeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("accessMode"), mode: z.enum(libraryAccessModeValues) }),
  z.object({ kind: z.literal("move"), parentId: z.string().uuid().nullable() }),
  z.object({ kind: z.literal("grants"), grants: principals }),
]);
export type PreviewLibraryAccessChangeInput = z.infer<typeof previewLibraryAccessChangeSchema>;

export const libraryPageFormatValues = ["markdown", "html", "text", "blocks"] as const;
export type LibraryPageFormat = (typeof libraryPageFormatValues)[number];
/** 新しく作るページの既定の形式（library-blocks.md §3.4） */
export const LIBRARY_DEFAULT_PAGE_FORMAT: LibraryPageFormat = "blocks";
/**
 * 公式のページ（`tool.library_official_*`）の形式。`blocks` はまだ入れない（公式の表の CHECK は 0452 のまま・
 * 0504 は組織・事業所のページだけ）
 */
export const libraryOfficialPageFormatValues = ["markdown", "html", "text"] as const;
export type LibraryOfficialPageFormat = (typeof libraryOfficialPageFormatValues)[number];

/** ページの状態（公開版の有無） */
export const libraryPageStatusValues = ["draft", "published"] as const;
export type LibraryPageStatus = (typeof libraryPageStatusValues)[number];

/** 版の状態（直すだけ・公開・置き換わった） */
export const libraryVersionStateValues = ["draft", "published", "superseded"] as const;
export type LibraryVersionState = (typeof libraryVersionStateValues)[number];

/** 木の深さの上限（根を 1 とする・§5.1）。`permissions/paths.ts` の `LIBRARY_MAX_DEPTH` と一致させる */
export const LIBRARY_MAX_DEPTH = 5;
/** ページの題名の長さの上限 */
export const LIBRARY_PAGE_TITLE_MAX = 200;
/** 要約（検索・一覧のまえがき）の長さの上限 */
export const LIBRARY_PAGE_SUMMARY_MAX = 200;
/** 下書きの保存のメモ（版の note）の長さの上限 */
export const LIBRARY_VERSION_NOTE_MAX = 200;
/** 本文の長さの上限（約 65k 字。表の 1 行に収まる上限で切る）。blocks は JSON の文字列の上限が別（`LIBRARY_BLOCKS_BODY_MAX`） */
export const LIBRARY_PAGE_BODY_MAX = 65_000;
/** ヘルプキーの形（§10）: `アプリ/画面` の軽い英数字 */
export const LIBRARY_HELP_KEY_RE = /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/u;

/** スペースの中で一意になるページの slug。URL と内部リンク（`[[slug]]`）に使う */
export const LIBRARY_PAGE_SLUG_RE = /^[a-z0-9][a-z0-9-]*$/u;
export const LIBRARY_PAGE_SLUG_MAX = 100;

/** 今の blocks の形の版。上げるときは `migrateBlocksDoc`（library/pure）に移行を足す */
export const LIBRARY_BLOCKS_SCHEMA_VERSION = 1 as const;
/** blocks の本文（JSON の文字列）の長さの上限 */
export const LIBRARY_BLOCKS_BODY_MAX = 500_000;
/** 入れ子の深さの上限（doc を 1 とする） */
export const LIBRARY_BLOCKS_MAX_DEPTH = 16;
/** ノードの数の上限（text のノードを含む） */
export const LIBRARY_BLOCKS_MAX_NODES = 10_000;
/** 文字の合計の上限（text・alt・コードの文字。他の形式の本文の上限と同じ） */
export const LIBRARY_BLOCKS_MAX_TEXT = LIBRARY_PAGE_BODY_MAX;

/** Notion の 10 色（既定・灰・茶・橙・黄・緑・青・紫・桃・赤）。文字色の名前（mark `textColor`） */
export const libraryBlockTextColorValues = [
  "default", "gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red",
] as const;
export type LibraryBlockTextColor = (typeof libraryBlockTextColorValues)[number];
/**
 * 背景色の名前（callout の色・mark `bgColor`）。値は bf-ui のトークンの名前で持ち、CSS 変数に写す（直接の色の値は保存しない・
 * ダークで読めなくなるため）
 */
export const libraryBlockBgColorValues = [
  "default", "gray_bg", "brown_bg", "orange_bg", "yellow_bg", "green_bg", "blue_bg", "purple_bg", "pink_bg", "red_bg",
] as const;
export type LibraryBlockBgColor = (typeof libraryBlockBgColorValues)[number];

/** コードブロックの言語の名前（小文字の英数字と `+ # . -`・30 字まで。null は無し） */
export const LIBRARY_BLOCKS_CODE_LANGUAGE_RE = /^[a-z0-9][a-z0-9+#.-]{0,29}$/u;
/** 列の数（columns の中の column） */
export const LIBRARY_BLOCKS_COLUMNS_MIN = 2;
export const LIBRARY_BLOCKS_COLUMNS_MAX = 4;
/** 画像の alt の長さの上限 */
export const LIBRARY_BLOCKS_ALT_MAX = 500;

const EMOJI_RE =
  /^(?:\p{Regional_Indicator}{2}|[#*0-9]️?⃣|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*(?:[\u{E0020}-\u{E007E}]+\u{E007F})?)$/u;
/** 絵文字 1 つか（ページのアイコン・callout のアイコン） */
export function isSingleEmoji(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 32 && EMOJI_RE.test(value);
}

/**
 * リンクの行き先として許すか（https と `/library/…` だけ）。`javascript:` `data:` `//host` `http:` は断る。
 * 読む表示（static の描画）も同じ関数で絞る
 */
export function isAllowedBlocksHref(href: string): boolean {
  if (typeof href !== "string" || href.length === 0 || href.length > 2048) return false;
  if (/[\u0000- \u007f]/u.test(href)) return false;
  if (href.startsWith("/library/")) return /^\/library\/[A-Za-z0-9\-._~/%?=&#+]*$/u.test(href);
  if (!href.startsWith("https://")) return false;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && url.hostname.length > 0 && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

const linkMarkSchema = z.strictObject({
  type: z.literal("link"),
  attrs: z.strictObject({
    href: z.string().refine(isAllowedBlocksHref, { message: "リンクは https と /library/ だけ" }),
    target: z.enum(["_blank"]).nullable().optional(),
    rel: z.string().max(100).nullable().optional(),
    class: z.null().optional(),
  }),
});
const plainMarkSchema = z.strictObject({ type: z.enum(["bold", "italic", "underline", "strike", "code"]) });
const textColorMarkSchema = z.strictObject({
  type: z.literal("textColor"),
  attrs: z.strictObject({ color: z.enum(libraryBlockTextColorValues).exclude(["default"]) }),
});
const bgColorMarkSchema = z.strictObject({
  type: z.literal("bgColor"),
  attrs: z.strictObject({ color: z.enum(libraryBlockBgColorValues).exclude(["default"]) }),
});
export const libraryBlocksMarkSchema = z.union([linkMarkSchema, plainMarkSchema, textColorMarkSchema, bgColorMarkSchema]);
export type LibraryBlocksMark = z.infer<typeof libraryBlocksMarkSchema>;

const textNodeSchema = z.strictObject({
  type: z.literal("text"),
  text: z.string().min(1),
  marks: z.array(libraryBlocksMarkSchema).max(8).optional(),
});
const hardBreakSchema = z.strictObject({ type: z.literal("hardBreak") });
const inlineSchema = z.union([textNodeSchema, hardBreakSchema]);
export type LibraryBlocksInline = z.infer<typeof inlineSchema>;
const inlineContent = z.array(inlineSchema).optional();

/** ブロックのノード（再帰の型は手で書く） */
export type LibraryBlocksNode =
  | { type: "paragraph"; content?: LibraryBlocksInline[] }
  | { type: "heading"; attrs: { level: 1 | 2 | 3 }; content?: LibraryBlocksInline[] }
  | { type: "blockquote"; content: LibraryBlocksNode[] }
  | { type: "codeBlock"; attrs?: { language?: string | null }; content?: { type: "text"; text: string }[] }
  | { type: "horizontalRule" }
  | { type: "bulletList"; content: LibraryBlocksListItem[] }
  | { type: "orderedList"; attrs?: { start?: number; type?: string | null }; content: LibraryBlocksListItem[] }
  | { type: "taskList"; content: LibraryBlocksTaskItem[] }
  | { type: "callout"; attrs: { icon?: string | null; color?: LibraryBlockBgColor }; content: LibraryBlocksNode[] }
  | { type: "details"; attrs?: { open?: boolean }; content: [LibraryBlocksDetailsSummary, LibraryBlocksDetailsContent] }
  | { type: "columns"; content: LibraryBlocksColumn[] }
  | { type: "image"; attrs: { assetId: string; alt: string; width?: number | null } };
export type LibraryBlocksListItem = { type: "listItem"; content: LibraryBlocksNode[] };
export type LibraryBlocksTaskItem = { type: "taskItem"; attrs: { checked: boolean }; content: LibraryBlocksNode[] };
export type LibraryBlocksDetailsSummary = { type: "detailsSummary"; content?: LibraryBlocksInline[] };
export type LibraryBlocksDetailsContent = { type: "detailsContent"; content: LibraryBlocksNode[] };
export type LibraryBlocksColumn = { type: "column"; attrs: { ratio: number }; content: LibraryBlocksNode[] };
export type LibraryBlocksDoc = { type: "doc"; content: LibraryBlocksNode[] };
/** 本文（`body` の JSON） */
export type LibraryBlocksBody = { schemaVersion: typeof LIBRARY_BLOCKS_SCHEMA_VERSION; doc: LibraryBlocksDoc };

const blockList = (inner: () => z.ZodType<LibraryBlocksNode>) => z.array(z.lazy(inner)).min(1);

const listItemSchema: z.ZodType<LibraryBlocksListItem> = z.strictObject({
  type: z.literal("listItem"),
  content: blockList(() => blockSchema),
});
const taskItemSchema: z.ZodType<LibraryBlocksTaskItem> = z.strictObject({
  type: z.literal("taskItem"),
  attrs: z.strictObject({ checked: z.boolean() }),
  content: blockList(() => blockSchema),
});
const columnSchema: z.ZodType<LibraryBlocksColumn> = z.strictObject({
  type: z.literal("column"),
  attrs: z.strictObject({ ratio: z.number().min(5).max(95) }),
  content: blockList(() => blockInColumnSchema),
});

const simpleBlockSchemas = {
  paragraph: z.strictObject({ type: z.literal("paragraph"), content: inlineContent }),
  heading: z.strictObject({
    type: z.literal("heading"),
    attrs: z.strictObject({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
    content: inlineContent,
  }),
  codeBlock: z.strictObject({
    type: z.literal("codeBlock"),
    attrs: z
      .strictObject({
        language: z
          .string()
          .refine((v) => LIBRARY_BLOCKS_CODE_LANGUAGE_RE.test(v), { message: "言語の名前の形が正しくありません" })
          .nullable()
          .optional(),
      })
      .optional(),
    content: z.array(z.strictObject({ type: z.literal("text"), text: z.string().min(1) })).optional(),
  }),
  horizontalRule: z.strictObject({ type: z.literal("horizontalRule") }),
  image: z.strictObject({
    type: z.literal("image"),
    attrs: z.strictObject({
      assetId: z.string().uuid(),
      alt: z.string().trim().min(1).max(LIBRARY_BLOCKS_ALT_MAX),
      width: z.number().int().min(16).max(4000).nullable().optional(),
    }),
  }),
};

function containerSchemas(inner: () => z.ZodType<LibraryBlocksNode>) {
  return [
    z.strictObject({ type: z.literal("blockquote"), content: blockList(inner) }),
    z.strictObject({ type: z.literal("bulletList"), content: z.array(listItemSchema).min(1) }),
    z.strictObject({
      type: z.literal("orderedList"),
      attrs: z
        .strictObject({
          start: z.number().int().min(0).max(100_000).optional(),
          type: z.enum(["1", "a", "A", "i", "I"]).nullable().optional(),
        })
        .optional(),
      content: z.array(listItemSchema).min(1),
    }),
    z.strictObject({ type: z.literal("taskList"), content: z.array(taskItemSchema).min(1) }),
    z.strictObject({
      type: z.literal("callout"),
      attrs: z.strictObject({
        icon: z.string().refine(isSingleEmoji, { message: "アイコンは絵文字 1 つ" }).nullable().optional(),
        color: z.enum(libraryBlockBgColorValues).optional(),
      }),
      content: blockList(inner),
    }),
    z.strictObject({
      type: z.literal("details"),
      attrs: z.strictObject({ open: z.boolean().optional() }).optional(),
      content: z.tuple([
        z.strictObject({ type: z.literal("detailsSummary"), content: inlineContent }),
        z.strictObject({ type: z.literal("detailsContent"), content: blockList(inner) }),
      ]),
    }),
  ] as const;
}

function blockOptions(inner: () => z.ZodType<LibraryBlocksNode>) {
  const S = simpleBlockSchemas;
  return [S.paragraph, S.heading, S.codeBlock, S.horizontalRule, S.image, ...containerSchemas(inner)] as const;
}

/** 列の中に置けるブロック（columns 以外） */
const blockInColumnSchema: z.ZodType<LibraryBlocksNode> = z.lazy(() =>
  z.discriminatedUnion("type", blockOptions(() => blockInColumnSchema)),
) as z.ZodType<LibraryBlocksNode>;

const columnsSchema = z
  .strictObject({
    type: z.literal("columns"),
    content: z.array(columnSchema).min(LIBRARY_BLOCKS_COLUMNS_MIN).max(LIBRARY_BLOCKS_COLUMNS_MAX),
  })
  .refine((v) => Math.abs(v.content.reduce((sum, c) => sum + c.attrs.ratio, 0) - 100) <= 1, {
    message: "列の幅の合計は 100",
    path: ["content"],
  });

/** ブロック（doc・引用・リストの項目・callout・toggle の中身に置けるもの） */
const blockSchema: z.ZodType<LibraryBlocksNode> = z.lazy(() =>
  z.union([
    z.discriminatedUnion("type", blockOptions(() => blockSchema)),
    columnsSchema,
  ]),
) as z.ZodType<LibraryBlocksNode>;

const docSchema: z.ZodType<LibraryBlocksDoc> = z.strictObject({
  type: z.literal("doc"),
  content: z.array(blockSchema).min(1),
});

/** 深さ・ノードの数・文字の合計を先に数える（再帰の Zod に深すぎる入れ子を渡さない） */
export function measureBlocksTree(value: unknown): { depth: number; nodes: number; text: number } | null {
  let nodes = 0;
  let text = 0;
  let depth = 0;
  const stack: { v: unknown; d: number }[] = [{ v: value, d: 1 }];
  while (stack.length > 0) {
    const { v, d } = stack.pop()!;
    if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
    nodes += 1;
    depth = Math.max(depth, d);
    if (nodes > LIBRARY_BLOCKS_MAX_NODES || depth > LIBRARY_BLOCKS_MAX_DEPTH) return { depth, nodes, text };
    const node = v as { text?: unknown; attrs?: { alt?: unknown }; content?: unknown };
    if (typeof node.text === "string") text += node.text.length;
    if (node.attrs && typeof node.attrs === "object" && typeof node.attrs.alt === "string") text += node.attrs.alt.length;
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) return null;
      for (const child of node.content) stack.push({ v: child, d: d + 1 });
    }
  }
  return { depth, nodes, text };
}

/**
 * blocks の本文の形（`JSON.parse(body)` のあと）。許可リストの外・深すぎ・大きすぎは断る。
 * ⚠️ 他のスペースの画像（assetId）は Zod では分からないので、core が `library_assets` と突き合わせて断る
 */
export const libraryBlocksDocSchema: z.ZodType<LibraryBlocksBody> = z
  .unknown()
  .superRefine((v, ctx) => {
    const doc = typeof v === "object" && v !== null ? (v as { doc?: unknown }).doc : undefined;
    const m = measureBlocksTree(doc);
    if (m === null) return;
    if (m.depth > LIBRARY_BLOCKS_MAX_DEPTH) ctx.addIssue({ code: "custom", message: "入れ子が深すぎます" });
    else if (m.nodes > LIBRARY_BLOCKS_MAX_NODES) ctx.addIssue({ code: "custom", message: "ブロックが多すぎます" });
    else if (m.text > LIBRARY_BLOCKS_MAX_TEXT) ctx.addIssue({ code: "custom", message: "本文が長すぎます" });
  })
  .pipe(
    z.strictObject({
      schemaVersion: z.literal(LIBRARY_BLOCKS_SCHEMA_VERSION),
      doc: docSchema,
    }),
  ) as z.ZodType<LibraryBlocksBody>;

/** 空のページの本文（段落 1 つ） */
export const LIBRARY_EMPTY_BLOCKS_BODY: LibraryBlocksBody = {
  schemaVersion: LIBRARY_BLOCKS_SCHEMA_VERSION,
  doc: { type: "doc", content: [{ type: "paragraph" }] },
};

const title = z.string().trim().min(1).max(LIBRARY_PAGE_TITLE_MAX);
const summary = z.string().trim().max(LIBRARY_PAGE_SUMMARY_MAX);
const slug = z
  .string()
  .trim()
  .min(1)
  .max(LIBRARY_PAGE_SLUG_MAX)
  .refine((v) => LIBRARY_PAGE_SLUG_RE.test(v), { message: "slug は英数字と `-` のみ（先頭は英数字）" });
/** 本文の文字列。blocks は JSON の分だけ長いので上限を分ける（形式ごとの上限は `bodyFitsFormat`） */
const body = z.string().max(LIBRARY_BLOCKS_BODY_MAX);
const helpKey = z
  .string()
  .trim()
  .max(100)
  .refine((v) => LIBRARY_HELP_KEY_RE.test(v), { message: "help_key の形が正しくありません" });

/** 形式ごとの本文の長さの上限（blocks 以外は 65k 字・blocks は JSON の文字列で `LIBRARY_BLOCKS_BODY_MAX`） */
export function bodyFitsFormat(format: LibraryPageFormat, value: string): boolean {
  return value.length <= (format === "blocks" ? LIBRARY_BLOCKS_BODY_MAX : LIBRARY_PAGE_BODY_MAX);
}

/** ページのアイコン（絵文字 1 つ・null で外す）とカバー（同じスペースの画像の ID・null で外す） */
const pageIcon = z.string().refine(isSingleEmoji, { message: "アイコンは絵文字 1 つ" });
const coverAssetId = z.string().uuid();

/**
 * 新しいページを作る。`format` を省くと `blocks`（library-blocks.md §3.4）。
 * blocks の本文の形（許可リスト）は core が `libraryBlocksDocSchema` で確かめる（文字列の JSON を開くため）
 */
export const createLibraryPageSchema = z
  .object({
    spaceId: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(),
    title,
    summary: summary.nullable().optional(),
    format: z.enum(libraryPageFormatValues).default(LIBRARY_DEFAULT_PAGE_FORMAT),
    body: body.default(""),
    slug: slug.optional(),
    position: z.number().int().min(0).max(100_000).optional(),
    icon: pageIcon.nullable().optional(),
    coverAssetId: coverAssetId.nullable().optional(),
    /**
     * テンプレートから作る（同じスペースの、テンプレートの印が付いた公開済みのページ）。形式と本文はそのページの公開版を写し、
     * アイコンとカバーは渡さなければそのページのものを写す（library-blocks.md §6）
     */
    templatePageId: z.string().uuid().optional(),
  })
  .refine((v) => bodyFitsFormat(v.format, v.body), { message: "本文が長すぎます", path: ["body"] });
export type CreateLibraryPageInput = z.infer<typeof createLibraryPageSchema>;

/**
 * 下書きの版を保存する。
 *
 * `baseVersionNo`:
 * - 整数 → その版を元にした下書き（ずれていれば CONFLICT）
 * - `null` → 公開版の無いページで最初の下書きを保存する（新規作成の直後）
 */
export const saveLibraryPageDraftSchema = z.object({
  title: title.optional(),
  summary: summary.nullable().optional(),
  format: z.enum(libraryPageFormatValues).optional(),
  body: body.optional(),
  note: z.string().trim().max(LIBRARY_VERSION_NOTE_MAX).nullable().optional(),
  baseVersionNo: z.number().int().min(0).nullable(),
  /** ページの頭（版に持たない。保存したときにページへ直に入る・公開を待たない） */
  icon: pageIcon.nullable().optional(),
  coverAssetId: coverAssetId.nullable().optional(),
});
export type SaveLibraryPageDraftInput = z.infer<typeof saveLibraryPageDraftSchema>;

/** テンプレートの印を付ける・外す（edit 以上） */
export const setLibraryPageTemplateSchema = z.object({ isTemplate: z.boolean() });
export type SetLibraryPageTemplateInput = z.infer<typeof setLibraryPageTemplateSchema>;

/** ページを動かす（親を変える・並べ替える） */
export const moveLibraryPageSchema = z.object({
  parentId: z.string().uuid().nullable(),
  position: z.number().int().min(0).max(100_000).optional(),
});
export type MoveLibraryPageInput = z.infer<typeof moveLibraryPageSchema>;

/** 全文検索の文字の長さ・件数の上限（library.md §6） */
export const LIBRARY_SEARCH_QUERY_MAX = 100;
export const LIBRARY_SEARCH_LIMIT_MAX = 50;
export const LIBRARY_SEARCH_LIMIT_DEFAULT = 20;

/** ページを探す（公開版の題名と本文。見えるページだけ） */
export const searchLibraryPagesSchema = z.object({
  q: z.string().trim().min(1).max(LIBRARY_SEARCH_QUERY_MAX),
  spaceId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(LIBRARY_SEARCH_LIMIT_MAX).default(LIBRARY_SEARCH_LIMIT_DEFAULT),
});
export type SearchLibraryPagesInput = z.infer<typeof searchLibraryPagesSchema>;

/** 検索の 1 件。`snippet` は本文の当たった前後（題名だけ当たったときは本文の頭） */
export type LibrarySearchHit = {
  id: string;
  spaceId: string;
  spaceName: string;
  title: string;
  icon: string | null;
  snippet: string;
  updatedAt: string;
};

/** 形式を変える（新しい下書きの版を作るだけ・§5.2） */
export const convertLibraryPageFormatSchema = z.object({
  to: z.enum(libraryPageFormatValues),
});
export type ConvertLibraryPageFormatInput = z.infer<typeof convertLibraryPageFormatSchema>;

/** ライブラリの画像の MIME（SVG は入れない・§5.5） */
export const LIBRARY_ASSET_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type LibraryAssetMime = (typeof LIBRARY_ASSET_ALLOWED_MIME)[number];
/** 1 ファイルの上限: 10MB（§5.5） */
export const LIBRARY_ASSET_MAX_BYTES = 10 * 1024 * 1024;

/** 本文中の内部参照（`qaito-asset:{id}`）のプロトコル */
export const LIBRARY_ASSET_SRC_PREFIX = "qaito-asset:";

/**
 * 画像の取り込み。実体は staging（用途 `library_asset`）に置いたもので、MIME・サイズ・マジックバイトは
 * 取り込むときに実体に対して確かめる（`@qaito/schemas/upload`）
 */
export const uploadLibraryAssetSchema = z.object({
  stagedId: z.string().uuid(),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});
export type UploadLibraryAssetInput = z.infer<typeof uploadLibraryAssetSchema>;

/** 公式の画像の取り込み（Platform Admin）。置くスペースを指定する */
export const uploadLibraryOfficialAssetSchema = uploadLibraryAssetSchema.extend({ spaceId: z.string().uuid() });
export type UploadLibraryOfficialAssetInput = z.infer<typeof uploadLibraryOfficialAssetSchema>;

/** 公式のスペースの入力（platform-admin の口。ゲートは通さない） */
export const createLibraryOfficialSpaceSchema = z.object({
  name,
  description: description.nullable().optional(),
  iconName: iconName.nullable().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});
export type CreateLibraryOfficialSpaceInput = z.infer<typeof createLibraryOfficialSpaceSchema>;

export const updateLibraryOfficialSpaceSchema = z
  .object({
    name: name.optional(),
    description: description.nullable().optional(),
    iconName: iconName.nullable().optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "変える項目がありません" });
export type UpdateLibraryOfficialSpaceInput = z.infer<typeof updateLibraryOfficialSpaceSchema>;

/** 公式の本文（blocks を持たないので 65k 字のまま） */
const officialBody = z.string().max(LIBRARY_PAGE_BODY_MAX);

export const createLibraryOfficialPageSchema = z.object({
  spaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  title,
  summary: summary.nullable().optional(),
  format: z.enum(libraryOfficialPageFormatValues),
  body: officialBody.default(""),
  slug: slug.optional(),
  helpKey: helpKey.nullable().optional(),
  position: z.number().int().min(0).max(100_000).optional(),
});
export type CreateLibraryOfficialPageInput = z.infer<typeof createLibraryOfficialPageSchema>;

export const saveLibraryOfficialPageDraftSchema = z.object({
  title: title.optional(),
  summary: summary.nullable().optional(),
  format: z.enum(libraryOfficialPageFormatValues).optional(),
  body: officialBody.optional(),
  helpKey: helpKey.nullable().optional(),
  note: z.string().trim().max(LIBRARY_VERSION_NOTE_MAX).nullable().optional(),
  baseVersionNo: z.number().int().min(0).nullable(),
});
export type SaveLibraryOfficialPageDraftInput = z.infer<typeof saveLibraryOfficialPageDraftSchema>;

export const moveLibraryOfficialPageSchema = moveLibraryPageSchema;
export type MoveLibraryOfficialPageInput = z.infer<typeof moveLibraryOfficialPageSchema>;

/** 公式のページを組織の下に複製する（§3.2 の末尾） */
export const copyOfficialLibraryPageSchema = z.object({
  toSpaceId: z.string().uuid(),
  toParentId: z.string().uuid().nullable().optional(),
  slug: slug.optional(),
});
export type CopyOfficialLibraryPageInput = z.infer<typeof copyOfficialLibraryPageSchema>;

export const restoreLibraryPageVersionSchema = z.object({
  versionNo: z.number().int().min(1),
  note: z.string().trim().max(LIBRARY_VERSION_NOTE_MAX).nullable().optional(),
});
export type RestoreLibraryPageVersionInput = z.infer<typeof restoreLibraryPageVersionSchema>;
