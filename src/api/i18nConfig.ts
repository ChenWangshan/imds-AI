import { apiRequest } from "@/lib/api";

export type I18nConfig = {
  id?: number | string;
  configKey: string;
  zhValue: string;
  enValue: string;
  jaValue: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type I18nConfigPageQuery = {
  currentPage: number;
  enValue?: string;
  jaValue?: string;
  pageSize: number;
  keyword?: string;
  zhValue?: string;
};

export type I18nConfigPageResponse = {
  data?: I18nConfig[];
  recordsTotal?: number;
};

export async function fetchI18nConfigPage(query: I18nConfigPageQuery) {
  const response = await apiRequest<I18nConfigPageResponse>("/api/i18n/configs", {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      enValue: query.enValue?.trim() || undefined,
      jaValue: query.jaValue?.trim() || undefined,
      keyword: query.keyword?.trim() || undefined,
      zhValue: query.zhValue?.trim() || undefined,
    },
  });

  return {
    data: response.data ?? [],
    recordsTotal: response.recordsTotal ?? response.data?.length ?? 0,
  };
}

export async function fetchAllI18nConfigs() {
  return apiRequest<I18nConfig[]>("/api/i18n/configs/all");
}

export async function saveI18nConfig(payload: I18nConfig) {
  const body = {
    configKey: payload.configKey.trim(),
    description: payload.description ?? "",
    enValue: payload.enValue ?? "",
    jaValue: payload.jaValue ?? "",
    zhValue: payload.zhValue ?? "",
  };

  if (payload.id) {
    return apiRequest<I18nConfig>(`/api/i18n/configs/${payload.id}`, {
      method: "PUT",
      body,
    });
  }

  return apiRequest<I18nConfig>("/api/i18n/configs", {
    method: "POST",
    body,
  });
}

export async function deleteI18nConfig(id: number | string) {
  return apiRequest<unknown>(`/api/i18n/configs/${id}`, {
    method: "DELETE",
  });
}
