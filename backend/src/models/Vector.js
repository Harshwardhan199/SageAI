const mongoose = require("mongoose");

const vectorSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // actual embedding vector
  embedding: { type: [Number], required: true },

  // optional: metadata for fast retrieval / filtering
  model: { type: String },
  createdAt: { type: Date, default: Date.now }
});

vectorSchema.index({ chatId: 1, userId: 1 });

module.exports = mongoose.model("Vector", vectorSchema);
