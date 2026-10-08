import { apiRequest } from "./api";

export type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string | string[];
};

export type UserSubscription = {
  id: number;
  marketer_id: number;
  plan_id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  features: string | string[];
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>("/api/subscriptions/plans");
}

export async function createSubscriptionCheckout(planId: number): Promise<{ checkoutUrl: string; isFree?: boolean }> {
  return apiRequest<{ checkoutUrl: string; isFree?: boolean }>("/api/subscriptions/checkout", {
    method: "POST",
    body: JSON.stringify({ planId }),
    auth: true,
  });
}

export async function getMySubscription(): Promise<UserSubscription | null> {
  return apiRequest<UserSubscription | null>("/api/subscriptions/me", {
    auth: true,
  });
}
