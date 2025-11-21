import React, { useMemo, useState } from "react";
import { apiFetch } from "../api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function ShortenForm({ onCreated }) {
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

  const minDatetimeLocal = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  async function createLink() {
    setErr("");
    setSuccess("");
    setShortUrl("");

    if (!/^https?:\/\//i.test(url)) {
      setErr("Enter a valid http(s) URL");
      return;
    }

    if (requirePassword && !password.trim()) {
      setErr("Enter a password or turn off protection");
      return;
    }

    if (expiryType === "time" && !expiresAt) {
      setErr("Choose an expiry date & time");
      return;
    }

    if (expiryType === "clicks") {
      const clicks = parseInt(maxClicks, 10);
      if (Number.isNaN(clicks) || clicks <= 0) {
        setErr("Enter a valid click limit (min 1)");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        target: url.trim(),
        analytics_opt_in: true,
        require_password: requirePassword,
      };

      if (requirePassword && password.trim()) {
        payload.password = password.trim();
      }

      if (expiryType === "time") {
        payload.expires_at = new Date(expiresAt).toISOString();
      } else if (expiryType === "clicks") {
        payload.max_clicks = parseInt(maxClicks, 10);
      }

      const resp = await apiFetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let msg = `API ${resp.status}`;
        try {
          const errJson = await resp.json();
          msg = errJson.message || errJson.error || msg;
          // Provide user-friendly messages for common errors
          if (msg.includes("readonly") || msg.includes("permission") || msg.includes("Database permission")) {
            msg = "Database permission error. Please contact the administrator to fix database permissions.";
          } else if (msg.includes("database") || msg.includes("Database error")) {
            msg = "Database error. Please try again or contact the administrator.";
          }
        } catch (_) {
          // If we can't parse JSON, use status text
          msg = `API Error ${resp.status}: ${resp.statusText || "Unknown error"}`;
        }
        throw new Error(msg);
      }

      const data = await resp.json();
      setSuccess("Short link created!");
      const short = data.short_url || `${API_BASE}/p/${data.id}`;
      setShortUrl(short);
      onCreated?.(data.id);

      // Reset form
      setUrl("");
      setRequirePassword(false);
      setPassword("");
      setExpiryType("none");
      setExpiresAt("");
      setMaxClicks("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <h3>Shorten & check a URL</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={createLink}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8 }}
        >
          {loading ? "Creating…" : "Shorten & Preview"}
        </button>
      </div>

      <div style={{ marginTop: 16, borderTop: "1px solid #f1f1f1", paddingTop: 16 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Expiry (optional)</label>
          <select
            value={expiryType}
            onChange={(e) => setExpiryType(e.target.value)}
            style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="none">No expiry</option>
            <option value="time">Time-based expiry</option>
            <option value="clicks">Click-based expiry</option>
          </select>

          {expiryType === "time" && (
            <input
              type="datetime-local"
              min={minDatetimeLocal}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          )}

          {expiryType === "clicks" && (
            <input
              type="number"
              min={1}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="Expire after N successful redirects"
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          )}
        </div>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}
      {success && (
        <div style={{ color: "#15803d", marginTop: 12 }}>
          {success}{" "}
          {shortUrl && (
            <>
              <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 6 }}>{shortUrl}</code>
              <button
                style={{ marginLeft: 8, padding: "6px 10px" }}
                onClick={() => navigator.clipboard.writeText(shortUrl)}
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
