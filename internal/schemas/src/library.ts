import { z } from "zod";

/** 置き場（組織 = 組織の全員 / 事業所 = その事業所の所属者 / 個人 = 本人だけ） */
export const libraryAreaValues = ["org", "facility", "personal"] as const;
export type LibraryArea = (typeof libraryAreaValues)[number];

/** ノードの種類 */
export const libraryNodeKindValues = ["folder", "page"] as const;
export type LibraryNodeKind = (typeof libraryNodeKindValues)[number];

/** 公開 = 置き場の対象の全員 / 非公開 = 持ち主・見せる人・ルートだけが中に入れる（名前は対象の全員に見える） */
export const libraryVisibilityValues = ["public", "private"] as const;
export type LibraryVisibility = (typeof libraryVisibilityValues)[number];

/** 見せる人の段（見る / 編集）。持ち主は名簿に入れない */
export const libraryMemberLevelValues = ["view", "edit"] as const;
export type LibraryMemberLevel = (typeof libraryMemberLevelValues)[number];

/** 1 回に置ける見せる人の上限 */
export const LIBRARY_NAMES_MAX = 200;

export const libraryPageFormatValues = ["blocks", "design"] as const;
export type LibraryPageFormat = (typeof libraryPageFormatValues)[number];
export const LIBRARY_DEFAULT_PAGE_FORMAT: LibraryPageFormat = "blocks";
/** 公式のページ（`tool.library_official_*`）の形式。組織のページと同じ 2 つ */
export const libraryOfficialPageFormatValues = libraryPageFormatValues;
export type LibraryOfficialPageFormat = (typeof libraryOfficialPageFormatValues)[number];

/** 木の深さの上限（根を 1 とする・フォルダを含む）。`permissions/paths.ts` が使う */
export const LIBRARY_MAX_DEPTH = 8;
/**
 * 置き場あたりの生きたノード（フォルダとページ）の上限。超えると作る・複製が CONFLICT（TREE_FULL）。
 * 木を読むときは全部返す（黙って欠ける木を作らない）。数えるのは core の `areaRoomLeft`（木の鍵を取った tx の中）
 */
export const LIBRARY_MAX_NODES_PER_AREA = 5000;
/** フォルダ・ページの名前の長さの上限 */
export const LIBRARY_PAGE_TITLE_MAX = 200;
export const LIBRARY_VERSIONS_KEPT = 10;
/** 本文の長さの上限（約 65k 字。表の 1 行に収まる上限で切る）。blocks は JSON の文字列の上限が別（`LIBRARY_BLOCKS_BODY_MAX`） */
export const LIBRARY_PAGE_BODY_MAX = 65_000;
/** デザインページの本文（検査したあとの HTML + CSS）の長さの上限。STORIES の 1 枚（約 110KB）の約 2.5 倍 */
export const LIBRARY_DESIGN_BODY_MAX = 300_000;
/** ヘルプキーの形: `アプリ/画面` の軽い英数字 */
export const LIBRARY_HELP_KEY_RE = /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/u;

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

/** コードブロックの言語の名前（小文字の英数字と `+ # . -`・30 字まで。null は無し） */
export const LIBRARY_BLOCKS_CODE_LANGUAGE_RE = /^[a-z0-9][a-z0-9+#.-]{0,29}$/u;
/** 画像の alt の長さの上限 */
export const LIBRARY_BLOCKS_ALT_MAX = 500;
/** 1 つの表の行の上限（見出しの行を含む） */
export const LIBRARY_BLOCKS_TABLE_MAX_ROWS = 100;
/** 1 つの表の列の上限 */
export const LIBRARY_BLOCKS_TABLE_MAX_COLS = 20;
/** 1 つの本文の表の数の上限 */
export const LIBRARY_BLOCKS_MAX_TABLES = 50;

/**
 * 本文の中のライブラリへの内部リンク: `/library/n/{nodeId}`（見出しへの印 `#…` だけ付けてよい）。
 * `..`・`%2e`・`?`・ほかのパスは入れない（相対の任意パスへ飛ばさない・審査 L8）。web の描画も同じ正規表現で絞る
 */
export const LIBRARY_INTERNAL_LINK_RE = /^\/library\/n\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:#[A-Za-z0-9_-]{1,128})?$/u;

/**
 * リンクの行き先として許すか（https と `/library/n/{nodeId}` だけ）。`javascript:` `data:` `//host` `http:` は断る。
 * 読む表示（static の描画）も同じ関数で絞る
 */
export function isAllowedBlocksHref(href: string): boolean {
  if (typeof href !== "string" || href.length === 0 || href.length > 2048) return false;
  if (/[\u0000- \u007f]/u.test(href)) return false;
  if (href.startsWith("/")) return LIBRARY_INTERNAL_LINK_RE.test(href);
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
    href: z.string().refine(isAllowedBlocksHref, { message: "リンクは https と /library/n/{nodeId} だけ" }),
    target: z.enum(["_blank"]).nullable().optional(),
    rel: z.string().max(100).nullable().optional(),
    class: z.null().optional(),
  }),
});
const plainMarkSchema = z.strictObject({ type: z.enum(["bold", "italic", "strike", "code"]) });
export const libraryBlocksMarkSchema = z.union([linkMarkSchema, plainMarkSchema]);
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
  | { type: "image"; attrs: { assetId: string; alt: string } };
