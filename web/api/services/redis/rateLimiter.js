const { getRedis } = require("../../db");

class RateLimiter {
  static get WINDOW_MS() {
    return parseInt(process.env.REDIS_RATE_LIMIT_WINDOW_MS || "60000", 10); // 1 minute
  }

  static get MAX_REQUESTS() {
    return parseInt(process.env.REDIS_RATE_LIMIT_MAX_REQUESTS || "20", 10); // 20 req/min
  }

  /**
   * Checks sliding window rate limit for a user/identifier.
   * Returns { allowed: boolean, remaining: number, resetMs: number }
   */
  static async checkRateLimit(identifier) {
    if (!identifier) return { allowed: false, unavailable: true, resetMs: this.WINDOW_MS };

    try {
      const redis = getRedis();
      if (!redis) {
        return { allowed: false, unavailable: true, resetMs: this.WINDOW_MS };
      }
      const key = `rate_limit:${identifier}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.pexpire(key, this.WINDOW_MS);
      }

      let ttlMs = await redis.pttl(key);
      if (ttlMs < 0) {
        // If key has no TTL associated, refresh it
        await redis.pexpire(key, this.WINDOW_MS);
        ttlMs = this.WINDOW_MS;
      }

      if (count > this.MAX_REQUESTS) {
        return {
          allowed: false,
          remaining: 0,
          resetMs: ttlMs > 0 ? ttlMs : this.WINDOW_MS
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, this.MAX_REQUESTS - count),
        resetMs: ttlMs > 0 ? ttlMs : this.WINDOW_MS
      };
    } catch (err) {
      console.warn(`[Redis RateLimiter] checkRateLimit failed for ${identifier}:`, err.message);
      // Deliberately fail closed. This endpoint consumes paid LLM capacity and must
      // not become unlimited when its distributed limiter is unavailable.
      return { allowed: false, unavailable: true, resetMs: this.WINDOW_MS };
    }
  }
}

module.exports = RateLimiter;
