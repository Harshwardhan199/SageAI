require("dotenv").config();
const axios = require("axios")

const { v4: uuidv4 } = require("uuid");

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

    let { currentChat, prompt } = req.body;

    // Create chat if not exists
    if (!currentChat) {
      currentChat = `guest-${uuidv4()}`;
    }

     // Save user message in Redis
    await addToRedisContext(currentChat, {
      sender: "user",
      text: prompt
    });

    // Retrieve Redis context
    const contextMessages = await getRedisContext(currentChat);

    // Construct LLM input (Redis context + top semantic matches)
    const llmContext = contextMessages
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n");

    // Send prompt + context to FastAPI → LLaMA3 - (llama3:latest)
    const apiRes = await axios.post(`${LLM_API_URL}/chat`, {
      model: "llama-3.1-8b-instant",
      message: llmContext
    });

    const llmResponse = formatResponse(apiRes.data);

    // Save bot response in Redis
    await addToRedisContext(currentChat, {
      sender: "bot",
      text: llmResponse
    });

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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