const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
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

promptSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.models.Prompt || mongoose.model("Prompt", promptSchema);
