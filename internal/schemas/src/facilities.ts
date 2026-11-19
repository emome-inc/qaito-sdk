import { z } from "zod";
import { serviceTypeCodeOptions } from "./shared-options";
import { normalizeKanaNameOrNull } from "./kana";

export const serviceTypeLabelToCode: Record<string, string> = Object.fromEntries(
  serviceTypeCodeOptions.map((o) => [o.label, o.value]),
);

export const serviceTypeCodeToLabel: Record<string, string> = Object.fromEntries(
  serviceTypeCodeOptions.map((o) => [o.value, o.label]),
);

/**
 * フォーム送信値（日本語ラベル または 2 桁コード）を DB の service_type_code に変換する。
 * - 2 桁以下の文字列はコードとみなしてそのまま返す
 * - 日本語ラベルはコードに変換する
 * - 変換不能（未知のラベル/コード）は null を返す（呼び出し側で 400 を返すこと）
 */
export function toServiceTypeCode(value: string): string | null {
  if (!value) return null;
  if (value.length <= 2) {
    const known = serviceTypeCodeOptions.find((o) => o.value === value);
    return known ? value : null;
  }
  return serviceTypeLabelToCode[value] ?? null;
}

/**
 * DB の service_type_code（2 桁コード）を表示用ラベルに変換する。
 * 未知コードはコードをそのまま返す（表示崩れを防ぐ）。
 */
export function fromServiceTypeCode(code: string | null): string {
  if (!code) return "";
  return serviceTypeCodeToLabel[code] ?? code;
}

export const serviceTypeOptions = serviceTypeCodeOptions.map((o) => ({
  value: o.value,
  label: o.label,
}));

export const serviceTypes = serviceTypeCodeOptions.map((o) => o.label) as unknown as readonly string[];

export const OFFICE_NUMBER_MESSAGE = "事業所番号は 10 桁の数字で入力してください";
export const SERVICE_TYPE_CODE_MESSAGE = "サービス種別が不正です";

export const officeNumberFieldSchema = z
  .string()
  .transform((v) => {
    const cleaned = v
      .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/[\s\-‐−–－ー]/g, "");
    return cleaned === "" ? null : cleaned;
  })
  .refine((v) => v === null || /^[0-9]{10}$/.test(v), {
    message: OFFICE_NUMBER_MESSAGE,
  });

export const serviceTypeCodeFieldSchema = z
  .string()
  .refine((v) => v.trim() === "" || toServiceTypeCode(v.trim()) !== null, {
    message: SERVICE_TYPE_CODE_MESSAGE,
  })
  .transform((v) => {
    const t = v.trim();
    return t === "" ? null : toServiceTypeCode(t);
  });

export const createFacilitySchema = z.object({
  office_number: officeNumberFieldSchema.optional(),
  name: z.string().min(1, "事業所名は必須です"),
  name_kana: z.string().optional(),
  service_type_code: z.string().optional(),
  service_category: z.string().optional(),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address_line: z.string().optional(),
  latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]).optional(),
  longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]).optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  memo: z.string().optional(),
  company_id: z.string().uuid().optional(),
});

export const updateFacilitySchema = createFacilitySchema.partial();

/** ミラー行のうち取込に使う項目（contracts/facility.master.json の response_fields 部分集合）。 */
export type EefulFacilityMasterFields = {
  id: number;
  facility_code: string | null;
  facility_name: string | null;
  facility_kana: string | null;
  service_type: string | null;
  prefecture_name: string | null;
  city_name: string | null;
  address: string | null;
  address_detail: string | null;
  phone_number: string | null;
  fax_number: string | null;
  max_capacity: string | null;
};

/** 取込で facility.facilities に流し込む値（キーは Web フォームの input name = snake_case）。 */
export type FacilityAutofillFields = {
  name: string;
  name_kana: string | null;
  /** 10 桁の事業所番号のみ採用（facility.facilities の CHECK 制約 facilities_office_number_10digit） */
  office_number: string | null;
  service_category: "kaigo_hoken";
  /** 和文サービス種別名から 2 桁コードに解決できた場合のみ（未知は null） */
  service_type_code: string | null;
  prefecture: string | null;
  city: string | null;
  /** address から都道府県・市区町村の接頭辞を除いた番地以降（+ address_detail） */
  address_line: string | null;
  phone: string | null;
  fax: string | null;
  /** 「32」「10人」→ 数値。EEFUL 側の 0 / 空 は「不明」として null */
  capacity: number | null;
  eeful_facility_id: number;
};

function cleanValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  if (t === "" || t === "NULL" || t === "null") return null;
  return t;
}

/** 先頭が prefix と一致する場合だけ取り除く（重複した住所表記の圧縮）。 */
function stripPrefix(value: string, prefix: string | null): string {
  if (!prefix) return value;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function parseCapacity(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0 || n > 32767) return null;
  return n;
}

