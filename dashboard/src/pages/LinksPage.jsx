import React, { useEffect, useState } from "react";
import { apiFetch } from "../api.js";

export default function LinksPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiFetch("/api/links");
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const body = await resp.json();
        if (!cancelled) setRows(Array.isArray(body) ? body : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h2 style={{ marginBottom: 12 }}>My Links</h2>
      <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={th}>Short</th>
                <th style={th}>Target</th>
                <th style={th}>Clicks</th>
                <th style={th}>Password</th>
                <th style={th}>Analytics</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={td}><code>/{row.id}</code></td>
                  <td style={{ ...td, maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.target}</td>
                  <td style={td}>{row.clicks}</td>
                  <td style={td}>{row.require_password ? "on" : "off"}</td>
                  <td style={td}>{row.analytics_opt_in ? "on" : "off"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td style={{ ...td, paddingTop: 24 }} colSpan={5}>
                    No links yet. Shorten one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const th = { padding: "8px 12px", fontWeight: 600 };
const td = { padding: "8px 12px" };

