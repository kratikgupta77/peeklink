import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function Badge({ label, score }) {
  let bg = "#e8f5e9", fg = "#2e7d32";
  if (label === "warning") { bg = "#fff8e1"; fg = "#8d6e00"; }
  if (label === "blocked") { bg = "#ffebee"; fg = "#c62828"; }
  return <span style={{ background: bg, color: fg, padding: "6px 10px", borderRadius: 8, fontWeight: 600 }}>
    {label[0].toUpperCase()+label.slice(1)} {typeof score==="number" ? `score=${score.toFixed(2)}`:""}
  </span>;
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function PreviewCard({ linkId }) {
  const [target, setTarget] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [err, setErr] = useState("");
  const [shortOverride, setShortOverride] = useState("");

  const previewUrl = useMemo(() => `${API_BASE}/p/${linkId}`, [linkId]);
  const shortUrl = useMemo(() => shortOverride || `${API_BASE}/p/${linkId}`, [shortOverride, linkId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r1 = await apiFetch(`/api/links/${linkId}`);
        if (!r1.ok) throw new Error(`GET /api/links/${linkId} ${r1.status}`);
        const l = await r1.json();
        if (cancelled) return;
        setTarget(l.target);
        setShortOverride(l.short_url || "");

        const r2 = await apiFetch(`/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ url: l.target }] })
        });
        if (!r2.ok) throw new Error(`score ${r2.status}`);
        const s = await r2.json();
        if (cancelled) return;
        const res = s.results?.[0] || {};
        setVerdict({ label: res.label || "safe", p: res.p ?? null, reasons: res.reasons || [] });
      } catch (e) {
        setErr(String(e));
        setVerdict({ label: "safe", p: 0.0, reasons: ["model_unavailable"] });
      }
    })();
    return () => { cancelled = true; };
  }, [linkId]);

  const openGate = () => window.open(previewUrl, "_blank");
  const copyShort = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch (_) {
      /* noop */
    }
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Preview</h3>
        {verdict && <Badge label={verdict.label} score={verdict.p} />}
      </div>
      <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}>
        {target || "…"}
      </div>
      {verdict?.reasons?.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary>Why this verdict?</summary>
          <ul>{verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </details>
      )}
      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={openGate} style={{ padding: "10px 14px" }}>Open Sandbox (/p/{linkId})</button>
        {verdict?.label === "safe" && shortUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ padding: "6px 10px", borderRadius: 6, background: "#f7f7f7" }}>{shortUrl}</code>
            <button onClick={copyShort} style={{ padding: "8px 12px" }}>Copy Short URL</button>
          </div>
        )}
      </div>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
