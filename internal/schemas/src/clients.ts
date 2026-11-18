import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { normalizeKanaName } from "./kana";
import { planCreationKindValues } from "./client-service-plans";

export const genderOptions = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "その他" },
] as const;

/**
 * 利用状態（client.clients.status）
 * master-design §3.1 の CHECK 制約と一致させる
 */
export const clientStatusOptions = [
  { value: "pending", label: "利用開始前" },
  { value: "active", label: "利用中" },
  { value: "suspended", label: "一時停止" },
  { value: "hospitalized", label: "入院中" },
  { value: "withdrawn", label: "利用中止" },
  { value: "trial", label: "お試し体験" },
] as const;

export const clientStatusValues = [
  "pending",
  "active",
  "suspended",
  "hospitalized",
  "withdrawn",
  "trial",
] as const;

export type ClientStatus = (typeof clientStatusValues)[number];

/**
 * Wave 1 対応版 createClientSchema
 *
 * 新フィールド（family_name / given_name 等）が最上位。
 * expand-contract 期間中は旧フィールド（name / name_kana / birth_date 等）も
 * optional で維持し、dual-write を許容する。
 *
 * Wave 最終で旧フィールドを除去予定。
 */
export const createClientSchema = z.object({

  client_number: z.string().optional(),
  legacy_client_number: z.string().trim().max(50).optional().nullable(),

  status: z.enum(clientStatusValues).default("active"),

  family_name: z.string({ error: "姓（漢字）は必須です" }).min(1, "姓（漢字）は必須です"),
  given_name: z.string().min(1, "名（漢字）は必須です").optional(),
  family_name_kana: z.string().transform(normalizeKanaName).optional(),
  given_name_kana: z.string().transform(normalizeKanaName).optional(),

  insured_number: z.string().optional(),

  birth_date_v2: z.string().date().optional(),

  gender: z.enum(["male", "female", "other"]).optional(),

  face_photo_path: z.string().optional(),

  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address_line: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  phone: z.string().optional(),
  mobile: z.string().optional(),

  care_manager_id: z.string().uuid().optional().nullable(),
  care_manager_assigned_from: z.string().date().optional().nullable(),
  plan_creation_kind: z.enum(planCreationKindValues).optional().nullable(),
  houkatsu_office_id: z.string().uuid().optional().nullable(),

  insurer_number: z.string().optional(),
  facility_id: z.string().uuid().optional().nullable(),
  kyotaku_facility_id: z.string().uuid().optional().nullable(),

  height_cm: z.number().int().min(0).max(300).optional().nullable(),

  medication_management: z
    .enum(["self", "facility", "family"])
    .optional()
    .nullable(),

  bath_care_note: z.string().optional(),
  nursing_care_note: z.string().optional(),

  hobbies: z.string().optional(),
  current_services: z.string().optional(),
  life_history: z.string().optional(),
  consultation_notes: z.string().optional(),
  living_with_family: z.boolean().optional(),
  sns_consent: z.boolean().optional(),
  memo: z.string().optional(),
});

export const updateClientSchema = partialForUpdate(createClientSchema);

export const clientIdParam = z.object({ id: z.string().uuid() });

export const clientIntakeTargetSchema = z.object({
  facility_id: z.string().uuid(),
});
export type ClientIntakeTarget = z.infer<typeof clientIntakeTargetSchema>;

export const intakeFieldPickSchema = z.union([
  z.object({ take: z.enum(["current", "incoming"]) }).strict(),
  z.object({ value: z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]) }).strict(),
]);
export type IntakeFieldPick = z.infer<typeof intakeFieldPickSchema>;

