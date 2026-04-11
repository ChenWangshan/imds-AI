import { apiClient, apiRequest } from "@/lib/api";

const DISPATCH_API_PREFIX = "/dispatch-api/api";

export type BlendingPlanChild = {
  id?: string;
  loadingPointId?: string;
  plannedOutput?: number | string;
  unloadRatio?: number | string;
};

export type BlendingPlanGroup = {
  id?: string;
  dumpPoint?: string;
  totalQuantity?: number | string;
  unit?: string;
  productionPlanType?: string;
  productionTarget?: number | string;
  children?: BlendingPlanChild[];
};

export type BlendingPlanRecord = {
  id: number | string;
  planId: string;
  planName: string;
  planDate: string;
  planShift: string;
  blendingMode: string;
  organization: string;
  stockpileCount: number;
  dumpAreaCount: number;
  totalTonnage: number;
  creator: string;
  createdAt: string;
  status: string;
  completionRatio: number;
  planGroups?: BlendingPlanGroup[];
};

type BlendingPlanPageResponse = {
  data: BlendingPlanRecord[];
  recordsTotal: number;
};

type BlendingPlanMutationPayload = Omit<BlendingPlanRecord, "id" | "creator" | "createdAt">;

export async function fetchBlendingPlanPage(query: {
  currentPage: number;
  pageSize: number;
  planId?: string;
  planName?: string;
  planDate?: string;
  planShift?: string;
  blendingMode?: string;
  organization?: string;
  createdAt?: string;
  status?: string;
}) {
  return apiRequest<BlendingPlanPageResponse>(`${DISPATCH_API_PREFIX}/blending-plans`, {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      planId: query.planId?.trim() || undefined,
      planName: query.planName?.trim() || undefined,
      planDate: query.planDate?.trim() || undefined,
      planShift: query.planShift?.trim() || undefined,
      blendingMode: query.blendingMode?.trim() || undefined,
      organization: query.organization?.trim() || undefined,
      createdAt: query.createdAt?.trim() || undefined,
      status: query.status?.trim() || undefined,
    },
  });
}

export async function fetchBlendingPlanDetail(id: number | string) {
  return apiRequest<BlendingPlanRecord>(`${DISPATCH_API_PREFIX}/blending-plans/${id}`, {
    method: "GET",
  });
}

export async function createBlendingPlan(payload: BlendingPlanMutationPayload) {
  return apiRequest<BlendingPlanRecord>(`${DISPATCH_API_PREFIX}/blending-plans`, {
    method: "POST",
    body: payload,
  });
}

export async function updateBlendingPlan(id: number | string, payload: BlendingPlanMutationPayload) {
  return apiRequest<BlendingPlanRecord>(`${DISPATCH_API_PREFIX}/blending-plans/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteBlendingPlan(id: number | string) {
  return apiRequest<{ message: string }>(`${DISPATCH_API_PREFIX}/blending-plans/${id}`, {
    method: "DELETE",
  });
}

export async function downloadBlendingPlanTemplate() {
  return apiClient.request<Blob, Blob>({
    method: "GET",
    responseType: "blob",
    url: `${DISPATCH_API_PREFIX}/blending-plans/template/export`,
  });
}

export async function importBlendingPlans(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.request<{ importedCount: number; message: string }, { importedCount: number; message: string }>({
    method: "POST",
    url: `${DISPATCH_API_PREFIX}/blending-plans/import`,
    data: formData,
  });
}
