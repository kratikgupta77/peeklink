import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../Components/AuthShell.jsx";

export default function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) {
      setStatus("Enter username and password");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const resp = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `Login failed (${resp.status})`);
      }
      const data = await resp.json();
      localStorage.setItem("refresh", data.refresh);
      setToken(data.access);
      navigate("/shorten", { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back">
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button disabled={loading} style={buttonStyle}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        {status && <p style={{ color: "#dc2626" }}>{status}</p>}
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </AuthShell>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const buttonStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "#111827",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

