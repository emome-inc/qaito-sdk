import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";
import { serviceCategoryValues } from "./shared-options";

export const transportDirectionValues = [
  "pickup",
  "dropoff",
] as const;

export type TransportDirection = (typeof transportDirectionValues)[number];

export const boardingStatusValues = [
  "boarded",
  "absent",
  "cancelled",
] as const;

export type BoardingStatus = (typeof boardingStatusValues)[number];

export const createTransportLogSchema = z.object({
  /** 利用者 UUID（必須）*/
  clientId: z.string().uuid("client_id は UUID 形式です"),
  /** 事業所 UUID（任意）*/
  facilityId: z.string().uuid("facility_id は UUID 形式です").optional().nullable(),
  /** 送迎便 UUID（nullable = 計画外送迎も可）*/
  routeId: z.string().uuid("route_id は UUID 形式です").optional().nullable(),
  /** 停車順 UUID（nullable = 計画外送迎も可）*/
  routeStopId: z.string().uuid("route_stop_id は UUID 形式です").optional().nullable(),
  /** ドライバースタッフ UUID（任意）*/
  driverStaffId: z.string().uuid("driver_staff_id は UUID 形式です").optional().nullable(),

  /** 乗降日（YYYY-MM-DD）*/
  serviceDate: z.string().date("serviceDate は YYYY-MM-DD 形式です"),
  /** 制度コード 2 軸（§2.3）*/
  serviceCategory: z.enum(serviceCategoryValues).default("kaigo_hoken"),
  serviceTypeCode: z.string().max(2, "serviceTypeCode は 2 文字以内です").default("15"),

  /** 迎え/送り（db カラム名: transport_type）*/
  transportType: z.enum(transportDirectionValues).default("pickup"),

  /** 予定時刻（HH:MM 形式）*/
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "scheduledTime は HH:MM または HH:MM:SS 形式です")
    .optional()
    .nullable(),
  /** 実績時刻（HH:MM 形式）*/
  actualTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "actualTime は HH:MM または HH:MM:SS 形式です")
    .optional()
    .nullable(),

  /** 乗車場所住所（任意）*/
  pickupAddress: z.string().max(500).optional().nullable(),
  pickupLatitude: z.string().optional().nullable(),
  pickupLongitude: z.string().optional().nullable(),

  /** 降車場所住所（任意）*/
  dropoffAddress: z.string().max(500).optional().nullable(),
  dropoffLatitude: z.string().optional().nullable(),
  dropoffLongitude: z.string().optional().nullable(),

  /**
   * 乗降ステータス（設計 SoT: boarding_status。送迎減算根拠に直結）
   * 'boarded'=乗車 | 'absent'=不乗（欠席）| 'cancelled'=中止
   */
  boardingStatus: z.enum(boardingStatusValues).default("boarded"),
  /** 不乗理由（boardingStatus='absent' 時）*/
  absenceReason: z.string().max(500).optional().nullable(),

  /** 乗降時の状態メモ（表情・様子・申し送り）*/
  vitalNote: z.string().max(1000).optional().nullable(),
  /** ドライバーメモ */
  driverNote: z.string().max(1000).optional().nullable(),
  /** 備考 */
  memo: z.string().max(1000).optional().nullable(),
  /**
   * キャンセル日時（forms-module.md §5.1 送迎表用）。boardingStatus='cancelled' と併用可能な
   * 別枠（時刻と理由を分けて保持する）。
   */
  canceledAt: z.string().datetime({ offset: true }).optional().nullable(),
  /** キャンセル理由 */
  canceledReason: z.string().max(500).optional().nullable(),
});

export type CreateTransportLogInput = z.infer<typeof createTransportLogSchema>;

export const updateTransportLogSchema = partialForUpdate(
  createTransportLogSchema.omit({
    clientId:        true,
    serviceDate:     true,
    serviceCategory: true,
    serviceTypeCode: true,
  }),
);

export type UpdateTransportLogInput = z.infer<typeof updateTransportLogSchema>;

export const recordTransportLegForDaySchema = z.object({
  clientId: z.string().uuid("clientId は UUID 形式です"),
  facilityId: z.string().uuid("facilityId は UUID 形式です"),
  serviceDate: z.string().date("serviceDate は YYYY-MM-DD 形式です"),
  transportType: z.enum(transportDirectionValues),
  boarded: z.boolean(),
  actualTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "actualTime は HH:MM または HH:MM:SS 形式です")
    .optional()
    .nullable(),
});
export type RecordTransportLegForDayInput = z.infer<typeof recordTransportLegForDaySchema>;

export const checkInTransportLogSchema = z.object({
  /** 乗降ステータス（boarded=乗車 | absent=不乗 | cancelled=中止）*/
  boardingStatus: z.enum(boardingStatusValues),
  /** 実績時刻（HH:MM）*/
  actualTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "actualTime は HH:MM または HH:MM:SS 形式です")
    .optional()
    .nullable(),
  /** 不乗理由（boardingStatus='absent' 時）*/
  absenceReason: z.string().max(500).optional().nullable(),
  /** 乗降時の状態メモ */
  vitalNote: z.string().max(1000).optional().nullable(),
  /** ドライバーメモ */
  driverNote: z.string().max(1000).optional().nullable(),
});

export type CheckInTransportLogInput = z.infer<typeof checkInTransportLogSchema>;

export const transportLogIdParam = z.object({
  id: z.string().uuid("id は UUID 形式です"),
});
