import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../Components/AuthShell.jsx";

export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    if (!username || !email || !password) {
      setStatus("Pick a username, email, and password");
      return;
    }
    if (password !== confirm) {
      setStatus("Passwords do not match");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Signup failed (${resp.status})`);
      }
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account">
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
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
        <input
          placeholder="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />
        <button disabled={loading} style={buttonStyle}>
          {loading ? "Creating…" : "Sign Up"}
        </button>
        {status && <p style={{ color: "#dc2626" }}>{status}</p>}
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <Link to="/login">Sign in</Link>
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

