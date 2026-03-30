export type ApiError = {
  message: string;
  status: number;
};

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  token?: string | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed with status ${response.status}`;
    throw {
      message,
      status: response.status,
    } satisfies ApiError;
  }

  return data as T;
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, method = "GET", token } = options;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}
