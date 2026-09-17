import api from "../interceptors/axios";

export const savePrompt = async (text) => {
  return api.post(
    "/user/savePrompt",
    { text },
    { withCredentials: true }
  );
};