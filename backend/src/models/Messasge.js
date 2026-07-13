const mongoose = require("mongoose");

const partSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image", "audio"], required: true },
  value: { type: String },
  url: { type: String }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String },
  parts: [partSchema],

  // NEW structured response fields
  type: { type: String, enum: ["chat", "quiz"], default: "chat" },
  content: { type: mongoose.Schema.Types.Mixed },
  title: { type: String },

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

  // Sync type and content for user messages
  if (this.sender === "user") {
    this.type = "chat";
    if (this.content === undefined || this.content === null) {
      if (this.text) {
        this.content = this.text;
      } else if (this.parts && this.parts.length > 0) {
        this.content = this.parts
          .filter(p => p.type === "text")
          .map(p => p.value)
          .join("\n");
      } else {
        this.content = "";
      }
    }
  }

  // Sync text and parts from content (for bot messages where content is the source of truth)
  if (this.content !== undefined && this.content !== null && !this.text) {
    if (typeof this.content === "string") {
      this.text = this.content;
      this.parts = [{ type: "text", value: this.content }];
    } else {
      this.text = JSON.stringify(this.content);
      this.parts = [{ type: "text", value: this.text }];
    }
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

  // Conversely, if text/parts are set but type/content are not
  if (!this.type) {
    this.type = "chat";
  }
  if (this.content === undefined || this.content === null) {
    if (this.text) {
      try {
        const parsed = JSON.parse(this.text);
        if (parsed && (parsed.type === "chat" || parsed.type === "quiz")) {
          this.type = parsed.type;
          this.content = parsed.content || parsed.questions;
          if (parsed.title) this.title = parsed.title;
        } else if (Array.isArray(parsed)) {
          this.type = "quiz";
          this.content = parsed;
        } else if (parsed && parsed.questions) {
          this.type = "quiz";
          this.content = parsed.questions;
          if (parsed.title) this.title = parsed.title;
        } else {
          this.content = this.text;
        }
      } catch (e) {
        this.content = this.text;
      }
    } else {
      this.content = "";
    }
  }

  next();
});

// Efficient query for chat history
messageSchema.index({ chatId: 1, createdAt: 1 });

// Optional: vector search index (for Atlas UI)
messageSchema.index({ embedding: "vector" }); // Atlas uses this to detect vector field

module.exports = mongoose.model("Message", messageSchema);
