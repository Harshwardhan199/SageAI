const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getCurrentUser, createFolder, deleteFolder, getUserFolders, getChat, moveChat, deleteChat, getUngroupedChats, savePrompt, getPrompts, togglePinPrompt, deletePrompt } = require("../controllers/userController");
const { chat, feedback } = require("../controllers/chatController");

router.get("/me", authMiddleware, getCurrentUser); //get user

router.post("/createFolder", authMiddleware, createFolder); //create folder
router.get("/folders", authMiddleware, getUserFolders); //get folders
router.post("/deleteFolder", authMiddleware, deleteFolder); //delete folder

router.get("/chats", authMiddleware, getUngroupedChats); //get chats
router.post("/moveChat", authMiddleware, moveChat); //move chat
router.post("/deleteChat", authMiddleware, deleteChat); //delete chat

router.post("/getChat", authMiddleware, getChat); //load current chat

router.post("/chat", authMiddleware, chat); //handles prompt
router.post("/feedback", authMiddleware, feedback); //handles prompt

router.post("/savePrompt", authMiddleware, savePrompt); //save prompt
router.get("/getPrompts", authMiddleware, getPrompts); //get prompt
router.post("/togglePinPrompt", authMiddleware, togglePinPrompt) // toggle Pin/Unpin Prompt
router.post("/deletePrompt", authMiddleware, deletePrompt) // delete Prompt

module.exports = router;
