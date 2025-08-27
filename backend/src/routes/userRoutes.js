const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getCurrentUser, createFolder, deleteFolder, getUserFolders, createChat, deleteChat, getUserChats } = require("../controllers/userController");

router.get("/me", authMiddleware, getCurrentUser);

router.post("/createFolder", authMiddleware, createFolder);
router.post("/deleteFolder", authMiddleware, deleteFolder); 
router.get("/folders", authMiddleware, getUserFolders);

router.post("/newChat", authMiddleware, createChat);
router.post("/deleteChat", authMiddleware, deleteChat); 
router.get("/chats", authMiddleware, getUserChats);

module.exports = router;
