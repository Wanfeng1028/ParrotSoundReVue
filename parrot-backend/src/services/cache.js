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

module.exports = { initCache, getCache, getCacheMode };
