import React, { useState } from "react";
import { apiFetch } from "../api";
export default function ShortenForm({ onCreated }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function createLink() {
  setErr("");
  if (!/^https?:\/\//i.test(url)) { setErr("Enter a valid http(s) URL"); return; }
  setLoading(true);
  try {
    const token = localStorage.getItem('access') || '';
    const r = await apiFetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        target: url,
        analytics_opt_in: true,    // keep if you want analytics
        require_password: false
      })
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    onCreated?.(data.id);
  } catch (e) {
    setErr(e.message);
  } finally {
    setLoading(false);
  }
}


  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <h3>Shorten & check a URL</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button onClick={createLink} disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Creating…" : "Shorten & Preview"}
        </button>
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
