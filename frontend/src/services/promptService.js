import api from "../api/axios";

export const savePrompt = async (text) => {
  return api.post(
    "/user/savePrompt",
    { text },
    { withCredentials: true }
  );
};