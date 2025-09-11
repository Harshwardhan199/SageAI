const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getCurrentUser, createFolder, deleteFolder, getUserFolders, getChat, deleteChat, getUserChats } = require("../controllers/userController");
const { chat } = require("../controllers/chatController");

router.get("/me", authMiddleware, getCurrentUser); //get user

router.post("/createFolder", authMiddleware, createFolder); //create folder
router.get("/folders", authMiddleware, getUserFolders); //get folders
router.post("/deleteFolder", authMiddleware, deleteFolder); //delete folder

router.get("/chats", authMiddleware, getUserChats); //get chats
router.post("/deleteChat", authMiddleware, deleteChat); //delete chat

router.post("/getChat", authMiddleware, getChat); //load current chat

router.post("/chat", authMiddleware, chat); //handles prompt

module.exports = router;
