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

    const folderChats = await Chat.find({ userId: user._id, folderId: folderId });

    for (const entry of folderChats){
      const chat = await Chat.findOneAndDelete({ _id: entry._id, userId: user._id });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found or not authorized" });
      }

      // Also delete related messages
      await Message.deleteMany({ chatId: chat._id });

      // Delete Redis context for this chat
      const redis = getRedis();
      await redis.del(`chat_context:${chat._id}`);
    };

    res.json({ message: "Folder Deleted  Successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserFolders = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch Folders
    //const folderList = await Folder.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
    const folderList = await Folder.find({ userId: req.user.userId }, { _id: 1, name: 1, color: 1 }).sort({ createdAt: -1 }).lean();

    const folderIds = folderList.map(f => f._id);

    //Fetch Chats by Folder
    const chatsByFolder = await Chat.aggregate([
      { $match: { userId: user._id, folderId: { $in: folderIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$folderId",
          chats: { $push: { _id: "$_id", title: "$title" } }
        }
      },
      {
        $project: {
          chats: { $slice: ["$chats", 10] }
        }
      }
    ]);

    const chatsMap = {};
    chatsByFolder.forEach(entry => {
      chatsMap[entry._id.toString()] = entry.chats;
    });

    const foldersWithChats = folderList.map(folder => ({
      _id: folder._id,
      name: folder.name,
      color: folder.color,
      chats: chatsMap[folder._id.toString()] || []
    }));

    res.json({ folders: foldersWithChats });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const moveChat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { chatId, folderId } = req.body;

    if (!chatId) return res.status(400).json({ error: "Chat ID is required" });

    const chat = await Chat.findOne({ _id: chatId, userId: user._id });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found or not authorized" });
    }

    chat.folderId = folderId;
    await chat.save();

    res.json({ message: "Chat moved  Successfully", chat });
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

const getUngroupedChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch only chats not in any folder
    const ungroupedChats = await Chat.find({ userId: user._id, folderId: null }).sort({ lastMessageAt: -1 }).select({ _id: 1, title: 1 }).lean();

    res.json({ ungroupedChats });
  } catch (err) {
    console.error(err);
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

module.exports = { getCurrentUser, createFolder, deleteFolder, getUserFolders, getChat, moveChat, deleteChat, getUngroupedChats }; 