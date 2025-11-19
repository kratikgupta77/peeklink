import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  token: null,
  setToken: () => {},
  clearToken: () => {},
});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from chrome.storage on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["accessToken"], (result) => {
        setTokenState(result.accessToken || null);
        setLoading(false);
      });
    } else {
      // Fallback to localStorage for development
      setTokenState(localStorage.getItem("access") || null);
      setLoading(false);
    }
  }, []);

  const setToken = (value) => {
    if (value) {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.set({ accessToken: value }, () => {
          setTokenState(value);
        });
      } else {
        localStorage.setItem("access", value);
        setTokenState(value);
      }
    } else {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.remove(["accessToken", "refreshToken"], () => {
          setTokenState(null);
        });
      } else {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setTokenState(null);
      }
    }
  };

  const clearToken = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.remove(["accessToken", "refreshToken"], () => {
        setTokenState(null);
      });
    } else {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setTokenState(null);
    }
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

