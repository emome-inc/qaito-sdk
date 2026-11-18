/**
 * 訪問看護 24時間対応の記録（client.nursing_oncall_*）の Zod。
 *
 * 参照: clinical-record・schedule の実装。持ち主は `clinical-record`。
 * 相談の内容・した対応・コメントは要配慮。バリデーション失敗の詳細をクライアントへ返さない（固定文言）。
 */
import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { isValidVisitKind, visitServiceCategoryValues } from "./schedule-visits";

export const ONCALL_CALLER_KINDS = ["self", "family", "care_manager", "doctor", "institution", "other"] as const;
export type OncallCallerKind = (typeof ONCALL_CALLER_KINDS)[number];

export const ONCALL_METHODS = ["phone", "line", "other"] as const;
export type OncallMethod = (typeof ONCALL_METHODS)[number];

export const ONCALL_OUTCOMES = ["phone_only", "emergency_visit", "hospital", "other"] as const;
export type OncallOutcome = (typeof ONCALL_OUTCOMES)[number];

/** 一覧のタブ。未読 = 受けた時刻が直近 14 日で自分の既読が無いもの */
export const ONCALL_TABS = ["all", "unread", "read", "favorite"] as const;
export type OncallTab = (typeof ONCALL_TABS)[number];

/** 未読として数える期間（日）。期間なしだと入ったばかりの職員に過去の記録がすべて未読になる */
export const ONCALL_UNREAD_DAYS = 14;

const uuid = z.string().uuid();
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

const recordFields = z.object({
  /** 記録の事業所（stamp）。書ける事業所の範囲にあること */
  facilityId: uuid,
  clientId: uuid,
  /** 相談を受けた時刻 */
  receivedAt: z.string().datetime({ offset: true }),
  callerKind: z.enum(ONCALL_CALLER_KINDS),
  /** 相手の名前・続柄（「長女」「居宅介護支援事業所さくら」） */
  callerName: z.string().trim().max(100).optional().nullable(),
  method: z.enum(ONCALL_METHODS).default("phone"),
  /** 電話受付の受電を指す（方法が電話のときだけ） */
  phoneCallId: uuid.optional().nullable(),
  /** 対応した職員。省略は書いた人の職員 */
  responderStaffId: uuid.optional(),
  /** 相談の内容（要配慮） */
  consultation: z.string().trim().min(1).max(4000),
  /** した対応（要配慮） */
  response: z.string().trim().min(1).max(4000),
  outcome: z.enum(ONCALL_OUTCOMES),
  /** 主治医へ連絡したか */
  doctorContacted: z.boolean().default(false),
  /**
   * 結果が緊急訪問で、まだ訪問が結ばれていないとき: 続けて作る緊急訪問の開始時刻（HH:MM）。
   * 記録の列ではない（保存の手順が緊急訪問の口へ渡すだけ）。省略は予定を作らない。
   * 緊急訪問だけ作れなかったときも記録は保存し、応答の `emergencyFailure` で知らせる
   */
  emergencyStartTime: timeString.optional(),
});

export const createNursingOncallRecordSchema = recordFields.refine(
  (v) => v.phoneCallId == null || v.method === "phone",
  { path: ["phoneCallId"], message: "受電を指せるのは方法が電話のときだけです" },
);

/**
 * 利用者・事業所は変えない（別の人の記録として書き直す）。
 * `expectedUpdatedAt` は読み込んだ時点の `updatedAt`（ISO 8601・必須）。違えば CONFLICT（後から書いた人が先の保存を黙って上書きしない）。
 * 列ではなく条件なので、更新対象には入れない（core が項目を 1 つずつ拾う）
 */
export const updateNursingOncallRecordSchema = partialForUpdate(
  recordFields.omit({ facilityId: true, clientId: true }),
).extend({
  expectedUpdatedAt: z.string().datetime({ offset: true }),
});

