require("dotenv").config();
const axios = require("axios")

const { v4: uuidv4 } = require("uuid");
const { getRedis } = require("../db");

const InputRouter = require("../services/InputRouter");
const ReasoningService = require("../services/ReasoningService");

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
  await redis.lTrim(key, -20, -1);
  await redis.expire(key, 60 * 60 * 24);
};

const getRedisContext = async (chatId) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;
  const msgs = await redis.lRange(key, 0, -1);
  return msgs.map(m => JSON.parse(m));
};

// Main function
const tempChat = async (req, res) => {
  try {
    let { currentChat, prompt, parts, model } = req.body;

    // Create chat if not exists
    if (!currentChat) {
      currentChat = `guest-${uuidv4()}`;
    }

    // Default to llama-3.3-70b-versatile if model not provided
    if (!model) {
      model = "llama-3.3-70b-versatile";
    }

    // Validate that reasoning model is allowed
    if (!ReasoningService.allowedModels.includes(model)) {
      return res.status(400).json({ error: `Invalid reasoning model selected: ${model}` });
    }

    // Support both new 'parts' structure and legacy single 'prompt' string
    if (!parts || !Array.isArray(parts)) {
      parts = [{ type: "text", value: prompt || "" }];
    }

    // Extract basic text prompt for title & saving purposes
    const textPart = parts.find(p => p.type === "text");
    const textPrompt = textPart ? textPart.value : (prompt || "Multi-Modal Message");

    // Save user message in Redis context (for short term history compatibility)
    await addToRedisContext(currentChat, {
      sender: "user",
      text: textPrompt,
      parts
    });

    // Retrieve Redis context
    const contextMessages = await getRedisContext(currentChat);

    // Route input modalities and generate final reasoning prompt
    const finalPrompt = await InputRouter.route(parts);

    // Call selected reasoning model using reasoning service (no semantic matches for guests)
    const rawResponse = await ReasoningService.generateResponse(
      model,
      finalPrompt,
      contextMessages,
      []
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

    // Save bot response in Redis
    const botText = llmResponse.blocks
      .map(block => block.content || (block.questions ? JSON.stringify(block.questions) : ""))
      .join(" ");

    await addToRedisContext(currentChat, {
      sender: "bot",
      text: botText,
      blocks: llmResponse.blocks
    });

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error("tempChat error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

const tempFeedback = async (req, res) => {
  try {
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

module.exports = { tempChat, tempFeedback};