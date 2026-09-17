const express = require("express");
const router = express.Router();

const { handleEmbeddingWebhook, triggerRetryUnpublished } = require("../controllers/internalController");

// Protected embedding webhook called by Upstash QStash
router.post("/embedding", handleEmbeddingWebhook);

// Protected recovery trigger for retrying unpublished embeddings
router.post("/retry-embeddings", triggerRetryUnpublished);

module.exports = router;
