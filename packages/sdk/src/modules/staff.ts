
import type {
  CreateJobRoleInput,
  CreateStaffAllowancesInput,
  CreateStaffAssignmentInput,
  CreateStaffEmergencyContactInput,
  CreateStaffEmploymentInput,
  CreateStaffFamilyInput,
  CreateStaffHealthCheckInput,
  CreateStaffInput,
  CreateStaffInsuranceInput,
  CreateStaffQualificationInput,
  CreateStaffSpecialStatusInput,
  CreateStaffSubsidyInput,
  JobRole,
  MyStaffMember,
  MyStaffProfile,
  ReplaceStaffJobRolesInput,
  StaffAllowances,
  StaffAssignment,
  StaffEmergencyContact,
  StaffEmployment,
  StaffFamily,
  StaffHealthCheck,
  StaffInsurance,
  StaffJobRole,
  StaffMember,
  StaffQualification,
  StaffSpecialStatus,
  StaffSubsidy,
  UpdateJobRoleInput,
  UpdateStaffAssignmentInput,
  UpdateStaffEmergencyContactInput,
  UpdateStaffFamilyInput,
  UpdateStaffHealthCheckInput,
  UpdateStaffInput,
  UpdateStaffQualificationInput,
  UpdateStaffSubsidyInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createStaffNamespace(tx: SdkTransport) {
  return {
    list: (params?: { q?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.status) qs.set("status", params.status);
      const q = qs.toString();
      return tx.request<StaffMember[]>("GET", `/staff${q ? `?${q}` : ""}`);
    },
    /** GET /staff/me — 自分（ログインしている人に紐づく職員）の ID・社員番号・氏名。紐づいていなければ null */
    getMe: () => tx.request<MyStaffMember | null>("GET", `/staff/me`),
    /** GET /staff/me/profile — 自分の所属（今の発令）・職種・資格。紐づいていなければ null（本人の口・staff:read は要らない） */
    getMyProfile: () => tx.request<MyStaffProfile | null>("GET", `/staff/me/profile`),
    get: (id: string) => tx.request<StaffMember>("GET", `/staff/${pathParam(id, "id")}`),
    create: (input: CreateStaffInput) => tx.request<StaffMember>("POST", "/staff", input),
    bulkCreate: (input: { rows: CreateStaffInput[] }) =>
      tx.request<{
        created: number;
        failed: number;
        results: Array<{ index: number; ok: boolean; staffId?: string; employeeNumber?: string; error?: string }>;
      }>("POST", "/staff/bulk", input),
    bulkImportFile: (file: File | Blob) => {
      const formData = new FormData();
      formData.append("file", file);
      return tx.requestMultipart<{
        created: number;
        failed: number;
        results: Array<{ rowIndex: number; ok: boolean; staffId?: string; employeeNumber?: string; error?: string }>;
      }>("/staff/intake/import", formData);
    },
    intakeTemplate: (): Promise<Blob> => tx.requestBlob("GET", "/staff/intake/template"),
    update: (id: string, input: UpdateStaffInput) =>
      tx.request<StaffMember>("PATCH", `/staff/${pathParam(id, "id")}`, input),
    delete: (id: string) => tx.request<void>("DELETE", `/staff/${pathParam(id, "id")}`),
    qualifications: {
      list: (staffId: string) =>
        tx.request<StaffQualification[]>("GET", `/staff/${pathParam(staffId, "staffId")}/qualifications`),
      /** GET /staff/qualifications/expiring — 有効期限を持つ資格（職員をまたいで・期限の近い順） */
      expiring: () => tx.request<StaffQualification[]>("GET", "/staff/qualifications/expiring"),
      create: (staffId: string, input: CreateStaffQualificationInput) =>
        tx.request<StaffQualification>("POST", `/staff/${pathParam(staffId, "staffId")}/qualifications`, input),
      update: (staffId: string, id: string, input: UpdateStaffQualificationInput) =>
        tx.request<StaffQualification>("PATCH", `/staff/${pathParam(staffId, "staffId")}/qualifications/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/qualifications/${pathParam(id, "id")}`),
    },
    assignments: {
      list: (staffId: string) =>
        tx.request<StaffAssignment[]>("GET", `/staff/${pathParam(staffId, "staffId")}/assignments`),
      create: (staffId: string, input: CreateStaffAssignmentInput) =>
        tx.request<StaffAssignment>("POST", `/staff/${pathParam(staffId, "staffId")}/assignments`, input),
      update: (staffId: string, id: string, input: UpdateStaffAssignmentInput) =>
        tx.request<StaffAssignment>("PATCH", `/staff/${pathParam(staffId, "staffId")}/assignments/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/assignments/${pathParam(id, "id")}`),
    },
    family: {
      list: (staffId: string) =>
        tx.request<StaffFamily[]>("GET", `/staff/${pathParam(staffId, "staffId")}/family`),
      create: (staffId: string, input: CreateStaffFamilyInput) =>
        tx.request<StaffFamily>("POST", `/staff/${pathParam(staffId, "staffId")}/family`, input),
      update: (staffId: string, id: string, input: UpdateStaffFamilyInput) =>
        tx.request<StaffFamily>("PATCH", `/staff/${pathParam(staffId, "staffId")}/family/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/family/${pathParam(id, "id")}`),
    },
    emergencyContacts: {
      list: (staffId: string) =>
        tx.request<StaffEmergencyContact[]>("GET", `/staff/${pathParam(staffId, "staffId")}/emergency-contacts`),
      create: (staffId: string, input: CreateStaffEmergencyContactInput) =>
        tx.request<StaffEmergencyContact>("POST", `/staff/${pathParam(staffId, "staffId")}/emergency-contacts`, input),
      update: (staffId: string, id: string, input: UpdateStaffEmergencyContactInput) =>
        tx.request<StaffEmergencyContact>("PATCH", `/staff/${pathParam(staffId, "staffId")}/emergency-contacts/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/emergency-contacts/${pathParam(id, "id")}`),
    },
    employment: {
      get: (staffId: string) =>
        tx.request<StaffEmployment | null>("GET", `/staff/${pathParam(staffId, "staffId")}/employment`),
      upsert: (staffId: string, input: CreateStaffEmploymentInput) =>
        tx.request<StaffEmployment>("PUT", `/staff/${pathParam(staffId, "staffId")}/employment`, input),
    },
    insurance: {
      get: (staffId: string) =>
        tx.request<StaffInsurance | null>("GET", `/staff/${pathParam(staffId, "staffId")}/insurance`),
      upsert: (staffId: string, input: CreateStaffInsuranceInput) =>
        tx.request<StaffInsurance>("PUT", `/staff/${pathParam(staffId, "staffId")}/insurance`, input),
    },
    allowances: {
      get: (staffId: string) =>
        tx.request<StaffAllowances | null>("GET", `/staff/${pathParam(staffId, "staffId")}/allowances`),
      upsert: (staffId: string, input: CreateStaffAllowancesInput) =>
        tx.request<StaffAllowances>("PUT", `/staff/${pathParam(staffId, "staffId")}/allowances`, input),
    },
    subsidies: {
      list: (staffId: string) =>
        tx.request<StaffSubsidy[]>("GET", `/staff/${pathParam(staffId, "staffId")}/subsidies`),
      create: (staffId: string, input: CreateStaffSubsidyInput) =>
        tx.request<StaffSubsidy>("POST", `/staff/${pathParam(staffId, "staffId")}/subsidies`, input),
      update: (staffId: string, id: string, input: UpdateStaffSubsidyInput) =>
        tx.request<StaffSubsidy>("PATCH", `/staff/${pathParam(staffId, "staffId")}/subsidies/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/subsidies/${pathParam(id, "id")}`),
    },
    /** staff:sensitive スコープ必須 */
    specialStatus: {
      get: (staffId: string) =>
        tx.request<StaffSpecialStatus | null>("GET", `/staff/${pathParam(staffId, "staffId")}/special-status`),
      upsert: (staffId: string, input: CreateStaffSpecialStatusInput) =>
        tx.request<StaffSpecialStatus>("PUT", `/staff/${pathParam(staffId, "staffId")}/special-status`, input),
    },
    /** staff:sensitive スコープ必須 */
    healthChecks: {
      list: (staffId: string) =>
        tx.request<StaffHealthCheck[]>("GET", `/staff/${pathParam(staffId, "staffId")}/health-checks`),
      create: (staffId: string, input: CreateStaffHealthCheckInput) =>
        tx.request<StaffHealthCheck>("POST", `/staff/${pathParam(staffId, "staffId")}/health-checks`, input),
      update: (staffId: string, id: string, input: UpdateStaffHealthCheckInput) =>
        tx.request<StaffHealthCheck>("PATCH", `/staff/${pathParam(staffId, "staffId")}/health-checks/${pathParam(id, "id")}`, input),
      delete: (staffId: string, id: string) =>
        tx.request<void>("DELETE", `/staff/${pathParam(staffId, "staffId")}/health-checks/${pathParam(id, "id")}`),
    },
  };
}

export function createJobRoleNamespace(tx: SdkTransport) {
  return {
    list: (params?: { is_active?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
      const q = qs.toString();
      return tx.request<JobRole[]>("GET", `/staff/job-role/roles${q ? `?${q}` : ""}`);
    },
    get: (id: string) => tx.request<JobRole>("GET", `/staff/job-role/roles/${pathParam(id, "id")}`),
    create: (input: CreateJobRoleInput) => tx.request<JobRole>("POST", "/staff/job-role/roles", input),
    update: (id: string, input: UpdateJobRoleInput) =>
      tx.request<JobRole>("PATCH", `/staff/job-role/roles/${pathParam(id, "id")}`, input),
    delete: (id: string) => tx.request<void>("DELETE", `/staff/job-role/roles/${pathParam(id, "id")}`),
    listForStaff: (staffId: string) =>
      tx.request<StaffJobRole[]>("GET", `/staff/job-role/staff/${pathParam(staffId, "staffId")}/roles`),
    replaceForStaff: (staffId: string, input: ReplaceStaffJobRolesInput) =>
      tx.request<StaffJobRole[]>("PUT", `/staff/job-role/staff/${pathParam(staffId, "staffId")}/roles`, input),
  };
}
