const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  invalidAccessTokens: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
