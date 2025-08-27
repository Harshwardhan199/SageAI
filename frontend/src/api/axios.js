import axios from "axios";
import { authStore } from "../context/AuthContext";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

const getValidAccessToken = async () => {
  let token = authStore.getAccessToken();
  if (!token) {
    // Token missing → call refresh
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/refresh",
        {},
        { withCredentials: true }
      );
      token = res.data.accessToken;
      authStore.updateAccessToken(token);
    } catch (err) {
      console.error("Failed to refresh token before request", err);
    }
  }
  return token;
};

// Request Interceptor → Attach Access Token
api.interceptors.request.use(
  async (config) => {
    const accessToken = await getValidAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor → Handle Token Expiry & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired & we haven’t retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("Retring for new access token /refresh");

      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;
        authStore.updateAccessToken(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        authStore.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
