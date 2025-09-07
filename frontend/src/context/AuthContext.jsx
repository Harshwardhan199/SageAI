import { createContext, useContext, useState } from "react";

let accessTokenCache = null;
let setUserCache = null;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  
  setUserCache = setUser;

  const updateAccessToken = (token) => {
    accessTokenCache = token;    
    setAccessToken(token);      
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, updateAccessToken, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const authStore = {
  getAccessToken: () => accessTokenCache,
  updateAccessToken: (token) => { accessTokenCache = token; },
  setUser: (user) => {
    if (setUserCache) setUserCache(user);
  }
};
