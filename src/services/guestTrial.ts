import type { UserRole } from "./authService";
import type { AutoBriefResult, ScriptDoctorResult } from "./aiService";

export const GUEST_AI_TRIAL_LIMIT = 2;
export const GUEST_ID_KEY = "kolab_guest_id";
export const GUEST_AI_BRIEF_DRAFT_KEY = "kolab_guest_ai_brief_draft";
export const GUEST_SCRIPT_DOCTOR_DRAFT_KEY = "kolab_guest_script_doctor_draft";
export const POST_LOGIN_INTENT_KEY = "kolab_post_login_intent";
export const POST_LOGIN_HANDOFF_KEY = "kolab_post_login_handoff";

const TEMP_DATA_TTL_MS = 60 * 60 * 1000;

export type GuestTrialQuota = {
  limit: number;
  used: number;
  remaining: number;
  requiresAuth: boolean;
};

export type GuestAiBriefForm = {
  inputText: string;
  brand: string;
  product: string;
  platform: string;
  targetAudience: string;
  budget: string;
};

export type GuestScriptDoctorForm = {
  inputScript: string;
  platform: string;
  tone: string;
  product: string;
  targetAudience: string;
};

export type GuestAiBriefDraft = {
  createdAt: number;
  form: GuestAiBriefForm;
  result: AutoBriefResult;
};

export type GuestScriptDoctorDraft = {
  createdAt: number;
  form: GuestScriptDoctorForm;
  result: ScriptDoctorResult | null;
};

type PostLoginIntent = {
  type: "create-campaign-from-ai-brief" | "continue-script-doctor";
  returnTo: "/marketer/campaigns" | "/koc/script-doctor";
  createdAt: number;
};

function randomGuestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateGuestId() {
  const current = localStorage.getItem(GUEST_ID_KEY);
  if (current && /^[A-Za-z0-9_-]{32,128}$/.test(current)) return current;
  const next = randomGuestId();
  localStorage.setItem(GUEST_ID_KEY, next);
  return next;
}

function readFreshJson<T>(key: string, validate: (value: unknown) => value is T): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const createdAt = typeof parsed === "object" && parsed !== null ? Number((parsed as { createdAt?: unknown }).createdAt) : 0;
    if (!validate(parsed) || !createdAt || Date.now() - createdAt > TEMP_DATA_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

function writeSessionJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in privacy mode; the active page remains usable.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isBriefDraft(value: unknown): value is GuestAiBriefDraft {
  if (!isRecord(value) || !isRecord(value.form) || !isRecord(value.result)) return false;
  return typeof value.form.inputText === "string" && typeof value.result.campaignTitle === "string";
}

function isScriptDraft(value: unknown): value is GuestScriptDoctorDraft {
  if (!isRecord(value) || !isRecord(value.form)) return false;
  return typeof value.form.inputScript === "string" && (value.result === null || isRecord(value.result));
}

function isIntent(value: unknown): value is PostLoginIntent {
  if (!isRecord(value)) return false;
  return (
    (value.type === "create-campaign-from-ai-brief" && value.returnTo === "/marketer/campaigns") ||
    (value.type === "continue-script-doctor" && value.returnTo === "/koc/script-doctor")
  );
}

export function saveGuestAiBriefDraft(form: GuestAiBriefForm, result: AutoBriefResult) {
  writeSessionJson(GUEST_AI_BRIEF_DRAFT_KEY, { createdAt: Date.now(), form, result });
}

export function readGuestAiBriefDraft() {
  return readFreshJson(GUEST_AI_BRIEF_DRAFT_KEY, isBriefDraft);
}

export function clearGuestAiBriefDraft() {
  sessionStorage.removeItem(GUEST_AI_BRIEF_DRAFT_KEY);
}

export function saveGuestScriptDoctorDraft(form: GuestScriptDoctorForm, result: ScriptDoctorResult | null) {
  writeSessionJson(GUEST_SCRIPT_DOCTOR_DRAFT_KEY, { createdAt: Date.now(), form, result });
}

export function readGuestScriptDoctorDraft() {
  return readFreshJson(GUEST_SCRIPT_DOCTOR_DRAFT_KEY, isScriptDraft);
}

export function clearGuestScriptDoctorDraft() {
  sessionStorage.removeItem(GUEST_SCRIPT_DOCTOR_DRAFT_KEY);
}

export function savePostLoginIntent(type: PostLoginIntent["type"]) {
  const intent: PostLoginIntent = type === "create-campaign-from-ai-brief"
    ? { type, returnTo: "/marketer/campaigns", createdAt: Date.now() }
    : { type, returnTo: "/koc/script-doctor", createdAt: Date.now() };
  writeSessionJson(POST_LOGIN_INTENT_KEY, intent);
}

export function readPostLoginIntent() {
  return readFreshJson(POST_LOGIN_INTENT_KEY, isIntent);
}

export function clearPostLoginIntent() {
  sessionStorage.removeItem(POST_LOGIN_INTENT_KEY);
}

export function clearPostLoginHandoff() {
  sessionStorage.removeItem(POST_LOGIN_HANDOFF_KEY);
}

export function consumePostLoginHandoff(type: PostLoginIntent["type"]) {
  const handoff = readFreshJson(POST_LOGIN_HANDOFF_KEY, isIntent);
  if (!handoff || handoff.type !== type) {
    clearPostLoginHandoff();
    return false;
  }
  clearPostLoginHandoff();
  return true;
}


export function getPendingIntentRole(): Extract<UserRole, "marketer" | "koc"> | null {
  const intent = readPostLoginIntent();
  if (!intent) return null;
  return intent.type === "create-campaign-from-ai-brief" ? "marketer" : "koc";
}

export function consumePostLoginIntent(role: UserRole) {
  const intent = readPostLoginIntent();
  if (!intent) return null;
  const requiredRole = intent.type === "create-campaign-from-ai-brief" ? "marketer" : "koc";
  clearPostLoginIntent();
  if (role !== requiredRole) {
    return {
      destination: null,
      message: requiredRole === "marketer"
        ? "Tính năng tạo chiến dịch yêu cầu tài khoản Marketer."
        : "Tính năng Script Doctor yêu cầu tài khoản KOC.",
    };
  }
  writeSessionJson(POST_LOGIN_HANDOFF_KEY, intent);
  return { destination: intent.returnTo, message: null };
}

export function getSafeInternalReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  const allowed = ["/marketer", "/koc", "/admin", "/owner", "/pricing"];
  return allowed.some((prefix) => value === prefix || value.startsWith(`${prefix}/`)) ? value : null;
}
