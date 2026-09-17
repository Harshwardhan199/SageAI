require("dotenv").config();

const User = require("../models/User");
const Chat = require("../models/Chat");
const Project = require("../models/Project");
const Message = require("../models/Message");

const InputRouter = require("../services/InputRouter");
const ReasoningService = require("../services/ReasoningService");
const GroqService = require("../services/groq/groqService");
const ProjectService = require("../services/project/projectService");
const ContextRanker = require("../services/memory/contextRanker");
const QStashService = require("../services/qstash/qstashService");

const ConversationCache = require("../services/redis/conversationCache");
const RateLimiter = require("../services/redis/rateLimiter");
const PromptCache = require("../services/redis/promptCache");
const VectorSearchCache = require("../services/redis/vectorSearchCache");
const StreamingState = require("../services/redis/streamingState");
const { extractBlocks } = require("../utils/blockExtractor");

function formatResponse(raw) {
  if (!raw || typeof raw !== "string") return raw;

  const segments = raw.split(/(```[\s\S]*?```)/g);

  const formatted = segments
    .map((segment) => {
      if (segment.startsWith("```")) return segment;

      let s = segment;
      s = s.replace(/Step (\d+):/g, "### Step $1:");
      s = s.replace(/(\b[a-zA-Z0-9_-]+\.(js|py|json|txt|md)\b)/g, "`$1`");
      s = s.replace(/(npm [^\n]+|mkdir [^\n]+|cd [^\n]+)/g, "```\n$1\n```");
      s = s.replace(/\b(express|body-parser|cors)\b/g, "`$1`");
      s = s.replace(/\b(True|False|None|return|def|for|if)\b/g, "`$1`");

      return s;
    })
    .join("");

  return formatted;
}

