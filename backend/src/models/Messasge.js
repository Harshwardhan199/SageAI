const mongoose = require("mongoose");

const partSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image", "audio"], required: true },
  value: { type: String },
  url: { type: String }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  type: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed },
  title: { type: String },
  questions: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String },
  parts: [partSchema],

  // NEW structured content blocks
  blocks: [blockSchema],

  attachments: [{
    type: { type: String, enum: ["image", "file", "link"], required: true },
    url: { type: String, required: true }
  }],

  metadata: {
    tokensUsed: { type: Number },
    model: { type: String },
    responseTimeMs: { type: Number }
  },

  // NEW: embedding for vector search
  embedding: { type: [Number], default: [] },

  // optional summary for old messages (context pruning)
  summary: { type: String, default: "" },

  // mark if this message is currently part of Redis context
  isContextual: { type: Boolean, default: true }

}, { timestamps: true });

// Pre-validate hook for backward compatibility and field sync
messageSchema.pre("validate", function(next) {
  // Sync role and sender
  if (this.role && !this.sender) {
    this.sender = this.role === "user" ? "user" : "bot";
  } else if (this.sender && !this.role) {
    this.role = this.sender === "user" ? "user" : "model";
  }

  // Populate blocks for user messages if missing
  if (this.sender === "user" && (!this.blocks || this.blocks.length === 0)) {
    const userText = this.text || (this.parts && this.parts.filter(p => p.type === "text").map(p => p.value).join("\n")) || "";
    this.blocks = [{ type: "chat", content: userText }];
  }

  // Convert legacy format (type/content) to blocks if blocks is missing
  if (!this.blocks || this.blocks.length === 0) {
    if (this.type && this.content) {
      if (this.type === "quiz") {
        this.blocks = [{
          type: "quiz",
          title: this.title || "Quiz",
          questions: this.content
        }];
      } else {
        this.blocks = [{
          type: this.type,
          content: this.content
        }];
      }
    } else if (this.text) {
      try {
        const parsed = JSON.parse(this.text);
        if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
          this.blocks = parsed.blocks;
        } else if (parsed && parsed.type && (parsed.content || parsed.questions)) {
          if (parsed.type === "quiz") {
            this.blocks = [{
              type: "quiz",
              title: parsed.title || "Quiz",
              questions: parsed.content || parsed.questions
            }];
          } else {
            this.blocks = [{
              type: parsed.type,
              content: parsed.content
            }];
          }
        } else {
          this.blocks = [{ type: "chat", content: this.text }];
        }
      } catch (e) {
        this.blocks = [{ type: "chat", content: this.text }];
      }
    }
  }

  // Sync text and parts from blocks list
  if (this.blocks && this.blocks.length > 0 && !this.text) {
    this.text = this.blocks.map(block => {
      if (block.type === "chat") {
        return block.content || "";
      } else if (block.type === "quiz") {
        return JSON.stringify({ type: "quiz", title: block.title, questions: block.questions });
      }
      return JSON.stringify(block);
    }).join("\n\n");
  }

  // Sync text and parts
  if (this.parts && this.parts.length > 0) {
    if (!this.text) {
      this.text = this.parts
        .filter(p => p.type === "text")
        .map(p => p.value)
        .join("\n");
    }
  } else if (this.text) {
    this.parts = [{ type: "text", value: this.text }];
  }

  next();
});

// Efficient query for chat history
messageSchema.index({ chatId: 1, createdAt: 1 });

// Optional: vector search index (for Atlas UI)
messageSchema.index({ embedding: "vector" }); // Atlas uses this to detect vector field

module.exports = mongoose.model("Message", messageSchema);
