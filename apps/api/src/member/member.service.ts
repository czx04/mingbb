import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";

import { RateLimitService } from "../redis/rate-limit.service";
import { SUPABASE_ADMIN } from "../supabase/supabase.constants";

type DatabaseRow = Record<string, unknown>;

@Injectable()
export class MemberService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly rateLimit: RateLimitService,
  ) {}

  async lookup(phone: string, clientAddress: string) {
    const normalizedPhone = phone.replace(/\s/g, "");
    const message =
      "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau 15 phút.";
    await this.rateLimit.enforce("member-ip", clientAddress, message);
    await this.rateLimit.enforce(
      "member-phone",
      `${clientAddress}|${normalizedPhone}`,
      message,
    );

    const customerResult = await this.supabase
      .from("customers")
      .select("id,full_name,phone,referral_code,loyalty_points,created_at")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (customerResult.error)
      throw new ServiceUnavailableException("Không thể tải Thẻ MING lúc này");
    if (!customerResult.data)
      throw new NotFoundException(
        "Không tìm thấy Thẻ MING cho số điện thoại này",
      );

    const customer = customerResult.data as DatabaseRow;
    const customerId = String(customer.id);
    const [appointmentsResult, referralsResult] = await Promise.all([
      this.supabase
        .from("appointments")
        .select(
          "booking_code,starts_at,ends_at,status,total_amount,barbers(name),appointment_services(service_name,duration_minutes,unit_price,quantity,sort_order)",
        )
        .eq("customer_id", customerId)
        .order("starts_at", { ascending: false })
        .limit(200),
      this.supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("referred_by_customer_id", customerId),
    ]);
    if (appointmentsResult.error || referralsResult.error) {
      throw new ServiceUnavailableException(
        "Không thể tải thông tin Thẻ MING lúc này",
      );
    }

    const appointments = ((appointmentsResult.data ?? []) as DatabaseRow[]).map(
      toMemberAppointment,
    );
    const now = Date.now();
    const upcomingAppointments = appointments
      .filter(
        (appointment) =>
          appointment.startsAt > now &&
          !["completed", "cancelled", "no_show"].includes(appointment.status),
      )
      .sort((a, b) => a.startsAt - b.startsAt);
    const appointmentHistory = appointments
      .filter(
        (appointment) =>
          !upcomingAppointments.some(
            (upcoming) => upcoming.bookingCode === appointment.bookingCode,
          ),
      )
      .sort((a, b) => b.startsAt - a.startsAt);

    return {
      member: {
        fullName: customer.full_name,
        maskedPhone: maskPhone(String(customer.phone)),
        referralCode: customer.referral_code ?? null,
        loyaltyPoints: Number(customer.loyalty_points ?? 0),
        completedVisits: appointments.filter(
          (appointment) => appointment.status === "completed",
        ).length,
        referralCount: referralsResult.count ?? 0,
        memberSince: customer.created_at,
      },
      upcomingAppointments,
      appointmentHistory,
    };
  }
}

function toMemberAppointment(row: DatabaseRow) {
  const barber = relationOne(row.barbers);
  const services = relationMany(row.appointment_services)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((service) => ({
      name: String(service.service_name),
      durationMinutes: Number(service.duration_minutes),
      unitPrice: Number(service.unit_price),
      quantity: Number(service.quantity ?? 1),
    }));
  const startsAt = new Date(String(row.starts_at));
  return {
    bookingCode: String(row.booking_code),
    startsAt: startsAt.getTime(),
    startsAtIso: startsAt.toISOString(),
    endsAtIso: new Date(String(row.ends_at)).toISOString(),
    status: String(row.status),
    statusLabel: statusLabel(String(row.status)),
    totalAmount: Number(row.total_amount ?? 0),
    barberName: barber?.name ? String(barber.name) : null,
    services,
  };
}

function relationOne(value: unknown): DatabaseRow | null {
  if (Array.isArray(value))
    return (value[0] as DatabaseRow | undefined) ?? null;
  return value && typeof value === "object" ? (value as DatabaseRow) : null;
}

function relationMany(value: unknown): DatabaseRow[] {
  return Array.isArray(value) ? (value as DatabaseRow[]) : [];
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)} *** ${phone.slice(-4)}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    in_service: "Đang phục vụ",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    no_show: "Không đến",
  };
  return labels[status] ?? status;
}
