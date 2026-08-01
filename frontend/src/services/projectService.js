import api from "../api/axios";

export const projectService = {
  getProjects: async () => {
    const res = await api.get("/projects");
    return res.data.projects;
  },

  getRecentChats: async () => {
    const res = await api.get("/projects/recent-chats");
    return res.data.chats;
  },

  getProjectById: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data.project;
  },

  createProject: async (data) => {
    const res = await api.post("/projects", data);
    return res.data.project;
  },

  updateProject: async (projectId, data) => {
    const res = await api.patch(`/projects/${projectId}`, data);
    return res.data.project;
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  }
};
