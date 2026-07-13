import { Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";

import { RateLimitExceededException } from "./rate-limit.exception";
import { RateLimitPolicy, RateLimitService } from "./rate-limit.service";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  reason?: "timeout";
};

describe("RateLimitService", () => {
  const config = {
    get: jest.fn().mockReturnValue("ming:test:v1"),
    getOrThrow: jest
      .fn()
      .mockReturnValue("test-hmac-secret-with-at-least-32-characters"),
  };
  let service: RateLimitService;
  let limit: jest.Mock<Promise<LimitResult>, [string]>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    service = new RateLimitService(
      {} as Redis,
      config as unknown as ConfigService,
    );
    limit = jest.fn();
    const limiter = { limit };
    const limiters = (
      service as unknown as {
        limiters: Record<RateLimitPolicy, typeof limiter>;
      }
    ).limiters;
    limiters["booking-customer-lookup"] = limiter;
    limiters["member-ip"] = limiter;
    limiters["member-phone"] = limiter;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("hashes identifiers before sending them to Upstash", async () => {
    limit.mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60_000,
    });

    await service.enforce("member-ip", "203.0.113.10", "Too many requests");

    const identifier = limit.mock.calls[0][0];
    expect(identifier).toMatch(/^[a-f0-9]{64}$/);
    expect(identifier).not.toContain("203.0.113.10");
  });

  it("throws a rate-limit exception with retry timing when denied", async () => {
    limit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    await expect(
      service.enforce("member-phone", "ip|phone", "Too many requests"),
    ).rejects.toBeInstanceOf(RateLimitExceededException);
  });

  it("fails closed when Upstash times out", async () => {
    limit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 30_000,
      reason: "timeout",
    });

    await expect(
      service.enforce("member-phone", "ip|phone", "Too many requests"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