export type LibraryBlocksListItem = { type: "listItem"; content: LibraryBlocksNode[] };
export type LibraryBlocksTaskItem = { type: "taskItem"; attrs: { checked: boolean }; content: LibraryBlocksNode[] };
/**
 * 表（Tiptap の @tiptap/extension-table の名前・GFM の表に写せる形だけ）。置けるのは本文の一番上の並びだけ（引用・リストの中には置かない）。
 * 1 行目は全部 tableHeader・2 行目からは全部 tableCell・どの行もセルの数は 1 行目と同じ。セルの中は段落 1 つ（インラインだけ）。
 * 結合・幅・揃えは持たない（attrs は Tiptap が既定で付ける colspan 1・rowspan 1・colwidth null だけ受ける）
 */
export type LibraryBlocksCellAttrs = { colspan?: 1; rowspan?: 1; colwidth?: null };
export type LibraryBlocksParagraph = { type: "paragraph"; content?: LibraryBlocksInline[] };
export type LibraryBlocksTableHeader = { type: "tableHeader"; attrs?: LibraryBlocksCellAttrs; content: [LibraryBlocksParagraph] };
export type LibraryBlocksTableCell = { type: "tableCell"; attrs?: LibraryBlocksCellAttrs; content: [LibraryBlocksParagraph] };
export type LibraryBlocksTableRow = { type: "tableRow"; content: (LibraryBlocksTableHeader | LibraryBlocksTableCell)[] };
export type LibraryBlocksTable = { type: "table"; content: LibraryBlocksTableRow[] };
/** 本文の一番上の並びに置けるもの（ブロック + 表） */
export type LibraryBlocksTopNode = LibraryBlocksNode | LibraryBlocksTable;
export type LibraryBlocksDoc = { type: "doc"; content: LibraryBlocksTopNode[] };
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
  ] as const;
}

function blockOptions(inner: () => z.ZodType<LibraryBlocksNode>) {
  const S = simpleBlockSchemas;
  return [S.paragraph, S.heading, S.codeBlock, S.horizontalRule, S.image, ...containerSchemas(inner)] as const;
}

/** ブロック（doc・引用・リストの項目の中に置けるもの） */
const blockSchema: z.ZodType<LibraryBlocksNode> = z.lazy(() =>
  z.discriminatedUnion("type", blockOptions(() => blockSchema)),
) as z.ZodType<LibraryBlocksNode>;

const cellAttrsSchema = z
  .strictObject({ colspan: z.literal(1).optional(), rowspan: z.literal(1).optional(), colwidth: z.null().optional() })
  .optional();
const cellParagraphSchema = z.tuple([simpleBlockSchemas.paragraph]);
const tableHeaderSchema = z.strictObject({ type: z.literal("tableHeader"), attrs: cellAttrsSchema, content: cellParagraphSchema });
const tableCellSchema = z.strictObject({ type: z.literal("tableCell"), attrs: cellAttrsSchema, content: cellParagraphSchema });
const tableRowSchema = <C extends z.ZodTypeAny>(cell: C) =>
  z.strictObject({ type: z.literal("tableRow"), content: z.array(cell).min(1).max(LIBRARY_BLOCKS_TABLE_MAX_COLS) });

