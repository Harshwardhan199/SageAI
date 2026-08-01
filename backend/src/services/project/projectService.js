const mongoose = require("mongoose");
const Project = require("../../models/Project");
const Chat = require("../../models/Chat");
const Message = require("../../models/Messasge");
const { getRedis } = require("../../db");

class ProjectService {
  /**
   * Retrieves or creates the system-managed hidden default project for a user.
   */
  static async getOrCreateDefaultProject(userId) {
    let defaultProject = await Project.findOne({
      userId,
      isDefault: true,
      isHidden: true
    });

    if (!defaultProject) {
      defaultProject = await Project.create({
        userId,
        name: "Default Workspace",
        description: "Hidden system workspace for ungrouped chats",
        isDefault: true,
        isHidden: true,
        color: "#ffffff"
      });
    }

    return defaultProject;
  }

  /**
   * Retrieves all user-visible (non-hidden) projects along with their recent chats.
   */
  static async getUserProjects(userId) {
    const userObjectId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

    const projects = await Project.find(
      { userId: userObjectId, isHidden: false },
      { _id: 1, name: 1, color: 1, description: 1, sharedContext: 1, isPinned: 1, createdAt: 1 }
    )
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    const projectIds = projects.map(p => p._id);

    const chatsByProject = await Chat.aggregate([
      { $match: { userId: userObjectId, projectId: { $in: projectIds } } },
      { $sort: { lastMessageAt: -1 } },
      {
        $group: {
          _id: "$projectId",
          chats: { $push: { _id: "$_id", title: "$title", lastMessageAt: "$lastMessageAt" } }
        }
      }
    ]);

    const chatsMap = {};
    chatsByProject.forEach(entry => {
      chatsMap[entry._id.toString()] = entry.chats;
    });

    return projects.map(project => ({
      ...project,
      chats: chatsMap[project._id.toString()] || []
    }));
  }

  /**
   * Retrieves all user chats sorted by last message timestamp (for the Recent sidebar section).
   */
  static async getRecentChats(userId, limit = 50) {
    return Chat.find({ userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(limit)
      .select({ _id: 1, title: 1, projectId: 1, lastMessageAt: 1 })
      .lean();
  }

  /**
   * Creates a new user project.
   */
  static async createProject(userId, { name, color, description, sharedContext }) {
    if (!name || !name.trim()) {
      throw new Error("Project name is required.");
    }

    return Project.create({
      userId,
      name: name.trim(),
      color: color || "#ffffff",
      description: description || "",
      sharedContext: sharedContext || "",
      isDefault: false,
      isHidden: false
    });
  }

  /**
   * Fetches details of a specific project and its chats.
   */
  static async getProjectById(userId, projectId) {
    const project = await Project.findOne({ _id: projectId, userId }).lean();
    if (!project) return null;

    const chats = await Chat.find({ userId, projectId })
      .sort({ lastMessageAt: -1 })
      .select({ _id: 1, title: 1, lastMessageAt: 1 })
      .lean();

    return { ...project, chats };
  }

  /**
   * Updates an existing project.
   */
  static async updateProject(userId, projectId, { name, color, description, sharedContext }) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) return null;

    if (project.isDefault && project.isHidden) {
      throw new Error("Cannot modify system default project.");
    }

    if (name) project.name = name.trim();
    if (color !== undefined) project.color = color;
    if (description !== undefined) project.description = description;
    if (sharedContext !== undefined) project.sharedContext = sharedContext;

    await project.save();
    return project;
  }

  /**
   * Deletes a project and all associated chats and messages.
   */
  static async deleteProject(userId, projectId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) return null;

    if (project.isDefault && project.isHidden) {
      throw new Error("Cannot delete system default project.");
    }

    // Find all chats in project
    const chats = await Chat.find({ userId, projectId });

    for (const chat of chats) {
      await Message.deleteMany({ chatId: chat._id });
      await Chat.findByIdAndDelete(chat._id);

      try {
        const redis = getRedis();
        await redis.del(`chat_context:${chat._id}`);
      } catch (err) {
        console.warn("Redis delete error during project deletion:", err.message);
      }
    }

    await Project.findByIdAndDelete(projectId);
    return true;
  }
}

module.exports = ProjectService;
