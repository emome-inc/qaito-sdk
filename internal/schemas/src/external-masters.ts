import { z } from "zod";
import { normalizeKanaName } from "./kana";
import { partialForUpdate } from "./partial-for-update";
import { PHONE_LOOKUP_MAX_NUMBERS } from "./phone";

export const EXTERNAL_MASTER_NAME_MAX = 200;
export const EXTERNAL_MASTER_KANA_MAX = 200;
export const EXTERNAL_MASTER_PHONE_MAX = 40;
export const EXTERNAL_MASTER_EMAIL_MAX = 254;
export const EXTERNAL_MASTER_ADDRESS_MAX = 300;
export const EXTERNAL_MASTER_MEMO_MAX = 2000;
export const CONTACT_PARTY_PHONES_MAX = 10;
const SHORT_MAX = 100;

/** 任意の文字列（前後の空白を落とす）。空文字・null は「消す」（core が null にそろえる）。 */
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
/** ふりがな（カタカナにそろえる）。 */
const optionalKana = z.string().max(EXTERNAL_MASTER_KANA_MAX).transform(normalizeKanaName).nullable().optional();
const requiredName = z.string().trim().min(1, "名称は必須です").max(EXTERNAL_MASTER_NAME_MAX);
const optionalEmail = z
  .union([z.literal(""), z.string().trim().max(EXTERNAL_MASTER_EMAIL_MAX).email()])
  .nullable()
  .optional();
const optionalUuid = z.string().uuid().nullable().optional();

/** 住所（4 項目に分けて持つ。都道府県・市区町村・それ以降）。 */
const addressFields = {
  postalCode: optionalText(10),
  prefecture: optionalText(10),
  city: optionalText(SHORT_MAX),
  addressLine: optionalText(EXTERNAL_MASTER_ADDRESS_MAX),
};

/** 一覧の共通の検索条件。`q` は名称・ふりがな・電話番号の部分一致。 */
const listBase = {
  q: z.string().trim().max(EXTERNAL_MASTER_NAME_MAX).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
};

/** 重複の統合（E6）。統合する側（パスの id）を論理削除し、`intoId` を行き先に記録する。 */
export const mergeExternalMasterSchema = z.object({
  intoId: z.string().uuid(),
});

/**
 * 電話番号の逆引き（`findPartiesByPhone`）。REST / ツールは `?numbers=` のカンマ区切りで送る。
 * そろえられない番号（市外局番なし等）は黙って外す（0 件になるだけ）。
 */
export const phoneLookupQuerySchema = z.object({
  numbers: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter((s) => s !== "") : v),
    z.array(z.string().trim().min(1).max(EXTERNAL_MASTER_PHONE_MAX)).min(1).max(PHONE_LOOKUP_MAX_NUMBERS),
  ),
});

export const PHONE_PARTY_KINDS = [
  "medical_institution",
  "care_office",
  "care_manager",
  "contact_party",
  "client",
  "client_family",
  "staff",
  "staff_emergency_contact",
  "facility",
  "company",
] as const;
export type PhonePartyKind = (typeof PHONE_PARTY_KINDS)[number];
export type PhonePartyMatch = {
  readonly kind: PhonePartyKind;
  readonly id: string;
  readonly name: string;
  /** 当たった番号（E.164） */
  readonly phoneE164: string;
};

/** POST /medical-institution/institutions */
export const createMedicalInstitutionMasterSchema = z.object({
  name: requiredName,
  ...addressFields,
  phone: optionalText(EXTERNAL_MASTER_PHONE_MAX),
  fax: optionalText(EXTERNAL_MASTER_PHONE_MAX),
  /** 厚労省の医療機関コード（任意・組織の中で重ならない） */
  institutionCode: optionalText(20),
  medicalDepartment: optionalText(SHORT_MAX),
  memo: optionalText(EXTERNAL_MASTER_MEMO_MAX),
});

/** PATCH /medical-institution/institutions/:id */
export const updateMedicalInstitutionMasterSchema = partialForUpdate(createMedicalInstitutionMasterSchema);

/** GET /medical-institution/institutions */
export const listMedicalInstitutionMastersQuerySchema = z.object({ ...listBase });

export const careOfficeKindValues = ["kyotaku", "houkatsu"] as const;
export type CareOfficeKind = (typeof careOfficeKindValues)[number];
export const careOfficeKindOptions = [
  { value: "kyotaku", label: "居宅介護支援事業所" },
  { value: "houkatsu", label: "地域包括支援センター" },
] as const;

