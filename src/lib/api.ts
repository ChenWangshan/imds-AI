import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "vue3-ai-token";

export type ApiError = {
  message: string;
  status: number;
};

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  params?: Record<string, unknown>;
  token?: string | null;
};

type RequestConfigWithToken = InternalAxiosRequestConfig & {
  token?: string | null;
};

function readStoredToken() {
  if (typeof window === "undefined") return "";

  const rawValue = window.localStorage.getItem(TOKEN_KEY);
  if (!rawValue) return "";

  try {
    return JSON.parse(rawValue) as string;
  } catch {
    return "";
  }
}

function createApiError(error: AxiosError | Error): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: error.message || "Request failed",
      status: 500,
    };
  }

  const responseData = error.response?.data;
  const message =
    (typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData &&
      typeof responseData.message === "string" &&
      responseData.message) ||
    (typeof responseData === "object" &&
      responseData !== null &&
      "error" in responseData &&
      typeof responseData.error === "string" &&
      responseData.error) ||
    (typeof responseData === "string" && responseData) ||
    error.message ||
    "Request failed";

  return {
    message,
    status: error.response?.status ?? 500,
  };
}

export const apiClient = axios.create({
  baseURL: "/",
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: RequestConfigWithToken) => {
    const requestConfig = config;
    const token = requestConfig.token ?? readStoredToken();

    requestConfig.headers = requestConfig.headers ?? {};
    const isFormData =
      typeof FormData !== "undefined" && requestConfig.data instanceof FormData;

    if (isFormData) {
      delete requestConfig.headers["Content-Type"];
    } else if (!requestConfig.headers["Content-Type"]) {
      requestConfig.headers["Content-Type"] = "application/json";
    }

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    return requestConfig;
  },
  (error) => Promise.reject(createApiError(error)),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => Promise.reject(createApiError(error)),
);

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, method = "GET", params, token } = options;

  return apiClient.request<T, T>({
    url,
    method: method as AxiosRequestConfig["method"],
    data: body,
    headers,
    params,
    token,
  } as RequestConfigWithToken);
}
