import { z } from "zod";
import { VITAL_INPUT_RANGES as R } from "./vitals";

/** HH:MM（24h） */
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 形式");

/** 摂取率: 完食=100 / N%=N（パーサが正規化済み） */
const intakePct = z.number().int().min(0).max(100);

/** バイタル 1 測定（同日複数行あり） */
export const kaipokeVitalSchema = z.object({
  tempCelsius: z.number().min(R.tempCelsius.min).max(R.tempCelsius.max).nullable(),
  bpSystolic: z.number().int().min(R.bpSystolic.min).max(R.bpSystolic.max).nullable(),
  bpDiastolic: z.number().int().min(R.bpDiastolic.min).max(R.bpDiastolic.max).nullable(),
  pulse: z.number().int().min(R.pulse.min).max(R.pulse.max).nullable(),
  weightKg: z.number().min(R.weightKg.min).max(R.weightKg.max).nullable(),
});

/** レク 1 件（同日複数あり） */
export const kaipokeRecreationSchema = z.object({
  participated: z.boolean(),
  startTime: hhmm.nullable(),
  endTime: hhmm.nullable(),
  content: z.string().max(200).nullable(),
});

/** 機能訓練 1 カテゴリ */
export const kaipokeTrainingSchema = z.object({
  performed: z.boolean(),
  category: z.string().max(200),
});

/** 1 利用者・1 日分のパース結果 */
export const kaipokeClientDaySchema = z.object({
  /** PDF ページ番号（エラー参照用。氏名は含めない場所ではこの番号で指す） */
  page: z.number().int().min(1),
  /** PDF 記載の氏名（原文。例: "荒川 敬子"） */
  sourceName: z.string().min(1).max(100),
  /** 正規化済み氏名（空白除去・異体字正規化。突合キー） */
  normalizedName: z.string().min(1).max(100),
  /** 記録日（YYYY-MM-DD） */
  serviceDate: z.string().date(),

  /** 利用登録行の有無と内容（出欠の一次ソース） */
  usage: z
    .object({
      used: z.boolean(),
      /** 「送迎：送迎あり」 */
      transport: z.boolean(),
    })
    .nullable(),
  vitals: z.array(kaipokeVitalSchema),
  bath: z
    .object({
      performed: z.boolean(),
      /** かいぽけ原文（一般浴/個浴/シャワー浴/機械浴 等） */
      methodRaw: z.string().max(50).nullable(),
    })
    .nullable(),
  meal: z
    .object({
      staplePct: intakePct.nullable(),
      sidePct: intakePct.nullable(),
    })
    .nullable(),
  snackPct: intakePct.nullable(),
  trainings: z.array(kaipokeTrainingSchema),
  recreations: z.array(kaipokeRecreationSchema),
  /** 処置（複数行は改行連結済み） */
  treatment: z.string().max(4000).nullable(),
  /** ケース記録（複数行は改行連結済み。要配慮の可能性） */
  caseNotes: z.string().max(8000).nullable(),
  recorderNames: z.array(z.string().max(100)),
});

/** PDF 全体のパース結果 */
export const kaipokeParseResultSchema = z.object({
  /** 形式 id（形式カタログのキー） */
  formatId: z.literal("kaipoke_daytablet_pdf"),
  /** PDF 記載の事業所名（選択事業所との不一致警告に使用） */
  facilityNameRaw: z.string().max(200).nullable(),
  /** 全ページで単一の記録日である前提。複数日が混在した場合は days が複数になる */
  serviceDates: z.array(z.string().date()).min(1),
  clients: z.array(kaipokeClientDaySchema),
  /** パースできなかったページ（ページ番号のみ。内容は含めない） */
  unparsedPages: z.array(z.number().int()),
});

export type KaipokeVital = z.infer<typeof kaipokeVitalSchema>;
export type KaipokeClientDay = z.infer<typeof kaipokeClientDaySchema>;
export type KaipokeParseResult = z.infer<typeof kaipokeParseResultSchema>;

export const kaipokeMatchStatusValues = ["matched", "ambiguous", "unmatched"] as const;

export const kaipokeClientMatchSchema = z.object({
  page: z.number().int(),
  sourceName: z.string(),
  status: z.enum(kaipokeMatchStatusValues),
  /** matched のとき確定 client_id。ambiguous のとき候補一覧 */
  clientId: z.string().uuid().nullable(),
  candidates: z.array(
    z.object({ clientId: z.string().uuid(), name: z.string(), clientNumber: z.string().nullable() }),
  ),
  /** 突合対応表（intake_name_mappings）由来の自動確定か */
  viaMapping: z.boolean(),
});

export type KaipokeClientMatch = z.infer<typeof kaipokeClientMatchSchema>;

/** 取込対象の種別トグル（操作者の書込先 scope で UI/サーバ双方が縮退） */
export const kaipokeCommitTargetsSchema = z.object({
  attendance: z.boolean().default(true),
  transport: z.boolean().default(true),
  vitals: z.boolean().default(true),
  careRecord: z.boolean().default(true),
  recreation: z.boolean().default(true),
  training: z.boolean().default(true),
});

export const kaipokeCommitOptionsSchema = z.object({
  /** 当日予定が無い利用者にスポット予定を作成して出席にする */
  createSpotSchedule: z.boolean().default(true),
  /** 利用登録行が無く記録のみの利用者も出席にする */
  attendWithoutUsageRow: z.boolean().default(false),
});

/** 手動突合の解決（unmatched/ambiguous → 選択した client_id。null = 今回スキップ） */
export const kaipokeManualMatchSchema = z.object({
  sourceName: z.string().min(1).max(100),
  clientId: z.string().uuid().nullable(),
  /** 対応表（intake_name_mappings）に保存して次回から自動適用する */
  remember: z.boolean().default(true),
});

export const kaipokeCommitRequestSchema = z.object({
  facilityId: z.string().uuid(),
  targets: kaipokeCommitTargetsSchema.default({
    attendance: true,
    transport: true,
    vitals: true,
    careRecord: true,
    recreation: true,
    training: true,
  }),
  options: kaipokeCommitOptionsSchema.default({
    createSpotSchedule: true,
    attendWithoutUsageRow: false,
  }),
  manualMatches: z.array(kaipokeManualMatchSchema).default([]),
});

export type KaipokeCommitRequest = z.infer<typeof kaipokeCommitRequestSchema>;

export const kaipokeCommitSummarySchema = z.object({
  jobId: z.string().uuid(),
  clientsTotal: z.number().int(),
  clientsImported: z.number().int(),
  clientsSkipped: z.number().int(),
  /** 種別ごとの作成/置換/スキップ件数 */
  perTarget: z.record(
    z.string(),
    z.object({ created: z.number().int(), replaced: z.number().int(), skipped: z.number().int() }),
  ),
  /** PII 非含有（ページ番号・種別・エラー種類のみ） */
  errors: z.array(
    z.object({ page: z.number().int(), target: z.string(), type: z.string() }),
  ),
  /**
   * 取込先の所有モジュールのゲートが書き込みを断った対象（権限なし）。**その対象だけ**取り込まない
   * （他の対象・他の利用者は続ける）。`code` はゲートの拒否理由（`forbidden_scope` 等）。
   * 省略時は無し（この欄を足す前の応答と互換）。
   */
  deniedTargets: z
    .array(z.object({ target: z.string(), code: z.string() }))
    .optional(),
});

export type KaipokeCommitSummary = z.infer<typeof kaipokeCommitSummarySchema>;
