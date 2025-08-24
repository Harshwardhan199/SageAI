import axios from "axios";
import { authStore } from "../context/AuthContext";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Request Interceptor → Attach Access Token
api.interceptors.request.use(
  async (config) => {
    let accessToken = authStore.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    else {      
      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        accessToken = res.data.accessToken;
        authStore.updateAccessToken(accessToken);

        config.headers.Authorization = `Bearer ${accessToken}`;
      } catch (err) {
        console.log("Refresh failed in request interceptor", err);
      }
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

      console.log("Retring for new access token /refresh");

      originalRequest._retry = true;
      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;
        authStore.updateAccessToken(newAccessToken);

        // Retry failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
