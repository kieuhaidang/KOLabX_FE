const rawApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const isDev = import.meta.env.DEV;

// Ưu tiên dùng đường dẫn tương đối ("") trong Production để tránh lộ localhost
export const API_BASE_URL = isDev
  ? (rawApiUrl || "http://localhost:5000")
  : (rawApiUrl.includes("localhost") || rawApiUrl.includes("127.0.0.1") ? "" : rawApiUrl);

export const AUTH_USER_KEY = "kolab_auth_user";
export const AUTH_TOKEN_KEY = "kolab_auth_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (!(rest.body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson && (payload as any)?.message) || `Lỗi hệ thống (${response.status})`;
    if (auth && response.status === 401) {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<{ url: string }>("/api/upload", {
    method: "POST",
    body: formData,
    auth: true,
  });
}
