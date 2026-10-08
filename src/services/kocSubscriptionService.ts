import { apiRequest } from "./api";

export type KocSubscription = {
  plan: "free" | "plus";
  used: number;
  limit: number;
  resetAt: string | Date | null;
  isSearchBoosted: boolean;
};

export async function getKocSubscription() {
  return apiRequest<{ subscription: KocSubscription }>("/api/koc/subscription", { auth: true });
}

export async function upgradeKocToPlus() {
  return apiRequest<{ message: string; subscription: KocSubscription }>("/api/koc/subscription/upgrade-plus", {
    method: "POST",
    auth: true,
  });
}

