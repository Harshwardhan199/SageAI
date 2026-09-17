import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

import { config } from "../config";

let accessTokenCache = null;
let setUserCache = null;
let setAccessTokenCache = null;
let clearAuthCache = null;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Expose setters to authStore
  setUserCache = setUser;
  setAccessTokenCache = setAccessToken;

  const updateAccessToken = (token) => {
    accessTokenCache = token;
    setAccessToken(token);
  };

  const clearAuth = () => {
    accessTokenCache = null;

    setAccessToken(null);
    setUser(null);

    setIsAuthenticated(false);
  };

  clearAuthCache = clearAuth;

  const initializeAuth = async () => {
    try {
      const res = await axios.post(
        `${config.BACKEND_URL}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      if (res.data.authenticated) {
        updateAccessToken(res.data.accessToken);
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        clearAuth();
      }
    } catch (err) {
      clearAuth();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        loading,
        isAuthenticated,

        updateAccessToken,
        setUser,
        clearAuth,
        initializeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const authStore = {
  getAccessToken: () => accessTokenCache,

  updateAccessToken: (token) => {
    accessTokenCache = token;
    if (setAccessTokenCache) {
      setAccessTokenCache(token);
    }
  },

  setUser: (user) => {
    if (setUserCache) {
      setUserCache(user);
    }
  },

  clearAuth: () => {
    if (clearAuthCache) {
      clearAuthCache();
    }
  },
};
