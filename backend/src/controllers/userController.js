const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Messasge");
const Prompt = require("../models/Prompt");
const ProjectService = require("../services/project/projectService");
const { extractBlocks } = require("../utils/blockExtractor");

const { getRedis } = require("../db");

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

const moveChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId, projectId } = req.body;
    let targetProjectId = projectId;

    if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

    const chat = await Chat.findOne({ _id: chatId, userId: user._id });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found or not authorized" });
    }

    if (!targetProjectId) {
      const defaultProject = await ProjectService.getOrCreateDefaultProject(user._id);
      targetProjectId = defaultProject._id;
    }

    chat.projectId = targetProjectId;
    await chat.save();

    // Update message projectIds for project RAG scoping
    await Message.updateMany({ chatId: chat._id }, { projectId: targetProjectId });

    res.json({ message: "Chat moved successfully", chat });
  } catch (err) {
    console.error("moveChat error:", err);
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

    // Delete related messages
    await Message.deleteMany({ chatId: chat._id });

    // Delete Redis context for this chat
    try {
      const redis = getRedis();
      await redis.del(`chat_context:${chat._id}`);
    } catch (err) {
      console.warn("Redis delete error during chat deletion:", err.message);
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("deleteChat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getUngroupedChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const defaultProject = await ProjectService.getOrCreateDefaultProject(user._id);

    // Fetch chats belonging ONLY to default project or legacy chats without project assignment
    const ungroupedChats = await Chat.find({
      userId: user._id,
      $or: [
        { projectId: defaultProject._id },
        { projectId: null }
      ]
    })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .select({ _id: 1, title: 1, projectId: 1, lastMessageAt: 1 })
      .lean();

    res.json({ ungroupedChats });
  } catch (err) {
    console.error("getUngroupedChats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

    // Enforce ownership check: Ensure chat belongs to requesting user
    const chat = await Chat.findOne({ _id: chatId, userId: user._id });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found or not authorized" });
    }

    // Retrieve messages belonging to this authorized chat
    const messages = await Message.find({ chatId: chat._id }).select("-embedding").sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => {
      const msgObj = msg.toObject ? msg.toObject() : msg;
      
      // Auto-expand raw JSON string blocks if stored during earlier streams
      if (msgObj.blocks && msgObj.blocks.length === 1 && msgObj.blocks[0].type === "chat") {
        const rawContent = msgObj.blocks[0].content;
        if (typeof rawContent === "string" && rawContent.trim().startsWith("{")) {
          msgObj.blocks = extractBlocks(rawContent);
        }
      }

      if (!msgObj.blocks || msgObj.blocks.length === 0) {
        if (msgObj.type && msgObj.content) {
          if (msgObj.type === "quiz") {
            msgObj.blocks = [{
              type: "quiz",
              title: msgObj.title || "Quiz",
              questions: msgObj.content
            }];
          } else {
            msgObj.blocks = [{
              type: msgObj.type,
              content: msgObj.content
            }];
          }
        } else if (msgObj.text) {
          try {
            const parsed = JSON.parse(msgObj.text);
            if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
              msgObj.blocks = parsed.blocks;
            } else if (parsed && parsed.type && (parsed.content || parsed.questions)) {
              if (parsed.type === "quiz") {
                msgObj.blocks = [{
                  type: "quiz",
                  title: parsed.title || "Quiz",
                  questions: parsed.content || parsed.questions
                }];
              } else {
                msgObj.blocks = [{
                  type: parsed.type,
                  content: parsed.content
                }];
              }
            } else if (Array.isArray(parsed)) {
              msgObj.blocks = [{
                type: "quiz",
                title: msgObj.title || "Quiz",
                questions: parsed
              }];
            } else {
              msgObj.blocks = [{ type: "chat", content: msgObj.text }];
            }
          } catch (e) {
            msgObj.blocks = [{ type: "chat", content: msgObj.text }];
          }
        } else {
          msgObj.blocks = [{ type: "chat", content: "" }];
        }
      }
      return msgObj;
    });

    res.status(200).json({ messages: formattedMessages });

  } catch (err) {
    console.error("getChat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const savePrompt = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { text } = req.body;

    const prompt = await Prompt.create({
      userId: req.user.userId,
      text,
      isPinned: false, 
    });

    res.status(201).json({ message: "Prompt Successfully Saved", prompt });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getPrompts = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pinned = await Prompt.find({ userId: req.user.userId, isPinned: true })
      .sort({ createdAt: -1 })
      .limit(5);

    let prompts = [...pinned];
    if (pinned.length < 5) {
      const remaining = 5 - pinned.length;
      const recentUnpinned = await Prompt.find({
        userId: req.user.userId,
        isPinned: false,
      })
        .sort({ createdAt: -1 })
        .limit(remaining);

      prompts = [...pinned, ...recentUnpinned];
    }

    res.status(200).json({ savedPrompts: prompts });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const togglePinPrompt = async (req, res) => {
  try {
    const { promptId } = req.body;
    const userId = req.user.userId;

    const prompt = await Prompt.findOne({ _id: promptId, userId });
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });

    prompt.isPinned = !prompt.isPinned;
    await prompt.save();

    res.json({ message: `Prompt ${prompt.isPinned ? "pinned" : "unpinned"}`, prompt });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const deletePrompt = async (req, res) => {
  try {
    const { promptId } = req.body;
    const userId = req.user.userId;

    const prompt = await Prompt.findOneAndDelete({ _id: promptId, userId });
    if (!prompt) return res.status(404).json({ error: "Prompt not found or not authorized" });

    res.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const renameChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId, title } = req.body;
    if (!chatId) return res.status(400).json({ error: "Chat ID is required" });
    if (!title || !title.trim()) return res.status(400).json({ error: "Chat title is required" });

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user.userId },
      { title: title.trim() },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: "Chat not found or not authorized" });
    }

    res.json({ message: "Chat Renamed Successfully", chat });
  } catch (err) {
    console.error("Rename chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getCurrentUser,
  getChat,
  moveChat,
  deleteChat,
  getUngroupedChats,
  savePrompt,
  getPrompts,
  togglePinPrompt,
  deletePrompt,
  renameChat
};