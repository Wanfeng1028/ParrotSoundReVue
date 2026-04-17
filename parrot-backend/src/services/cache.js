const { createClient } = require("redis");
const { env } = require("../config/env");

class MemoryCache {
  constructor() {
    this.map = new Map();
  }

  async set(key, value, options = {}) {
    const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
    this.map.set(key, { value, expiresAt });
  }

  async get(key) {
    const record = this.map.get(key);
    if (!record) return null;
    if (record.expiresAt && record.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return record.value;
  }

  async del(key) {
    this.map.delete(key);
  }

  async keys(prefix = "") {
    return Array.from(this.map.keys()).filter((key) => key.startsWith(prefix));
  }
}

let cache = new MemoryCache();
let cacheMode = "memory";

const initCache = async () => {
  if (!env.redisUrl) return { mode: cacheMode };
  try {
    const client = createClient({ url: env.redisUrl });
    client.on("error", () => {});
    await client.connect();
    cache = client;
    cacheMode = "redis";
  } catch (error) {
    cache = new MemoryCache();
    cacheMode = "memory";
  }
  return { mode: cacheMode };
};

const getCache = () => cache;
const getCacheMode = () => cacheMode;

const serialize = (value) => JSON.stringify(value);

const deserialize = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const cacheGetJson = async (key) => deserialize(await cache.get(key));

const cacheSetJson = async (key, value, ttlSeconds) => {
  await cache.set(key, serialize(value), ttlSeconds ? { EX: ttlSeconds } : undefined);
};

const cacheDel = async (key) => {
  await cache.del(key);
};

const cacheDelByPrefix = async (prefix) => {
  if (cacheMode === "redis" && typeof cache.scanIterator === "function") {
    for await (const key of cache.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      await cache.del(key);
    }
    return;
  }

  if (typeof cache.keys === "function") {
    const keys = await cache.keys(prefix);
    await Promise.all(keys.map((key) => cache.del(key)));
  }
};

const remember = async (key, ttlSeconds, loader) => {
  const cached = await cacheGetJson(key);
  if (cached !== null) {
    return { value: cached, hit: true };
  }

  const value = await loader();
  await cacheSetJson(key, value, ttlSeconds);
  return { value, hit: false };
};

module.exports = {
  initCache,
  getCache,
  getCacheMode,
  cacheGetJson,
  cacheSetJson,
  cacheDel,
  cacheDelByPrefix,
  remember,
};
