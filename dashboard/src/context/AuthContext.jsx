import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  clearToken: () => {},
});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("access"));

  const setToken = (value) => {
    if (value) {
      localStorage.setItem("access", value);
    } else {
      localStorage.removeItem("access");
    }
    setTokenState(value || null);
  };

  const clearToken = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setTokenState(null);
  };

  const value = useMemo(() => ({
    token,
    setToken,
    clearToken,
  }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

