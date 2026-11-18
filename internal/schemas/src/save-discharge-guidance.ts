import { z } from "zod";
import { clinicalSourceStagedIdsSchema } from "./clinical-document-ocr";
import {
  renkeiMethodValues,
  taiinKyodoExtraSchema,
  taiinKyodoParticipantSchema,
  TAIIN_KYODO_SERVICE_TYPES,
} from "./clinical-record";

const date = (name: string) => z.string().date(`${name} は YYYY-MM-DD 形式です`);
const uuid = (name: string) => z.string().uuid(`${name} は UUID 形式です`);

export const saveDischargeGuidanceSchema = z
  .object({
    /** 直す記録（医療連携イベント）の ID。無ければ新しく作る */
    id: uuid("id").optional().nullable(),
    serviceTypeCode: z.enum(TAIIN_KYODO_SERVICE_TYPES),
    facilityId: uuid("facilityId").optional().nullable(),
    institutionId: uuid("institutionId").optional().nullable(),
    /** ひも付ける入退院（既存）。`newHospitalization` があればそちらを作ってひも付ける */
    hospitalizationEpisodeId: uuid("hospitalizationEpisodeId").optional().nullable(),
    /** 入退院を新しく作るとき（医療機関の入院。医療機関名は相手の医療機関から写す） */
    newHospitalization: z
      .object({ admissionDate: date("admissionDate"), dischargeDate: date("dischargeDate").optional().nullable() })
      .strict()
      .optional(),
    /** 既存の入退院がまだ入院中のとき入れる退院日（すでに退院日がある入退院は変えない） */
    episodeDischargeDate: date("episodeDischargeDate").optional().nullable(),
    eventDate: date("eventDate"),
    eventTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "eventTime は HH:MM 形式です")
      .optional()
      .nullable(),
    method: z.enum(renkeiMethodValues).optional().nullable(),
    counterpart: z.string().max(200).optional().nullable(),
    participants: z.array(taiinKyodoParticipantSchema).max(30).optional(),
    body: z.string().max(8000).optional().nullable(),
    extraData: taiinKyodoExtraSchema.optional(),
    /** 保存のあとで確定まで進めるか */
    confirm: z.boolean().optional(),
    sourceStagedIds: clinicalSourceStagedIdsSchema.optional(),
  })
  .strict();
export type SaveDischargeGuidanceInput = z.input<typeof saveDischargeGuidanceSchema>;

/**
 * 入力を弾いた理由（`INVALID_INPUT` に添える）。画面が理由ごとに案内を出し分ける。
 * - `event_invalid` … 記録の入力（実施日・項目の形）が正しくない
 * - `hospitalization_dates` … 新しい入退院の入院日・退院日が正しくない（退院日が入院日より前を含む）
 * - `discharge_before_admission` … 既存の入退院に入れる退院日が入院日より前
 */
export const SAVE_DISCHARGE_GUIDANCE_REASONS = [
  "event_invalid",
  "hospitalization_dates",
  "discharge_before_admission",
] as const;
export type SaveDischargeGuidanceReason = (typeof SAVE_DISCHARGE_GUIDANCE_REASONS)[number];