const tableSchema: z.ZodType<LibraryBlocksTable> = z
  .strictObject({
    type: z.literal("table"),
    content: z
      .tuple([tableRowSchema(tableHeaderSchema)], tableRowSchema(tableCellSchema))
      .refine((rows) => rows.length <= LIBRARY_BLOCKS_TABLE_MAX_ROWS, { message: "表の行が多すぎます" }),
  })
  .refine((t) => t.content.every((r) => r.content.length === t.content[0].content.length), {
    message: "表の行ごとのセルの数がそろっていません",
  }) as z.ZodType<LibraryBlocksTable>;

const docSchema: z.ZodType<LibraryBlocksDoc> = z
  .strictObject({
    type: z.literal("doc"),
    content: z.array(z.union([tableSchema, blockSchema])).min(1),
  })
  .refine((d) => d.content.filter((n) => n.type === "table").length <= LIBRARY_BLOCKS_MAX_TABLES, { message: "表が多すぎます" });

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
 * ⚠️ ほかのページの画像（assetId）は Zod では分からないので、core が `library_node_assets` と突き合わせて断る
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

const uuid = z.string().uuid();
const title = z.string().trim().min(1).max(LIBRARY_PAGE_TITLE_MAX);
/** 本文の文字列。blocks は JSON の分だけ長いので上限を分ける（形式ごとの上限は `bodyFitsFormat`） */
const body = z.string().max(LIBRARY_BLOCKS_BODY_MAX);
const helpKey = z
  .string()
  .trim()
  .max(100)
  .refine((v) => LIBRARY_HELP_KEY_RE.test(v), { message: "help_key の形が正しくありません" });
const position = z.number().int().min(0).max(100_000);

/** 形式ごとの本文の長さの上限（blocks は JSON の文字列で `LIBRARY_BLOCKS_BODY_MAX`・design は `LIBRARY_DESIGN_BODY_MAX`） */
export function bodyFitsFormat(format: LibraryPageFormat, value: string): boolean {
  return value.length <= (format === "blocks" ? LIBRARY_BLOCKS_BODY_MAX : LIBRARY_DESIGN_BODY_MAX);
}

const EMOJI_RE =
  /^(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*(?:[\u{E0020}-\u{E007E}]+\u{E007F})?)$/u;
/** 絵文字 1 つか（1 つの書記素・32 字まで・国旗 / キーキャップ / 肌の色 / ZWJ で結んだ絵文字 / タグ付きの旗。英数字・記号だけ・制御文字は通さない） */
export function isSingleEmoji(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= 32 && EMOJI_RE.test(value);
}

const nodeIcon = z.string().refine(isSingleEmoji, { message: "アイコンは絵文字 1 つ" });
/**
 * 文書の本文を Markdown で受けるときの長さの上限（直したあとの blocks は blocks の上限で見る）。
 * library の pure の MARKDOWN_SOURCE_MAX（取り込みの解析の上限）と同じ値にする（schemas は modules を読めないので値で持つ）
 */
export const LIBRARY_MARKDOWN_INPUT_MAX = 100_000;
const markdown = z.string().max(LIBRARY_MARKDOWN_INPUT_MAX);

/** 置き場と事業所の組み合わせ（事業所は facilityId が要る・組織と個人は持たない）。個人の持ち主は呼んだ本人 */
function placementFits(v: { area: LibraryArea; facilityId?: string | null }): boolean {
  return v.area === "facility" ? typeof v.facilityId === "string" : v.facilityId == null;
}
const placementMessage = { message: "事業所の置き場は facilityId が必須、組織と個人は持たない", path: ["facilityId"] };

/** 見せる人 1 人と段 */
export const libraryNameInputSchema = z.object({
  userId: uuid,
  level: z.enum(libraryMemberLevelValues),
});
export type LibraryNameInput = z.infer<typeof libraryNameInputSchema>;

const names = z
  .array(libraryNameInputSchema)
  .max(LIBRARY_NAMES_MAX)
  .refine((rows) => new Set(rows.map((r) => r.userId)).size === rows.length, { message: "同じ人が 2 回あります" });

/**
 * 公開 / 非公開と見せる人。公開は見せる人を持たない。非公開の見せる人は省いてよい（持ち主とルートだけになる）。
 * 個人の置き場では受けない（core が個人を非公開に固定する）
 */
