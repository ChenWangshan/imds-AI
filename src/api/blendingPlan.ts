import { apiRequest } from "@/lib/api";

const DISPATCH_API_PREFIX = "/dispatch-api/api";

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
};

type BlendingPlanPageResponse = {
  data: BlendingPlanRecord[];
  recordsTotal: number;
};

export async function fetchBlendingPlanPage(query: {
  currentPage: number;
  pageSize: number;
  planName?: string;
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
      planName: query.planName?.trim() || undefined,
      status: query.status?.trim() || undefined,
    },
  });
}

export async function fetchBlendingPlanDetail(id: number | string) {
  return apiRequest<BlendingPlanRecord>(`${DISPATCH_API_PREFIX}/blending-plans/${id}`, {
    method: "GET",
  });
}

export async function createBlendingPlan(payload: Omit<BlendingPlanRecord, "id" | "creator" | "createdAt">) {
  return apiRequest<BlendingPlanRecord>(`${DISPATCH_API_PREFIX}/blending-plans`, {
    method: "POST",
    body: payload,
  });
}

export async function updateBlendingPlan(
  id: number | string,
  payload: Omit<BlendingPlanRecord, "id" | "creator" | "createdAt">,
) {
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
