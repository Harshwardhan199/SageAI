const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String },

  attachments: [{
    type: { type: String, enum: ["image", "file", "link"], required: true },
    url: { type: String, required: true }
  }],

  metadata: {
    tokensUsed: { type: Number },
    model: { type: String },
    responseTimeMs: { type: Number }
  },

  // NEW: embedding for vector search
  embedding: { type: [Number], default: [] },

  // optional summary for old messages (context pruning)
  summary: { type: String, default: "" },

  // mark if this message is currently part of Redis context
  isContextual: { type: Boolean, default: true }

}, { timestamps: true });

// Efficient query for chat history
messageSchema.index({ chatId: 1, createdAt: 1 });

// Optional: vector search index (for Atlas UI)
messageSchema.index({ embedding: "vector" }); // Atlas uses this to detect vector field

module.exports = mongoose.model("Message", messageSchema);