export const libraryVisibilityInputSchema = z.discriminatedUnion("visibility", [
  z.object({ visibility: z.literal("public") }),
  z.object({ visibility: z.literal("private"), names: names.default([]) }),
]);
export type LibraryVisibilityInput = z.infer<typeof libraryVisibilityInputSchema>;

export const createLibraryNodeSchema = z
  .object({
    area: z.enum(libraryAreaValues),
    facilityId: uuid.nullable().optional(),
    parentId: uuid.nullable().optional(),
    kind: z.enum(libraryNodeKindValues),
    title,
    position: position.optional(),
    visibility: libraryVisibilityInputSchema.optional(),
    format: z.enum(libraryPageFormatValues).optional(),
    body: body.optional(),
    /** 文書の本文を Markdown で（core が blocks に直して、ふつうの本文と同じ保存の道を通す）。body と一緒には渡さない */
    markdown: markdown.optional(),
  })
  .refine((v) => v.markdown === undefined || v.body === undefined, { message: "本文は body か markdown のどちらか", path: ["markdown"] })
  .refine(placementFits, placementMessage)
  .refine((v) => v.area !== "personal" || v.visibility === undefined, {
    message: "個人の置き場は公開 / 非公開を持たない",
    path: ["visibility"],
  })
  .refine(
    (v) =>
      v.kind === "page" ||
      (v.format === undefined && v.body === undefined && v.markdown === undefined),
    { message: "フォルダは本文・形式を持たない", path: ["kind"] },
  )
  .refine((v) => v.body === undefined || bodyFitsFormat(v.format ?? LIBRARY_DEFAULT_PAGE_FORMAT, v.body), {
    message: "本文が長すぎます",
    path: ["body"],
  });
export type CreateLibraryNodeInput = z.infer<typeof createLibraryNodeSchema>;

/** 名前・アイコン（null で外す）を変える（本文は `saveLibraryBodySchema`）。フォルダ・文書・デザインページのどれでも */
export const updateLibraryNodeSchema = z
  .object({
    title: title.optional(),
    icon: nodeIcon.nullable().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "変える項目がありません" });
export type UpdateLibraryNodeInput = z.infer<typeof updateLibraryNodeSchema>;

/**
 * 本文を保存する（保存したらすぐ反映）。`baseVersionNo` は必須で、ノードの今の版番号と違えば CONFLICT
 * （ほかの人の保存を黙って上書きしない）。保存のたびに版が 1 つ増える
 */
export const saveLibraryBodySchema = z
  .object({
    baseVersionNo: z.number().int().min(1),
    title: title.optional(),
    format: z.enum(libraryPageFormatValues).optional(),
    body: body.optional(),
    /** 文書の本文を Markdown で（作るときと同じ）。body と一緒には渡さない */
    markdown: markdown.optional(),
  })
  .refine((v) => v.markdown === undefined || v.body === undefined, { message: "本文は body か markdown のどちらか", path: ["markdown"] })
  .refine((v) => v.body === undefined || v.format === undefined || bodyFitsFormat(v.format, v.body), {
    message: "本文が長すぎます",
    path: ["body"],
  });
export type SaveLibraryBodyInput = z.infer<typeof saveLibraryBodySchema>;

/** 移す（同じ置き場の中だけ。親を変える・並べ替える。`parentId` が null なら置き場の根） */
export const moveLibraryNodeSchema = z.object({
  parentId: uuid.nullable(),
  position: position.optional(),
});
export type MoveLibraryNodeInput = z.infer<typeof moveLibraryNodeSchema>;

/**
 * 公開 / 非公開を切り替える（非公開の根だけ・個人は不可）。公開 → 非公開は作った人とルートだけで、切り替えた人が持ち主になる。
 * 非公開 → 公開で見せる人の行は消える
 */
export const setLibraryVisibilitySchema = libraryVisibilityInputSchema;
export type SetLibraryVisibilityInput = LibraryVisibilityInput;

/** 切り替える前に影響を見る（副作用なし）。入力は切り替えと同じ */
export const previewLibraryVisibilitySchema = libraryVisibilityInputSchema;
export type PreviewLibraryVisibilityInput = LibraryVisibilityInput;

/** 影響を受ける人（切り替えられる人〔作った人・持ち主・ルート〕にだけ返す） */
export type LibraryAffectedPerson = { userId: string; name: string };

