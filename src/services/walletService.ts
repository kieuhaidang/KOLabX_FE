import { apiRequest } from "./api";
import { Withdrawal } from "./withdrawalService";

export type WalletTransactionType = "refund" | "withdrawal" | "payment";

export type WalletTransaction = {
  id: number;
  walletId: number;
  amount: number;
  type: WalletTransactionType;
  referenceId: number | null;
  description: string;
  createdAt: string;
};

export type Wallet = {
  id: number;
  userId: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type WalletData = {
  wallet: Wallet;
  transactions: WalletTransaction[];
  withdrawals: Withdrawal[];
};

export async function getMyWallet() {
  return apiRequest<WalletData>("/api/wallets/me", { auth: true });
}

export async function requestWalletWithdrawal(data: {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}) {
  return apiRequest<{
    message: string;
    wallet: Wallet;
    withdrawal: Withdrawal;
  }>("/api/wallets/withdraw", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}
