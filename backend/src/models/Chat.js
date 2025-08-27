const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
  
  title: { type: String, required: true, trim: true },
      
  isPinned: { type: Boolean, default: false },
    
  lastMessageAt: { type: Date }
}, { timestamps: true });

chatSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