/** 影響を受ける人の数と名前（名前は先頭から `LIBRARY_PREVIEW_PEOPLE_MAX` 人まで・`count` は全数） */
export type LibraryAffectedPeople = { count: number; people: LibraryAffectedPerson[] };

/** 確認の画面に名前を出す人数の上限（超えた分は「ほか n 人」） */
export const LIBRARY_PREVIEW_PEOPLE_MAX = 50;

/**
 * 切り替えの影響（置き場の対象の人のうち。ルートは数えない）:
 * - `losing` … 中に入れなくなる人（名前だけは見える）
 * - `gaining` … 中に入れるようになる人
 * - `absorbedRoots` … 公開のフォルダを非公開にするとき、中にある非公開の根で、新しい根に吸収されて名簿が消えるものの数
 * - `absorbedNames` … その吸収で消える名簿の行の数
 */
export type LibraryVisibilityPreview = {
  losing: LibraryAffectedPeople;
  gaining: LibraryAffectedPeople;
  absorbedRoots: number;
  absorbedNames: number;
};

/** 見せる人を全部置き換える（非公開の根だけ・持ち主とルート） */
export const setLibraryNamesSchema = z.object({ names });
export type SetLibraryNamesInput = z.infer<typeof setLibraryNamesSchema>;

/**
 * 見せる人の 1 行（名簿を取る口の戻り。持ち主とルートにだけ返す）。
 * `effective` … いまその置き場の対象に所属しているか（外れている間は効かない・行は残す）
 */
export type LibraryNameEntry = {
  userId: string;
  name: string;
  level: LibraryMemberLevel;
  effective: boolean;
};

/** 名簿を取る口の戻り（持ち主は名簿の外。持ち主の名前は返さない） */
export type LibraryNames = {
  names: LibraryNameEntry[];
  /** 自分が持ち主か */
  isOwner: boolean;
};

/** 複製の元（組織・事業所・個人のノード / 公式のノード）。フォルダは中ごと写す */
export const libraryCopySourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("node"), id: uuid }),
  z.object({ kind: z.literal("official"), id: uuid }),
]);
export type LibraryCopySource = z.infer<typeof libraryCopySourceSchema>;

/**
 * 複製する（読めるものを、自分が作れる所へ）。個人から事業所へのドラッグ & ドロップもこの口。
 * 先が組織・事業所なら公開か非公開を選ぶ（非公開の親の下は親に従うので、公開を渡すと core が断る）。先が個人なら渡さない。
 * 画像も写す。写したノードは元と独立する（出所を持たない）
 */
export const copyLibraryNodeSchema = z
  .object({
    source: libraryCopySourceSchema,
    target: z
      .object({
        area: z.enum(libraryAreaValues),
        facilityId: uuid.nullable().optional(),
        parentId: uuid.nullable().optional(),
        position: position.optional(),
      })
      .refine(placementFits, placementMessage),
    visibility: libraryVisibilityInputSchema.optional(),
  })
  .refine((v) => (v.target.area === "personal" ? v.visibility === undefined : v.visibility !== undefined), {
    message: "先が組織・事業所なら公開か非公開を選ぶ（個人は渡さない）",
    path: ["visibility"],
  });
export type CopyLibraryNodeInput = z.infer<typeof copyLibraryNodeSchema>;

/**
 * デザインページの一部を直す（old → new の置き換え・1 か所だけ）。`oldString` が本文にちょうど 1 回だけ現れるときだけ通す
 * （0 回・2 回以上は INVALID_INPUT。AI が大きな HTML を毎回出し直さずに済む）。置き換えたあとの本文は丸ごと検査し直す。
 * `baseVersionNo` は保存と同じ楽観ロック（違えば CONFLICT）
 */
export const editLibraryDesignSchema = z.object({
  baseVersionNo: z.number().int().min(1),
  oldString: z.string().min(1).max(LIBRARY_DESIGN_BODY_MAX),
  newString: z.string().max(LIBRARY_DESIGN_BODY_MAX),
});
export type EditLibraryDesignInput = z.infer<typeof editLibraryDesignSchema>;

/** デザインページの検査だけ（保存しない）。保存の前に、落とされるもの・警告・大きさを確かめる */
export const previewLibraryDesignSchema = z.object({
  body: z.string().max(LIBRARY_BLOCKS_BODY_MAX),
});
export type PreviewLibraryDesignInput = z.infer<typeof previewLibraryDesignSchema>;