export const listNursingOncallRecordsQuerySchema = z.object({
  /** 省略は書ける範囲のすべての事業所 */
  facilityId: uuid.optional(),
  /** 受けた日（JST）の範囲 */
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  clientId: uuid.optional(),
  outcome: z.enum(ONCALL_OUTCOMES).optional(),
  /** 利用者の名前で探す */
  q: z.string().trim().max(50).optional(),
  tab: z.enum(ONCALL_TABS).default("all"),
  /** 受けた時刻の並び。既定は新しい順 */
  order: z.enum(["desc", "asc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});

/** 件数はタブごとに数えるので tab / order / limit / offset は受けない */
export const countNursingOncallRecordsQuerySchema = listNursingOncallRecordsQuerySchema.omit({
  tab: true,
  order: true,
  limit: true,
  offset: true,
});

/** 未読だけの件数（ホーム用）。絞り込みは事業所だけ */
export const countNursingOncallUnreadQuerySchema = z.object({
  facilityId: uuid.optional(),
});

export const setNursingOncallFavoriteSchema = z.object({
  favorite: z.boolean(),
});

export const createNursingOncallCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

/** 緊急訪問に選べる訪問看護の区分（schedule の訪問の値域のうち訪問看護のもの。13=訪問看護 / 63=介護予防訪問看護） */
export const ONCALL_VISIT_SERVICE_TYPE_CODES = ["13", "63"] as const;
export type OncallVisitServiceTypeCode = (typeof ONCALL_VISIT_SERVICE_TYPE_CODES)[number];
/** 訪問看護の訪問区分（schedule の `VISIT_KIND_BY_SERVICE_TYPE` の 13 / 63 と同じ） */
export const ONCALL_VISIT_KINDS = ["nurse", "pt_ot_st"] as const;

/**
 * 記録から緊急訪問を作る。相談の本文は予定に写さない。
 *
 * 保険の区分（`serviceCategory`）・サービス種類（`serviceTypeCode`）・訪問区分（`visitKind`）は**任意**。
 * 省略した分は、その利用者の直近の訪問看護の訪問（同じ事業所）から写す。見つからなければ
 * `SERVICE_TYPE_REQUIRED` で返すので、画面は選ばせる（黙って 13 にしない — 医療保険・予防の利用者で請求がずれる）。
 */
export const createNursingOncallEmergencyVisitSchema = z
  .object({
    acknowledgeNearby: z.boolean().optional(),
    /** 訪問の開始時刻（HH:MM） */
    startTime: timeString,
    endTime: timeString.optional().nullable(),
    /** 訪問日。省略は相談を受けた日（JST） */
    serviceDate: z.string().date().optional(),
    /** 保険の区分（kaigo_hoken=介護保険 / iryo_hoken=医療保険 …。schedule の訪問と同じ値域） */
    serviceCategory: z.enum(visitServiceCategoryValues).optional(),
    /** 13=訪問看護 / 63=介護予防訪問看護 */
    serviceTypeCode: z.enum(ONCALL_VISIT_SERVICE_TYPE_CODES).optional(),
    /** nurse=看護師等 / pt_ot_st=PT・OT・ST */
    visitKind: z.enum(ONCALL_VISIT_KINDS).optional(),
  })
  .refine((v) => v.serviceTypeCode === undefined || v.visitKind === undefined || isValidVisitKind(v.serviceTypeCode, v.visitKind), {
    path: ["visitKind"],
    message: "visitKind はサービス種類に合う値にしてください",
  });

/** 緊急訪問の区分が見つからないときのコード（画面が選ばせる）。REST は 400 + `code: "SERVICE_TYPE_REQUIRED"` */
export const ONCALL_SERVICE_TYPE_REQUIRED = "SERVICE_TYPE_REQUIRED" as const;

/**
 * 24時間対応の記録の口が、入力を弾く**理由ごとのコード**（一般の `INVALID_INPUT` に潰さない）。
 * REST は 400 + `code`（固定文言は `@qaito/vocabulary` の `NURSING_ONCALL_MESSAGES.rejects`。入力の詳細は返さない）。
 *   - `RESPONDER_REQUIRED` … 対応した職員が記録の事業所に属していない（退職・発令なし）／書いた人に職員の記録が無く既定を決められない
 *   - `CLIENT_NOT_IN_FACILITY` … 利用者の今の所属事業所が記録の事業所ではない
 *   - `PHONE_CALL_UNAVAILABLE` … 指した受電が見られない（`phone:read` 無し・他 org・実在しない）
 *   - `SERVICE_TYPE_REQUIRED` … 緊急訪問の区分を入力にも直近の訪問にも見つけられない
 */
/**
 * 緊急訪問を作れなかった理由の種類（記録の保存の応答 `emergencyFailure.kind`・画面の案内の出し分け）。
 * - `service_type_required` … 区分を入力にも直近の訪問看護の訪問にも見つけられない（選ばせる）
 * - `forbidden` … 訪問の予定を作る権限が無い（`schedule:write`）・事業所の範囲外
 * - `orphan` … 訪問は作ったが記録に結べず、取り消しもできなかった（もう一度で作成済みの訪問に結ぶ）
 * - `overlap` / `nearby` … その利用者の訪問と時間が重なる / 前後の訪問との間隔が短い
 * - `other` … それ以外
 */
export const ONCALL_EMERGENCY_FAILURE_KINDS = ["service_type_required", "forbidden", "orphan", "overlap", "nearby", "other"] as const;
export type OncallEmergencyFailureKind = (typeof ONCALL_EMERGENCY_FAILURE_KINDS)[number];
/** 記録の保存のあと緊急訪問を作れなかったとき（記録は保存済み） */
export type OncallEmergencyFailure = {
  kind: OncallEmergencyFailureKind;
  /** 試した開始時刻（やり直しの欄の初期値） */
  startTime: string;
};

/** 緊急訪問の口の失敗（コード・作ったが結べなかった訪問・時間の理由）を種類に写す */
export function oncallEmergencyFailureKind(code: string, orphanVisitId?: string, reason?: string): OncallEmergencyFailureKind {
  if (orphanVisitId) return "orphan";
  if (code === "CONFLICT" && reason === "visit_time_overlap") return "overlap";
  if (code === "CONFLICT" && reason === "visit_time_nearby") return "nearby";
  if (code === ONCALL_SERVICE_TYPE_REQUIRED) return "service_type_required";
  if (code === "forbidden_scope" || code === "FORBIDDEN" || code === "FORBIDDEN_FACILITY") return "forbidden";
  return "other";
}

/**
 * CONFLICT の理由（安定した識別子・文言ではない）。画面が文言を選ぶのに使う。
 * 結んだ緊急訪問があって結果を変えられないときの CONFLICT は理由を付けない（別の文言）
 */
export const ONCALL_CONFLICT_REASONS = {
  /** ほかの人が先に保存した（読み込んだ時点の更新日時と違う） */
  stale: "oncall_stale",
  /** 同じ書き手・利用者・受けた時刻の記録がもうある（二重タップ・再送） */
  duplicate: "oncall_duplicate",
} as const;

export const ONCALL_REJECT_CODES = [
  "RESPONDER_REQUIRED",
  "CLIENT_NOT_IN_FACILITY",
  "PHONE_CALL_UNAVAILABLE",
  ONCALL_SERVICE_TYPE_REQUIRED,
] as const;
export type OncallRejectCode = (typeof ONCALL_REJECT_CODES)[number];
export const isOncallRejectCode = (code: string): code is OncallRejectCode =>
  (ONCALL_REJECT_CODES as readonly string[]).includes(code);

export type CreateNursingOncallRecordInput = z.input<typeof createNursingOncallRecordSchema>;
export type UpdateNursingOncallRecordInput = z.infer<typeof updateNursingOncallRecordSchema>;
export type ListNursingOncallRecordsQuery = z.infer<typeof listNursingOncallRecordsQuerySchema>;
export type CountNursingOncallRecordsQuery = z.infer<typeof countNursingOncallRecordsQuerySchema>;
export type CountNursingOncallUnreadQuery = z.infer<typeof countNursingOncallUnreadQuerySchema>;
export type SetNursingOncallFavoriteInput = z.infer<typeof setNursingOncallFavoriteSchema>;
export type CreateNursingOncallCommentInput = z.infer<typeof createNursingOncallCommentSchema>;
export type CreateNursingOncallEmergencyVisitInput = z.infer<typeof createNursingOncallEmergencyVisitSchema>;
