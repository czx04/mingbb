import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";

import { UPSTASH_REDIS } from "./redis.constants";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix: string;

  constructor(
    @Inject(UPSTASH_REDIS) private readonly redis: Redis,
    configService: ConfigService,
  ) {
    this.prefix = configService
      .get<string>("REDIS_KEY_PREFIX", "ming:dev:v1")
      .replace(/:+$/, "");
  }

  key(...parts: Array<string | number>) {
    return [this.prefix, ...parts].join(":");
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      this.logger.warn(`Redis GET failed for ${key}: ${errorMessage(error)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      this.logger.warn(`Redis SET failed for ${key}: ${errorMessage(error)}`);
    }
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await load();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async version(scope: string): Promise<number | null> {
    const key = this.key(scope);
    try {
      const value = await this.redis.get<number | string>(key);
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      this.logger.warn(`Redis GET failed for ${key}: ${errorMessage(error)}`);
      return null;
    }
  }

  async bump(scope: string): Promise<void> {
    const key = this.key(scope);
    try {
      await this.redis.incr(key);
    } catch (error) {
      this.logger.warn(`Redis INCR failed for ${key}: ${errorMessage(error)}`);
    }
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