/**
 * ノードを読むときの形（`as`）。module の口で省くと本文そのまま（画面）。REST（AI・MCP・SDK）は省くと markdown。
 * - markdown … 文書（blocks）を Markdown で（デザインページは検査済みの HTML のまま）
 * - raw … 保存の形そのまま（blocks は JSON・design は検査済みの HTML）
 * - html / text / outline … HTML・検索用の文字・見出しの並び
 */
export const libraryNodeReadAsValues = ["markdown", "raw", "html", "text", "outline"] as const;
export type LibraryNodeReadAs = (typeof libraryNodeReadAsValues)[number];
export const getLibraryNodeQuerySchema = z.object({
  as: z.enum(libraryNodeReadAsValues).optional(),
});
export type GetLibraryNodeQuery = z.infer<typeof getLibraryNodeQuerySchema>;

/**
 * 版を 1 つ戻す / 進む（取り消し / やり直し）。持っている版（直近 `LIBRARY_VERSIONS_KEPT` 件）の中で、いま出ている版の位置を動かし、
 * その版の本文と形式をページの本文にする（版の行は作らない）。戻した位置から保存すると、それより新しい版は消える。
 * 題名・アイコン・公開 / 非公開・置き場所は変わらない。`baseVersionNo` は保存と同じ楽観ロック
 */
export const libraryVersionStepValues = ["back", "forward"] as const;
export type LibraryVersionStep = (typeof libraryVersionStepValues)[number];
export const stepLibraryVersionSchema = z.object({
  direction: z.enum(libraryVersionStepValues),
  baseVersionNo: z.number().int().min(1),
});
export type StepLibraryVersionInput = z.infer<typeof stepLibraryVersionSchema>;

/** 木を取る（置き場ごと） */
export const getLibraryTreeSchema = z
  .object({
    area: z.enum(libraryAreaValues),
    facilityId: uuid.nullable().optional(),
  })
  .refine(placementFits, placementMessage);
export type GetLibraryTreeInput = z.infer<typeof getLibraryTreeSchema>;

/**
 * 中に入れるノード（本文は含めない・`LibraryNodeWithBody`）。持ち主・作った人・更新した人の id は返さない
 * （持ち主の判定の結果は `levelOf` の段で返す）
 */
export type LibraryNode = {
  id: string;
  kind: LibraryNodeKind;
  area: LibraryArea;
  facilityId: string | null;
  parentId: string | null;
  position: number;
  title: string;
  /** 一覧の印（null は種類の印） */
  icon: string | null;
  visibility: LibraryVisibility;
  /** 非公開の根（自分を含む祖先で最も近い非公開）。公開・個人は null */
  accessRootId: string | null;
  /** ページだけ。フォルダは null */
  format: LibraryPageFormat | null;
  /** 保存のときに `baseVersionNo` として返す */
  versionNo: number;
  updatedAt: string;
};

/** 本文つきのノード（読める人だけ） */
export type LibraryNodeWithBody = LibraryNode & { body: string };

/**
 * 自分がこのノードでできること（画面の出し分け。止めるのは口のゲート）。
 * `setVisibility` は今と逆へ切り替えられるか（公開 → 非公開は作った人とルート・非公開 → 公開は持ち主とルート・非公開の根だけ）
 */
export type LibraryNodeCapabilities = {
  edit: boolean;
  /** 中に作れるか（フォルダだけ） */
  createChild: boolean;
  delete: boolean;
  setVisibility: boolean;
  /** 見せる人を見る・決める（非公開の根の持ち主とルート） */
  manageNames: boolean;
  /** 複製の元にできるか */
  copy: boolean;
};

/** 1 件を開いたときの形（本文・できること・非公開の根の題名〔中の子のとき「〇〇に従う」に使う〕） */
export type LibraryNodeView = LibraryNodeWithBody & {
  capabilities: LibraryNodeCapabilities;
  /** 非公開の根の題名（自分が根なら自分の題名）。公開・個人は null */
  accessRootTitle: string | null;
  /** 見せる人の数（非公開の根の持ち主とルートにだけ・ほかは null） */
  namesCount: number | null;
  createdByName: string | null;
  /** design の本文が今の検査の規則で描けるか（通らない旧い行は false で本文は空。blocks・フォルダは true） */
  designRenderable: boolean;
  /** 版を 1 つ戻せるか / 進めるか（持っている版の中で。フォルダは両方 false） */
  canBack: boolean;
  canForward: boolean;
  organizationName: string | null;
};

