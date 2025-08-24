const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getCurrentUser, getUserFolders } = require("../controllers/userController");

router.get("/me", authMiddleware, getCurrentUser);
router.get("/folders", authMiddleware, getUserFolders);

module.exports = router;
