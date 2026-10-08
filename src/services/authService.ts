import { apiRequest, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "./api";

export type UserRole = "owner" | "admin" | "marketer" | "koc";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  themePreference?: string | null;
};

export function getHomePathForRole(role: UserRole) {
  if (role === "owner") return "/owner/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return `/${role}`;
}

type AuthResponse = {
  message: string;
  token?: string;
  user: AuthUser;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  role: "marketer" | "koc";
};

type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

type MeResponse = {
  user: AuthUser;
};

function persistAuth(user: AuthUser, token?: string) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  persistAuth(response.user, response.token);
  return response;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  persistAuth(response.user, response.token);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<MeResponse>("/api/auth/me", {
    method: "GET",
    auth: true,
  });

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  return response.user;
}

export async function updateThemePreference(themeId: string): Promise<{ themePreference: string }> {
  return apiRequest<{ themePreference: string }>("/api/auth/me/theme", {
    method: "PATCH",
    body: JSON.stringify({ themeId }),
    auth: true,
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
