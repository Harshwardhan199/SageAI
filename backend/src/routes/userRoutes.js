const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/userController");
const { chat, feedback, streamChat } = require("../controllers/chatController");

router.get("/me", authMiddleware, getCurrentUser);

router.get("/chats", authMiddleware, getUngroupedChats);
router.post("/moveChat", authMiddleware, moveChat);
router.post("/deleteChat", authMiddleware, deleteChat);
router.post("/renameChat", authMiddleware, renameChat);

router.post("/getChat", authMiddleware, getChat);

router.post("/chat", authMiddleware, chat);
router.post("/stream", authMiddleware, streamChat);
router.post("/feedback", authMiddleware, feedback);

router.post("/savePrompt", authMiddleware, savePrompt);
router.get("/getPrompts", authMiddleware, getPrompts);
router.post("/togglePinPrompt", authMiddleware, togglePinPrompt);
router.post("/deletePrompt", authMiddleware, deletePrompt);

module.exports = router;
