const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getProjects,
  getRecentChats,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require("../controllers/projectController");

router.get("/", authMiddleware, getProjects);
router.post("/", authMiddleware, createProject);

router.get("/recent-chats", authMiddleware, getRecentChats);

router.get("/:projectId", authMiddleware, getProjectById);
router.patch("/:projectId", authMiddleware, updateProject);
router.delete("/:projectId", authMiddleware, deleteProject);

module.exports = router;
