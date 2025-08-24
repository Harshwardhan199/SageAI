const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },

  sender: { type: String, enum: ["user", "bot"], required: true },

  text: { type: String },
  
  attachments: [{
    type: { type: String, enum: ["image", "file", "link"], required: true },
    url: { type: String, required: true }
  }],
  
  metadata: {
    tokensUsed: { type: Number },
    model: { type: String },
    responseTimeMs: { type: Number }
  }
}, { timestamps: true });

messageSchema.index({ chatId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
