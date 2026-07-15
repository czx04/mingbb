import { ForbiddenException } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";

import { CacheService } from "../redis/cache.service";
import { RateLimitService } from "../redis/rate-limit.service";
import { MemberService } from "./member.service";

const CUSTOMER_ID = "customer-001";

function query(result: unknown) {
  const builder: Record<string, jest.Mock | ((resolve: (value: unknown) => unknown) => unknown)> = {};
  const chain = jest.fn(() => builder);
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.upsert = chain;
  builder.maybeSingle = jest.fn(async () => result);
  builder.single = jest.fn(async () => result);
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

describe("MemberService reviews", () => {
  const supabase = { from: jest.fn() };
  const rateLimit = { enforce: jest.fn().mockResolvedValue(undefined) };
  const cache = {
    getOrSet: jest.fn((_key: string, _ttl: number, load: () => Promise<unknown>) => load()),
    key: jest.fn((value: string) => `cache:${value}`),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  let service: MemberService;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimit.enforce.mockResolvedValue(undefined);
    service = new MemberService(
      supabase as unknown as SupabaseClient,
      rateLimit as unknown as RateLimitService,
      cache as unknown as CacheService,
    );
  });

  it("rejects a review when the customer has no completed appointment", async () => {
    const customer = query({ data: { id: CUSTOMER_ID }, error: null });
    const completedAppointments = query({ data: null, count: 0, error: null });
    supabase.from.mockReturnValueOnce(customer).mockReturnValueOnce(completedAppointments);

    await expect(
      service.saveReview(
        { phone: "0900000000", rating: 5, comment: "Rất tốt" },
        "203.0.113.10",
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it("upserts one review for a customer and trims an empty comment", async () => {
    const customer = query({ data: { id: CUSTOMER_ID }, error: null });
    const completedAppointments = query({ data: null, count: 1, error: null });
    const savedReview = query({
      data: {
        rating: 4,
        comment: null,
        created_at: "2026-07-14T01:00:00.000Z",
        updated_at: "2026-07-14T01:00:00.000Z",
      },
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(customer)
      .mockReturnValueOnce(completedAppointments)
      .mockReturnValueOnce(savedReview);

    const result = await service.saveReview(
      { phone: "0900000000", rating: 4, comment: "   " },
      "203.0.113.10",
    );

    expect(savedReview.upsert).toHaveBeenCalledWith(
      { customer_id: CUSTOMER_ID, rating: 4, comment: null },
      { onConflict: "customer_id" },
    );
    expect(result.review.rating).toBe(4);
    expect(result.review.comment).toBeNull();
    expect(cache.delete).toHaveBeenCalledWith("cache:public-reviews");
  });
});
