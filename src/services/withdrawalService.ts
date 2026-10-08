import { apiRequest } from "./api";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";

export type Withdrawal = {
  id: number;
  kocId: number;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: WithdrawalStatus;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// --- KOC ---
export async function requestWithdrawal(amount: number, earningIds?: number[]) {
  return apiRequest<{ message: string; withdrawal: Withdrawal }>("/api/withdrawals/request", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ amount, earningIds }),
  });
}

export async function getMyWithdrawals() {
  return apiRequest<{ items: Withdrawal[] }>("/api/withdrawals/me", { auth: true });
}

// --- Admin ---
export async function adminListWithdrawals(status?: WithdrawalStatus) {
  const query = status ? `?status=${status}` : "";
  return apiRequest<{ items: Withdrawal[] }>(`/api/withdrawals/admin/list${query}`, { auth: true });
}

export async function adminUpdateWithdrawalStatus(id: number, status: WithdrawalStatus, adminNote?: string) {
  return apiRequest<{ withdrawal: Withdrawal }>(`/api/withdrawals/admin/${id}/status`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ status, adminNote }),
  });
}
