const { getRedis } = require("../../db");

class SessionStore {
  static get TTL() {
    return parseInt(process.env.REDIS_SESSION_TTL || "604800", 10); // Default 7 days
  }

  /**
   * Stores a new session in Redis (`session:<sessionId>`) and indexes it under `user_sessions:<userId>`.
   */
  static async createSession(sessionId, userId, meta = {}) {
    if (!sessionId || !userId) return null;

    try {
      const redis = getRedis();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + this.TTL * 1000).toISOString();

      const sessionData = {
        userId: userId.toString(),
        userAgent: meta.userAgent || "unknown",
        ip: meta.ip || "unknown",
        createdAt: now,
        lastSeen: now,
        expiresAt
      };

      const sessionKey = `session:${sessionId}`;
      const userIndexKey = `user_sessions:${userId}`;

      await redis.set(sessionKey, JSON.stringify(sessionData), { EX: this.TTL });
      await redis.sAdd(userIndexKey, sessionId);
      await redis.expire(userIndexKey, this.TTL);

      return sessionData;
    } catch (err) {
      console.error(`[Redis SessionStore] createSession failed for ${sessionId}:`, err.message);
      return null;
    }
  }

  /**
   * Retrieves a session by sessionId.
   */
  static async getSession(sessionId) {
    if (!sessionId) return null;

    try {
      const redis = getRedis();
      const sessionKey = `session:${sessionId}`;
      const data = await redis.get(sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`[Redis SessionStore] getSession failed for ${sessionId}:`, err.message);
      return null;
    }
  }

  /**
   * Updates lastSeen timestamp and refreshes Redis TTL for an active session.
   */
  static async touchSession(sessionId) {
    if (!sessionId) return null;

    try {
      const redis = getRedis();
      const sessionKey = `session:${sessionId}`;
      const raw = await redis.get(sessionKey);
      if (!raw) return null;

      const sessionData = JSON.parse(raw);
      sessionData.lastSeen = new Date().toISOString();

      await redis.set(sessionKey, JSON.stringify(sessionData), { EX: this.TTL });
      if (sessionData.userId) {
        await redis.expire(`user_sessions:${sessionData.userId}`, this.TTL);
      }

      return sessionData;
    } catch (err) {
      console.error(`[Redis SessionStore] touchSession failed for ${sessionId}:`, err.message);
      return null;
    }
  }

  /**
   * Deletes a session and removes it from the user's session index.
   */
  static async deleteSession(sessionId, userId) {
    if (!sessionId) return;

    try {
      const redis = getRedis();
      const sessionKey = `session:${sessionId}`;

      // If userId wasn't provided, try to extract it from session data first
      let targetUserId = userId;
      if (!targetUserId) {
        const existing = await this.getSession(sessionId);
        if (existing) targetUserId = existing.userId;
      }

      await redis.del(sessionKey);

      if (targetUserId) {
        const userIndexKey = `user_sessions:${targetUserId}`;
        await redis.sRem(userIndexKey, sessionId);
      }
    } catch (err) {
      console.error(`[Redis SessionStore] deleteSession failed for ${sessionId}:`, err.message);
    }
  }

  /**
   * Retrieves all active session objects for a user.
   */
  static async getUserSessions(userId) {
    if (!userId) return [];

    try {
      const redis = getRedis();
      const userIndexKey = `user_sessions:${userId}`;
      const sessionIds = await redis.sMembers(userIndexKey);

      const activeSessions = [];
      for (const id of sessionIds) {
        const session = await this.getSession(id);
        if (session) {
          activeSessions.push({ sessionId: id, ...session });
        } else {
          // Clean up stale index member
          await redis.sRem(userIndexKey, id);
        }
      }

      return activeSessions;
    } catch (err) {
      console.error(`[Redis SessionStore] getUserSessions failed for ${userId}:`, err.message);
      return [];
    }
  }

  /**
   * Revokes all active sessions for a user (e.g. forced security logout).
   */
  static async revokeAllUserSessions(userId) {
    if (!userId) return;

    try {
      const redis = getRedis();
      const userIndexKey = `user_sessions:${userId}`;
      const sessionIds = await redis.sMembers(userIndexKey);

      for (const id of sessionIds) {
        await redis.del(`session:${id}`);
      }

      await redis.del(userIndexKey);
    } catch (err) {
      console.error(`[Redis SessionStore] revokeAllUserSessions failed for ${userId}:`, err.message);
    }
  }
}

module.exports = SessionStore;
