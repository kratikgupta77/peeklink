import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function Badge({ label, score }) {
  let bg = "#e8f5e9",
    fg = "#2e7d32";
  if (label === "warning") {
    bg = "#fff8e1";
    fg = "#8d6e00";
  }
  if (label === "blocked") {
    bg = "#ffebee";
    fg = "#c62828";
  }
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: "6px 10px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {label[0].toUpperCase() + label.slice(1)}{" "}
      {typeof score === "number" ? `threat=${score.toFixed(2)}` : ""}
    </span>
  );
}

export default function PreviewCard({ linkId }) {
  const { token } = useAuth();
  const [target, setTarget] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [err, setErr] = useState("");
  const [shortOverride, setShortOverride] = useState("");
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8000");

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

  useEffect(() => {
    getApiBase().then(setApiBase);
  }, []);

  const previewUrl = useMemo(() => `${apiBase}/p/${linkId}`, [apiBase, linkId]);
  const shortUrl = useMemo(() => shortOverride || `${apiBase}/p/${linkId}`, [shortOverride, apiBase, linkId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiBase = await getApiBase();
        const r1 = await fetch(`${apiBase}/api/links/${linkId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r1.ok) throw new Error(`GET /api/links/${linkId} ${r1.status}`);
        const l = await r1.json();
        if (cancelled) return;
        setTarget(l.target);
        setShortOverride(l.short_url || "");

        // Get verdict from FastAPI service
        const r2 = await fetch(`${apiBase.replace(":8000", ":9000")}/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ url: l.target }] }),
        });
        if (!r2.ok) throw new Error(`score ${r2.status}`);
        const s = await r2.json();
        if (cancelled) return;
        const res = s.results?.[0] || {};
        setVerdict({
          label: res.label || "safe",
          p: res.p ?? null,
          reasons: res.reasons || [],
        });
      } catch (e) {
        setErr(String(e));
        setVerdict({ label: "safe", p: 0.0, reasons: ["model_unavailable"] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkId, token]);

  const openGate = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: previewUrl });
    } else {
      window.open(previewUrl, "_blank");
    }
  };

  const copyShort = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch (_) {
      /* noop */
    }
  };

  const openAnalytics = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: "http://127.0.0.1:5173/links" });
    } else {
      window.open("http://127.0.0.1:5173/links", "_blank");
    }
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Preview</h3>
        {verdict && <Badge label={verdict.label} score={verdict.p} />}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
          wordBreak: "break-all",
        }}
      >
        {target || "…"}
      </div>
      {verdict?.reasons?.length > 0 && (
        <details style={{ marginTop: 10, fontSize: 12 }}>
          <summary style={{ cursor: "pointer" }}>Why this verdict?</summary>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {verdict.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      )}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={openGate}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Open Preview
        </button>
        {verdict?.label === "safe" && shortUrl && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
              <code style={{ padding: "6px 10px", borderRadius: 6, background: "#f7f7f7", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{shortUrl}</code>
              <button
                onClick={copyShort}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Copy
              </button>
            </div>
          </>
        )}
        <button
          onClick={openAnalytics}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          View Analytics
        </button>
      </div>
      {err && <div style={{ color: "#dc2626", marginTop: 8, fontSize: 12 }}>{err}</div>}
    </div>
  );
}

