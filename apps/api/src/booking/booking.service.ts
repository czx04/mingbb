import { createHash } from "node:crypto";

import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";

import { CacheService } from "../redis/cache.service";
import { RateLimitService } from "../redis/rate-limit.service";
import { CACHE_TTL_SECONDS, redisScopes } from "../redis/redis.constants";
import { SUPABASE_ADMIN } from "../supabase/supabase.constants";
import { CreateWebsiteBookingDto } from "./booking.dto";

const LOCATION_ID = "00000000-0000-4000-8000-000000000001";
const TIMEZONE = "Asia/Ho_Chi_Minh";
const TIMEZONE_OFFSET = "+07:00";

type DatabaseRow = Record<string, unknown>;

type LocationSettings = {
  bookingWindowDays: number;
  slotMinutes: number;
  capacityPerBarber: number;
  allowAnyBarber: boolean;
};

@Injectable()
export class BookingService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly cache: CacheService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async catalog() {
    const version = cacheVersion(
      await this.cache.version(redisScopes.catalogVersion(LOCATION_ID)),
    );
    const cacheKey = this.cache.key("cache", "catalog", LOCATION_ID, version);
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_SECONDS.catalog,
      async () => {
        const [
          locationResult,
          settingsResult,
          servicesResult,
          serviceLocationsResult,
        ] = await Promise.all([
          this.supabase
            .from("locations")
            .select("id,name,slug,timezone,phone,address")
            .eq("id", LOCATION_ID)
            .eq("active", true)
            .single(),
          this.supabase
            .from("location_settings")
            .select(
              "booking_window_days,booking_slot_minutes,capacity_per_barber,allow_any_barber",
            )
            .eq("location_id", LOCATION_ID)
            .single(),
          this.supabase
            .from("services")
            .select(
              "id,name,description,duration_minutes,price_amount,sort_order",
            )
            .eq("active", true)
            .eq("online_bookable", true)
            .is("archived_at", null)
            .order("sort_order"),
          this.supabase
            .from("service_locations")
            .select("service_id,price_override,duration_override")
            .eq("location_id", LOCATION_ID)
            .eq("active", true),
        ]);

        throwOnErrors(
          locationResult,
          settingsResult,
          servicesResult,
          serviceLocationsResult,
        );
        if (!locationResult.data || !settingsResult.data)
          throw new BadRequestException("Chi nhánh chưa được cấu hình");
        const overrides = new Map(
          ((serviceLocationsResult.data ?? []) as DatabaseRow[]).map((row) => [
            String(row.service_id),
            row,
          ]),
        );

        const services = ((servicesResult.data ?? []) as DatabaseRow[])
          .filter((row) => overrides.has(String(row.id)))
          .map((row) => {
            const override = overrides.get(String(row.id));
            return {
              id: row.id,
              name: row.name,
              description: row.description ?? "",
              duration: override?.duration_override ?? row.duration_minutes,
              price: override?.price_override ?? row.price_amount,
            };
          });

        return {
          location: locationResult.data,
          settings: {
            bookingWindowDays: settingsResult.data.booking_window_days,
            slotMinutes: settingsResult.data.booking_slot_minutes,
            capacityPerBarber: settingsResult.data.capacity_per_barber,
            allowAnyBarber: settingsResult.data.allow_any_barber,
          },
          services,
        };
      },
    );
  }

  async publicServices() {
    const version = cacheVersion(
      await this.cache.version(redisScopes.catalogVersion(LOCATION_ID)),
    );
    const cacheKey = this.cache.key("cache", "public-services", LOCATION_ID, version);
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_SECONDS.catalog,
      async () => {
        const [servicesResult, categoriesResult, locationsResult] = await Promise.all([
          this.supabase
            .from("services")
            .select("id,name,slug,short_description,description,duration_minutes,price_amount,sort_order,featured,online_bookable,price_display_mode,category:service_categories(id,name,slug,sort_order)")
            .eq("active", true)
            .eq("published", true)
            .is("archived_at", null)
            .order("sort_order"),
          this.supabase
            .from("service_categories")
            .select("id,name,slug,sort_order")
            .eq("active", true)
            .is("archived_at", null)
            .order("sort_order"),
          this.supabase
            .from("service_locations")
            .select("service_id,price_override,duration_override")
            .eq("location_id", LOCATION_ID)
            .eq("active", true),
        ]);
        throwOnErrors(servicesResult, categoriesResult, locationsResult);
        const locations = new Map(
          ((locationsResult.data ?? []) as DatabaseRow[]).map((row) => [String(row.service_id), row]),
        );
        const services = ((servicesResult.data ?? []) as DatabaseRow[]).map((row) => {
          const location = locations.get(String(row.id));
          const category = relationOne(row.category);
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            shortDescription: row.short_description ?? "",
            description: row.description ?? row.short_description ?? "",
            duration: location?.duration_override ?? row.duration_minutes,
            price: location?.price_override ?? row.price_amount,
            sortOrder: row.sort_order,
            featured: Boolean(row.featured),
            onlineBookable: Boolean(row.online_bookable),
            priceDisplayMode: row.price_display_mode ?? "fixed",
            category: category ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
              sortOrder: category.sort_order,
            } : null,
          };
        });
        return {
          categories: (categoriesResult.data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            sortOrder: row.sort_order,
          })),
          services,
        };
      },
    );
  }

  async availability(date: string) {
    const settings = await this.getSettings();
    this.assertBookableDate(date, settings.bookingWindowDays);
    const [resourcesVersion, scheduleVersion] = await Promise.all([
      this.cache.version(redisScopes.resourcesVersion(LOCATION_ID)),
      this.cache.version(redisScopes.scheduleVersion(LOCATION_ID, date)),
    ]);
    const cacheKey = this.cache.key(
      "cache",
      "availability",
      LOCATION_ID,
      date,
      cacheVersion(resourcesVersion),
      cacheVersion(scheduleVersion),
    );
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_SECONDS.availability,
      async () => {
        const { startOfDay, nextDay } = dayBounds(date);

        const [
          barbersResult,
          locationsResult,
          shiftsResult,
          appointmentsResult,
        ] = await Promise.all([
          this.supabase
            .from("barbers")
            .select("id")
            .eq("active", true)
            .is("archived_at", null),
          this.supabase
            .from("barber_locations")
            .select("barber_id")
            .eq("location_id", LOCATION_ID)
            .eq("active", true),
          this.supabase
            .from("work_shifts")
            .select("barber_id,starts_at,ends_at")
            .eq("location_id", LOCATION_ID)
            .lt("starts_at", nextDay)
            .gt("ends_at", startOfDay),
          this.supabase
            .from("appointments")
            .select("barber_id,starts_at,ends_at")
            .eq("location_id", LOCATION_ID)
            .not("status", "in", "(cancelled,no_show)")
            .gte("starts_at", startOfDay)
            .lt("starts_at", nextDay),
        ]);

        throwOnErrors(
          barbersResult,
          locationsResult,
          shiftsResult,
          appointmentsResult,
        );
        const activeBarbers = new Set(
          ((barbersResult.data ?? []) as DatabaseRow[]).map((row) =>
            String(row.id),
          ),
        );
        const locationBarbers = new Set(
          ((locationsResult.data ?? []) as DatabaseRow[]).map((row) =>
            String(row.barber_id),
          ),
        );
        const shifts = ((shiftsResult.data ?? []) as DatabaseRow[]).filter(
          (row) =>
            activeBarbers.has(String(row.barber_id)) &&
            locationBarbers.has(String(row.barber_id)),
        );
        const appointments = (appointmentsResult.data ?? []) as DatabaseRow[];
        const slots = new Map<
          string,
          { from: string; to: string; barberIds: Set<string> }
        >();

        shifts.forEach((shift) => {
          const from = localParts(String(shift.starts_at));
          const to = localParts(String(shift.ends_at));
          let cursor = timeToMinutes(from.time);
          const end = timeToMinutes(to.time);
          while (cursor + settings.slotMinutes <= end) {
            const slotFrom = timeFromMinutes(cursor);
            const slotTo = timeFromMinutes(cursor + settings.slotMinutes);
            const key = `${slotFrom}|${slotTo}`;
            const slot = slots.get(key) ?? {
              from: slotFrom,
              to: slotTo,
              barberIds: new Set<string>(),
            };
            slot.barberIds.add(String(shift.barber_id));
            slots.set(key, slot);
            cursor += settings.slotMinutes;
          }
        });

        const now = Date.now();
        return {
          date,
          slots: Array.from(slots.values())
            .map((slot) => {
              const booked = appointments.filter((appointment) => {
                const start = localParts(String(appointment.starts_at));
                const end = localParts(String(appointment.ends_at));
                return start.time === slot.from && end.time === slot.to;
              }).length;
              return {
                time: slot.from,
                endsAt: slot.to,
                remainingCapacity: Math.max(
                  slot.barberIds.size * settings.capacityPerBarber - booked,
                  0,
                ),
              };
            })
            .filter(
              (slot) =>
                slot.remainingCapacity > 0 &&
                new Date(
                  `${date}T${slot.time}:00${TIMEZONE_OFFSET}`,
                ).getTime() > now,
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
        };
      },
    );
  }

  async availableBarbers(date: string, time: string, serviceIds: string[]) {
    const settings = await this.getSettings();
    this.assertBookableDate(date, settings.bookingWindowDays);
    const normalizedServiceIds = [...serviceIds].sort();
    const servicesHash = createHash("sha256")
      .update(normalizedServiceIds.join(","))
      .digest("hex")
      .slice(0, 16);
    const [resourcesVersion, scheduleVersion] = await Promise.all([
      this.cache.version(redisScopes.resourcesVersion(LOCATION_ID)),
      this.cache.version(redisScopes.scheduleVersion(LOCATION_ID, date)),
    ]);
    const cacheKey = this.cache.key(
      "cache",
      "barbers",
      LOCATION_ID,
      date,
      time,
      servicesHash,
      cacheVersion(resourcesVersion),
      cacheVersion(scheduleVersion),
    );
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_SECONDS.barbers,
      async () => {
        const startsAt = `${date}T${time}:00${TIMEZONE_OFFSET}`;
        if (new Date(startsAt).getTime() <= Date.now())
          throw new BadRequestException("Khung giờ này đã qua");
        const endsAt = addMinutesIso(startsAt, settings.slotMinutes);

        const [
          servicesResult,
          serviceLocationsResult,
          barbersResult,
          barberLocationsResult,
          skillsResult,
          shiftsResult,
          appointmentsResult,
        ] = await Promise.all([
          this.supabase
            .from("services")
            .select("id")
            .in("id", normalizedServiceIds)
            .eq("active", true)
            .is("archived_at", null),
          this.supabase
            .from("service_locations")
            .select("service_id")
            .eq("location_id", LOCATION_ID)
            .eq("active", true)
            .in("service_id", normalizedServiceIds),
          this.supabase
            .from("barbers")
            .select("id,name,bio,metadata,sort_order")
            .eq("active", true)
            .is("archived_at", null)
            .order("sort_order"),
          this.supabase
            .from("barber_locations")
            .select("barber_id")
            .eq("location_id", LOCATION_ID)
            .eq("active", true),
          this.supabase
            .from("barber_services")
            .select("barber_id,service_id")
            .eq("active", true)
            .in("service_id", normalizedServiceIds),
          this.supabase
            .from("work_shifts")
            .select("barber_id")
            .eq("location_id", LOCATION_ID)
            .lte("starts_at", startsAt)
            .gte("ends_at", endsAt),
          this.supabase
            .from("appointments")
            .select("barber_id")
            .eq("location_id", LOCATION_ID)
            .eq("starts_at", startsAt)
            .eq("ends_at", endsAt)
            .not("status", "in", "(cancelled,no_show)"),
        ]);

        throwOnErrors(
          servicesResult,
          serviceLocationsResult,
          barbersResult,
          barberLocationsResult,
          skillsResult,
          shiftsResult,
          appointmentsResult,
        );
        if (
          (servicesResult.data ?? []).length !== normalizedServiceIds.length ||
          (serviceLocationsResult.data ?? []).length !==
            normalizedServiceIds.length
        ) {
          throw new BadRequestException("Có dịch vụ không còn hoạt động");
        }

        const locationIds = new Set(
          ((barberLocationsResult.data ?? []) as DatabaseRow[]).map((row) =>
            String(row.barber_id),
          ),
        );
        const shiftIds = new Set(
          ((shiftsResult.data ?? []) as DatabaseRow[]).map((row) =>
            String(row.barber_id),
          ),
        );
        const skills = (skillsResult.data ?? []) as DatabaseRow[];
        const appointments = (appointmentsResult.data ?? []) as DatabaseRow[];
        const eligible = ((barbersResult.data ?? []) as DatabaseRow[]).filter(
          (barber) => {
            const id = String(barber.id);
            return (
              locationIds.has(id) &&
              shiftIds.has(id) &&
              normalizedServiceIds.every((serviceId) =>
                skills.some(
                  (skill) =>
                    String(skill.barber_id) === id &&
                    String(skill.service_id) === serviceId,
                ),
              )
            );
          },
        );
        const totalRemaining = Math.max(
          eligible.length * settings.capacityPerBarber - appointments.length,
          0,
        );

        return {
          allowAnyBarber: settings.allowAnyBarber && totalRemaining > 0,
          barbers: eligible
            .map((barber) => {
              const assigned = appointments.filter(
                (appointment) =>
                  String(appointment.barber_id) === String(barber.id),
              ).length;
              return {
                id: barber.id,
                name: barber.name,
                detail: barber.bio ?? "",
                avatarUrl: metadataAvatar(barber.metadata),
                remainingCapacity: Math.max(
                  Math.min(
                    settings.capacityPerBarber - assigned,
                    totalRemaining,
                  ),
                  0,
                ),
              };
            })
            .filter((barber) => barber.remainingCapacity > 0),
        };
      },
    );
  }

  async createAppointment(
    input: CreateWebsiteBookingDto,
    clientAddress: string,
  ) {
    const normalizedPhone = input.customer.phone.replace(/\s/g, "");
    const message =
      "Bạn đã tạo quá nhiều lịch hẹn. Vui lòng thử lại sau 15 phút.";
    await this.rateLimit.enforce("booking-create-ip", clientAddress, message);
    await this.rateLimit.enforce(
      "booking-create-phone",
      `${clientAddress}|${normalizedPhone}`,
      message,
    );
    const { data, error } = await this.supabase.rpc("create_website_booking", {
      p_date: input.date,
      p_time: input.time,
      p_service_ids: input.serviceIds,
      p_barber_id: input.barberId ?? null,
      p_full_name: input.customer.fullName.trim(),
      p_phone: normalizedPhone,
      p_referral_code: input.referralCode?.trim() || null,
      p_note: input.note?.trim() || null,
    });
    if (error)
      throw new BadRequestException(humanizeBookingError(error.message));
    await this.cache.bump(redisScopes.scheduleVersion(LOCATION_ID, input.date));
    return data;
  }

  async lookupCustomer(phone: string, clientAddress: string) {
    const normalizedPhone = phone.replace(/\s/g, "");
    await this.rateLimit.enforce(
      "booking-customer-lookup",
      clientAddress,
      "Bạn đã kiểm tra quá nhiều số điện thoại. Vui lòng thử lại sau.",
    );
    const { data, error } = await this.supabase
      .from("customers")
      .select("full_name")
      .eq("phone", normalizedPhone)
      .maybeSingle();
    if (error)
      throw new BadRequestException("Không thể kiểm tra số điện thoại lúc này");
    if (!data) return { exists: false as const };
    return { exists: true as const, customer: { fullName: data.full_name } };
  }

  private async getSettings(): Promise<LocationSettings> {
    const cacheKey = this.cache.key("cache", "settings", LOCATION_ID);
    return this.cache.getOrSet(
      cacheKey,
      CACHE_TTL_SECONDS.settings,
      async () => {
        const { data, error } = await this.supabase
          .from("location_settings")
          .select(
            "booking_window_days,booking_slot_minutes,capacity_per_barber,allow_any_barber",
          )
          .eq("location_id", LOCATION_ID)
          .single();
        if (error || !data)
          throw new BadRequestException(
            error?.message ?? "Chi nhánh chưa được cấu hình",
          );
        return {
          bookingWindowDays: Number(data.booking_window_days),
          slotMinutes: Number(data.booking_slot_minutes),
          capacityPerBarber: Number(data.capacity_per_barber),
          allowAnyBarber: Boolean(data.allow_any_barber),
        };
      },
    );
  }

  private assertBookableDate(date: string, windowDays: number) {
    const today = localDateValue(new Date());
    const lastDate = addDays(today, windowDays - 1);
    if (date < today || date > lastDate)
      throw new BadRequestException("Ngày đặt lịch nằm ngoài khoảng cho phép");
  }
}

function throwOnErrors(
  ...results: Array<{ error: { message: string } | null }>
) {
  const error = results.find((result) => result.error)?.error;
  if (error) throw new BadRequestException(error.message);
}

function dayBounds(date: string) {
  return {
    startOfDay: `${date}T00:00:00${TIMEZONE_OFFSET}`,
    nextDay: `${addDays(date, 1)}T00:00:00${TIMEZONE_OFFSET}`,
  };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function addMinutesIso(value: string, minutes: number) {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

function localDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
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

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function metadataAvatar(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const avatarUrl = (value as DatabaseRow).avatar_url;
  return typeof avatarUrl === "string" ? avatarUrl : null;
}

function relationOne(value: unknown): DatabaseRow | null {
  if (Array.isArray(value)) return (value[0] as DatabaseRow | undefined) ?? null;
  return value && typeof value === "object" ? (value as DatabaseRow) : null;
}

function humanizeBookingError(message: string) {
  if (
    message.includes("Khung giờ này đã đủ") ||
    message.includes("Barber đã đủ")
  )
    return "Khung giờ vừa hết chỗ. Vui lòng chọn giờ khác.";
  return message;
}

function cacheVersion(version: number | null) {
  return (
    version ??
    `unavailable-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
