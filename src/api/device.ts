import { apiRequest } from "@/lib/api";

const DEVICE_API_PREFIX = "/device-api/api";

export type DeviceRecord = {
  id: number | string;
  deviceCode: string;
  deviceType: string;
  organization: string;
  vin: string;
  deviceModel: string;
};

export type DeviceModelRecord = {
  id: number | string;
  modelName: string;
  deviceType: string;
  carLength: number;
  carWidth: number;
};

type DevicePageResponse = {
  data: DeviceRecord[];
  recordsTotal: number;
};

type DeviceModelPageResponse = {
  data: DeviceModelRecord[];
  recordsTotal: number;
};

export async function fetchDevicePage(query: {
  currentPage: number;
  pageSize: number;
  deviceCode?: string;
}) {
  return apiRequest<DevicePageResponse>(`${DEVICE_API_PREFIX}/devices`, {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      deviceCode: query.deviceCode?.trim() || undefined,
    },
  });
}

export async function fetchDeviceDetail(id: number | string) {
  return apiRequest<DeviceRecord>(`${DEVICE_API_PREFIX}/devices/${id}`, {
    method: "GET",
  });
}

export async function createDevice(payload: Omit<DeviceRecord, "id">) {
  return apiRequest<DeviceRecord>(`${DEVICE_API_PREFIX}/devices`, {
    method: "POST",
    body: payload,
  });
}

export async function updateDevice(id: number | string, payload: Omit<DeviceRecord, "id">) {
  return apiRequest<DeviceRecord>(`${DEVICE_API_PREFIX}/devices/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteDevice(id: number | string) {
  return apiRequest<{ message: string }>(`${DEVICE_API_PREFIX}/devices/${id}`, {
    method: "DELETE",
  });
}

export async function fetchDeviceModelPage(query: {
  currentPage: number;
  pageSize: number;
  modelName?: string;
}) {
  return apiRequest<DeviceModelPageResponse>(`${DEVICE_API_PREFIX}/device-models`, {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      modelName: query.modelName?.trim() || undefined,
    },
  });
}

export async function fetchDeviceModelDetail(id: number | string) {
  return apiRequest<DeviceModelRecord>(`${DEVICE_API_PREFIX}/device-models/${id}`, {
    method: "GET",
  });
}

export async function createDeviceModel(payload: Omit<DeviceModelRecord, "id">) {
  return apiRequest<DeviceModelRecord>(`${DEVICE_API_PREFIX}/device-models`, {
    method: "POST",
    body: payload,
  });
}

export async function updateDeviceModel(
  id: number | string,
  payload: Omit<DeviceModelRecord, "id">,
) {
  return apiRequest<DeviceModelRecord>(`${DEVICE_API_PREFIX}/device-models/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteDeviceModel(id: number | string) {
  return apiRequest<{ message: string }>(`${DEVICE_API_PREFIX}/device-models/${id}`, {
    method: "DELETE",
  });
}
