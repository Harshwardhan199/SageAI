const { getRedis } = require("../../db");

const QUEUE_KEY = "embedding_queue";

const EmbeddingQueue = {
  /**
   * Enqueue a message for asynchronous embedding processing
   */
  enqueue: async (messageId, text) => {
    if (!messageId || !text || typeof text !== "string" || !text.trim()) {
      return false;
    }

    try {
      const redis = getRedis();
      const payload = JSON.stringify({
        messageId: messageId.toString(),
        text: text.trim(),
        enqueuedAt: new Date().toISOString(),
        attempts: 0
      });

      await redis.rPush(QUEUE_KEY, payload);
      return true;
    } catch (err) {
      console.error("[EmbeddingQueue] Enqueue error:", err);
      return false;
    }
  },

  /**
   * Pop a task from queue (blocking pop with timeout)
   */
  dequeue: async (timeoutSeconds = 2) => {
    try {
      const redis = getRedis();
      const result = await redis.bLPop(QUEUE_KEY, timeoutSeconds);
      if (result && result.element) {
        return JSON.parse(result.element);
      }
      return null;
    } catch (err) {
      // Ignore timeout or connection reset errors in loop
      return null;
    }
  },

  /**
   * Re-enqueue a failed task for retry
   */
  requeue: async (task) => {
    try {
      if (!task || task.attempts >= 3) return false;
      task.attempts = (task.attempts || 0) + 1;
      const redis = getRedis();
      await redis.rPush(QUEUE_KEY, JSON.stringify(task));
      return true;
    } catch (err) {
      console.error("[EmbeddingQueue] Requeue error:", err);
      return false;
    }
  },

  /**
   * Get queue length
   */
  getQueueLength: async () => {
    try {
      const redis = getRedis();
      return await redis.lLen(QUEUE_KEY);
    } catch (err) {
      return 0;
    }
  }
};

module.exports = EmbeddingQueue;
