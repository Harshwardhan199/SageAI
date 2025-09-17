require("dotenv").config();
const axios = require("axios")

const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Messasge");

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
    const res = await axios.post("http://127.0.0.1:8000/embed", payload );
    return res.data.embedding;
  } catch (err) {
    console.error("Error generating embedding:", err);
    return null;
  }
};

// Main function
const chat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let { currentChat, prompt } = req.body;

    // Create chat if not exists
    if (!currentChat) {
      const chatDoc = new Chat({
        userId: user._id,
        title: prompt,
        lastMessageAt: new Date()
      });
      await chatDoc.save();
      currentChat = chatDoc._id;
    }

    // Generate embedding for prompt
    const embedding = await generateEmbedding(prompt);

    // Save user message with embedding
    const userMessage = new Message({
      chatId: currentChat,
      sender: "user",
      text: prompt,
      embedding
    });
    await userMessage.save();

    // Add to Redis short-term context
    await addToRedisContext(currentChat, userMessage);

    // Retrieve Redis context
    const contextMessages = await getRedisContext(currentChat);

    // Retrieve semantic matches from MongoDB Atlas Vector Search (long-term)
    const semanticMatches = await Message.aggregate([
      {
        $vectorSearch: {
          index: "message_embedding_index",
          queryVector: embedding,
          path: "embedding",
          numCandidates: 100,
          limit: 5,
          filter: { chatId: currentChat }
        }
      }
    ]);

    // Construct LLM input (Redis context + top semantic matches)
    const llmContext = [
      // System-level instruction to the model
      ...contextMessages.map(m => `${m.sender}: ${m.text}`),
      ...semanticMatches.map(m => `history: ${m.text}`)
    ].join("\n");

    // Send prompt + context to FastAPI → LLaMA3 - (llama3:latest)
    const apiRes = await axios.post(`${LLM_API_URL}/chat`, {
      model: "llama-3.1-8b-instant",
      message: llmContext
    });

    const llmResponse = formatResponse(apiRes.data);

    // Save bot response (with embedding)
    const botEmbedding = await generateEmbedding(llmResponse);

    let llmText;
    if (Array.isArray(llmResponse) || typeof llmResponse === "object") {
      llmText = JSON.stringify(llmResponse);
    } else {
      llmText = llmResponse;
    }

    const botMessage = new Message({
      chatId: currentChat,
      sender: "bot",
      text: llmText,
      embedding: botEmbedding
    });
    await botMessage.save();

    // Update Redis context with bot response
    await addToRedisContext(currentChat, botMessage);

    return res.json({ message: "Response generated", currentChat, llmResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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

module.exports = { chat, feedback }; 