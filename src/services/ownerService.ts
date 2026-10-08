import { apiRequest } from "./api";
import type { AdminEarningsSummary, AdminPagination, AdminUserStatus } from "./adminService";

export type OwnerAdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "marketer" | "koc";
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type OwnerDashboardResponse = {
  metrics: {
    totalUsers: number;
    totalMarketers: number;
    totalKocs: number;
    activeUsers: number;
    totalCampaigns: number;
    openCampaigns: number;
    totalBookings: number;
    pendingBookings: number;
    totalEarnings: number;
    paidEarnings: number;
    pendingEarnings: number;
    totalAdmins: number;
    activeAdmins: number;
    totalDisputes: number;
    openDisputes: number;
    underReviewDisputes: number;
  };
  recentUsers: OwnerAdminUser[];
  recentCampaigns: Array<{
    id: number;
    title: string;
    status: string;
    platform: string | null;
    budget: number;
    createdAt: string;
    marketerName: string;
  }>;
  bookingStatusBreakdown: Array<{ status: string; count: number }>;
  earningsSummary: AdminEarningsSummary;
  disputeMetrics: {
    totalDisputes: number;
    openDisputes: number;
    underReviewDisputes: number;
  };
  financialSettings: PlatformFinancialSettings | null;
  recentAuditLogs: AuditLogItem[];
};

export type PlatformFinancialSettings = {
  id: number;
  platformFeePercent: number;
  kocPayoutPercent: number;
  payoutDelayDays: number;
  autoReleaseEnabled: boolean;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogItem = {
  id: number;
  actorId: number | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  description: string | null;
  createdAt: string;
};

export async function getOwnerDashboard() {
  return apiRequest<OwnerDashboardResponse>("/api/owner/dashboard", {
    method: "GET",
    auth: true,
  });
}

export async function listOwnerAdmins(params?: {
  status?: AdminUserStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: OwnerAdminUser[]; pagination: AdminPagination }>(`/api/owner/admins${suffix}`, {
    method: "GET",
    auth: true,
  });
}

export async function updateOwnerAdminStatus(userId: number, status: AdminUserStatus) {
  return apiRequest<{ message: string; user: OwnerAdminUser }>(`/api/owner/admins/${userId}/status`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function updateOwnerAdminRole(userId: number, role: "admin" | "marketer" | "koc") {
  return apiRequest<{ message: string; user: OwnerAdminUser }>(`/api/owner/admins/${userId}/role`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ role }),
  });
}

export async function getOwnerFinancialSettings() {
  return apiRequest<{ settings: PlatformFinancialSettings }>("/api/owner/financial-settings", {
    method: "GET",
    auth: true,
  });
}

export async function updateOwnerFinancialSettings(payload: Partial<PlatformFinancialSettings>) {
  return apiRequest<{ message: string; settings: PlatformFinancialSettings }>("/api/owner/financial-settings", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function listOwnerAuditLogs(params?: {
  action?: string;
  targetType?: string;
  actorId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.targetType) query.set("targetType", params.targetType);
  if (params?.actorId) query.set("actorId", String(params.actorId));
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: AuditLogItem[]; pagination: AdminPagination }>(`/api/owner/audit-logs${suffix}`, {
    method: "GET",
    auth: true,
  });
}
