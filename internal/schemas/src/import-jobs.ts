import { z } from "zod";

export const importJobStatusValues = [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;
export type ImportJobStatus = (typeof importJobStatusValues)[number];

export const importJobStatus = z.enum(importJobStatusValues);

export const importJobErrorDetailSchema = z.object({
  row: z.number().int().positive(),
  field: z.string(),
  type: z.string(),
  message: z.string().optional(),
});
export type ImportJobErrorDetail = z.infer<typeof importJobErrorDetailSchema>;

export const importJobRowSchema = z.object({
  id: z.string().uuid(),
  importType: z.string(),
  fileName: z.string().nullable(),
  status: importJobStatus,
  totalRows: z.number().int().nullable(),
  successRows: z.number().int().nullable(),
  errorRows: z.number().int().nullable(),
  errorDetails: z.array(importJobErrorDetailSchema),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ImportJobRow = z.infer<typeof importJobRowSchema>;

export const intakeUploadSchema = z.object({
  /** テンプレート種別 — 現状は "client_bulk" のみ */
  importType: z.literal("client_bulk"),
  /** S3 にアップロード済みファイルの file_key（DDL の file_key NOT NULL カラムに挿入する値） */
  fileKey: z.string().min(1),
  /** オリジナルのファイル名（meta.file_name として保存、表示用） */
  fileName: z.string().min(1),
  /** ファイルの行数（ヘッダ除く、null 可） */
  totalRows: z.number().int().positive().nullable().optional(),
});
export type IntakeUploadInput = z.infer<typeof intakeUploadSchema>;

export const intakeTemplateName = z.enum(["client_bulk"]);
export type IntakeTemplateName = z.infer<typeof intakeTemplateName>;