/**
 * 名前だけ見える非公開の根（中に入れない人に出す）。子の数・更新日・作成者・持ち主・名簿の人数・本文は返さない。
 * 個人の置き場・置き場の対象外の人には出さない。検索にも出さない
 */
export type OutlineNode = {
  id: string;
  kind: LibraryNodeKind;
  area: LibraryArea;
  facilityId: string | null;
  parentId: string | null;
  position: number;
  title: string;
  icon: string | null;
  locked: true;
};

/** 木の応答（入れるノードと、名前だけのノード） */
export type LibraryTree = {
  readable: LibraryNode[];
  locked: OutlineNode[];
};

/**
 * デザインページの検査の報告の 1 行。`code` は機械が読む印（落としたもの: `element`・`external_font`・`css_property` など /
 * 気をつけること: `no_dark_mode`・`px_font_size` など。値の SoT は library の pure の sanitize-design・design-text）。
 * `name` は検査器が持つ固定の語（`script`・`@import` など）だけで、入力の文字は映さない
 */
export type LibraryDesignReportItem = { code: string; count: number; name?: string };

/** デザインページの検査の報告（落としたもの・気をつけること） */
export type LibraryDesignReport = {
  /** 落としたもの（保存の前に直すと良いもの） */
  removed: LibraryDesignReportItem[];
  /** 落とさないが気をつけること（動き・大きさ など） */
  warnings: LibraryDesignReportItem[];
};

/** デザインページの検査の結果（preview の戻り・保存の前に AI と人が見る） */
export type LibraryDesignPreview = LibraryDesignReport & {
  /** 検査したあとの本文（保存されるのはこの形） */
  body: string;
  /** 検査したあとの長さ（字） */
  length: number;
};

/** 作る・本文の保存・部分の直しの戻り。design のときは検査の報告が付く（blocks は null） */
export type LibraryNodeSaved = LibraryNode & { report: LibraryDesignReport | null };

/** 公開のフォルダを消せないとき（中にほかの人の非公開がある）の件数 */
export type LibraryDeleteBlocked = { othersPrivateInside: number };

/** 自分が見られる置き場と、書けるか（左の帯の区分と「作る」の出し分け）。公式は別の口 */
export type LibraryMyAccess = {
  areas: {
    area: LibraryArea;
    /** 事業所の置き場だけ */
    facilityId: string | null;
    /** 見出し（組織 / 事業所の名前 / 個人） */
    title: string;
    /** 作れるか（library:write と置き場。組織は今は常に false） */
    canWrite: boolean;
  }[];
  isRoot: boolean;
};

