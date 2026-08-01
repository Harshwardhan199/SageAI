const { getRedis } = require("../../db");
const { createHash } = require("../../utils/hash");

class VectorSearchCache {
  static get TTL() {
    return parseInt(process.env.REDIS_VECTOR_CACHE_TTL || "300", 10); // Default 5 minutes
  }

  /**
   * Generates cache key for a vector query + projectId pair.
   */
  static getKey(queryText, projectId) {
    const raw = `${projectId}:${queryText.trim()}`;
    const hash = createHash(raw);
    return `vector_cache:${hash}`;
  }

  /**
   * Retrieves cached RAG vector search results.
   */
  static async getCachedVectorResults(queryText, projectId) {
    if (!queryText || !projectId) return null;

    try {
      const redis = getRedis();
      const key = this.getKey(queryText, projectId);
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.warn(`[Redis VectorSearchCache] getCachedVectorResults failed:`, err.message);
      return null;
    }
  }

  /**
   * Caches RAG vector search results.
   */
  static async setCachedVectorResults(queryText, projectId, matches) {
    if (!queryText || !projectId || !matches) return;

    try {
      const redis = getRedis();
      const key = this.getKey(queryText, projectId);
      await redis.set(key, JSON.stringify(matches), { EX: this.TTL });
    } catch (err) {
      console.warn(`[Redis VectorSearchCache] setCachedVectorResults failed:`, err.message);
    }
  }
}

module.exports = VectorSearchCache;
