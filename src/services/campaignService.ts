import { apiRequest } from "./api";

export type CampaignStatus = "draft" | "scheduled" | "open" | "paused" | "in_progress" | "completed" | "cancelled" | "pending_payment";

export type Campaign = {
  id: number;
  marketerId: number;
  title: string;
  description: string;
  category: string;
  platform: string;
  targetFollowersMin: number;
  targetFollowersMax: number;
  targetEngagementMin: number;
  budget: number;
  remainingBudget?: number;
  totalDeposited?: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  productName?: string;
  productDescription?: string;
  productImages?: string[];
};

export type MarketerStats = {
  totalSpent: number;
  activeKocs: number;
  spendingTrend: Array<{ date: string; amount: number }>;
};

export type CampaignCreateResponse = {
  message: string;
  campaign: Campaign;
};

export async function createCampaign(data: any, idempotencyKey: string) {
  return apiRequest<CampaignCreateResponse>("/api/campaigns", {
    method: "POST",
    auth: true,
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(data),
  });
}

export async function listCampaigns(filters: { status?: string; platform?: string; category?: string } = {}) {
  const params = new URLSearchParams(filters as any).toString();
  return apiRequest<{ items: Campaign[] }>(`/api/campaigns?${params}`, { auth: true });
}

export async function listAvailableCampaigns(filters: any = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiRequest<{ items: Campaign[] }>(`/api/campaigns/available?${params}`, { auth: true });
}

export async function getCampaignById(id: number) {
  return apiRequest<{ campaign: Campaign }>(`/api/campaigns/${id}`, { auth: true });
}

export async function updateCampaign(id: number, data: any) {
  return apiRequest<{ campaign: Campaign }>(`/api/campaigns/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: number) {
  return apiRequest<{ message: string }>(`/api/campaigns/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getMarketerStats() {
  return apiRequest<MarketerStats>("/api/campaigns/stats", { auth: true });
}

export async function payCampaign(id: number) {
  return apiRequest<{ campaignId: number; paymentId: number; orderCode: number; checkoutUrl: string }>(`/api/campaigns/${id}/pay`, {
    method: "POST",
    auth: true,
  });
}

export async function topupCampaign(id: number, amount: number) {
  return apiRequest<{ checkoutUrl: string }>(`/api/campaigns/${id}/topup`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ amount }),
  });
}
