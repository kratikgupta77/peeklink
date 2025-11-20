import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  clearToken: () => {},
});

export function AuthProvider({ children }) {
  // Check for token in URL params (from extension) or localStorage
  const getInitialToken = () => {
    // Check URL params first (for extension login)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      // Store it in localStorage and clean URL
      localStorage.setItem("access", urlToken);
      window.history.replaceState({}, "", window.location.pathname);
      return urlToken;
    }
    // Fallback to localStorage
    return localStorage.getItem("access");
  };

  const [token, setTokenState] = useState(getInitialToken);

  // Check for token in URL on mount (in case component mounts after URL change)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken && urlToken !== token) {
      localStorage.setItem("access", urlToken);
      setTokenState(urlToken);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

