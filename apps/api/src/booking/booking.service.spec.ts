import { SupabaseClient } from "@supabase/supabase-js";

import { CacheService } from "../redis/cache.service";
import { RateLimitService } from "../redis/rate-limit.service";
import { redisScopes } from "../redis/redis.constants";
import { BookingService } from "./booking.service";

const LOCATION_ID = "00000000-0000-4000-8000-000000000001";

describe("BookingService Redis integration", () => {
  const supabase = {
    rpc: jest.fn(),
  };
  const cache = {
    bump: jest.fn(),
  };
  const rateLimit = {
    enforce: jest.fn(),
  };
  let service: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimit.enforce.mockResolvedValue(undefined);
    service = new BookingService(
      supabase as unknown as SupabaseClient,
      cache as unknown as CacheService,
      rateLimit as unknown as RateLimitService,
    );
  });

  it("invalidates the affected schedule after a website booking succeeds", async () => {
    supabase.rpc.mockResolvedValue({
      data: { bookingCode: "MING-001" },
      error: null,
    });
    cache.bump.mockResolvedValue(undefined);

    await service.createAppointment(
      {
        date: "2026-07-20",
        time: "09:00",
        serviceIds: ["00000000-0000-4000-8000-000000000010"],
        barberId: null,
        customer: {
          fullName: "Nguyen Van A",
          phone: "0900000000",
        },
      },
      "203.0.113.10",
    );

    expect(cache.bump).toHaveBeenCalledWith(
      redisScopes.scheduleVersion(LOCATION_ID, "2026-07-20"),
    );
  });

  it("does not invalidate the cache when the booking transaction fails", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "database error" },
    });

    await expect(
      service.createAppointment(
        {
          date: "2026-07-20",
          time: "09:00",
          serviceIds: ["00000000-0000-4000-8000-000000000010"],
          barberId: null,
          customer: {
            fullName: "Nguyen Van A",
            phone: "0900000000",
          },
        },
        "203.0.113.10",
      ),
    ).rejects.toThrow("database error");
    expect(cache.bump).not.toHaveBeenCalled();
  });

  it("checks both booking limits before writing to Supabase", async () => {
    supabase.rpc.mockResolvedValue({
      data: { bookingCode: "MING-002" },
      error: null,
    });
    cache.bump.mockResolvedValue(undefined);

    await service.createAppointment(
      {
        date: "2026-07-20",
        time: "10:00",
        serviceIds: ["00000000-0000-4000-8000-000000000010"],
        barberId: null,
        customer: {
          fullName: "Nguyen Van B",
          phone: "0912345678",
        },
      },
      "203.0.113.10",
    );

    expect(rateLimit.enforce).toHaveBeenNthCalledWith(
      1,
      "booking-create-ip",
      "203.0.113.10",
      expect.any(String),
    );
    expect(rateLimit.enforce).toHaveBeenNthCalledWith(
      2,
      "booking-create-phone",
      "203.0.113.10|0912345678",
      expect.any(String),
    );
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it("does not call Supabase when a booking limit is exceeded", async () => {
    rateLimit.enforce.mockRejectedValueOnce(new Error("rate limited"));

    await expect(
      service.createAppointment(
        {
          date: "2026-07-20",
          time: "10:00",
          serviceIds: ["00000000-0000-4000-8000-000000000010"],
          barberId: null,
          customer: {
            fullName: "Nguyen Van B",
            phone: "0912345678",
          },
        },
        "203.0.113.10",
      ),
    ).rejects.toThrow("rate limited");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
