const { Client } = require("@upstash/qstash");
const Message = require("../../models/Message");

let qstashClient = null;

function getClient() {
  if (!qstashClient) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      return null;
    }
    qstashClient = new Client({ token });
  }
  return qstashClient;
}

function getWebhookUrl() {
  if (process.env.QSTASH_WEBHOOK_URL) {
    return process.env.QSTASH_WEBHOOK_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/internal/embedding`;
  }
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/api/internal/embedding`;
  }
  return "http://localhost:5000/api/internal/embedding";
}

async function markPublishFailure(messageId) {
  // A chat request has already persisted this message before publishing. Avoid
  // Mongoose buffering an update forever if the database became unavailable.
  if (Message.db.readyState !== 1) {
    console.error(`[QStash] Cannot record failed publication for ${messageId}: MongoDB is unavailable.`);
    return;
  }
  await Message.findByIdAndUpdate(messageId, { embeddingStatus: "failed_publish" });
}

const QStashService = {
  /**
   * Publishes an asynchronous embedding job containing ONLY identifiers.
   * Never sends raw message text over QStash.
   * At-least-once delivery semantics: non-blocking to user chat.
   *
   * @param {Object} params
   * @param {string} params.messageId Message ObjectId
   * @param {string} params.chatId Chat ObjectId
   * @param {string} params.userId User ObjectId
   * @returns {Promise<{ success: boolean, messageId: string, error?: string }>}
   */
  publishEmbeddingJob: async ({ messageId, chatId, userId }) => {
    if (!messageId) {
      return { success: false, error: "Missing messageId" };
    }

    const payload = {
      messageId: messageId.toString(),
      chatId: chatId ? chatId.toString() : null,
      userId: userId ? userId.toString() : null
    };

    try {
      const client = getClient();
      const webhookUrl = getWebhookUrl();

      if (!client) {
        console.warn(`[QStashService] QSTASH_TOKEN not configured. Marking message ${messageId} as failed_publish.`);
        await markPublishFailure(messageId);
        return { success: false, messageId, error: "QSTASH_TOKEN not configured" };
      }

      await client.publishJSON({
        url: webhookUrl,
        body: payload,
        retries: 3
      });

      await Message.findByIdAndUpdate(messageId, { embeddingStatus: "published" });
      return { success: true, messageId };
    } catch (err) {
      console.error(`[QStash Publish Error] Failed to publish embedding job for message ${messageId}:`, {
        error: err.message,
        chatId,
        userId
      });

      try {
        await markPublishFailure(messageId);
      } catch (dbErr) {
        console.error(`[QStash] Failed to update message embeddingStatus for ${messageId}:`, dbErr.message);
      }

      // Do NOT throw: user response must remain successful
      return { success: false, messageId, error: err.message };
    }
  },

  /**
   * Recovers and republishes embedding jobs for messages that failed publication.
   */
  retryUnpublishedEmbeddings: async (limit = 50) => {
    try {
      const failedMessages = await Message.find({
        embeddingStatus: "failed_publish",
        $or: [{ embedding: { $size: 0 } }, { embedding: { $exists: false } }]
      })
        .limit(limit)
        .select("_id chatId userId");

      const results = [];
      for (const msg of failedMessages) {
        const res = await QStashService.publishEmbeddingJob({
          messageId: msg._id,
          chatId: msg.chatId,
          userId: msg.userId
        });
        results.push(res);
      }

      return { total: failedMessages.length, results };
    } catch (err) {
      console.error("[QStashService] retryUnpublishedEmbeddings error:", err.message);
      return { total: 0, error: err.message };
    }
  }
};

module.exports = QStashService;