/** 画像（ページに属する） */
export type LibraryAsset = {
  id: string;
  mime: LibraryAssetMime;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

/** 画像を見る署名 URL（短い期限） */
export type LibraryAssetUrl = { url: string; expiresAt: string };

/** 公式のノード（組織を持たない・公開 / 非公開と版を持たない） */
export type LibraryOfficialNode = Omit<LibraryNode, "area" | "facilityId" | "visibility" | "accessRootId" | "versionNo"> & {
  helpKey: string | null;
};
export type LibraryOfficialNodeWithBody = LibraryOfficialNode & { body: string };

/** 公式の木 */
export type LibraryOfficialTree = { nodes: LibraryOfficialNode[] };

/** ヘルプキー → 開く先 */
export type LibraryHelpTarget = { title: string; url: string };

/** 全文検索の文字の長さ・件数の上限 */
export const LIBRARY_SEARCH_QUERY_MAX = 100;
export const LIBRARY_SEARCH_LIMIT_MAX = 50;
export const LIBRARY_SEARCH_LIMIT_DEFAULT = 20;

/** 探す（名前と本文。中に入れるノードだけ。名前だけ見える非公開は出さない） */
export const searchLibraryNodesSchema = z
  .object({
    q: z.string().trim().min(1).max(LIBRARY_SEARCH_QUERY_MAX),
    area: z.enum(libraryAreaValues).optional(),
    facilityId: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(LIBRARY_SEARCH_LIMIT_MAX).default(LIBRARY_SEARCH_LIMIT_DEFAULT),
  })
  .refine((v) => v.facilityId === undefined || v.area === "facility", {
    message: "facilityId は事業所の置き場だけ",
    path: ["facilityId"],
  });
export type SearchLibraryNodesInput = z.infer<typeof searchLibraryNodesSchema>;

/** 検索の 1 件。`snippet` は本文の当たった前後（名前だけ当たったときは本文の頭） */
/** 検索の 1 件（共通の項目） */
type LibrarySearchHitBase = {
  id: string;
  kind: LibraryNodeKind;
  /** ページの形式（文書とデザインページの印を分ける）。フォルダは null */
  format: LibraryPageFormat | null;
  title: string;
  icon: string | null;
  snippet: string;
  updatedAt: string;
};
/**
 * 検索の 1 件。`official` で分ける: false は組織・事業所・個人のノード（置き場つき）、true は公式（全組織で共通・置き場を持たない）。
 * 置き場の種類に "official" は足さない（area を見る所が 4 つ目を扱うことになる）
 */
export type LibrarySearchHit =
  | (LibrarySearchHitBase & { official: false; area: LibraryArea; facilityId: string | null })
  | (LibrarySearchHitBase & { official: true; area: null; facilityId: null });

/** ライブラリの画像の MIME（SVG は入れない） */
export const LIBRARY_ASSET_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type LibraryAssetMime = (typeof LIBRARY_ASSET_ALLOWED_MIME)[number];
/** 1 ファイルの上限: 10MB */
export const LIBRARY_ASSET_MAX_BYTES = 10 * 1024 * 1024;
export const LIBRARY_ASSET_MAX_PER_PAGE = 200;

/** 本文中の内部参照（`qaito-asset:{id}`）のプロトコル */
export const LIBRARY_ASSET_SRC_PREFIX = "qaito-asset:";

/**
 * 画像の取り込み（ページに属する。置き先のページは口のパス）。実体は staging（用途 `library_asset`）に置いたもので、
 * MIME・サイズ・マジックバイトは取り込むときに実体に対して確かめる（`@qaito/schemas/upload`）
 */
export const uploadLibraryAssetSchema = z.object({
  stagedId: uuid,
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});
export type UploadLibraryAssetInput = z.infer<typeof uploadLibraryAssetSchema>;

/** 公式の画像の取り込み（Platform Admin）。置き先の公式のページを指定する */
export const uploadLibraryOfficialAssetSchema = uploadLibraryAssetSchema.extend({ officialNodeId: uuid });
export type UploadLibraryOfficialAssetInput = z.infer<typeof uploadLibraryOfficialAssetSchema>;

/** 公式の本文（形式は組織のページと同じ 2 つ。長さの上限も同じ `bodyFitsFormat`） */
const officialBody = z.string().max(LIBRARY_BLOCKS_BODY_MAX);

export const createLibraryOfficialNodeSchema = z
  .object({
    parentId: uuid.nullable().optional(),
    kind: z.enum(libraryNodeKindValues),
    title,
    icon: nodeIcon.nullable().optional(),
    format: z.enum(libraryOfficialPageFormatValues).optional(),
    body: officialBody.optional(),
    helpKey: helpKey.nullable().optional(),
    position: position.optional(),
  })
  .refine((v) => v.kind === "page" || (v.format === undefined && v.body === undefined && v.helpKey == null), {
    message: "フォルダは本文・形式・help_key を持たない",
    path: ["kind"],
  });
export type CreateLibraryOfficialNodeInput = z.infer<typeof createLibraryOfficialNodeSchema>;

/** 公式のノードを直す（保存したらすぐ反映） */
export const updateLibraryOfficialNodeSchema = z
  .object({
    title: title.optional(),
    icon: nodeIcon.nullable().optional(),
    format: z.enum(libraryOfficialPageFormatValues).optional(),
    body: officialBody.optional(),
    helpKey: helpKey.nullable().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "変える項目がありません" });
export type UpdateLibraryOfficialNodeInput = z.infer<typeof updateLibraryOfficialNodeSchema>;

export const moveLibraryOfficialNodeSchema = moveLibraryNodeSchema;
export type MoveLibraryOfficialNodeInput = MoveLibraryNodeInput;
