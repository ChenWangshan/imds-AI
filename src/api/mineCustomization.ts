import { apiRequest } from "@/lib/api";

export type MineCustomizationMenu = {
  systemCode: string;
  menuCode: string;
};

export type SystemMineCustomization = {
  id?: number | string;
  baseVersionCode: string;
  versionName: string;
  mineAreas: string[];
  status: string;
  description: string;
  menus: MineCustomizationMenu[];
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type SystemMineCustomizationPayload = {
  baseVersionCode: string;
  versionName: string;
  mineAreas: string[];
  status?: string;
  description?: string;
  menus: MineCustomizationMenu[];
};

export type SystemMineCustomizationQuery = {
  baseVersionCode?: string;
  versionName?: string;
  systemCode?: string;
};

export type SystemMineCustomizationPageResponse = {
  data?: SystemMineCustomization[];
  recordsTotal?: number;
};

function normalizeMenus(menus: MineCustomizationMenu[] = []) {
  return menus
    .map((item) => ({
      systemCode: String(item.systemCode ?? "").trim(),
      menuCode: String(item.menuCode ?? "").trim(),
    }))
    .filter((item) => item.systemCode && item.menuCode);
}

function normalizePayload(payload: SystemMineCustomizationPayload) {
  return {
    baseVersionCode: String(payload.baseVersionCode ?? "").trim(),
    versionName: String(payload.versionName ?? "").trim(),
    mineAreas: Array.isArray(payload.mineAreas)
      ? payload.mineAreas.map((item) => String(item).trim()).filter(Boolean)
      : [],
    status: String(payload.status ?? "DRAFT").trim(),
    description: String(payload.description ?? "").trim(),
    menus: normalizeMenus(payload.menus),
  };
}

export async function fetchSystemMineCustomizations(query: SystemMineCustomizationQuery = {}) {
  const response = await apiRequest<SystemMineCustomizationPageResponse>(
    "/api/system/mine-customizations",
    {
      method: "GET",
      params: {
        baseVersionCode: query.baseVersionCode?.trim() || undefined,
        systemCode: query.systemCode?.trim() || undefined,
        versionName: query.versionName?.trim() || undefined,
      },
    },
  );

  return {
    data: response.data ?? [],
    recordsTotal: response.recordsTotal ?? response.data?.length ?? 0,
  };
}

export async function fetchSystemMineCustomizationDetail(id: number | string) {
  return apiRequest<SystemMineCustomization>(`/api/system/mine-customizations/${id}`);
}

export async function createSystemMineCustomization(payload: SystemMineCustomizationPayload) {
  return apiRequest<SystemMineCustomization>("/api/system/mine-customizations", {
    method: "POST",
    body: normalizePayload(payload),
  });
}

export async function updateSystemMineCustomization(
  id: number | string,
  payload: SystemMineCustomizationPayload,
) {
  return apiRequest<SystemMineCustomization>(`/api/system/mine-customizations/${id}`, {
    method: "PUT",
    body: normalizePayload(payload),
  });
}

export async function deleteSystemMineCustomization(id: number | string) {
  return apiRequest<unknown>(`/api/system/mine-customizations/${id}`, {
    method: "DELETE",
  });
}