/** POST /care-office/offices */
export const createCareOfficeSchema = z.object({
  name: requiredName,
  nameKana: optionalKana,
  /** 事業所番号（10 桁の数字・任意） */
  officeNumber: z
    .union([z.literal(""), z.string().trim().regex(/^[0-9]{10}$/, "事業所番号は 10 桁の数字です")])
    .nullable()
    .optional(),
  /** 事業所の種類（省くと居宅介護支援事業所） */
  officeKind: z.enum(careOfficeKindValues).optional(),
  ...addressFields,
  phone: optionalText(EXTERNAL_MASTER_PHONE_MAX),
  fax: optionalText(EXTERNAL_MASTER_PHONE_MAX),
  memo: optionalText(EXTERNAL_MASTER_MEMO_MAX),
});

/** PATCH /care-office/offices/:id */
export const updateCareOfficeSchema = partialForUpdate(createCareOfficeSchema);

/** GET /care-office/offices（`officeKind` で種類に絞る） */
export const listCareOfficesQuerySchema = z.object({ ...listBase, officeKind: z.enum(careOfficeKindValues).optional() });

/** POST /care-office/managers */
export const createCareOfficeManagerSchema = z.object({
  /** 所属先（任意・E2）。同じ組織の削除していない事業所だけ */
  careOfficeId: optionalUuid,
  name: requiredName,
  nameKana: optionalKana,
  /** 介護支援専門員番号（8 桁の数字・任意。給付管理票の作成区分 1 のときに要る） */
  cmNumber: z
    .union([z.literal(""), z.string().trim().regex(/^[0-9]{8}$/, "介護支援専門員番号は 8 桁の数字です")])
    .nullable()
    .optional(),
  phone: optionalText(EXTERNAL_MASTER_PHONE_MAX),
  email: optionalEmail,
  isActive: z.boolean().default(true),
  memo: optionalText(EXTERNAL_MASTER_MEMO_MAX),
});

/** PATCH /care-office/managers/:id */
export const updateCareOfficeManagerSchema = partialForUpdate(createCareOfficeManagerSchema);

/** GET /care-office/managers（`careOfficeId` で所属先に絞る・`includeInactive` で担当外も出す） */
export const listCareOfficeManagersQuerySchema = z.object({
  ...listBase,
  careOfficeId: z.string().uuid().optional(),
  includeInactive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .optional(),
});

/** 法人・団体か、人か（E1: 人は法人・団体の下に 1 段だけ置ける）。 */
export const CONTACT_PARTY_KINDS = ["organization", "person"] as const;
export type ContactPartyKind = (typeof CONTACT_PARTY_KINDS)[number];

/** 種別（E4: 固定の列挙 + other。絞り込みにだけ使い、権限にも分岐にも使わない）。 */
export const CONTACT_PARTY_CATEGORIES = [
  "vendor",
  "government",
  "care_support",
  "volunteer",
  "neighbor",
  "applicant",
  "other",
] as const;
export type ContactPartyCategory = (typeof CONTACT_PARTY_CATEGORIES)[number];

/** 種別の表示名（画面・ツールの説明で使う）。 */
export const CONTACT_PARTY_CATEGORY_LABELS: Readonly<Record<ContactPartyCategory, string>> = {
  vendor: "取引先",
  government: "役所・公的機関",
  care_support: "介護・福祉の関係機関",
  volunteer: "ボランティア",
  neighbor: "地域の人",
  applicant: "求人の応募者",
  other: "その他",
};

export const CONTACT_PARTY_KIND_LABELS: Readonly<Record<ContactPartyKind, string>> = {
  organization: "法人・団体",
  person: "人",
};

/** 関係先の電話番号 1 件（代表・直通・携帯 …）。 */
export const contactPartyPhoneInputSchema = z.object({
  label: optionalText(30),
  phone: z.string().trim().min(1, "電話番号を入れてください").max(EXTERNAL_MASTER_PHONE_MAX),
  isPrimary: z.boolean().optional(),
});

/** POST /contact/parties */
export const createContactPartySchema = z.object({
  kind: z.enum(CONTACT_PARTY_KINDS),
  /** 所属先（kind=person のときだけ・法人・団体の関係先を指す） */
  parentId: optionalUuid,
  name: requiredName,
  nameKana: optionalKana,
  department: optionalText(SHORT_MAX),
  title: optionalText(SHORT_MAX),
  category: z.enum(CONTACT_PARTY_CATEGORIES).default("other"),
  email: optionalEmail,
  ...addressFields,
  memo: optionalText(EXTERNAL_MASTER_MEMO_MAX),
  /** 電話番号（送ったときは全件を置き換える） */
  phones: z.array(contactPartyPhoneInputSchema).max(CONTACT_PARTY_PHONES_MAX).optional(),
});

/** PATCH /contact/parties/:id（`kind` は変えられない） */
export const updateContactPartySchema = partialForUpdate(createContactPartySchema.omit({ kind: true }));

