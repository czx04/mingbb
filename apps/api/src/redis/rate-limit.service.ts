import { createHmac } from "node:crypto";

import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { RateLimitExceededException } from "./rate-limit.exception";
import { UPSTASH_REDIS } from "./redis.constants";

export type RateLimitPolicy =
  | "booking-customer-lookup"
  | "booking-create-ip"
  | "booking-create-phone"
  | "member-ip"
  | "member-phone"
  | "member-review-ip"
  | "member-review-phone";

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly secret: string;
  private readonly limiters: Record<RateLimitPolicy, Ratelimit>;

  constructor(
    @Inject(UPSTASH_REDIS) redis: Redis,
    configService: ConfigService,
  ) {
    const prefix = configService
      .get<string>("REDIS_KEY_PREFIX", "ming:dev:v1")
      .replace(/:+$/, "");
    this.secret = configService.getOrThrow<string>("RATE_LIMIT_HASH_SECRET");
    if (this.secret.length < 32) {
      throw new Error(
        "RATE_LIMIT_HASH_SECRET must contain at least 32 characters",
      );
    }
    this.limiters = {
      "booking-customer-lookup": createLimiter(
        redis,
        `${prefix}:ratelimit:booking-customer`,
        30,
      ),
      "booking-create-ip": createLimiter(
        redis,
        `${prefix}:ratelimit:booking-create-ip`,
        10,
      ),
      "booking-create-phone": createLimiter(
        redis,
        `${prefix}:ratelimit:booking-create-phone`,
        3,
      ),
      "member-ip": createLimiter(redis, `${prefix}:ratelimit:member-ip`, 30),
      "member-phone": createLimiter(
        redis,
        `${prefix}:ratelimit:member-phone`,
        10,
      ),
      "member-review-ip": createLimiter(
        redis,
        `${prefix}:ratelimit:member-review-ip`,
        10,
      ),
      "member-review-phone": createLimiter(
        redis,
        `${prefix}:ratelimit:member-review-phone`,
        5,
      ),
    };
  }

  async enforce(
    policy: RateLimitPolicy,
    identifier: string,
    message: string,
  ): Promise<void> {
    let result;
    try {
      result = await this.limiters[policy].limit(this.hash(identifier));
    } catch (error) {
      this.logger.error(
        `Upstash rate limit failed for ${policy}: ${errorMessage(error)}`,
      );
      throw new ServiceUnavailableException(
        "Không thể xác minh giới hạn truy cập lúc này. Vui lòng thử lại sau.",
      );
    }

    if (result.reason === "timeout") {
      this.logger.error(`Upstash rate limit timed out for ${policy}`);
      throw new ServiceUnavailableException(
        "Không thể xác minh giới hạn truy cập lúc này. Vui lòng thử lại sau.",
      );
    }

    if (!result.success) {
      const retryAfterSeconds = Math.max(
        Math.ceil((result.reset - Date.now()) / 1000),
        1,
      );
      throw new RateLimitExceededException(retryAfterSeconds, message);
    }
  }

  private hash(identifier: string) {
    return createHmac("sha256", this.secret).update(identifier).digest("hex");
  }
}

function createLimiter(redis: Redis, prefix: string, limit: number) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "15 m"),
    prefix,
    timeout: 1500,
    analytics: false,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
