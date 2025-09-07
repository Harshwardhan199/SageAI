const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
  title: { type: String, required: true, trim: true },
  isPinned: { type: Boolean, default: false },
  lastMessageAt: { type: Date },

  // NEW: status for archived / active
  status: { type: String, enum: ["active", "archived"], default: "active" },

  // NEW: summary of older messages for context trimming
  summary: { type: String, default: "" },

  // NEW: vector IDs for long-term memory
  vectorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vector" }]

}, { timestamps: true });

// Index for recent chats per user
chatSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
