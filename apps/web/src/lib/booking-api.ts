import { env } from "./env";

export type BookingService = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

export type BookingCatalog = {
  location: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    phone?: string | null;
    address?: string | null;
  };
  settings: {
    bookingWindowDays: number;
    slotMinutes: number;
    capacityPerBarber: number;
    allowAnyBarber: boolean;
  };
  services: BookingService[];
};

export type BookingSlot = {
  time: string;
  endsAt: string;
  remainingCapacity: number;
};

export type AvailableBarber = {
  id: string;
  name: string;
  detail: string;
  avatarUrl?: string | null;
  remainingCapacity: number;
};

export type AvailableBarbers = {
  allowAnyBarber: boolean;
  barbers: AvailableBarber[];
};

export type CreateBookingInput = {
  date: string;
  time: string;
  serviceIds: string[];
  barberId: string | null;
  customer: {
    fullName: string;
    phone: string;
  };
  referralCode?: string;
  note?: string;
};

export type BookingResult = {
  databaseId: string;
  bookingCode: string;
  status: "pending";
  startsAt: string;
  endsAt: string;
  totalDurationMinutes: number;
  subtotalAmount: number;
  barberId: string | null;
};

export type CustomerLookupResult =
  | { exists: false }
  | { exists: true; customer: { fullName: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message || `Không thể kết nối máy chủ (${response.status})`);
  }
  return body as T;
}

export const bookingApi = {
  catalog: () => request<BookingCatalog>("/booking/catalog"),
  availability: (date: string) => request<{ date: string; slots: BookingSlot[] }>(`/booking/availability?date=${encodeURIComponent(date)}`),
  barbers: (date: string, time: string, serviceIds: string[]) => {
    const query = new URLSearchParams({ date, time, serviceIds: serviceIds.join(",") });
    return request<AvailableBarbers>(`/booking/barbers?${query.toString()}`);
  },
  lookupCustomer: (phone: string) => request<CustomerLookupResult>("/booking/customers/lookup", {
    method: "POST",
    body: JSON.stringify({ phone })
  }),
  create: (input: CreateBookingInput) => request<BookingResult>("/booking/appointments", {
    method: "POST",
    body: JSON.stringify(input)
  })
};
