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

  // NEW: embedding ID for vector DB integration
  embeddingId: { type: mongoose.Schema.Types.ObjectId, ref: "Vector", default: null },

  // NEW: summary field for old messages (context trimming)
  summary: { type: String, default: "" },

  // NEW: mark if this message is currently part of the active context window
  isContextual: { type: Boolean, default: true }

}, { timestamps: true });

// Index to fetch messages in order for a chat
messageSchema.index({ chatId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
