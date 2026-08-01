const { getRedis } = require("../../db");

class StreamingState {
  static get TTL() {
    return parseInt(process.env.REDIS_STREAMING_TTL || "300", 10); // 5 minutes safety timeout
  }

  /**
   * Sets generation state for a chat ("generating" or "idle").
   */
  static async setGenerating(chatId, status = "generating") {
    if (!chatId) return;

    try {
      const redis = getRedis();
      const key = `generation:${chatId}`;
      if (status === "generating") {
        await redis.set(key, "generating", { EX: this.TTL });
      } else {
        await redis.del(key);
      }
    } catch (err) {
      console.warn(`[Redis StreamingState] setGenerating failed for ${chatId}:`, err.message);
    }
  }

  /**
   * Checks if a chat is currently generating a response.
   */
  static async isGenerating(chatId) {
    if (!chatId) return false;

    try {
      const redis = getRedis();
      const key = `generation:${chatId}`;
      const val = await redis.get(key);
      return val === "generating";
    } catch (err) {
      console.warn(`[Redis StreamingState] isGenerating failed for ${chatId}:`, err.message);
      return false;
    }
  }
}

module.exports = StreamingState;