const chat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const rateCheck = await RateLimiter.checkRateLimit(user._id.toString());
    if (rateCheck.unavailable) {
      return res.status(503).json({ error: "Rate limiting is temporarily unavailable. Please retry shortly." });
    }
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment before sending another message.",
        resetMs: rateCheck.resetMs
      });
    }

    let { currentChat, projectId, prompt, parts, model } = req.body;

    if (!model) {
      model = "llama-3.3-70b-versatile";
    }

    if (!ReasoningService.allowedModels.includes(model)) {
      return res.status(400).json({ error: `Invalid reasoning model selected: ${model}` });
    }

    if (!parts || !Array.isArray(parts)) {
      parts = [{ type: "text", value: prompt || "" }];
    }

    const textPart = parts.find(p => p.type === "text");
    const textPrompt = textPart ? textPart.value : (prompt || "Multi-Modal Message");

    const isPureText = parts.length === 1 && parts[0].type === "text";
    if (isPureText && currentChat) {
      const cachedResponse = await PromptCache.getCachedPrompt(textPrompt, model);
      if (cachedResponse) {
        return res.json({ message: "Response generated (cached)", currentChat, llmResponse: cachedResponse });
      }
    }

    let chatDoc;
    if (currentChat) {
      chatDoc = await Chat.findOne({ _id: currentChat, userId: user._id });
    }

    if (!chatDoc) {
      let targetProjectId = projectId;
      if (!targetProjectId) {
        const defaultProject = await ProjectService.getOrCreateDefaultProject(user._id);
        targetProjectId = defaultProject._id;
      }

      chatDoc = new Chat({
        userId: user._id,
        projectId: targetProjectId,
        title: textPrompt.substring(0, 50) || "New Chat",
        lastMessageAt: new Date()
      });
      await chatDoc.save();
      currentChat = chatDoc._id;
    } else {
      chatDoc.lastMessageAt = new Date();
      await chatDoc.save();
    }

    const finalPrompt = await InputRouter.route(parts);
    const embeddingText = parts.map(p => p.value || p.url || "").join(" ");

    // Persist authoritative user message to MongoDB
    const userMessage = new Message({
      chatId: currentChat,
      userId: user._id,
      projectId: chatDoc.projectId,
      role: "user",
      parts: parts
    });
    await userMessage.save();

    // Asynchronously dispatch embedding job to QStash (contains ONLY identifiers)
    QStashService.publishEmbeddingJob({
      messageId: userMessage._id,
      chatId: currentChat,
      userId: user._id
    }).catch(() => {});

    await ConversationCache.addMessage(currentChat, userMessage);

    const contextMessages = await ConversationCache.getMessages(currentChat);
    const activeProject = await Project.findById(chatDoc.projectId);
    const sharedContext = activeProject ? activeProject.sharedContext : "";

    let semanticMatches = [];
    if (chatDoc.projectId) {
      if (embeddingText.trim()) {
        semanticMatches = await VectorSearchCache.getCachedVectorResults(embeddingText, chatDoc.projectId);
      }

      if (!semanticMatches || semanticMatches.length === 0) {
        let rawMatches = [];
        try {
          rawMatches = await Message.find({
            projectId: chatDoc.projectId,
            chatId: { $ne: currentChat }
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        } catch (e) {}

        semanticMatches = ContextRanker.rankMatches(rawMatches, currentChat, 5);

        if (embeddingText.trim() && semanticMatches.length > 0) {
          await VectorSearchCache.setCachedVectorResults(embeddingText, chatDoc.projectId, semanticMatches);
        }
      }
    }

    const rawResponse = await ReasoningService.generateResponse(
      model,
      finalPrompt,
      contextMessages,
      semanticMatches,
      sharedContext
    );

    let llmResponse = rawResponse;
    if (typeof llmResponse === "string") {
      try {
        llmResponse = JSON.parse(llmResponse);
      } catch (e) {
        llmResponse = {
          blocks: [{ type: "chat", content: formatResponse(llmResponse) }]
        };
      }
    }

    if (llmResponse && Array.isArray(llmResponse.blocks)) {
      llmResponse.blocks = llmResponse.blocks.map(block => {
        if (block.type === "chat" && typeof block.content === "string") {
          block.content = formatResponse(block.content);
        }
        return block;
      });
    } else {
      llmResponse = {
        blocks: [{ type: "chat", content: typeof llmResponse === "object" ? JSON.stringify(llmResponse) : String(llmResponse) }]
      };
    }

    if (isPureText) {
      await PromptCache.setCachedPrompt(textPrompt, model, llmResponse);
    }

    // Persist authoritative bot message to MongoDB
    const botMessage = new Message({
      chatId: currentChat,
      userId: user._id,
      projectId: chatDoc.projectId,
      role: "model",
      sender: "bot",
      blocks: llmResponse.blocks
    });
    await botMessage.save();

    // Asynchronously dispatch bot embedding job to QStash
    QStashService.publishEmbeddingJob({
      messageId: botMessage._id,
      chatId: currentChat,
      userId: user._id
    }).catch(() => {});

    await ConversationCache.addMessage(currentChat, botMessage);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error("chatController error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

const feedback = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let { currentChat, prompt } = req.body;

    const rawFeedback = await GroqService.generateFeedback({
      model: "llama-3.1-8b-instant",
      message: prompt
    });

    const llmResponse = formatResponse(rawFeedback);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error("feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const streamChat = async (req, res) => {
  let currentChatId = null;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const rateCheck = await RateLimiter.checkRateLimit(user._id.toString());
    if (rateCheck.unavailable) {
      return res.status(503).json({ error: "Rate limiting is temporarily unavailable. Please retry shortly." });
    }
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment before sending another message.",
        resetMs: rateCheck.resetMs
      });
    }

    let { currentChat, projectId, prompt, parts, model } = req.body;
    if (!model) model = "llama-3.3-70b-versatile";
    if (!ReasoningService.allowedModels.includes(model)) {
      return res.status(400).json({ error: `Invalid reasoning model selected: ${model}` });
    }

    if (!parts || !Array.isArray(parts)) {
      parts = [{ type: "text", value: prompt || "" }];
    }

    const textPart = parts.find(p => p.type === "text");
    const textPrompt = textPart ? textPart.value : (prompt || "Multi-Modal Message");

    let chatDoc;
    if (currentChat) {
      chatDoc = await Chat.findOne({ _id: currentChat, userId: user._id });
    }

    if (!chatDoc) {
      let targetProjectId = projectId;
      if (!targetProjectId) {
        const defaultProject = await ProjectService.getOrCreateDefaultProject(user._id);
        targetProjectId = defaultProject._id;
      }

      chatDoc = new Chat({
        userId: user._id,
        projectId: targetProjectId,
        title: textPrompt.substring(0, 50) || "New Chat",
        lastMessageAt: new Date()
      });
      await chatDoc.save();
      currentChat = chatDoc._id;
    } else {
      chatDoc.lastMessageAt = new Date();
      await chatDoc.save();
    }

    currentChatId = currentChat;

    await StreamingState.setGenerating(currentChat, "generating");

    // Configure SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send metadata frame
    res.write(`data: ${JSON.stringify({ meta: { currentChat, title: chatDoc.title } })}\n\n`);

    const finalPrompt = await InputRouter.route(parts);

    // Persist user message to MongoDB
    const userMessage = new Message({
      chatId: currentChat,
      userId: user._id,
      projectId: chatDoc.projectId,
      role: "user",
      parts: parts
    });
    await userMessage.save();

    // Asynchronously dispatch embedding job to QStash
    QStashService.publishEmbeddingJob({
      messageId: userMessage._id,
      chatId: currentChat,
      userId: user._id
    }).catch(() => {});

    await ConversationCache.addMessage(currentChat, userMessage);

    const contextMessages = await ConversationCache.getMessages(currentChat);
    const activeProject = await Project.findById(chatDoc.projectId);
    const sharedContext = activeProject ? activeProject.sharedContext : "";

    let semanticMatches = [];
    if (chatDoc.projectId) {
      let rawMatches = [];
      try {
        rawMatches = await Message.find({
          projectId: chatDoc.projectId,
          chatId: { $ne: currentChat }
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
      } catch (e) {}

      semanticMatches = ContextRanker.rankMatches(rawMatches, currentChat, 5);
    }

    const messagesPayload = [];
    let systemPrompt = "You are a helpful assistant.";
    if (sharedContext && sharedContext.trim()) {
      systemPrompt += `\n\nProject Workspace Context Instructions:\n${sharedContext.trim()}`;
    }
    if (semanticMatches && semanticMatches.length > 0) {
      const snippets = semanticMatches.map(m => m.text || (m.parts && m.parts.map(p => p.value).join(" "))).filter(Boolean);
      if (snippets.length > 0) {
        systemPrompt += "\n\nHere is relevant workspace context:\n" + snippets.map(s => `- ${s}`).join("\n");
      }
    }
    messagesPayload.push({ role: "system", content: systemPrompt });

    for (const msg of contextMessages) {
      const content = msg.text || (msg.parts && msg.parts.map(p => p.value).join("\n")) || "";
      messagesPayload.push({
        role: msg.role === "model" || msg.sender === "bot" ? "assistant" : "user",
        content
      });
    }
    messagesPayload.push({ role: "user", content: finalPrompt });

    // Client disconnect & abort handling
    const abortController = new AbortController();
    let clientDisconnected = false;

    req.on("close", () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
        abortController.abort();
        StreamingState.setGenerating(currentChat, "idle").catch(() => {});
      }
    });

    const stream = await GroqService.streamChatCompletion(
      { model, messages: messagesPayload },
      { signal: abortController.signal }
    );

    let accumulatedText = "";

    for await (const chunk of stream) {
      if (clientDisconnected) break;

      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        accumulatedText += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    if (!clientDisconnected) {
      let blocks = extractBlocks(accumulatedText);
      blocks = blocks.map(block => {
        if (block.type === "chat" && typeof block.content === "string") {
          block.content = formatResponse(block.content);
        }
        return block;
      });

      // Await bot message persistence before completing request
      const botMessage = new Message({
        chatId: currentChat,
        userId: user._id,
        projectId: chatDoc.projectId,
        role: "model",
        sender: "bot",
        blocks: blocks
      });
      await botMessage.save();

      // Dispatch bot embedding job asynchronously
      QStashService.publishEmbeddingJob({
        messageId: botMessage._id,
        chatId: currentChat,
        userId: user._id
      }).catch(() => {});

      await ConversationCache.addMessage(currentChat, botMessage);

      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    console.error("streamChat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } finally {
    if (currentChatId) {
      await StreamingState.setGenerating(currentChatId, "idle").catch(() => {});
    }
  }
};

module.exports = { chat, feedback, streamChat };
