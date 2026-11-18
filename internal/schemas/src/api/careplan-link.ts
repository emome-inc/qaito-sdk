import { z } from "zod";
import { normalizeKanaName } from "../kana";

/** POST /careplan-link/service-offices — サービス提供事業所の登録。 */
export const createServiceOfficeApiSchema = z.object({
  /** 事業所番号（10 桁の数字。DB の CHECK と同じ形） */
  officeNumber: z.string().trim().regex(/^[0-9]{10}$/, "事業所番号は 10 桁の数字です"),
  /** サテライト（枝番）。`varchar(2)` */
  satelliteCode: z.string().trim().max(2).nullable().optional(),
  name: z.string().trim().min(1).max(200),
  nameKana: z.string().max(200).transform(normalizeKanaName).nullable().optional(),
  /** 自社の事業所として紐づけるときだけ。他社の事業所は省略（null） */
  facilityId: z.string().uuid().nullable().optional(),
});
export type CreateServiceOfficeApiInput = z.infer<typeof createServiceOfficeApiSchema>;

/** POST /careplan-link/service-offices/:id/facility — 他社として入っている名簿の行を自社の事業所に結ぶ。 */
export const attachServiceOfficeFacilityApiSchema = z.object({
  /** 結ぶ自社の事業所 */
  facilityId: z.string().uuid(),
});
export type AttachServiceOfficeFacilityApiInput = z.infer<typeof attachServiceOfficeFacilityApiSchema>;

/**
 * POST /careplan-link/service-offices/register-facility — 自社の事業所を、事業所の台帳の番号と名前で名簿に登録する。
 * 番号・名前は受けない（台帳から取る。画面や AI から別の番号を入れさせない）。
 */
export const registerFacilityServiceOfficeApiSchema = z.object({
  /** 登録する自社の事業所 */
  facilityId: z.string().uuid(),
});
export type RegisterFacilityServiceOfficeApiInput = z.infer<typeof registerFacilityServiceOfficeApiSchema>;

/**
 * GET /careplan-link/service-offices の絞り込み（どれも省略可）。
 * `unlinked=true` は事業所に結ばれていない行（他社として入っている行）だけ。
 */
export const listServiceOfficesQuerySchema = z.object({
  facilityId: z.string().uuid().optional(),
  officeNumber: z.string().trim().min(1).max(20).optional(),
  unlinked: z.enum(["true", "false"]).optional(),
});
export type ListServiceOfficesQuery = z.infer<typeof listServiceOfficesQuerySchema>;

/**
 * 結び付け待ちの理由。`receive_failed` の外は `@qaito/modules/careplan-link/pure` の `UpplanUnmatchedReason` と同じ値。
 * `receive_failed` は当たったが受け取りの口が断った（利用者が境界の外・入力が様式に合わない など）
 */
export const UPPLAN_UNMATCHED_REASONS = [
  "invalid_key",
  "no_date",
  "office_unknown",
  "client_not_found",
  "client_ambiguous",
  "receive_failed",
] as const;

/** 行の結び付けの状態。linked = 利用者のケアプランにした / pending = 結び付け待ち */
export const upplanRowLinkSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("linked"),
    clientId: z.string().uuid(),
    planId: z.string().uuid(),
    linkedAt: z.string(),
  }),
  z.object({
    status: z.literal("pending"),
    reason: z.enum(UPPLAN_UNMATCHED_REASONS),
  }),
]);
export type UpplanRowLink = z.infer<typeof upplanRowLinkSchema>;

const dateField = z.string().date().nullable().optional();

/** 受けた計画の 1 行（第1〜3表）。キーは保険者番号(6) + 被保険者番号(10)。欄の名前は居宅サービス計画書の作成と同じ */
export const upplanPlanRowSchema = z.object({
  rowNo: z.number().int().min(0),
  insurerNumber: z.string().max(20),
  insuredNumber: z.string().max(20),
  /** 第1表の作成日 */
  createdOn: dateField,
  effectiveFrom: dateField,
  effectiveUntil: dateField,
  /** 送り元の居宅介護支援事業所の番号（作った居宅を名簿から引く） */
  careOfficeNumber: z.string().max(20).nullable().optional(),
  careManagerName: z.string().max(200).nullable().optional(),
  careManagerOffice: z.string().max(200).nullable().optional(),
  clientWishes: z.string().max(5000).nullable().optional(),
  familyWishes: z.string().max(5000).nullable().optional(),
  overallPolicy: z.string().max(5000).nullable().optional(),
  lifeSupportReason: z.string().max(5000).nullable().optional(),
  needs: z.array(z.record(z.string(), z.unknown())).max(50).optional(),
  schedules: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  link: upplanRowLinkSchema.optional(),
});
export type UpplanPlanRow = z.infer<typeof upplanPlanRowSchema>;

/** `parsed_payload` の全体。`officeNumber` はファイルの受ける側（自組織）の事業所番号 */
export const upplanPayloadSchema = z.object({
  officeNumber: z.string().max(20),
  rows: z.array(upplanPlanRowSchema).max(5000),
});
export type UpplanPayload = z.infer<typeof upplanPayloadSchema>;

/** POST /careplan-link/files/:id/rows/:rowNo/link — 結び付け待ちの行を手で利用者に結び付ける */
export const linkUpplanRowApiSchema = z.object({
  clientId: z.string().uuid(),
});
export type LinkUpplanRowApi = z.infer<typeof linkUpplanRowApiSchema>;
