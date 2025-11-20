import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  clearToken: () => {},
});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken") || localStorage.getItem("access");
    setTokenState(storedToken || null);
    setLoading(false);
  }, []);

  const setToken = (value) => {
    if (value) {
      localStorage.setItem("accessToken", value);
      localStorage.setItem("access", value); // Also store as "access" for compatibility
      setTokenState(value);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refresh");
      setTokenState(null);
    }
  };

  const clearToken = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh");
    setTokenState(null);
  };

  const value = useMemo(
    () => ({
      token,
      setToken,
      clearToken,
      loading,
    }),
    [token, loading]
  );

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

