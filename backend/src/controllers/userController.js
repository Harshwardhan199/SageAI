const axios = require("axios")

const User = require("../models/User");
const Folder = require("../models/Folder");
const Chat = require("../models/Chat");
const Message = require("../models/Messasge");

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

const chat = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let { currentChat, prompt } = req.body;

    if (!currentChat) {

      //Create Chat
      const chat = new Chat({
        userId: user._id,
        title: prompt,
        lastMessageAt: new Date(),
      });
      await chat.save();
      currentChat = chat.id;

      // Save message (Prompt)
      const user_message = new Message({
        chatId: currentChat,
        sender: "user",
        text: prompt,
      });
      await user_message.save();

      // send prompt to api
      try {
        const apiRes = await axios.post("http://127.0.0.1:8000/chat", { "model": "llama3:latest", "message": prompt });

        let rawResponse = apiRes.data;

        console.log("Raw Response: ", rawResponse);

        let cleanResponse = rawResponse;
        if (typeof rawResponse === "string") {
          try {
            cleanResponse = JSON.parse(rawResponse);
          } catch {
            cleanResponse = rawResponse;
          }
        }

        console.log("Formatting");
        const markdownResponse = formatResponse(cleanResponse);
        console.log("Done Formatting");

        // Save message (Prompt)
        const bot_message = new Message({
          chatId: currentChat,
          sender: "bot",
          text: markdownResponse,
        });
        await bot_message.save();

        //log
        console.log("Response: ", markdownResponse);

        // Response
        return res.json({ message: "Chat Created Successfully", currentChat, markdownResponse });

      } catch (error) {
        console.log(error);

        return res.status(500).json({ error: "API error" });
      }

    }

    // Save message (Prompt)
    const user_message = new Message({
      chatId: currentChat,
      sender: "user",
      text: prompt,
    });
    await user_message.save();

    // send prompt to api
    const apiRes = await axios.post("http://127.0.0.1:8000/chat", { "model": "llama3:latest", "message": prompt });

    let rawResponse = apiRes.data;

    console.log("Raw Response: ", rawResponse);

    let cleanResponse = rawResponse;
    if (typeof rawResponse === "string") {
      try {
        cleanResponse = JSON.parse(rawResponse);
      } catch {
        cleanResponse = rawResponse;
      }
    }

    console.log("Formatting");
    const markdownResponse = formatResponse(cleanResponse);
    console.log("Done Formatting");

    // Save message (Prompt)
    const bot_message = new Message({
      chatId: currentChat,
      sender: "bot",
      text: markdownResponse,
    });
    await bot_message.save();

    //log
    console.log("Response: ", markdownResponse);

    // Response
    return res.json({ message: "Response to prompt", markdownResponse });
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

module.exports = { getCurrentUser, createFolder, deleteFolder, getUserFolders, chat, getChat, deleteChat, getUserChats }; 