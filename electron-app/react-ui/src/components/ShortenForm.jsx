import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ShortenForm({ onCreated, onPreview }) {
  const { token } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiryType, setExpiryType] = useState("none");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [domainName, setDomainName] = useState("127.0.0.1:8000");
  const [apiBase, setApiBase] = useState(() => {
    return localStorage.getItem("apiBase") || "http://127.0.0.1:8000";
  });

  async function createLink() {
    setErr("");
    setSuccess("");
    setShortUrl("");
    if (!/^https?:\/\//i.test(url)) {
      setErr("Enter a valid http(s) URL");
      return;
    }

    if (requirePassword && !password) {
      setErr("Password is required when password protection is enabled");
      return;
    }

    let expiresAtValue = null;
    if (expiryType === "time") {
      if (!expiresAt) {
        setErr("Please select an expiry date and time");
        return;
      }
      expiresAtValue = new Date(expiresAt).toISOString();
    }

    let maxClicksValue = null;
    if (expiryType === "clicks") {
      if (!maxClicks || parseInt(maxClicks) < 1) {
        setErr("Please enter a valid number of clicks (minimum 1)");
        return;
      }
      maxClicksValue = parseInt(maxClicks);
    }

    setLoading(true);
    try {
      const payload = {
        target: url,
        analytics_opt_in: true,
        require_password: requirePassword || false,
      };

      if (password && requirePassword) {
        payload.password = password;
      }

      if (expiresAtValue) {
        payload.expires_at = expiresAtValue;
      }

      if (maxClicksValue !== null) {
        payload.max_clicks = maxClicksValue;
      }

      const r = await fetch(`${apiBase}/api/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        let msg = `API ${r.status}`;
        try {
          const errJson = await r.json();
          msg = errJson.message || errJson.error || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await r.json();
      
      // Show success message with short link
      let short = data.short_url || `${apiBase}/p/${data.id}`;
      // Force HTTPS - always use https:// instead of http://
      if (short.startsWith('http://')) {
        short = 'https://' + short.substring(7); // Replace http:// with https://
      }
      setSuccess("Short URL created:");
      setShortUrl(short);
      setShowAdditionalOptions(true);
      
      onCreated?.(data.id, short);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const minDatetimeLocal = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
          Destination URL
        </label>
        <input
          type="text"
          placeholder="https://current-page.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && createLink()}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
          Domain Name
        </label>
        <select
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
            background: "white",
          }}
        >
          <option value="127.0.0.1:8000">127.0.0.1:8000</option>
          <option value="peek.link">peek.link</option>
        </select>
      </div>

      {!showAdditionalOptions ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
              Expiration
            </label>
            <select
              value={expiryType}
              onChange={(e) => {
                setExpiryType(e.target.value);
                setExpiresAt("");
                setMaxClicks("");
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
                background: "white",
              }}
            >
              <option value="none">No expiry</option>
              <option value="time">Time-based expiry</option>
              <option value="clicks">Click-based expiry</option>
            </select>
          </div>

          {expiryType === "time" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Expiration Date
              </label>
              <input
                type="datetime-local"
                min={minDatetimeLocal}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="dd-mm-yyyy --:--"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          {expiryType === "clicks" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Maximum Clicks
              </label>
              <input
                type="number"
                placeholder="Enter maximum number of clicks"
                min="1"
                value={maxClicks}
                onChange={(e) => setMaxClicks(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          {requirePassword && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Enter Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={requirePassword}
                onChange={(e) => setRequirePassword(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ color: "#374151" }}>Password protect this link</span>
            </label>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowAdditionalOptions(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              fontSize: 13,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Additional Options
          </button>
        </div>
      )}

      <button
        onClick={createLink}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 6,
          border: "none",
          background: loading ? "#9ca3af" : "#111827",
          color: "#ffffff",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        {loading ? "Creating…" : "Create Link"}
      </button>

      {err && <div style={{ color: "#dc2626", marginTop: 8, marginBottom: 12, fontSize: 13 }}>{err}</div>}
      
      {success && shortUrl && (
        <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#1e40af", marginBottom: 8 }}>
            {success} <strong style={{ wordBreak: "break-all" }}>{shortUrl}</strong>
          </div>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shortUrl);
              } catch (_) {}
            }}
            style={{
              padding: "6px 12px",
              background: "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

