const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getCurrentUser, createFolder, deleteFolder, getUserFolders, chat, getChat, deleteChat, getUserChats } = require("../controllers/userController");

router.get("/me", authMiddleware, getCurrentUser);

router.post("/createFolder", authMiddleware, createFolder);
router.get("/folders", authMiddleware, getUserFolders); //get folders
router.post("/deleteFolder", authMiddleware, deleteFolder); 

router.get("/chats", authMiddleware, getUserChats); //get chats
router.post("/deleteChat", authMiddleware, deleteChat); 

router.post("/chat", authMiddleware, chat); //handles prompt

router.post("/getChat", authMiddleware, getChat);
module.exports = router;
