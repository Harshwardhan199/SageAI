const { Receiver } = require("@upstash/qstash");
const Message = require("../models/Message");
const Vector = require("../models/Vector");
const EmbeddingService = require("../services/nomic/embeddingService");
const QStashService = require("../services/qstash/qstashService");

let receiverInstance = null;

function getReceiver() {
  if (!receiverInstance) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (currentSigningKey && nextSigningKey) {
      receiverInstance = new Receiver({ currentSigningKey, nextSigningKey });
    }
  }
  return receiverInstance;
}

const verifyQStashSignature = async (req) => {
  const receiver = getReceiver();
  const signature = req.headers["upstash-signature"];

  // Production requirement: strict QStash signature verification
  if (process.env.NODE_ENV === "production" || receiver) {
    if (!receiver) {
      throw new Error("QStash signing keys are missing in production environment.");
    }
    if (!signature) {
      throw new Error("Missing Upstash-Signature header.");
    }

    const bodyStr = req.rawBody || JSON.stringify(req.body);
    const isValid = await receiver.verify({
      signature,
      body: bodyStr
    });

    if (!isValid) {
      throw new Error("Invalid Upstash signature.");
    }
    return true;
  }

  // Development fallback
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && req.headers["x-internal-secret"] !== internalSecret) {
    throw new Error("Unauthorized internal request.");
  }

  return true;
};

const handleEmbeddingWebhook = async (req, res) => {
  try {
    try {
      await verifyQStashSignature(req);
    } catch (authErr) {
      console.warn("[Internal Embedding Webhook] Authentication failed:", authErr.message);
      return res.status(401).json({ error: authErr.message });
    }

    const { messageId } = req.body || {};
    if (!messageId) {
      return res.status(400).json({ error: "Missing required identifier: messageId" });
    }

    // 1. Retrieve authoritative message from MongoDB
    const message = await Message.findById(messageId);
    if (!message) {
      console.warn(`[Internal Embedding Webhook] Message not found: ${messageId}`);
      return res.status(404).json({ error: "Message not found" });
    }

    // 2. IDEMPOTENCY CHECK: at-least-once delivery guarantee
    // Duplicate delivery is expected and must remain harmless
    if (message.embedding && Array.isArray(message.embedding) && message.embedding.length > 0) {
      console.log(`[Internal Embedding Webhook] Idempotent skip: Message ${messageId} already embedded.`);
      return res.status(200).json({ ok: true, alreadyEmbedded: true, messageId });
    }

    // 3. Extract authoritative content from message
    let textToEmbed = "";
    if (message.blocks && Array.isArray(message.blocks) && message.blocks.length > 0) {
      textToEmbed = message.blocks
        .map((b) => b.content || (b.questions ? JSON.stringify(b.questions) : ""))
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    if (!textToEmbed && message.text) {
      textToEmbed = message.text.trim();
    }

    if (!textToEmbed && message.parts && Array.isArray(message.parts)) {
      textToEmbed = message.parts
        .map((p) => p.value || p.url || "")
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    if (!textToEmbed) {
      message.embeddingStatus = "completed";
      await message.save();
      return res.status(200).json({ ok: true, skippedEmptyText: true, messageId });
    }

    // 4. Generate embedding via direct Nomic API
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.error(`[Internal Embedding Webhook] Failed to generate embedding for message: ${messageId}`);
      // Return 500 so QStash can retry according to its retry policy
      return res.status(500).json({ error: "Failed to generate embedding" });
    }

    // 5. Persist embedding to MongoDB
    message.embedding = embedding;
    message.embeddingStatus = "completed";
    await message.save();

    // 6. Upsert Vector model record
    try {
      await Vector.findOneAndUpdate(
        { messageId: message._id },
        {
          messageId: message._id,
          chatId: message.chatId,
          userId: message.userId,
          embedding,
          model: "nomic-embed-text-v1.5",
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (vecErr) {
      console.warn("[Internal Embedding Webhook] Vector collection upsert error:", vecErr.message);
    }

    console.log(`[Internal Embedding Webhook] Successfully embedded message: ${messageId}`);
    return res.status(200).json({ ok: true, messageId, dimensions: embedding.length });
  } catch (err) {
    console.error("[Internal Embedding Webhook] Unexpected error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

const triggerRetryUnpublished = async (req, res) => {
  try {
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (!internalSecret || req.headers["x-internal-secret"] !== internalSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await QStashService.retryUnpublishedEmbeddings();
    return res.json({ ok: true, result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { handleEmbeddingWebhook, triggerRetryUnpublished };
