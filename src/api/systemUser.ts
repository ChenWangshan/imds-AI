import { apiRequest } from "@/lib/api";

export type SystemUser = {
  id: number | string;
  username: string;
  phone?: string;
  email?: string;
  password?: string;
};

type UserListQuery = {
  currentPage: number;
  pageSize: number;
  username?: string;
};

type UserListResponse =
  | {
      data?: SystemUser[];
      list?: SystemUser[];
      rows?: SystemUser[];
      recordsTotal?: number;
      total?: number;
      count?: number;
    }
  | {
      data?: {
        data?: SystemUser[];
        list?: SystemUser[];
        rows?: SystemUser[];
        recordsTotal?: number;
        total?: number;
        count?: number;
      };
    };

type UserDetailResponse =
  | SystemUser
  | {
      data?: SystemUser;
    };

function unwrapListResponse(response: UserListResponse) {
  const payload = "data" in response && response.data && !Array.isArray(response.data)
    ? response.data
    : response;

  const data = payload.data ?? payload.list ?? payload.rows ?? [];
  const recordsTotal = payload.recordsTotal ?? payload.total ?? payload.count ?? data.length;

  return {
    data,
    recordsTotal,
  };
}

function unwrapDetailResponse(response: UserDetailResponse) {
  if ("data" in response && response.data) {
    return response.data;
  }

  return response as SystemUser;
}

export async function fetchUserPage(query: UserListQuery) {
  const response = await apiRequest<UserListResponse>("/api/users", {
    method: "GET",
    params: {
      currentPage: query.currentPage,
      page: query.currentPage,
      pageNum: query.currentPage,
      pageSize: query.pageSize,
      size: query.pageSize,
      username: query.username?.trim() || undefined,
    },
  });

  return unwrapListResponse(response);
}

export async function fetchUserDetail(id: number | string) {
  const response = await apiRequest<UserDetailResponse>(`/api/users/${id}`, {
    method: "GET",
  });

  return unwrapDetailResponse(response);
}

export async function createUser(payload: Omit<SystemUser, "id">) {
  return apiRequest<SystemUser | { data?: SystemUser }>("/api/users", {
    method: "POST",
    body: payload,
  });
}

export async function updateUser(id: number | string, payload: Omit<SystemUser, "id">) {
  return apiRequest<SystemUser | { data?: SystemUser }>(`/api/users/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteUser(id: number | string) {
  return apiRequest<unknown>(`/api/users/${id}`, {
    method: "DELETE",
  });
}
