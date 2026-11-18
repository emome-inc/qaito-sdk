import { z } from "zod";

const uuidField = z.string().uuid();

export const createJobRoleApiSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  /** シフト表に表示するか（既定 true）。全役割 false の職員のみ名簿から外れる */
  showOnShift: z.boolean().optional(),
});
export type CreateJobRoleInput = z.infer<typeof createJobRoleApiSchema>;

export const updateJobRoleApiSchema = createJobRoleApiSchema.partial();
export type UpdateJobRoleInput = z.infer<typeof updateJobRoleApiSchema>;

/** GET /staff/job-role/roles のクエリ（?is_active=true|false で絞り込み） */
export const listJobRolesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListJobRolesQuery = z.infer<typeof listJobRolesQuerySchema>;

export const jobRoleIdParamSchema = z.object({ id: uuidField });

/** PUT /staff/job-role/staff/:staffId/roles — 役割 ID の配列で置換する（既存リンクは差分適用） */
export const replaceStaffJobRolesApiSchema = z.object({
  jobRoleIds: z.array(uuidField).max(50),
});
export type ReplaceStaffJobRolesInput = z.infer<typeof replaceStaffJobRolesApiSchema>;

export const staffIdParamSchema = z.object({ staffId: uuidField });
