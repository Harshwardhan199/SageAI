const ProjectService = require("../services/project/projectService");

const getProjects = async (req, res) => {
  try {
    const projects = await ProjectService.getUserProjects(req.user.userId);
    res.json({ projects });
  } catch (err) {
    console.error("getProjects error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getRecentChats = async (req, res) => {
  try {
    const recentChats = await ProjectService.getRecentChats(req.user.userId);
    res.json({ chats: recentChats });
  } catch (err) {
    console.error("getRecentChats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const createProject = async (req, res) => {
  try {
    const project = await ProjectService.createProject(req.user.userId, req.body);
    res.status(201).json({ message: "Project created successfully", project });
  } catch (err) {
    console.error("createProject error:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await ProjectService.getProjectById(req.user.userId, req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (err) {
    console.error("getProjectById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await ProjectService.updateProject(
      req.user.userId,
      req.params.projectId || req.body.projectId,
      req.body
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project updated successfully", project });
  } catch (err) {
    console.error("updateProject error:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const success = await ProjectService.deleteProject(req.user.userId, projectId);
    if (!success) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("deleteProject error:", err);
    res.status(400).json({ error: err.message || "Server error" });
  }
};

module.exports = {
  getProjects,
  getRecentChats,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};
