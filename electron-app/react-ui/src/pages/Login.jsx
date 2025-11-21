import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiBase] = useState(() => {
    return localStorage.getItem("apiBase") || "http://127.0.0.1:8000";
  });

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) {
      setStatus("Enter username and password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const resp = await fetch(`${apiBase}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `Login failed (${resp.status})`);
      }
      
      const data = await resp.json();
      
      // Store refresh token
      localStorage.setItem("refresh", data.refresh);
      setToken(data.access);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openDashboard() {
    let dashboardBase = localStorage.getItem("dashboardBase") || "https://192.168.2.236";
    // Force HTTPS - always use https:// instead of http://
    if (dashboardBase.startsWith('http://')) {
      dashboardBase = 'https://' + dashboardBase.substring(7); // Replace http:// with https://
    } else if (!dashboardBase.startsWith('https://') && !dashboardBase.startsWith('http://')) {
      // If no protocol, assume HTTPS
      dashboardBase = `https://${dashboardBase}`;
    }
    window.open(`${dashboardBase}/login`, "_blank");
  }

  return (
    <div style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>PeekLink Desktop</h2>
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: 16, fontSize: 18 }}>Sign In</h3>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              autoFocus
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button disabled={loading} type="submit" style={buttonStyle}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
            {status && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 8 }}>{status}</p>}
          </form>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Don't have an account?
            </p>
            <button
              onClick={openDashboard}
              style={{
                ...buttonStyle,
                background: "transparent",
                color: "#2563eb",
                border: "1px solid #2563eb",
              }}
            >
              Open Dashboard to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  width: "100%",
};

const buttonStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: "#111827",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  width: "100%",
};

