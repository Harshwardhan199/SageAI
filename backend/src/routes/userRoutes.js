const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getCurrentUser } = require("../controllers/userController");

router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
