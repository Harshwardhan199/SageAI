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
    if (!identifier) return { allowed: true, remaining: this.MAX_REQUESTS, resetMs: 0 };

    try {
      const redis = getRedis();
      const key = `rate_limit:${identifier}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.pExpire(key, this.WINDOW_MS);
      }

      const ttlMs = await redis.pTTL(key);

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
      // Fallback: allow request if Redis fails
      return { allowed: true, remaining: 1, resetMs: 0 };
    }
  }
}

module.exports = RateLimiter;
