import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";

import { CacheService } from "../redis/cache.service";
import { redisScopes } from "../redis/redis.constants";
import { SUPABASE_ADMIN } from "../supabase/supabase.constants";
import {
  BarberInputDto,
  CreateAppointmentDto,
  ReplaceShiftsDto,
  ServiceInputDto,
  UpdateAppointmentStatusDto,
} from "./admin.dto";

const LOCATION_ID = "00000000-0000-4000-8000-000000000001";
const TIMEZONE_OFFSET = "+07:00";

type DatabaseRow = Record<string, unknown>;

@Injectable()
export class AdminService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly cache: CacheService,
  ) {}

  async bootstrap() {
    const [
      servicesResult,
      barbersResult,
      skillsResult,
      shiftsResult,
      appointmentsResult,
    ] = await Promise.all([
      this.supabase
        .from("services")
        .select("*")
        .is("archived_at", null)
        .order("sort_order"),
      this.supabase
        .from("barbers")
        .select("*")
        .is("archived_at", null)
        .order("sort_order"),
      this.supabase
        .from("barber_services")
        .select("barber_id,service_id,active"),
      this.supabase
        .from("work_shifts")
        .select("id,barber_id,starts_at,ends_at")
        .eq("location_id", LOCATION_ID)
        .order("starts_at"),
      this.supabase
        .from("appointments")
        .select(
          "id,booking_code,barber_id,starts_at,ends_at,status,customer_note,customers(full_name,phone),appointment_services(service_id)",
        )
        .eq("location_id", LOCATION_ID)
        .order("starts_at", { ascending: false })
        .limit(1000),
    ]);

    [
      servicesResult,
      barbersResult,
      skillsResult,
      shiftsResult,
      appointmentsResult,
    ].forEach((result) => {
      if (result.error) throw new BadRequestException(result.error.message);
    });

    const skills = (skillsResult.data ?? []) as DatabaseRow[];
    const services = ((servicesResult.data ?? []) as DatabaseRow[]).map(
      (row) => ({
        id: row.id,
        name: row.name,
        duration: row.duration_minutes,
        price: row.price_amount,
        active: row.active,
        barberIds: skills
          .filter((skill) => skill.service_id === row.id && skill.active)
          .map((skill) => skill.barber_id),
      }),
    );
    const barbers = ((barbersResult.data ?? []) as DatabaseRow[]).map(
      (row) => ({
        id: row.id,
        name: row.name,
        detail: row.bio ?? "",
        active: row.active,
        initials: row.initials,
        tone: row.color,
      }),
    );

    const schedules: Record<string, Record<string, unknown[]>> = {};
    ((shiftsResult.data ?? []) as DatabaseRow[]).forEach((row) => {
      const barberId = String(row.barber_id);
      const start = localParts(String(row.starts_at));
      const end = localParts(String(row.ends_at));
      schedules[barberId] ??= {};
      schedules[barberId][start.date] ??= [];
      schedules[barberId][start.date].push({
        id: row.id,
        from: start.time,
        to: end.time,
      });
    });

    const appointments = ((appointmentsResult.data ?? []) as DatabaseRow[]).map(
      (row) => {
        const start = localParts(String(row.starts_at));
        const end = localParts(String(row.ends_at));
        const customer = relationOne(row.customers);
        const appointmentService = relationOne(row.appointment_services);
        return {
          id: row.booking_code,
          databaseId: row.id,
          date: start.date,
          from: start.time,
          to: end.time,
          customer: customer?.full_name ?? "Khách hàng",
          phone: customer?.phone ?? "",
          serviceId: appointmentService?.service_id ?? "",
          barberId: row.barber_id,
          status: statusToLabel(String(row.status)),
          note: row.customer_note ?? "",
        };
      },
    );

    return {
      locationId: LOCATION_ID,
      services,
      barbers,
      schedules,
      appointments,
    };
  }

  async createService(input: ServiceInputDto) {
    const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;
    const { data, error } = await this.supabase
      .from("services")
      .insert({
        name: input.name,
        slug,
        duration_minutes: input.duration,
        price_amount: input.price,
        active: input.active,
      })
      .select("id")
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.syncServiceRelations(data.id as string, input.barberIds);
    await this.invalidateCatalogAndResources();
    return { id: data.id };
  }

  async updateService(id: string, input: ServiceInputDto) {
    const { error } = await this.supabase
      .from("services")
      .update({
        name: input.name,
        duration_minutes: input.duration,
        price_amount: input.price,
        active: input.active,
      })
      .eq("id", id);
    if (error) throw new BadRequestException(error.message);
    await this.syncServiceRelations(id, input.barberIds);
    await this.invalidateCatalogAndResources();
    return { ok: true };
  }

  async archiveService(id: string) {
    const { error } = await this.supabase
      .from("services")
      .update({ active: false, archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new BadRequestException(error.message);
    await this.invalidateCatalogAndResources();
    return { ok: true };
  }

  async createBarber(input: BarberInputDto) {
    const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;
    const { data, error } = await this.supabase
      .from("barbers")
      .insert({
        name: input.name,
        slug,
        bio: input.detail,
        active: input.active,
        initials: input.initials,
        color: input.color,
      })
      .select("id")
      .single();
    if (error) throw new BadRequestException(error.message);
    const relation = await this.supabase
      .from("barber_locations")
      .insert({ barber_id: data.id, location_id: LOCATION_ID });
    if (relation.error) throw new BadRequestException(relation.error.message);
    await this.invalidateResources();
    return { id: data.id };
  }

  async updateBarber(id: string, input: BarberInputDto) {
    const { error } = await this.supabase
      .from("barbers")
      .update({
        name: input.name,
        bio: input.detail,
        active: input.active,
        initials: input.initials,
        color: input.color,
      })
      .eq("id", id);
    if (error) throw new BadRequestException(error.message);
    await this.invalidateResources();
    return { ok: true };
  }

  async archiveBarber(id: string) {
    const { error } = await this.supabase
      .from("barbers")
      .update({ active: false, archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new BadRequestException(error.message);
    await this.invalidateResources();
    return { ok: true };
  }

  async replaceShifts(barberId: string, date: string, input: ReplaceShiftsDto) {
    input.shifts.forEach((shift, index) => {
      if (shift.from >= shift.to)
        throw new BadRequestException(
          `Ca ${index + 1}: giờ kết thúc phải sau giờ bắt đầu`,
        );
      if (
        input.shifts.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            shift.from < other.to &&
            shift.to > other.from,
        )
      ) {
        throw new BadRequestException("Các ca làm không được trùng nhau");
      }
    });

    const startOfDay = `${date}T00:00:00${TIMEZONE_OFFSET}`;
    const endOfDay = `${date}T23:59:59${TIMEZONE_OFFSET}`;
    const bookedResult = await this.supabase
      .from("appointments")
      .select("starts_at,ends_at")
      .eq("barber_id", barberId)
      .not("status", "in", "(cancelled,no_show)")
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay);
    if (bookedResult.error)
      throw new BadRequestException(bookedResult.error.message);
    const leavesBookingOutsideShift = (bookedResult.data ?? []).some(
      (appointment) => {
        const start = localParts(appointment.starts_at as string).time;
        const end = localParts(appointment.ends_at as string).time;
        return !input.shifts.some(
          (shift) => shift.from <= start && shift.to >= end,
        );
      },
    );
    if (leavesBookingOutsideShift)
      throw new BadRequestException(
        "Ca làm mới không bao phủ các lịch hẹn đang có",
      );

    const existing = await this.supabase
      .from("work_shifts")
      .select("id")
      .eq("barber_id", barberId)
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay);
    if (existing.error) throw new BadRequestException(existing.error.message);

    const existingIds = (existing.data ?? []).map((row) => row.id as string);
    if (existingIds.length) {
      const removal = await this.supabase
        .from("work_shifts")
        .delete()
        .in("id", existingIds);
      if (removal.error) throw new BadRequestException(removal.error.message);
    }
    if (input.shifts.length) {
      const insertion = await this.supabase.from("work_shifts").insert(
        input.shifts.map((shift) => ({
          location_id: LOCATION_ID,
          barber_id: barberId,
          starts_at: `${date}T${shift.from}:00${TIMEZONE_OFFSET}`,
          ends_at: `${date}T${shift.to}:00${TIMEZONE_OFFSET}`,
        })),
      );
      if (insertion.error)
        throw new BadRequestException(insertion.error.message);
    }
    await this.invalidateSchedule(date);
    return { ok: true };
  }

  async createAppointment(input: CreateAppointmentDto) {
    if (input.from >= input.to)
      throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu");
    const serviceResult = await this.supabase
      .from("services")
      .select("id,name,duration_minutes,price_amount,active")
      .eq("id", input.serviceId)
      .single();
    if (
      serviceResult.error ||
      !serviceResult.data ||
      !serviceResult.data.active
    )
      throw new NotFoundException("Không tìm thấy dịch vụ đang hoạt động");
    const settingsResult = await this.supabase
      .from("location_settings")
      .select("booking_slot_minutes")
      .eq("location_id", LOCATION_ID)
      .single();
    if (settingsResult.error)
      throw new BadRequestException(settingsResult.error.message);
    const slotMinutes = Number(settingsResult.data.booking_slot_minutes ?? 60);
    const expectedEnd = timeFromMinutes(
      timeToMinutes(input.from) + slotMinutes,
    );
    if (input.to !== expectedEnd)
      throw new BadRequestException(
        `Khung giờ này phải kết thúc lúc ${expectedEnd}`,
      );

    const startsAt = `${input.date}T${input.from}:00${TIMEZONE_OFFSET}`;
    const endsAt = `${input.date}T${input.to}:00${TIMEZONE_OFFSET}`;
    if (input.barberId) {
      const skillResult = await this.supabase
        .from("barber_services")
        .select("barber_id")
        .eq("barber_id", input.barberId)
        .eq("service_id", input.serviceId)
        .eq("active", true)
        .maybeSingle();
      if (skillResult.error || !skillResult.data)
        throw new BadRequestException("Barber không thực hiện dịch vụ này");

      const shiftResult = await this.supabase
        .from("work_shifts")
        .select("id")
        .eq("barber_id", input.barberId)
        .lte("starts_at", startsAt)
        .gte("ends_at", endsAt)
        .limit(1)
        .maybeSingle();
      if (shiftResult.error || !shiftResult.data)
        throw new BadRequestException("Khoảng giờ nằm ngoài ca làm của barber");
    }

    const normalizedPhone = input.phone.replace(/\s/g, "");
    const customerResult = await this.supabase
      .from("customers")
      .upsert(
        { full_name: input.customer, phone: normalizedPhone },
        { onConflict: "phone" },
      )
      .select("id")
      .single();
    if (customerResult.error)
      throw new BadRequestException(customerResult.error.message);

    const appointmentResult = await this.supabase
      .from("appointments")
      .insert({
        location_id: LOCATION_ID,
        customer_id: customerResult.data.id,
        barber_id: input.barberId ?? null,
        requested_service_id: input.serviceId,
        requested_service_ids: [input.serviceId],
        starts_at: startsAt,
        ends_at: endsAt,
        source: "admin",
        customer_note: input.note ?? null,
        total_duration_minutes: serviceResult.data.duration_minutes,
        subtotal_amount: serviceResult.data.price_amount,
      })
      .select("id,booking_code")
      .single();
    if (appointmentResult.error)
      throw new BadRequestException(
        humanizeDatabaseError(appointmentResult.error.message),
      );

    const snapshotResult = await this.supabase
      .from("appointment_services")
      .insert({
        appointment_id: appointmentResult.data.id,
        service_id: serviceResult.data.id,
        service_name: serviceResult.data.name,
        duration_minutes: serviceResult.data.duration_minutes,
        unit_price: serviceResult.data.price_amount,
      });
    if (snapshotResult.error) {
      await this.supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentResult.data.id);
      throw new BadRequestException(snapshotResult.error.message);
    }
    await this.invalidateSchedule(input.date);
    return {
      id: appointmentResult.data.booking_code,
      databaseId: appointmentResult.data.id,
    };
  }

  async updateAppointmentStatus(id: string, input: UpdateAppointmentStatusDto) {
    const updates: Record<string, unknown> = { status: input.status };
    if (input.status === "cancelled" || input.status === "no_show") {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = input.reason ?? null;
    } else {
      updates.cancelled_at = null;
      updates.cancellation_reason = null;
    }
    const { data, error } = await this.supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select("starts_at")
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (data?.starts_at)
      await this.invalidateSchedule(localParts(String(data.starts_at)).date);
    return { ok: true };
  }

  async assignBarber(id: string, barberId: string) {
    const appointmentResult = await this.supabase
      .from("appointments")
      .select("id,requested_service_id,starts_at,ends_at,status")
      .eq("id", id)
      .single();
    if (appointmentResult.error || !appointmentResult.data)
      throw new NotFoundException("Không tìm thấy lịch hẹn");
    if (
      ["cancelled", "no_show", "completed"].includes(
        appointmentResult.data.status as string,
      )
    ) {
      throw new BadRequestException("Không thể xếp thợ cho lịch đã kết thúc");
    }

    const skillResult = await this.supabase
      .from("barber_services")
      .select("barber_id")
      .eq("barber_id", barberId)
      .eq("service_id", appointmentResult.data.requested_service_id)
      .eq("active", true)
      .maybeSingle();
    if (skillResult.error || !skillResult.data)
      throw new BadRequestException(
        "Barber không thực hiện dịch vụ của lịch này",
      );

    const { error } = await this.supabase
      .from("appointments")
      .update({ barber_id: barberId })
      .eq("id", id);
    if (error) throw new BadRequestException(error.message);
    await this.invalidateSchedule(
      localParts(String(appointmentResult.data.starts_at)).date,
    );
    return { ok: true };
  }

  private async invalidateCatalogAndResources() {
    await Promise.all([
      this.cache.bump(redisScopes.catalogVersion(LOCATION_ID)),
      this.cache.bump(redisScopes.resourcesVersion(LOCATION_ID)),
    ]);
  }

  private async invalidateResources() {
    await this.cache.bump(redisScopes.resourcesVersion(LOCATION_ID));
  }

  private async invalidateSchedule(date: string) {
    await this.cache.bump(redisScopes.scheduleVersion(LOCATION_ID, date));
  }

  private async syncServiceRelations(serviceId: string, barberIds: string[]) {
    const locationResult = await this.supabase
      .from("service_locations")
      .upsert({ service_id: serviceId, location_id: LOCATION_ID });
    if (locationResult.error)
      throw new BadRequestException(locationResult.error.message);
    const removal = await this.supabase
      .from("barber_services")
      .delete()
      .eq("service_id", serviceId);
    if (removal.error) throw new BadRequestException(removal.error.message);
    if (barberIds.length) {
      const insertion = await this.supabase.from("barber_services").insert(
        barberIds.map((barberId) => ({
          barber_id: barberId,
          service_id: serviceId,
        })),
      );
      if (insertion.error)
        throw new BadRequestException(insertion.error.message);
    }
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function localParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function relationOne(value: unknown): DatabaseRow | null {
  if (Array.isArray(value))
    return (value[0] as DatabaseRow | undefined) ?? null;
  return value && typeof value === "object" ? (value as DatabaseRow) : null;
}

function statusToLabel(status: string) {
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

function humanizeDatabaseError(message: string) {
  return message.includes("appointments_barber_id_tstzrange_excl")
    ? "Barber đã có lịch trong khoảng giờ này"
    : message;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
