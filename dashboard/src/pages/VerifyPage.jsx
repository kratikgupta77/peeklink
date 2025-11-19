import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../Components/AuthShell.jsx";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => params.get("email") || "");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e) {
    e.preventDefault();
    if (!email || !code) {
      setStatus("Enter email and code");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const resp = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Verify failed (${resp.status})`);
      }
      navigate("/login", { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) {
      setStatus("Enter email to resend code");
      return;
    }
    setStatus("Sending code…");
    try {
      const resp = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${resp.status})`);
      }
      setStatus("Code sent. Check your email.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <AuthShell title="Verify your email">
      <form onSubmit={verify} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={inputStyle}
        />
        <button disabled={loading} style={buttonStyle}>
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
      <button onClick={resend} style={{ ...linkButtonStyle, marginTop: 12 }}>
        Resend code
      </button>
      {status && <p style={{ marginTop: 12, color: status.includes("sent") ? "#16a34a" : "#dc2626" }}>{status}</p>}
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

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 500,
};

