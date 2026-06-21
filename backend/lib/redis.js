import { Redis } from "@upstash/redis";

class RedisService {
  constructor(options = {}) {
    const url = options.url || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token =
      options.token || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing Upstash Redis credentials (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)",
      );
    }

    this.client =
      options.client ||
      new Redis({
        url,
        token,
      });
  }

  /** @returns {RedisService | null} */
  static tryCreate() {
    try {
      return new RedisService();
    } catch {
      return null;
    }
  }

  async getJson(key) {
    const data = await this.client.get(key);
    if (data == null) return null;
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }

  async setJson(key, value, ttlSeconds = null) {
    if (ttlSeconds) {
      return this.client.set(key, JSON.stringify(value), { ex: ttlSeconds });
    }
    return this.client.set(key, JSON.stringify(value));
  }

  async deleteKey(key) {
    return this.client.del(key);
  }
}

export default RedisService;
