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

    await service.createAppointment({
      date: "2026-07-20",
      time: "09:00",
      serviceIds: ["00000000-0000-4000-8000-000000000010"],
      barberId: null,
      customer: {
        fullName: "Nguyen Van A",
        phone: "0900000000",
      },
    });

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
      service.createAppointment({
        date: "2026-07-20",
        time: "09:00",
        serviceIds: ["00000000-0000-4000-8000-000000000010"],
        barberId: null,
        customer: {
          fullName: "Nguyen Van A",
          phone: "0900000000",
        },
      }),
    ).rejects.toThrow("database error");
    expect(cache.bump).not.toHaveBeenCalled();
  });
});