/** GET /contact/parties */
export const listContactPartiesQuerySchema = z.object({
  ...listBase,
  kind: z.enum(CONTACT_PARTY_KINDS).optional(),
  category: z.enum(CONTACT_PARTY_CATEGORIES).optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateMedicalInstitutionMasterInput = z.input<typeof createMedicalInstitutionMasterSchema>;
export type CreateCareOfficeInput = z.input<typeof createCareOfficeSchema>;
export type CreateCareOfficeManagerInput = z.input<typeof createCareOfficeManagerSchema>;
export type CreateContactPartyInput = z.input<typeof createContactPartySchema>;

/**
 * 1 回の取込の上限。CSV の本文はブラウザで文字に直して送る（ファイルは保存しない）。
 * `dryRun: true`（既定）は下見で、何も書かない。`false` はエラーの行が無いときだけ新規の行を登録する。
 */
export const EXTERNAL_MASTER_IMPORT_MAX_ROWS = 1000;
export const EXTERNAL_MASTER_IMPORT_MAX_CHARS = 2_000_000;

/** POST /care-office/offices/import ・ /care-office/managers/import ・ /medical-institution/institutions/import */
export const externalMasterImportSchema = z.object({
  csv: z.string().min(1).max(EXTERNAL_MASTER_IMPORT_MAX_CHARS),
  dryRun: z.boolean().default(true),
});
export type ExternalMasterImportInput = z.input<typeof externalMasterImportSchema>;

/** テンプレートの列（見出しで読むので並び順は問わない）。`example` はテンプレートの例の行に入れる架空の値 */
export type ExternalMasterImportColumn = { readonly header: string; readonly key: string; readonly required?: boolean; readonly example: string };

const addressColumns = [
  { header: "郵便番号", key: "postalCode", example: "100-0005" },
  { header: "都道府県", key: "prefecture", example: "東京都" },
  { header: "市区町村", key: "city", example: "千代田区" },
  { header: "番地", key: "addressLine", example: "丸の内9-9-9" },
] as const;

export const CARE_OFFICE_IMPORT_COLUMNS: readonly ExternalMasterImportColumn[] = [
  { header: "事業所名", key: "name", required: true, example: "テスト居宅介護支援事業所" },
  { header: "ふりがな", key: "nameKana", example: "テストキョタクカイゴシエンジギョウショ" },
  { header: "事業所番号", key: "officeNumber", example: "1300000000" },
  { header: "種類", key: "officeKind", example: "居宅介護支援事業所" },
  ...addressColumns,
  { header: "電話番号", key: "phone", example: "03-0000-0000" },
  { header: "FAX", key: "fax", example: "03-0000-0001" },
  { header: "メモ", key: "memo", example: "" },
];

export const CARE_MANAGER_IMPORT_COLUMNS: readonly ExternalMasterImportColumn[] = [
  { header: "氏名", key: "name", required: true, example: "介護 花子" },
  { header: "ふりがな", key: "nameKana", example: "カイゴ ハナコ" },
  { header: "所属の事業所番号", key: "officeNumber", example: "1300000000" },
  { header: "所属の事業所名", key: "officeName", example: "テスト居宅介護支援事業所" },
  { header: "介護支援専門員番号", key: "cmNumber", example: "" },
  { header: "電話番号", key: "phone", example: "03-0000-0000" },
  { header: "メールアドレス", key: "email", example: "" },
  { header: "メモ", key: "memo", example: "" },
];

export const MEDICAL_INSTITUTION_IMPORT_COLUMNS: readonly ExternalMasterImportColumn[] = [
  { header: "名称", key: "name", required: true, example: "テストクリニック" },
  ...addressColumns,
  { header: "電話番号", key: "phone", example: "03-0000-0002" },
  { header: "FAX", key: "fax", example: "" },
  { header: "医療機関コード", key: "institutionCode", example: "" },
  { header: "診療科", key: "medicalDepartment", example: "内科" },
  { header: "メモ", key: "memo", example: "" },
];

/** 行の結果。`new` = 新規（取り込むと登録する）/ `exists` = 登録済み（取り込まない）/ `error` = 直す必要がある */
export type ExternalMasterImportRowStatus = "new" | "exists" | "error";
export type ExternalMasterImportRow = {
  /** CSV の行番号（見出しが 1 行目） */
  readonly line: number;
  readonly name: string;
  readonly status: ExternalMasterImportRowStatus;
  /** 登録済みの行（`exists`）・登録した行（取り込んだ `new`）の id */
  readonly id: string | null;
  /** 直す箇所（列の見出しと理由）。値そのものは返さない */
  readonly errors: readonly { readonly column: string; readonly message: string }[];
};
export type ExternalMasterImportResult = {
  /** 書き込んだか（下見・エラーで止めたときは false） */
  readonly committed: boolean;
  /** ファイル全体の問題（見出しが無い・行が多すぎる 等）。あるときは rows は空 */
  readonly fileError: string | null;
  readonly rows: readonly ExternalMasterImportRow[];
  readonly counts: { readonly new: number; readonly exists: number; readonly error: number };
  /** 登録した件数（`committed` のとき） */
  readonly created: number;
};
