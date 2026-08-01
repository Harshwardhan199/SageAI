const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    isPinned: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now },

    // Status for archived / active
    status: { type: String, enum: ["active", "archived"], default: "active" },

    // Summary of older messages for context trimming
    summary: { type: String, default: "" },

    // Vector IDs for long-term memory
    vectorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vector" }]
  },
  { timestamps: true }
);

// Index for recent chats per user & per project
chatSchema.index({ userId: 1, lastMessageAt: -1 });
chatSchema.index({ userId: 1, projectId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
