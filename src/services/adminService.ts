import { apiRequest } from "./api";

export type AdminUserStatus = "active" | "inactive" | "banned";
export type AdminUserRole = "admin" | "marketer" | "koc";

export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardResponse = {
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
  };
  recentUsers: AdminUser[];
  recentCampaigns: Array<{
    id: number;
    title: string;
    status: string;
    platform: string | null;
    budget: number;
    createdAt: string;
    marketerName: string;
  }>;
  bookingStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  earningsSummary?: AdminEarningsSummary;
  disputeMetrics?: {
    totalDisputes: number;
    openDisputes: number;
    underReviewDisputes: number;
  };
};

export type AdminReportsResponse = {
  monthlyRevenue: Array<{
    label: string;
    bookingsCount: number;
    totalAmount: number;
    paidAmount: number;
  }>;
  topKocs: Array<{
    id: number;
    fullName: string;
    bookingCount: number;
    totalAmount: number;
  }>;
  topMarketers: Array<{
    id: number;
    fullName: string;
    campaignCount: number;
    totalBudget: number;
  }>;
  campaignStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    count: number;
  }>;
};

export type AdminEarning = {
  id: number;
  bookingId: number;
  kocId: number;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  kocName: string;
  marketerName: string;
  campaignTitle: string;
};

export type AdminEarningsSummary = {
  grossRevenue: number;
  creatorCommission: number;
  platformProfit: number;
  paidAmount: number;
  pendingAmount: number;
  totalRecords: number;
  platformFeePercent?: number;
};

export type AdminPaymentStatus = "pending" | "paid" | "confirmed" | "rejected" | "cancelled" | "expired";

export type AdminPayment = {
  id: number;
  paymentId: number;
  bookingId: number | null;
  campaignId: number | null;
  campaignTitle: string | null;
  marketerId: number | null;
  marketerName: string | null;
  marketerEmail: string | null;
  kocId: number | null;
  kocName: string | null;
  kocEmail: string | null;
  amount: number;
  paymentMethod: string;
  transactionCode: string | null;
  paymentProofUrl: string | null;
  submittedAt: string | null;
  status: AdminPaymentStatus;
  reviewedByAdminId: number | null;
  reviewedByAdminName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  bookingStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentsSummary = {
  pending: number;
  confirmed: number;
  rejected: number;
};

export async function getAdminDashboard() {
  return apiRequest<AdminDashboardResponse>("/api/admin/dashboard", {
    method: "GET",
    auth: true,
  });
}

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminCampaign = {
  id: number;
  marketerId: number;
  title: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  budget: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  marketerName: string;
  marketerEmail: string;
};

export async function listAdminUsers(params?: {
  role?: AdminUserRole | "";
  status?: AdminUserStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: AdminUser[]; pagination: AdminPagination }>(`/api/admin/users${suffix}`, {
    method: "GET",
    auth: true,
  });
}

export async function getAdminUser(userId: number) {
  return apiRequest<{ user: AdminUser }>(`/api/admin/users/${userId}`, {
    method: "GET",
    auth: true,
  });
}

export async function updateAdminUserStatus(userId: number, status: AdminUserStatus) {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/status`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function updateAdminUserRole(userId: number, role: Exclude<AdminUserRole, "admin">) {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ role }),
  });
}

export async function banAdminUser(userId: number) {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/ban`, {
    method: "PUT",
    auth: true,
  });
}

export async function unbanAdminUser(userId: number) {
  return apiRequest<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}/unban`, {
    method: "PUT",
    auth: true,
  });
}

export async function listAdminCampaigns(params?: {
  status?: string;
  marketerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.marketerId) query.set("marketerId", String(params.marketerId));
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: AdminCampaign[]; pagination: AdminPagination }>(`/api/admin/campaigns${suffix}`, {
    method: "GET",
    auth: true,
  });
}

export async function getAdminReports() {
  return apiRequest<AdminReportsResponse>("/api/admin/reports", {
    method: "GET",
    auth: true,
  });
}

export async function listAdminEarnings() {
  return apiRequest<{ items: AdminEarning[]; summary: AdminEarningsSummary }>("/api/admin/earnings", {
    method: "GET",
    auth: true,
  });
}

export async function listAdminPayments(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: AdminPayment[]; summary: AdminPaymentsSummary }>(`/api/admin/payments${suffix}`, {
    method: "GET",
    auth: true,
  });
}

export async function getAdminPayment(paymentId: number) {
  return apiRequest<{ payment: AdminPayment }>(`/api/admin/payments/${paymentId}`, {
    method: "GET",
    auth: true,
  });
}

export async function confirmAdminPayment(paymentId: number) {
  return apiRequest<{ message: string; payment: AdminPayment }>(`/api/admin/payments/${paymentId}/confirm`, {
    method: "PATCH",
    auth: true,
  });
}

export async function rejectAdminPayment(paymentId: number, rejectionReason: string) {
  return apiRequest<{ message: string; payment: AdminPayment }>(`/api/admin/payments/${paymentId}/reject`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ rejectionReason }),
  });
}
