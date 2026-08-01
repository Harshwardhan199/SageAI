require("dotenv").config();
const axios = require("axios")

const User = require("../models/User");
const Chat = require("../models/Chat");
const Project = require("../models/Project");
const Message = require("../models/Messasge");

const InputRouter = require("../services/InputRouter");
const ReasoningService = require("../services/ReasoningService");
const ProjectService = require("../services/project/projectService");
const ContextRanker = require("../services/memory/contextRanker");

const ConversationCache = require("../services/redis/conversationCache");
const RateLimiter = require("../services/redis/rateLimiter");
const PromptCache = require("../services/redis/promptCache");
const VectorSearchCache = require("../services/redis/vectorSearchCache");
const StreamingState = require("../services/redis/streamingState");
const EmbeddingQueue = require("../services/redis/embeddingQueue");
const { extractBlocks } = require("../utils/blockExtractor");

const { getRedis } = require("../db");

const LLM_API_URL = process.env.LLM_API_URL;

// Response formatter
function formatResponse(raw) {
  if (!raw || typeof raw !== "string") return raw;

  // Split text into code and non-code segments
  const segments = raw.split(/(```[\s\S]*?```)/g);

  const formatted = segments
    .map((segment) => {
      // If it's a code block, return as-is
      if (segment.startsWith("```")) return segment;

      // Otherwise process the text segment
      let s = segment;

      // Step headings
      s = s.replace(/Step (\d+):/g, "### Step $1:");

      // Filenames and commands
      s = s.replace(
        /(\b[a-zA-Z0-9_-]+\.(js|py|json|txt|md)\b)/g,
        "`$1`"
      );
      s = s.replace(
        /(npm [^\n]+|mkdir [^\n]+|cd [^\n]+)/g,
        "```\n$1\n```"
      );

      // Highlight dependencies
      s = s.replace(
        /\b(express|body-parser|cors)\b/g,
        "`$1`"
      );

      // Highlight only Python keywords outside code blocks
      s = s.replace(
        /\b(True|False|None|return|def|for|if)\b/g,
        "`$1`"
      );

      return s;
    })
    .join("");

  return formatted;
}

// Context Setter functions
const addToRedisContext = async (chatId, messageObj) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;

  // Store only essential fields
  const cleanMsg = {
    sender: messageObj.sender,
    text: messageObj.text,
    type: messageObj.type,
    content: messageObj.content,
    title: messageObj.title,
    timestamp: new Date().toISOString()
  };

  await redis.rPush(key, JSON.stringify(cleanMsg));
  await redis.lTrim(key, -10, -1);
  await redis.expire(key, 60 * 60 * 24);
};

const getRedisContext = async (chatId) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;
  const msgs = await redis.lRange(key, 0, -1);
  return msgs.map(m => JSON.parse(m));
};

const generateEmbedding = async (text) => {

  const payload = { text: typeof text === "string" ? text : JSON.stringify(text) };

  try {
    const res = await axios.post(`${LLM_API_URL}/embed`, payload );
    return res.data.embedding;
  } catch (err) {
    console.error("Error generating embedding:", err);
    return null;
  }
};

