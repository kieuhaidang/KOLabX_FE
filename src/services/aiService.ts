import { apiRequest } from "./api";

export type AiBriefRecord = {
  id: number;
  marketerId: number;
  inputText: string;
  optionalFields: {
    brand?: string | null;
    product?: string | null;
    platform?: string | null;
    targetAudience?: string | null;
    budget?: string | null;
  };
  result: AutoBriefResult;
  createdAt: string;
};

export type ScriptReviewRecord = {
  id: number;
  kocId: number;
  inputScript: string;
  optionalFields: {
    platform?: string | null;
    tone?: string | null;
    product?: string | null;
    targetAudience?: string | null;
  };
  result: ScriptDoctorResult;
  createdAt: string;
  updatedAt?: string;
};

export type AiUsage = {
  plan: "free" | "plus";
  used: number;
  limit: number;
  remaining?: number;
  resetAt: string | Date | null;
  isSearchBoosted: boolean;
};

export type SmartMatchingItem = {
  id: number;
  userId: number;
  name: string;
  niche: string | null;
  platform: string | null;
  followers: number;
  engagementRate: number;
  plan: "free" | "plus";
  isSearchBoosted: boolean;
  score: number;
  reasons: string[];
};

export type SmartMatchingCampaign = {
  id?: number;
  category?: string | null;
  platform?: string | null;
  budget?: number;
  targetFollowersMin?: number;
  targetFollowersMax?: number;
  targetEngagementMin?: number;
  description?: string | null;
};

export type AutoBriefResult = {
  campaignTitle: string;
  objectives: string[];
  targetAudience: string;
  contentDirection: string[];
  keyMessages: string[];
  suggestedKocProfile: string[];
  cta: string;
  hashtags: string[];
  deliverables: string[];
  timeline: string;
  budgetSuggestion: string;
};

export type ScriptDoctorResult = {
  improvedHook: string;
  improvedScript: string;
  strongerCTA: string;
  contentTips: string[];
  platformOptimization: string[];
  hashtagSuggestions: string[];
};

type AutoBriefPayload = {
  inputText: string;
  brand?: string | null;
  product?: string | null;
  platform?: string | null;
  targetAudience?: string | null;
  budget?: string | null;
};

type ScriptDoctorPayload = {
  inputScript: string;
  platform?: string | null;
  tone?: string | null;
  product?: string | null;
  targetAudience?: string | null;
};

type UpdateScriptReviewPayload = ScriptDoctorPayload & {
  result: ScriptDoctorResult;
};

export async function generateAutoBrief(payload: AutoBriefPayload) {
  return apiRequest<{ message: string; result: AutoBriefResult; item: AiBriefRecord }>("/api/ai/auto-brief", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function listMyAiBriefs() {
  return apiRequest<{ items: AiBriefRecord[] }>("/api/ai/briefs/me", { auth: true });
}

export async function generateScriptDoctor(payload: ScriptDoctorPayload) {
  return apiRequest<{ message: string; result: ScriptDoctorResult; item: ScriptReviewRecord; usage?: AiUsage }>(
    "/api/ai/script-doctor",
    {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
    }
  );
}

export async function listMyScriptReviews() {
  return apiRequest<{ items: ScriptReviewRecord[] }>("/api/ai/script-reviews/me", { auth: true });
}

export async function updateScriptReview(id: number, payload: UpdateScriptReviewPayload) {
  return apiRequest<{ message: string; item: ScriptReviewRecord }>(`/api/ai/script-reviews/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function reviseScriptReview(id: number, instruction: string) {
  return apiRequest<{ message: string; result: ScriptDoctorResult; item: ScriptReviewRecord; usage?: AiUsage }>(
    `/api/ai/script-reviews/${id}/revise`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ instruction }),
    }
  );
}

export async function getSmartMatchingByCampaignId(campaignId: number) {
  return apiRequest<{ campaign: SmartMatchingCampaign; items: SmartMatchingItem[] }>(
    `/api/ai/smart-matching/${campaignId}`,
    { auth: true }
  );
}

export type AiQuota = {
  plan: "free" | "plus";
  aiMonthlyLimit: number;
  aiUsedThisMonth: number;
  remaining: number;
  isSearchBoosted: boolean;
  resetAt?: string | Date | null;
};

export type SmartMatchingResponse = {
  campaign: SmartMatchingCampaign;
  items: SmartMatchingItem[];
};

export type SmartMatchingPayload = {
  campaignId?: number | string;
  category?: string;
  platform?: string;
  budget?: number | string;
  targetFollowersMin?: number | string;
  targetFollowersMax?: number | string;
  targetEngagementMin?: number | string;
  description?: string;
};

export async function getAiQuota() {
  return apiRequest<AiQuota>("/api/ai/quota", { auth: true });
}

export async function upgradeAiPlus() {
  return apiRequest<AiQuota & { message: string }>("/api/ai/upgrade-plus", {
    method: "POST",
    auth: true,
  });
}

export async function runSmartMatching(payload: SmartMatchingPayload) {
  return apiRequest<SmartMatchingResponse>("/api/ai/smart-matching", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}
