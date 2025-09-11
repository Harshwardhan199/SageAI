const User = require("../models/User");
const Folder = require("../models/Folder");
const Chat = require("../models/Chat");
const Message = require("../models/Messasge");

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

module.exports = { getCurrentUser, createFolder, deleteFolder, getUserFolders, getChat, deleteChat, getUserChats }; 