// Main chat handler
const chat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Rate Limiting via Redis
    const rateCheck = await RateLimiter.checkRateLimit(user._id.toString());
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment before sending another message.",
        resetMs: rateCheck.resetMs
      });
    }

    let { currentChat, projectId, prompt, parts, model } = req.body;

    // Default model if not provided
    if (!model) {
      model = "llama-3.3-70b-versatile";
    }

    // Validate model
    if (!ReasoningService.allowedModels.includes(model)) {
      return res.status(400).json({ error: `Invalid reasoning model selected: ${model}` });
    }

    // Support both 'parts' array and single 'prompt' string
    if (!parts || !Array.isArray(parts)) {
      parts = [{ type: "text", value: prompt || "" }];
    }

    const textPart = parts.find(p => p.type === "text");
    const textPrompt = textPart ? textPart.value : (prompt || "Multi-Modal Message");

    // Check Prompt Cache (for pure text prompts)
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

    // Create chat if not exists
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

    // Route input modalities and generate prompt
    const finalPrompt = await InputRouter.route(parts);

    const embeddingText = parts.map(p => p.value || p.url || "").join(" ");

    // Save user message with parts and projectId (instant response)
    const userMessage = new Message({
      chatId: currentChat,
      projectId: chatDoc.projectId,
      role: "user",
      parts: parts
    });
    await userMessage.save();

    // Enqueue embedding task asynchronously in Redis background queue
    EmbeddingQueue.enqueue(userMessage._id, embeddingText);

    // Add to Redis sliding-window short-term context
    await ConversationCache.addMessage(currentChat, userMessage);

    // Retrieve Redis short-term context
    const contextMessages = await ConversationCache.getMessages(currentChat);

    // Fetch active project for shared context instructions
    const activeProject = await Project.findById(chatDoc.projectId);
    const sharedContext = activeProject ? activeProject.sharedContext : "";

    // Retrieve semantic project matches
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

        // Cache vector search results in Redis
        if (embeddingText.trim() && semanticMatches.length > 0) {
          await VectorSearchCache.setCachedVectorResults(embeddingText, chatDoc.projectId, semanticMatches);
        }
      }
    }

    // Call selected reasoning model using reasoning service
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

    // Cache pure text prompt response
    if (isPureText) {
      await PromptCache.setCachedPrompt(textPrompt, model, llmResponse);
    }

    // Save bot response (instant response)
    const botMessage = new Message({
      chatId: currentChat,
      projectId: chatDoc.projectId,
      role: "model",
      sender: "bot",
      blocks: llmResponse.blocks
    });
    await botMessage.save();

    // Enqueue bot message embedding task asynchronously
    const botEmbeddingText = llmResponse.blocks
      .map(block => block.content || (block.questions ? JSON.stringify(block.questions) : ""))
      .join(" ");
    EmbeddingQueue.enqueue(botMessage._id, botEmbeddingText);

    // Update Redis context with bot response
    await ConversationCache.addMessage(currentChat, botMessage);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error("chatController error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// Quiz Feedback
const feedback = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let { currentChat, prompt } = req.body;

    const apiRes = await axios.post(`${LLM_API_URL}/feedback`, {
      model: "llama-3.1-8b-instant",
      message: prompt
    });

    const llmResponse = formatResponse(apiRes.data);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// SSE Real-Time Streaming Chat
const streamChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const rateCheck = await RateLimiter.checkRateLimit(user._id.toString());
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

    // Set Redis streaming state
    await StreamingState.setGenerating(currentChat, "generating");

    // Configure SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send metadata frame
    res.write(`data: ${JSON.stringify({ meta: { currentChat, title: chatDoc.title } })}\n\n`);

    const finalPrompt = await InputRouter.route(parts);
    const embeddingText = parts.map(p => p.value || p.url || "").join(" ");

    const userMessage = new Message({
      chatId: currentChat,
      projectId: chatDoc.projectId,
      role: "user",
      parts: parts
    });
    await userMessage.save();
    
    // Enqueue user message embedding task asynchronously in Redis background queue
    EmbeddingQueue.enqueue(userMessage._id, embeddingText);

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

    // Request SSE stream from FastAPI
    const streamRes = await axios.post(
      `${LLM_API_URL}/chat/stream`,
      { model, messages: messagesPayload },
      { responseType: "stream" }
    );

    let accumulatedText = "";
    let sseBuffer = "";

    streamRes.data.on("data", (chunk) => {
      const chunkStr = chunk.toString();
      res.write(chunkStr);

      sseBuffer += chunkStr;
      const lines = sseBuffer.split("\n");
      // Keep last incomplete line in buffer
      sseBuffer = lines.pop();

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ") && !trimmedLine.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(trimmedLine.substring(6));
            if (parsed.token) accumulatedText += parsed.token;
          } catch (e) {}
        }
      }
    });

    streamRes.data.on("end", async () => {
      try {
        if (sseBuffer.trim().startsWith("data: ") && !sseBuffer.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(sseBuffer.trim().substring(6));
            if (parsed.token) accumulatedText += parsed.token;
          } catch (e) {}
        }

        let blocks = extractBlocks(accumulatedText);
        blocks = blocks.map(block => {
          if (block.type === "chat" && typeof block.content === "string") {
            block.content = formatResponse(block.content);
          }
          return block;
        });

        const botMessage = new Message({
          chatId: currentChat,
          projectId: chatDoc.projectId,
          role: "model",
          sender: "bot",
          blocks: blocks
        });
        await botMessage.save();

        // Enqueue bot message embedding task asynchronously
        const botText = blocks
          .map(b => b.content || (b.questions ? JSON.stringify(b.questions) : ""))
          .join(" ");
        EmbeddingQueue.enqueue(botMessage._id, botText);

        await ConversationCache.addMessage(currentChat, botMessage);
        await StreamingState.setGenerating(currentChat, "idle");
      } catch (err) {
        console.error("Error saving streaming message:", err);
      } finally {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    });

    streamRes.data.on("error", async (err) => {
      console.error("Stream error:", err);
      await StreamingState.setGenerating(currentChat, "idle");
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error("streamChat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

module.exports = { chat, feedback, streamChat }; 