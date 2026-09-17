require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const { getRedis } = require("../db");
const InputRouter = require("../services/InputRouter");
const ReasoningService = require("../services/ReasoningService");
const GroqService = require("../services/groq/groqService");

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

const addToRedisContext = async (chatId, messageObj) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;

  const cleanMsg = {
    sender: messageObj.sender,
    text: messageObj.text,
    type: messageObj.type,
    content: messageObj.content,
    title: messageObj.title,
    timestamp: new Date().toISOString()
  };

  await redis.rpush(key, JSON.stringify(cleanMsg));
  await redis.ltrim(key, -20, -1);
  await redis.expire(key, 60 * 60 * 24);
};

const getRedisContext = async (chatId) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;
  const msgs = (await redis.lrange(key, 0, -1)) || [];
  return msgs.map((m) => (typeof m === "string" ? JSON.parse(m) : m));
};

const tempChat = async (req, res) => {
  try {
    let { currentChat, prompt, parts, model } = req.body;

    if (!currentChat) {
      currentChat = `guest-${uuidv4()}`;
    }

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

    await addToRedisContext(currentChat, {
      sender: "user",
      text: textPrompt,
      parts
    });

    const contextMessages = await getRedisContext(currentChat);
    const finalPrompt = await InputRouter.route(parts);

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

    const rawFeedback = await GroqService.generateFeedback({
      model: "llama-3.1-8b-instant",
      message: prompt
    });

    const llmResponse = formatResponse(rawFeedback);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error("tempFeedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { tempChat, tempFeedback };
