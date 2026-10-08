import { apiRequest } from "./api";

export type EarningStatus = "pending" | "paid" | "cancelled";

export type Earning = {
  id: number;
  bookingId: number;
  kocId: number;
  amount: number;
  status: EarningStatus;
  withdrawalStatus?: "available" | "pending_withdrawal" | "withdrawn" | "rejected";
  campaignTitle?: string;
  marketerName?: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getMyEarnings() {
  return apiRequest<{ items: Earning[] }>("/api/earnings/me", { auth: true });
}
