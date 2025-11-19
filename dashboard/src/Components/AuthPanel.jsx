import React, { useState } from "react";

export default function AuthPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem("access")));

  async function handleLogin(e) {
    e.preventDefault();
    setStatus("");
    if (!username || !password) {
      setStatus("Enter username + password");
      return;
    }
    setStatus("Signing in…");
    try {
      const resp = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail.detail || `Login failed (${resp.status})`);
      }
      const data = await resp.json();
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      setHasToken(true);
      setPassword("");
      setStatus("Token stored. Ready to go!");
    } catch (err) {
      setStatus(err.message);
    }
  }

  function clearTokens() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setHasToken(false);
    setStatus("Tokens cleared");
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Authenticate</h3>
      <p style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
        Use your Django credentials to grab a JWT before calling any owner APIs.
      </p>
      <form onSubmit={handleLogin} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", flex: "1 1 200px" }}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", flex: "1 1 200px" }}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" style={{ padding: "10px 14px" }}>
          {hasToken ? "Refresh Token" : "Sign In"}
        </button>
        {hasToken && (
          <button type="button" onClick={clearTokens} style={{ padding: "10px 14px" }}>
            Clear Token
          </button>
        )}
      </form>
      {hasToken && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#0a7" }}>
          Access token present in localStorage.
        </div>
      )}
      {status && (
        <div style={{ marginTop: 8, fontSize: 13, color: status.includes("Token") ? "#0a7" : "#c00" }}>
          {status}
        </div>
      )}
    </div>
  );
}

