const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required: function () { return !this.authProvider; },
  },
  authProvider: { type: String },
  googleId: { type: String },
  tokenVersion: { type: Number, default: 0 },

  // NEW: Track currently active chat
  currentChatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },

  // NEW: Role for multi-level access
  role: { type: String, enum: ["user", "admin"], default: "user" }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
