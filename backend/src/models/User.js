const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: {
    type: String,
    required: function () {
      return !this.authProvider;
    },
  },

  authProvider: { type: String },

  googleId: { type: String },

  tokenVersion: { type: Number, default: 0 },

  // settings: {
  //   theme: { type: String, enum: ["light", "dark"], default: "light" },
  //   language: { type: String, default: "en" },
  //   notifications: { type: Boolean, default: true }
  // }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
