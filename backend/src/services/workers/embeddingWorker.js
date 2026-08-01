require("dotenv").config();
const axios = require("axios");
const Message = require("../../models/Messasge");
const EmbeddingQueue = require("../redis/embeddingQueue");

const LLM_API_URL = process.env.LLM_API_URL || "http://localhost:8000";

let isRunning = false;
let shouldStop = false;

const generateEmbeddingRemote = async (text) => {
  try {
    const res = await axios.post(`${LLM_API_URL}/embed`, {
      text: typeof text === "string" ? text : JSON.stringify(text)
    }, { timeout: 10000 });
    
    if (res.data && Array.isArray(res.data.embedding) && res.data.embedding.length > 0) {
      return res.data.embedding;
    }
    return null;
  } catch (err) {
    console.error("[EmbeddingWorker] Remote embedding API error:", err.message);
    return null;
  }
};

const processNextTask = async () => {
  const task = await EmbeddingQueue.dequeue(2);
  if (!task) return;

  const { messageId, text, attempts } = task;

  try {
    const embedding = await generateEmbeddingRemote(text);

    if (embedding && embedding.length > 0) {
      await Message.findByIdAndUpdate(messageId, { embedding });
      console.log(`[EmbeddingWorker] Successfully attached embedding to message: ${messageId}`);
    } else {
      console.warn(`[EmbeddingWorker] Failed to generate embedding for message: ${messageId} (Attempt ${attempts + 1})`);
      if (attempts < 3) {
        await EmbeddingQueue.requeue(task);
      }
    }
  } catch (err) {
    console.error(`[EmbeddingWorker] Error processing message ${messageId}:`, err.message);
    if (attempts < 3) {
      await EmbeddingQueue.requeue(task);
    }
  }
};

const EmbeddingWorker = {
  /**
   * Start the background worker loop
   */
  start: async () => {
    if (isRunning) return;
    isRunning = true;
    shouldStop = false;

    console.log("[EmbeddingWorker] Background worker started.");

    setImmediate(async function loop() {
      if (shouldStop) {
        isRunning = false;
        console.log("[EmbeddingWorker] Background worker stopped.");
        return;
      }

      try {
        await processNextTask();
      } catch (err) {
        console.error("[EmbeddingWorker] Unhandled loop error:", err);
      }

      if (!shouldStop) {
        setTimeout(loop, 100);
      }
    });
  },

  /**
   * Stop the background worker loop
   */
  stop: () => {
    shouldStop = true;
  }
};

module.exports = EmbeddingWorker;
