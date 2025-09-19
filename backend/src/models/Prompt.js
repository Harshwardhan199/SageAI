const mongoose = require("mongoose");

const PromptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

PromptSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("Prompt", PromptSchema);