export function mapEefulMasterToFacilityFields(
  master: EefulFacilityMasterFields,
): FacilityAutofillFields {
  const prefecture = cleanValue(master.prefecture_name);
  const city = cleanValue(master.city_name);

  const rawAddress = cleanValue(master.address) ?? "";
  const withoutPref = stripPrefix(rawAddress, prefecture);
  const withoutCity = stripPrefix(withoutPref, city).trim();
  const detail = cleanValue(master.address_detail) ?? "";
  const addressLine = [withoutCity, detail].filter(Boolean).join(" ").trim();

  const code = cleanValue(master.facility_code) ?? "";
  const serviceType = cleanValue(master.service_type);

  return {
    name: cleanValue(master.facility_name) ?? "",
    name_kana: normalizeKanaNameOrNull(cleanValue(master.facility_kana)),
    office_number: /^[0-9]{10}$/.test(code) ? code : null,
    service_category: "kaigo_hoken",
    service_type_code: serviceType ? toServiceTypeCode(serviceType) : null,
    prefecture,
    city,
    address_line: addressLine || null,
    phone: cleanValue(master.phone_number),
    fax: cleanValue(master.fax_number),
    capacity: parseCapacity(cleanValue(master.max_capacity)),
    eeful_facility_id: master.id,
  };
}

export const EEFUL_OVERLAY_FIELDS = [
  "facility_name",
  "facility_kana",
  "service_type",
  "prefecture_name",
  "city_name",
  "address",
  "address_detail",
  "phone_number",
  "fax_number",
  "operator_name",
  "available_days",
  "available_days_detail",
  "max_capacity",
  "url",
  "latitude",
  "longitude",
] as const;

export type EefulOverlayField = (typeof EEFUL_OVERLAY_FIELDS)[number];

/** 上書き可能な列のうち数値型のもの（それ以外は text）。 */
export const EEFUL_OVERLAY_NUMERIC_FIELDS = ["latitude", "longitude"] as const;

/** 画面の入力ラベル（バリアフリーUI の Field label）。内部用語（EEFUL/overlay）を出さない。 */
export const EEFUL_OVERLAY_FIELD_LABELS: Record<EefulOverlayField, string> = {
  facility_name: "事業所名",
  facility_kana: "事業所名カナ",
  service_type: "サービス種別",
  prefecture_name: "都道府県",
  city_name: "市区町村",
  address: "住所",
  address_detail: "建物名・部屋番号",
  phone_number: "電話番号",
  fax_number: "FAX番号",
  operator_name: "運営法人",
  available_days: "営業日",
  available_days_detail: "営業日の補足",
  max_capacity: "定員",
  url: "ホームページ",
  latitude: "緯度",
  longitude: "経度",
};

/**
 * 補正の保存入力。
 *
 * **空文字は「上書き解除」**（= その列を NULL に戻して全国データの値に戻す）。
 * 未指定（キー無し）も同じく上書きなしとして扱う。
 */
export const eefulOverlayUpsertSchema = z.object({
  eeful_facility_id: z.coerce.number().int().positive(),
  facility_name: z.string().max(200).optional(),
  facility_kana: z.string().max(200).optional(),
  service_type: z.string().max(100).optional(),
  prefecture_name: z.string().max(20).optional(),
  city_name: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  address_detail: z.string().max(200).optional(),
  phone_number: z.string().max(30).optional(),
  fax_number: z.string().max(30).optional(),
  operator_name: z.string().max(200).optional(),
  available_days: z.string().max(200).optional(),
  available_days_detail: z.string().max(500).optional(),
  max_capacity: z.string().max(50).optional(),
  url: z.string().max(500).optional(),
  latitude: z.string().max(30).optional(),
  longitude: z.string().max(30).optional(),
  /** 修正理由（任意）。将来の審査で使う */
  note: z.string().max(500).optional(),
});

export type EefulOverlayUpsertInput = z.infer<typeof eefulOverlayUpsertSchema>;

/** overlay 行が持つ上書き値（DB 列名 = snake_case）。NULL/未指定は「上書きしない」。 */
export type EefulOverlayValues = Partial<
  Record<EefulOverlayField, string | number | null | undefined>
>;

export function composeEefulOverlayFields<T extends EefulOverlayValues>(
  mirror: T,
  overlay: EefulOverlayValues | null | undefined,
): { values: T; overriddenFields: EefulOverlayField[] } {
  if (!overlay) return { values: { ...mirror }, overriddenFields: [] };

  const values = { ...mirror };
  const overriddenFields: EefulOverlayField[] = [];
  for (const field of EEFUL_OVERLAY_FIELDS) {
    if (!(field in mirror)) continue;
    const v = overlay[field];
    if (v === null || v === undefined) continue;
    (values as EefulOverlayValues)[field] = v;
    overriddenFields.push(field);
  }
  return { values, overriddenFields };
}

export const WORKING_FACILITY_HEADER = "x-qaito-facility-id";
