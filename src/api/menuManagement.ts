import { apiRequest } from "@/lib/api";

export type MenuModelStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type MenuType = "DIRECTORY" | "MENU" | "BUTTON";

export type SystemMenu = {
  id?: number | string;
  modelCode: string;
  modelName: string;
  modelVersion: string;
  modelStatus: MenuModelStatus | string;
  systemCode: string;
  parentMenuCode: string;
  menuCode: string;
  menuName: string;
  menuNameEn: string;
  menuType: MenuType | string;
  routePath: string;
  componentPath: string;
  icon: string;
  sortNo: number;
  permissionCodes: string;
  apiBindings: string;
  visible: boolean;
  enabled: boolean;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemMenuVersion = {
  versionCode: string;
  versionName: string;
  status: MenuModelStatus | string;
  baseVersionCode: string;
  snapshotHash: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemMenuVersionPayload = {
  versionCode: string;
  versionName?: string;
  status?: MenuModelStatus | string;
  baseVersionCode?: string;
  description?: string;
};

export type SystemMenuExportResponse = {
  packageType: string;
  packageVersion: string;
  exportedAt: string;
  sourceSystem: string;
  menuVersion: string;
  menuSnapshotHash: string;
  menus: SystemMenu[];
};

export type SystemMenuPageQuery = {
  currentPage: number;
  pageSize: number;
  keyword?: string;
  menuVersion?: string;
  modelCode?: string;
  modelStatus?: string;
  systemCode?: string;
  menuType?: string;
};

export type SystemMenuPageResponse = {
  data?: SystemMenu[];
  recordsTotal?: number;
};

export type SystemMenuListQuery = {
  menuVersion?: string;
  modelCode?: string;
  systemCode?: string;
};

type ListResponse<T> =
  | T[]
  | {
      content?: T[];
      data?: T[];
      list?: T[];
      records?: T[];
      rows?: T[];
    };

function unwrapArrayResponse<T>(response: ListResponse<T>) {
  if (Array.isArray(response)) return response;

  return (
    response.data ??
    response.records ??
    response.rows ??
    response.list ??
    response.content ??
    []
  );
}

function normalizePayload(payload: Partial<SystemMenu>) {
  return {
    apiBindings: String(payload.apiBindings ?? "").trim(),
    componentPath: String(payload.componentPath ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    enabled: payload.enabled ?? true,
    icon: String(payload.icon ?? "").trim(),
    menuCode: String(payload.menuCode ?? "").trim(),
    menuName: String(payload.menuName ?? "").trim(),
    menuNameEn: String(payload.menuNameEn ?? "").trim(),
    menuType: String(payload.menuType ?? "MENU").trim(),
    modelCode: String(payload.modelCode ?? "").trim(),
    modelName: String(payload.modelName ?? "").trim(),
    modelStatus: String(payload.modelStatus ?? "DRAFT").trim(),
    modelVersion: String(payload.modelVersion ?? "").trim(),
    parentMenuCode: String(payload.parentMenuCode ?? "").trim(),
    permissionCodes: String(payload.permissionCodes ?? "").trim(),
    routePath: String(payload.routePath ?? "").trim(),
    sortNo: Number(payload.sortNo ?? 0),
    systemCode: String(payload.systemCode ?? "").trim(),
    visible: payload.visible ?? true,
  };
}

export async function fetchSystemMenuPage(query: SystemMenuPageQuery) {
  const response = await apiRequest<SystemMenuPageResponse>("/api/system/menus", {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      keyword: query.keyword?.trim() || undefined,
      menuVersion: query.menuVersion?.trim() || query.modelCode?.trim() || undefined,
      menuType: query.menuType?.trim() || undefined,
      modelCode: query.modelCode?.trim() || undefined,
      modelStatus: query.modelStatus?.trim() || undefined,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      systemCode: query.systemCode?.trim() || undefined,
    },
  });

  return {
    data: response.data ?? [],
    recordsTotal: response.recordsTotal ?? response.data?.length ?? 0,
  };
}

export async function fetchAllSystemMenus(query: SystemMenuListQuery = {}) {
  return apiRequest<SystemMenu[]>("/api/system/menus/all", {
    method: "GET",
    params: {
      menuVersion: query.menuVersion?.trim() || query.modelCode?.trim() || undefined,
      modelCode: query.modelCode?.trim() || undefined,
      systemCode: query.systemCode?.trim() || undefined,
    },
  });
}

export async function fetchSystemMenuDetail(id: number | string) {
  return apiRequest<SystemMenu>(`/api/system/menus/${id}`);
}

export async function fetchSystemMenuVersions() {
  const response = await apiRequest<ListResponse<SystemMenuVersion>>("/api/system/menus/versions");
  return unwrapArrayResponse(response);
}

export async function createSystemMenuVersion(payload: SystemMenuVersionPayload) {
  return apiRequest<SystemMenuVersion>("/api/system/menus/versions", {
    method: "POST",
    body: {
      baseVersionCode: String(payload.baseVersionCode ?? "").trim(),
      description: String(payload.description ?? "").trim(),
      status: String(payload.status ?? "DRAFT").trim(),
      versionCode: String(payload.versionCode ?? "").trim(),
      versionName: String(payload.versionName ?? payload.versionCode ?? "").trim(),
    },
  });
}

export async function exportSystemMenuVersion(menuVersion: string, systemCode?: string) {
  return apiRequest<SystemMenuExportResponse>("/api/system/menus/export", {
    method: "GET",
    params: {
      menuVersion: menuVersion.trim(),
      systemCode: systemCode?.trim() || undefined,
    },
  });
}

export async function saveSystemMenu(payload: Partial<SystemMenu>) {
  const body = normalizePayload(payload);

  if (payload.id) {
    return apiRequest<SystemMenu>(`/api/system/menus/${payload.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<SystemMenu>("/api/system/menus", {
    method: "POST",
    body,
  });
}

export async function deleteSystemMenu(id: number | string) {
  return apiRequest<unknown>(`/api/system/menus/${id}`, {
    method: "DELETE",
  });
}
