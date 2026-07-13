import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";

import { CacheService } from "./cache.service";

describe("CacheService", () => {
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue("ming:test:v1"),
  };
  let service: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    service = new CacheService(
      redis as unknown as Redis,
      config as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a cached value without calling the loader", async () => {
    redis.get.mockResolvedValue({ slots: ["09:00"] });
    const load = jest.fn();

    await expect(service.getOrSet("key", 15, load)).resolves.toEqual({
      slots: ["09:00"],
    });
    expect(load).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("loads and caches a missing value with a TTL", async () => {
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue("OK");
    const load = jest.fn().mockResolvedValue({ slots: [] });

    await expect(service.getOrSet("key", 15, load)).resolves.toEqual({
      slots: [],
    });
    expect(redis.set).toHaveBeenCalledWith("key", { slots: [] }, { ex: 15 });
  });

  it("falls back to the loader when Redis GET fails", async () => {
    redis.get.mockRejectedValue(new Error("network error"));
    const load = jest.fn().mockResolvedValue({ services: [] });

    await expect(service.getOrSet("key", 300, load)).resolves.toEqual({
      services: [],
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("returns a null version when Redis cannot be reached", async () => {
    redis.get.mockRejectedValue(new Error("network error"));

    await expect(
      service.version("version:catalog:location"),
    ).resolves.toBeNull();
  });

  it("increments a namespaced version key", async () => {
    redis.incr.mockResolvedValue(2);

    await service.bump("version:schedule:location:2026-07-13");
    expect(redis.incr).toHaveBeenCalledWith(
      "ming:test:v1:version:schedule:location:2026-07-13",
    );
  });
});