export const intakeRowResolutionSchema = z.discriminatedUnion("kind", [
  /** 差分の全項目を取り込む値に（すべて取り込む） */
  z.object({ kind: z.literal("update") }),
  /** 今の値が空の項目だけ取り込む値で埋める（どの項目かはサーバが差分から決める） */
  z.object({ kind: z.literal("merge") }),
  /** 項目ごとの指定（利用者の行だけ）。差分に出ていない項目は受けない */
  z.object({
    kind: z.literal("fields"),
    fields: z
      .record(z.string().min(1).max(64), intakeFieldPickSchema)
      .refine((v) => Object.keys(v).length > 0 && Object.keys(v).length <= 60, { message: "項目を選んでください" }),
  }),
  z.object({
    kind: z.literal("create_new"),
    clientNumberOverride: z.string().trim().min(1).max(50).optional(),
  }),
]);
export type IntakeRowResolution = z.infer<typeof intakeRowResolutionSchema>;

/** 重なりの種類（利用者の行か、子の行か）。 */
export const intakeOverlapKindValues = ["client", "family", "certification", "medication"] as const;
export type IntakeOverlapKind = (typeof intakeOverlapKindValues)[number];

/**
 * 確定（`POST /client/intake/commit` の multipart `resolutions`）の 1 件。プレビューで返した
 * `rowIndex`（Excel の行番号）・`kind`・`seq`・`existingId`・`digest` をそのまま送り返す。
 * サーバは確定時に突合・差分・本人らしさ・印を作り直し、食い違えば行のエラー（`STALE_OVERLAP`）。
 */
export const intakeOverlapResolutionEntrySchema = z.object({
  rowIndex: z.number().int().nonnegative(),
  kind: z.enum(intakeOverlapKindValues),
  seq: z.number().int().nonnegative(),
  existingId: z.string().uuid(),
  digest: z.string().min(1).max(200),
  resolution: intakeRowResolutionSchema,
});
export type IntakeOverlapResolutionEntry = z.infer<typeof intakeOverlapResolutionEntrySchema>;
export const intakeOverlapResolutionsSchema = z.array(intakeOverlapResolutionEntrySchema).max(2000);

export const INTAKE_FACILITY_MISMATCH_MIN_MATCHED = 3;
export const INTAKE_FACILITY_MISMATCH_RATIO = 0.3;
export const INTAKE_FACILITY_MISMATCH_MIN_RISKY = 5;

/** 取込で上書きする前の値（`client.import_change_before_images`）を残す日数。過ぎたら定期ジョブが消す。 */
export const INTAKE_BEFORE_IMAGE_RETENTION_DAYS = 30;

export const INTAKE_MAX_ROWS = 500;

/**
 * 事業所が未設定の利用者の一覧（`GET /client/clients/unassigned-facility`）のクエリ。
 * 未設定 = `client_profiles.facility_id` が NULL、またはプロファイルの行が無い。
 */
export const listUnassignedFacilityClientsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListUnassignedFacilityClientsQuery = z.input<typeof listUnassignedFacilityClientsQuery>;

/**
 * 事業所が未設定の利用者に、一括で事業所を付ける（`POST /client/clients/unassigned-facility/assign`）。
 * 付け替え（別の事業所へ移す）には使わない ── 未設定の人だけが対象。
 */
export const assignClientsFacilitySchema = z.object({
  facility_id: z.string().uuid(),
  client_ids: z.array(z.string().uuid()).min(1).max(500),
});
export type AssignClientsFacilityInput = z.infer<typeof assignClientsFacilitySchema>;

export const listRecentClientsQuery = z.object({
  since: z.string().datetime({ offset: true }).optional(),
  days: z.coerce.number().int().min(1).max(366).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListRecentClientsQuery = z.input<typeof listRecentClientsQuery>;

export const listClientsQuery = z.object({
  status: z.enum(clientStatusValues).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const insuranceNumberPairSchema = z
  .object({
    insurerNumber: z.string().trim().min(1).optional(),
    insuredNumber: z.string().trim().min(1).optional(),
  })
  .refine((v) => Boolean(v.insurerNumber) === Boolean(v.insuredNumber), {
    message: "保険者番号と被保険者番号は両方入力してください（片方だけでは保存できません）",
    path: ["insuredNumber"],
  });
