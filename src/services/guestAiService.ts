import { apiRequest } from "./api";
import type { AutoBriefResult, ScriptDoctorResult } from "./aiService";
import { getOrCreateGuestId, type GuestTrialQuota } from "./guestTrial";

export type GuestAiFeature = "auto_brief" | "script_doctor";

const guestHeaders = () => ({ "X-Kolab-Guest-Id": getOrCreateGuestId() });

export async function getGuestAiQuota(feature: GuestAiFeature) {
  return apiRequest<GuestTrialQuota>(`/api/ai/guest/quota?feature=${encodeURIComponent(feature)}`, {
    headers: guestHeaders(),
  });
}

export async function generateGuestAutoBrief(payload: {
  inputText: string;
  brand?: string | null;
  product?: string | null;
  platform?: string | null;
  targetAudience?: string | null;
  budget?: string | null;
}) {
  return apiRequest<{ message: string; result: AutoBriefResult; quota: GuestTrialQuota }>(
    "/api/ai/guest/auto-brief",
    { method: "POST", headers: guestHeaders(), body: JSON.stringify(payload) }
  );
}

export async function generateGuestScriptDoctor(payload: {
  inputScript: string;
  platform?: string | null;
  tone?: string | null;
  product?: string | null;
  targetAudience?: string | null;
}) {
  return apiRequest<{ message: string; result: ScriptDoctorResult; quota: GuestTrialQuota }>(
    "/api/ai/guest/script-doctor",
    { method: "POST", headers: guestHeaders(), body: JSON.stringify(payload) }
  );
}
