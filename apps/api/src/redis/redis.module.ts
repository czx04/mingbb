import { Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";

import { CacheService } from "./cache.service";
import { RateLimitExceptionFilter } from "./rate-limit.exception";
import { RateLimitService } from "./rate-limit.service";
import { UPSTASH_REDIS } from "./redis.constants";

@Global()
@Module({
  providers: [
    {
      provide: UPSTASH_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis({
          url: configService.getOrThrow<string>("UPSTASH_REDIS_REST_URL"),
          token: configService.getOrThrow<string>("UPSTASH_REDIS_REST_TOKEN"),
        }),
    },
    CacheService,
    RateLimitService,
    {
      provide: APP_FILTER,
      useClass: RateLimitExceptionFilter,
    },
  ],
  exports: [UPSTASH_REDIS, CacheService, RateLimitService],
})
export class RedisModule {}
