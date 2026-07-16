import type { Appointment, Barber, Review, ScheduleMap, Service, ServiceCategory, Shift } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type BootstrapData = {
  locationId: string;
  categories: ServiceCategory[];
  services: Service[];
  barbers: Barber[];
  schedules: ScheduleMap;
  appointments: Appointment[];
  reviews: Review[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  const body = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message || `API error ${response.status}`);
  }
  return body as T;
}

export const adminApi = {
  bootstrap: () => request<BootstrapData>("/admin/bootstrap"),
  createService: (service: Omit<Service, "id">) => request<{ id: string }>("/admin/services", { method: "POST", body: JSON.stringify(service) }),
  updateService: (service: Service) => request<{ ok: true }>(`/admin/services/${service.id}`, { method: "PUT", body: JSON.stringify(service) }),
  deleteService: (id: string) => request<{ ok: true }>(`/admin/services/${id}`, { method: "DELETE" }),
  createServiceCategory: (category: Omit<ServiceCategory, "id" | "slug">) => request<{ id: string }>("/admin/service-categories", { method: "POST", body: JSON.stringify(category) }),
  updateServiceCategory: (category: ServiceCategory) => request<{ ok: true }>(`/admin/service-categories/${category.id}`, { method: "PUT", body: JSON.stringify(category) }),
  createBarber: (barber: Omit<Barber, "id">) => request<{ id: string }>("/admin/barbers", { method: "POST", body: JSON.stringify({ ...barber, color: barber.tone }) }),
  updateBarber: (barber: Barber) => request<{ ok: true }>(`/admin/barbers/${barber.id}`, { method: "PUT", body: JSON.stringify({ ...barber, color: barber.tone }) }),
  deleteBarber: (id: string) => request<{ ok: true }>(`/admin/barbers/${id}`, { method: "DELETE" }),
  replaceShifts: (barberId: string, date: string, shifts: Shift[]) => request<{ ok: true }>(`/admin/barbers/${barberId}/shifts/${date}`, { method: "PUT", body: JSON.stringify({ shifts: shifts.map(({ id, from, to }) => ({ id: typeof id === "string" ? id : undefined, from, to })) }) }),
  createAppointment: (appointment: Omit<Appointment, "id" | "databaseId" | "status">) => request<{ id: string; databaseId: string }>("/admin/appointments", { method: "POST", body: JSON.stringify(appointment) }),
  updateAppointmentStatus: (databaseId: string, status: string) => request<{ ok: true }>(`/admin/appointments/${databaseId}/status`, { method: "PATCH", body: JSON.stringify({ status: statusToApi(status) }) }),
  assignBarber: (databaseId: string, barberId: string) => request<{ ok: true }>(`/admin/appointments/${databaseId}/barber`, { method: "PATCH", body: JSON.stringify({ barberId }) }),
  updateReviewVisibility: (customerId: string, visible: boolean) => request<{ ok: true }>(`/admin/reviews/${customerId}/visibility`, { method: "PATCH", body: JSON.stringify({ visible }) })
};

function statusToApi(status: string) {
  const values: Record<string, string> = { "Đang chờ": "pending", "Đã xác nhận": "confirmed", "Đang phục vụ": "in_service", "Hoàn thành": "completed", "Đã hủy": "cancelled", "Không đến": "no_show" };
  return values[status] || status;
}
