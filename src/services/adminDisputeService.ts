import { apiRequest } from "./api";

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_release_payment"
  | "resolved_refund"
  | "rejected";

export type AdminDispute = {
  id: number;
  bookingId: number;
  campaignTitle: string;
  reporterName: string;
  reporterRole: "marketer" | "koc" | "admin";
  respondentName: string;
  reason: string;
  evidence: string | null;
  status: DisputeStatus;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAdminDisputes(params?: { status?: DisputeStatus | ""; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiRequest<{ items: AdminDispute[] }>(`/api/admin/disputes${suffix}`, {
    method: "GET",
    auth: true,
  });
}

export async function getAdminDispute(disputeId: number) {
  return apiRequest<{ dispute: AdminDispute }>(`/api/admin/disputes/${disputeId}`, {
    method: "GET",
    auth: true,
  });
}

export async function updateAdminDisputeStatus(
  disputeId: number,
  payload: { status: DisputeStatus; resolutionNote?: string }
) {
  return apiRequest<{ message: string; dispute: AdminDispute }>(`/api/admin/disputes/${disputeId}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}
