const { getRedis } = require("../../db");
const { createHash } = require("../../utils/hash");

class PromptCache {
  static get TTL() {
    return parseInt(process.env.REDIS_PROMPT_CACHE_TTL || "3600", 10); // Default 1 hour
  }

  /**
   * Generates cache key for a prompt + model pair.
   */
  static getKey(promptText, model) {
    const raw = `${model}:${promptText.trim()}`;
    const hash = createHash(raw);
    return `prompt_cache:${hash}`;
  }

  /**
   * Retrieves cached LLM response for a prompt.
   */
  static async getCachedPrompt(promptText, model) {
    if (!promptText || !model) return null;

    try {
      const redis = getRedis();
      const key = this.getKey(promptText, model);
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.warn(`[Redis PromptCache] getCachedPrompt failed:`, err.message);
      return null;
    }
  }

  /**
   * Caches an LLM response for a prompt.
   */
  static async setCachedPrompt(promptText, model, responseObj) {
    if (!promptText || !model || !responseObj) return;

    try {
      const redis = getRedis();
      const key = this.getKey(promptText, model);
      await redis.set(key, JSON.stringify(responseObj), { EX: this.TTL });
    } catch (err) {
      console.warn(`[Redis PromptCache] setCachedPrompt failed:`, err.message);
    }
  }
}

module.exports = PromptCache;
