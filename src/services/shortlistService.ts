import { apiRequest } from "./api";

export async function toggleShortlist(kocId: number) {
  return apiRequest<{ status: 'added' | 'removed' }>("/api/shortlist/toggle", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ kocId }),
  });
}

export async function getMyShortlist() {
  return apiRequest<{ items: any[] }>("/api/shortlist/me", { auth: true });
}
