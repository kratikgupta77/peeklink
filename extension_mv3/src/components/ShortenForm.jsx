import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ShortenForm({ onCreated }) {
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

  async function getApiBase() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.get(["apiBase"], (result) => {
          resolve(result.apiBase || "http://127.0.0.1:8000");
        });
      } else {
        resolve("http://127.0.0.1:8000");
      }
    });
  }

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
      const apiBase = await getApiBase();
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
      const short = data.short_url || `${apiBase}/p/${data.id}`;
      setSuccess("Short link created!");
      setShortUrl(short);
      
      // Reset form
      setUrl("");
      setRequirePassword(false);
      setPassword("");
      setExpiryType("none");
      setExpiresAt("");
      setMaxClicks("");
      
      onCreated?.(data.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function useCurrentTab() {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          setUrl(tab.url);
        }
      } else {
        setErr("Chrome tabs API not available");
      }
    } catch (e) {
      setErr("Failed to get current tab URL: " + e.message);
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Shorten & Preview</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && createLink()}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
        />
        <button
          onClick={useCurrentTab}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          Use Tab
        </button>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={requirePassword}
            onChange={(e) => setRequirePassword(e.target.checked)}
          />
          Password protect this link
        </label>
        {requirePassword && (
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontSize: 13 }}
          />
        )}

        <label style={{ display: "block", marginTop: 8, marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
          Expiry (optional)
        </label>
        <select
          value={expiryType}
          onChange={(e) => setExpiryType(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontSize: 13 }}
        >
          <option value="none">No expiry</option>
          <option value="time">Time-based expiry</option>
          <option value="clicks">Click-based expiry</option>
        </select>
        {expiryType === "time" && (
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontSize: 13 }}
          />
        )}
        {expiryType === "clicks" && (
          <input
            type="number"
            placeholder="Maximum number of clicks"
            min="1"
            value={maxClicks}
            onChange={(e) => setMaxClicks(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 8, fontSize: 13 }}
          />
        )}
      </div>

      <button
        onClick={createLink}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#9ca3af" : "#2563eb",
          color: "white",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14,
          marginTop: 12,
        }}
      >
        {loading ? "Creating…" : "Shorten & Preview"}
      </button>

      {err && <div style={{ color: "#dc2626", marginTop: 12, fontSize: 13 }}>{err}</div>}
      {success && (
        <div style={{ color: "#15803d", marginTop: 12, fontSize: 13 }}>
          {success}{" "}
          {shortUrl && (
            <>
              <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 6, marginLeft: 8 }}>{shortUrl}</code>
              <button
                style={{ marginLeft: 8, padding: "6px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shortUrl);
                  } catch (_) {}
                }}
              >
                Copy
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

