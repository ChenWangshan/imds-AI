import { apiRequest } from "@/lib/api";
import type { SystemMenu } from "@/api/menuManagement";

export type RoleVersionStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type RoleStatus = "enabled" | "disabled";

export type SystemRoleVersion = {
  versionCode: string;
  menuVersionCode: string;
  menuSnapshotHash: string;
  status: RoleVersionStatus | string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemRoleVersionPayload = {
  versionCode: string;
  menuVersionCode: string;
  status?: RoleVersionStatus | string;
  description?: string;
};

export type SystemRole = {
  id?: number | string;
  roleVersionCode: string;
  menuVersionCode: string;
  roleCode: string;
  roleName: string;
  status: RoleStatus | string;
  sourceRoleVersionCode: string;
  sourceRoleCode: string;
  description: string;
  permissionCodes: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type SystemRolePageQuery = {
  currentPage: number;
  pageSize: number;
  keyword?: string;
  roleVersion?: string;
  status?: string;
};

export type SystemRolePageResponse = {
  data?: SystemRole[];
  recordsTotal?: number;
};

export type SystemRoleExportResponse = {
  packageType: string;
  packageVersion: string;
  exportedAt: string;
  sourceSystem: string;
  roleVersion: string;
  menuVersion: string;
  menuSnapshotHash: string;
  roles: SystemRole[];
  menus: SystemMenu[];
};

function normalizeRolePayload(payload: Partial<SystemRole>) {
  return {
    description: String(payload.description ?? "").trim(),
    permissionCodes: Array.isArray(payload.permissionCodes)
      ? payload.permissionCodes.map((item) => String(item).trim()).filter(Boolean)
      : [],
    roleCode: String(payload.roleCode ?? "").trim(),
    roleName: String(payload.roleName ?? "").trim(),
    roleVersionCode: String(payload.roleVersionCode ?? "").trim(),
    sourceRoleCode: String(payload.sourceRoleCode ?? "").trim(),
    sourceRoleVersionCode: String(payload.sourceRoleVersionCode ?? "").trim(),
    status: String(payload.status ?? "enabled").trim(),
  };
}

export async function fetchSystemRoleVersions() {
  return apiRequest<SystemRoleVersion[]>("/api/system/roles/versions");
}

export async function createSystemRoleVersion(payload: SystemRoleVersionPayload) {
  return apiRequest<SystemRoleVersion>("/api/system/roles/versions", {
    method: "POST",
    body: {
      description: String(payload.description ?? "").trim(),
      menuVersionCode: String(payload.menuVersionCode ?? "").trim(),
      status: String(payload.status ?? "DRAFT").trim(),
      versionCode: String(payload.versionCode ?? "").trim(),
    },
  });
}

export async function fetchSystemRolePage(query: SystemRolePageQuery) {
  const response = await apiRequest<SystemRolePageResponse>("/api/system/roles", {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      keyword: query.keyword?.trim() || undefined,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      roleVersion: query.roleVersion?.trim() || undefined,
      size: query.pageSize,
      status: query.status?.trim() || undefined,
    },
  });

  return {
    data: response.data ?? [],
    recordsTotal: response.recordsTotal ?? response.data?.length ?? 0,
  };
}

export async function fetchAllSystemRoles(roleVersion?: string) {
  return apiRequest<SystemRole[]>("/api/system/roles/all", {
    method: "GET",
    params: {
      roleVersion: roleVersion?.trim() || undefined,
    },
  });
}

export async function fetchSystemRoleDetail(id: number | string) {
  return apiRequest<SystemRole>(`/api/system/roles/${id}`);
}

export async function saveSystemRole(payload: Partial<SystemRole>) {
  const body = normalizeRolePayload(payload);

  if (payload.id) {
    return apiRequest<SystemRole>(`/api/system/roles/${payload.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<SystemRole>("/api/system/roles", {
    method: "POST",
    body,
  });
}

export async function deleteSystemRole(id: number | string) {
  return apiRequest<unknown>(`/api/system/roles/${id}`, {
    method: "DELETE",
  });
}

export async function exportSystemRoleVersion(roleVersion: string, roleCodes: string[] = []) {
  return apiRequest<SystemRoleExportResponse>("/api/system/roles/export", {
    method: "GET",
    params: {
      roleCodes: roleCodes.length ? roleCodes.join(",") : undefined,
      roleVersion: roleVersion.trim(),
    },
  });
}
