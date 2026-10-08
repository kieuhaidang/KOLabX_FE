import { apiRequest } from "./api";

export type MarketerProfile = {
  userId: number;
  role: "marketer";
  fullName: string;
  email: string;
  companyName: string | null;
  brandName: string | null;
  industry: string | null;
  bio: string | null;
  website: string | null;
  avatarUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KocProfile = {
  id: number;
  userId: number;
  role: "koc";
  fullName: string;
  email: string;
  displayName: string | null;
  niche: string | null;
  platform: string | null;
  followers: number;
  engagementRate: number;
  servicePrice: number;
  verified: boolean;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  plan?: "free" | "plus";
  isSearchBoosted?: boolean;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: string;
  updatedAt: string;
  completionRate?: number;
  responseRate?: number;
  responseTime?: string;
  kocRank?: string;
};

export type Profile = MarketerProfile | KocProfile;

export type AccountProfile = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type UpdateMarketerProfilePayload = {
  fullName?: string;
  companyName?: string | null;
  brandName?: string | null;
  industry?: string | null;
  bio?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
};

type UpdateKocProfilePayload = {
  fullName?: string;
  displayName?: string | null;
  niche?: string | null;
  platform?: string | null;
  followers?: number;
  engagementRate?: number;
  servicePrice?: number;
  verified?: boolean;
  bio?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
};

export type UpdateProfilePayload = UpdateMarketerProfilePayload | UpdateKocProfilePayload;

export async function getMyProfile() {
  return apiRequest<{ profile: Profile | AccountProfile }>("/api/profiles/me", { auth: true });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>("/api/profiles/password", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<{ message: string; profile: Profile }>("/api/profiles/me", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function listKocProfiles(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ items: KocProfile[] }>(`/api/profiles/kocs${suffix}`);
}

export async function getKocProfileById(id: number) {
  return apiRequest<{ profile: KocProfile }>(`/api/profiles/kocs/${id}`);
}

