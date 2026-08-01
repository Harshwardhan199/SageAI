const { getRedis } = require("../../db");

class ConversationCache {
  static get TTL() {
    return parseInt(process.env.REDIS_CHAT_TTL || "86400", 10); // Default 24 hours
  }

  static get WINDOW_SIZE() {
    return parseInt(process.env.REDIS_CHAT_WINDOW_SIZE || "20", 10);
  }

  /**
   * Adds a message to the short-term Redis chat context.
   */
  static async addMessage(chatId, messageObj) {
    if (!chatId) return;

    try {
      const redis = getRedis();
      const key = `chat_context:${chatId}`;

      const cleanMsg = {
        sender: messageObj.sender || (messageObj.role === "user" ? "user" : "bot"),
        role: messageObj.role || (messageObj.sender === "user" ? "user" : "model"),
        text: messageObj.text || "",
        blocks: messageObj.blocks || [],
        timestamp: new Date().toISOString()
      };

      await redis.rPush(key, JSON.stringify(cleanMsg));
      await redis.lTrim(key, -this.WINDOW_SIZE, -1);
      await redis.expire(key, this.TTL);
    } catch (err) {
      console.warn(`[Redis ConversationCache] addMessage failed for chatId ${chatId}:`, err.message);
    }
  }

  /**
   * Fetches short-term Redis chat history for a chat.
   */
  static async getMessages(chatId) {
    if (!chatId) return [];

    try {
      const redis = getRedis();
      const key = `chat_context:${chatId}`;
      const msgs = await redis.lRange(key, 0, -1);
      return msgs.map((m) => JSON.parse(m));
    } catch (err) {
      console.warn(`[Redis ConversationCache] getMessages failed for chatId ${chatId}:`, err.message);
      return [];
    }
  }

  /**
   * Clears the Redis context for a chat.
   */
  static async clearChat(chatId) {
    if (!chatId) return;

    try {
      const redis = getRedis();
      const key = `chat_context:${chatId}`;
      await redis.del(key);
    } catch (err) {
      console.warn(`[Redis ConversationCache] clearChat failed for chatId ${chatId}:`, err.message);
    }
  }
}

module.exports = ConversationCache;
