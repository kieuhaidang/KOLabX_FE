import { apiRequest } from "./api";

export type Message = {
  id: number;
  bookingId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  fileUrl?: string;
  fileType?: string;
  sentAt: string;
};

export async function listMessagesByBooking(bookingId: number) {
  return apiRequest<{ items: Message[] }>(`/api/messages/booking/${bookingId}`, { auth: true });
}

export async function createMessage(bookingId: number, content: string, fileUrl?: string, fileType?: string) {
  return apiRequest<{ item: Message }>(`/api/messages/booking/${bookingId}`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ content, fileUrl, fileType }),
  });
}

export async function markMessagesAsRead(bookingId: number) {
  return apiRequest<{ success: true }>(`/api/messages/booking/${bookingId}/read`, {
    method: "PUT",
    auth: true
  });
}

export async function hideChat(bookingId: number) {
  return apiRequest<{ success: true }>(`/api/messages/booking/${bookingId}/hide`, {
    method: "PUT",
    auth: true
  });
}

export async function deleteChat(bookingId: number) {
  return apiRequest<{ success: true }>(`/api/messages/booking/${bookingId}`, {
    method: "DELETE",
    auth: true
  });
}