const axios = require("axios")

const User = require("../models/User");
const Folder = require("../models/Folder");
const Chat = require("../models/Chat");
const Message = require("../models/Messasge");

const { getRedis } = require("../db");

// User data fetching functions
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("username email");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ username: user.username, email: user.email });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const createFolder = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, color, isPinned } = req.body;
    if (!name) return res.status(400).json({ error: "Folder name is required" });

    const folder = await Folder.create({
      userId: req.user.userId,
      name: name.trim(),
      color: color || "#ffffff",
      isPinned: isPinned || false,
    });

    res.json({ message: "Folder Created Successfully", folder });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { folderId } = req.body;

    if (!folderId) return res.status(400).json({ error: "Folder ID is required" });

    const folder = await Folder.findOneAndDelete({ _id: folderId, userId: user._id });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or not authorized" });
    }

    // (Optional) also set folderId = null for chats under this folder
    // await Chat.updateMany({ folderId: folderId }, { $set: { folderId: null } });

    res.json({ message: "Folder Deleted  Successfully", folder });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserFolders = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const folderList = await Folder.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    res.json({ folderList });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const deleteChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId } = req.body;

    if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId: user._id });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found or not authorized" });
    }

    // Also delete related messages
    await Message.deleteMany({ chatId: chat._id });

    // Delete Redis context for this chat
    const redis = getRedis();
    await redis.del(`chat_context:${chat._id}`);

    res.json({ message: "Chat Deleted  Successfully", chat });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const chatList = await Chat.find({ userId: user._id }).sort({ lastMessageAt: -1 })

    res.json({ chatList });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getChat = async (req, res) => {
  try {

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId } = req.body;

    // retrive messages 
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 })

    res.status(200).json({ messages });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

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
  await redis.rPush(key, JSON.stringify(messageObj));
  await redis.lTrim(key, -10, -1);
};

const getRedisContext = async (chatId) => {
  const redis = getRedis();
  const key = `chat_context:${chatId}`;
  const msgs = await redis.lRange(key, 0, -1);
  return msgs.map(m => JSON.parse(m));
};

const generateEmbedding = async (text) => {
  try {
    const res = await axios.post("http://127.0.0.1:8000/embed", { text });
    return res.data.embedding; 
  } catch (err) {
    console.error("Error generating embedding:", err);
    return [];
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
          limit: 5
        }
      }
    ]);

    // Construct LLM input (Redis context + top semantic matches)
    const llmContext = [
      ...contextMessages.map(m => `${m.sender}: ${m.text}`),
      ...semanticMatches.map(m => `history: ${m.text}`)
    ].join("\n");

    // Send prompt + context to FastAPI → LLaMA3
    const apiRes = await axios.post("http://127.0.0.1:8000/chat", {
      model: "llama3:latest",
      message: llmContext
    });

    const llmResponse = formatResponse(apiRes.data);

    // Save bot response (with embedding)
    const botEmbedding = await generateEmbedding(llmResponse);

    const botMessage = new Message({
      chatId: currentChat,
      sender: "bot",
      text: llmResponse,
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

module.exports = { getCurrentUser, createFolder, deleteFolder, getUserFolders, chat, getChat, deleteChat, getUserChats }; 