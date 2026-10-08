import { apiRequest } from "./api";
import type { Campaign } from "./campaignService";

export type PaymentLinkResponse = {
  bin: string;
  checkoutUrl: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  paymentRequestId: string;
  status: string;
  qrCode: string;
};

export async function createPaymentLink(data: {
  amount: number;
  description?: string;
  bookingId?: number;
}) {
  return apiRequest<PaymentLinkResponse>("/api/payments/create-link", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function verifyPayment(orderCode: number) {
  return apiRequest<{ orderCode: number; status: string }>(`/api/payments/verify/${orderCode}`, {
    auth: true,
  });
}

export type CampaignPaymentVerification = {
  orderCode: number;
  paymentId: number;
  status: string;
  providerStatus: string | null;
  checkoutUrl: string;
  campaign: Campaign;
};

export async function verifyCampaignPayment(orderCode: number) {
  return apiRequest<CampaignPaymentVerification>(`/api/payments/campaigns/verify/${orderCode}`, {
    auth: true,
  });
}
