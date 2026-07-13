export const UPSTASH_REDIS = Symbol("UPSTASH_REDIS");

export const CACHE_TTL_SECONDS = {
  catalog: 5 * 60,
  settings: 60,
  availability: 15,
  barbers: 10,
} as const;

export const redisScopes = {
  catalogVersion: (locationId: string) => `version:catalog:${locationId}`,
  resourcesVersion: (locationId: string) => `version:resources:${locationId}`,
  scheduleVersion: (locationId: string, date: string) =>
    `version:schedule:${locationId}:${date}`,
};
