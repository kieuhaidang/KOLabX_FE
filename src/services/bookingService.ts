import { apiRequest } from "./api";

export type BookingDirection = "marketer_invited" | "koc_applied";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed"
  | "draft_submitted"
  | "revision_requested"
  | "final_submitted"
  | "ready_to_connect"
  | "payment_rejected"
  | "in_progress";

export type Booking = {
  id: number;
  campaignId: number;
  marketerId: number;
  kocId: number;
  direction: BookingDirection;
  status: BookingStatus;
  offeredPrice: number;
  note: string | null;
  estimatedDeliveryDays?: number;
  sampleLink?: string | null;
  draftLink?: string | null;
  finalLink?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    title: string;
    description?: string;
    category?: string;
    platform?: string;
    marketerName?: string;
  };

  // Joined fields
  campaignTitle?: string;
  campaignCategory?: string;
  campaignPlatform?: string;
  marketerName?: string;
  kocName?: string;

  // Legacy/other joined fields
  full_name?: string;
  display_name?: string;
  avatarUrl?: string;
  niche?: string;
  platform?: string;
  followers?: number;
  engagement_rate?: number;
};

export type MarketerSubmission = {
  bookingId: number;
  campaignId: number;
  campaignTitle: string;
  kocId: number;
  kocProfileId?: number | null;
  kocName: string;
  kocEmail: string;
  draftLink: string | null;
  finalLink: string | null;
  status: BookingStatus;
  offeredPrice: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export async function createBooking(data: Partial<Booking>) {
  return apiRequest<{ booking: Booking }>("/api/bookings", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function listBookings(params: { status?: BookingStatus; onlyVisible?: boolean; search?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.onlyVisible) query.append("onlyVisible", "true");
  if (params.search) query.append("search", params.search);
  
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<{ items: Booking[] }>(`/api/bookings${suffix}`, { auth: true });
}

export async function listApplicantsByCampaign(campaignId: number) {
  return apiRequest<{ items: Booking[] }>(`/api/bookings/campaign/${campaignId}`, { auth: true });
}

export async function listMarketerSubmissions() {
  return apiRequest<{ items: MarketerSubmission[] }>("/api/bookings/marketer/submissions", { auth: true });
}

export async function getBookingById(id: number) {
  return apiRequest<{ booking: any }>(`/api/bookings/${id}`, { auth: true });
}

export async function updateBookingStatus(id: number, status: BookingStatus) {
  return apiRequest<{
    booking?: Booking;
    requiresPayment?: boolean;
    checkoutUrl?: string;
    amount?: number;
  }>(`/api/bookings/${id}/status`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function submitBookingSubmission(id: number, payload: { draftLink?: string; finalLink?: string }) {
  return apiRequest<{ message: string; booking: Booking }>(`/api/bookings/${id}/submission`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function reviewBookingSubmission(
  id: number,
  payload: { action: "approve" | "request_revision"; reviewNote?: string }
) {
  return apiRequest<{
    message: string;
    booking?: Booking;
    requiresPayment?: boolean;
    checkoutUrl?: string;
    amount?: number;
  }>(`/api/bookings/${id}/review-submission`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateBookingContent(id: number, payload: { draftLink?: string; finalLink?: string }) {
  return apiRequest<{ message: string; booking: Booking }>(`/api/bookings/${id}/content`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}
