import { env } from "./env";

export type MemberAppointment = {
  bookingCode: string;
  startsAt: number;
  startsAtIso: string;
  endsAtIso: string;
  status: "pending" | "confirmed" | "in_service" | "completed" | "cancelled" | "no_show";
  statusLabel: string;
  totalAmount: number;
  barberName: string | null;
  services: Array<{
    name: string;
    durationMinutes: number;
    unitPrice: number;
    quantity: number;
  }>;
};

export type MemberLookupResult = {
  member: {
    fullName: string;
    maskedPhone: string;
    referralCode: string | null;
    loyaltyPoints: number;
    completedVisits: number;
    referralCount: number;
    memberSince: string;
  };
  upcomingAppointments: MemberAppointment[];
  appointmentHistory: MemberAppointment[];
};

export class MemberApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const memberApi = {
  async lookup(phone: string): Promise<MemberLookupResult> {
    const response = await fetch(`${env.apiUrl}/members/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const body = await response.json().catch(() => null) as MemberLookupResult | { message?: string | string[] } | null;
    if (!response.ok) {
      const rawMessage = body && "message" in body ? body.message : null;
      const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
      throw new MemberApiError(message || `Không thể kết nối máy chủ (${response.status})`, response.status);
    }
    return body as MemberLookupResult;
  }
};
