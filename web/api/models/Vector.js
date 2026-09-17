const mongoose = require("mongoose");

const vectorSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  embedding: { type: [Number], required: true },
  model: { type: String },
  createdAt: { type: Date, default: Date.now }
});

vectorSchema.index({ chatId: 1, userId: 1 });

module.exports = mongoose.models.Vector || mongoose.model("Vector", vectorSchema);
