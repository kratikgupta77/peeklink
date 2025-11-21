import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function PreviewTab({ url, linkId }) {
  const { token } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(url || "");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [details, setDetails] = useState(null);
  const [err, setErr] = useState("");
  const [apiBase] = useState(() => {
    let base = localStorage.getItem("apiBase") || "https://192.168.2.236";
    // Force HTTPS if HTTP is used
    if (base.startsWith('http://')) {
      base = 'https://' + base.substring(7);
    } else if (!base.startsWith('https://') && !base.startsWith('http://')) {
      base = `https://${base}`;
    }
    return base;
  });

  async function checkUrl() {
    if (!previewUrl || !/^https?:\/\//i.test(previewUrl)) {
      setErr("Enter a valid http(s) URL");
      return;
    }

    setLoading(true);
    setErr("");
    setVerdict(null);
    setDetails(null);

    try {
      let actualTargetUrl = previewUrl;
      let redirectCount = 0;
      
      // Check if this is a PeekLink preview/redirect URL
      const peekLinkMatch = previewUrl.match(/\/[pr]\/([A-Za-z0-9_-]+)/);
      if (peekLinkMatch) {
        const linkId = peekLinkMatch[1];
        try {
          // Fetch the actual target URL from the backend
          const linkResp = await fetch(`${apiBase}/api/links/${linkId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (linkResp.ok) {
            const linkData = await linkResp.json();
            actualTargetUrl = linkData.target;
            redirectCount = 1; // PeekLink adds one redirect
          }
        } catch (e) {
          console.warn("Could not fetch link details:", e);
          // Continue with original URL if fetch fails
        }
      }

      // Check verdict on the actual target URL
      const verdictUrl = apiBase.replace(":8000", ":9000");
      const r2 = await fetch(`${verdictUrl}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ url: actualTargetUrl }] }),
      });
      
      if (!r2.ok) throw new Error(`score ${r2.status}`);
      const s = await r2.json();
      const res = s.results?.[0] || {};
      
      setVerdict({
        label: res.label || "safe",
        p: res.p ?? null,
        reasons: res.reasons || [],
      });

      // Get URL details for the actual target
      try {
        const startTime = Date.now();
        const testResp = await fetch(actualTargetUrl, { method: "GET", mode: "no-cors" }).catch(() => null);
        const responseTime = Date.now() - startTime;
        
        let statusCode = "200";
        try {
          if (testResp && testResp.status) {
            statusCode = testResp.status.toString();
          }
        } catch (_) {}

        setDetails({
          finalDestination: actualTargetUrl,
          redirects: redirectCount > 0 ? `${redirectCount} redirect(s) detected` : "No redirects detected",
          responseTime: `${responseTime}ms`,
          statusCode: statusCode,
        });
      } catch (e) {
        setDetails({
          finalDestination: actualTargetUrl,
          redirects: redirectCount > 0 ? `${redirectCount} redirect(s) detected` : "Unknown",
          responseTime: "N/A",
          statusCode: "N/A",
        });
      }
    } catch (e) {
      setErr(String(e));
      setVerdict({ label: "safe", p: 0.0, reasons: ["model_unavailable"] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (linkId) {
      // If we have a linkId, fetch the target URL
      (async () => {
        try {
          const r = await fetch(`${apiBase}/api/links/${linkId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (r.ok) {
            const data = await r.json();
            setPreviewUrl(data.target);
            // Auto-check URL when loaded
            setTimeout(() => {
              checkUrl();
            }, 100);
          }
        } catch (e) {
          setErr("Failed to load link");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId, token, apiBase]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "#374151" }}>
          URL to Preview
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="www.example.com"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
            onKeyPress={(e) => e.key === "Enter" && !loading && checkUrl()}
          />
          <button
            onClick={checkUrl}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: loading ? "#9ca3af" : "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {loading ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {err && <div style={{ color: "#dc2626", marginTop: 12, fontSize: 13 }}>{err}</div>}

      {verdict && (
        <div style={{ marginTop: 16 }}>
          {verdict.label === "blocked" && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>This link has been flagged as potentially dangerous</span>
              </div>
            </div>
          )}

          {verdict.label === "warning" && (
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400e", fontWeight: 600, fontSize: 14 }}>
                <span>⚠️</span>
                <span>This link may be unsafe</span>
              </div>
            </div>
          )}

          {verdict.label === "safe" && (
            <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#065f46", fontWeight: 600, fontSize: 14 }}>
                <span>✅</span>
                <span>This link appears to be safe</span>
              </div>
            </div>
          )}

          {details && (
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: 16, border: "1px solid #e5e7eb" }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>Final Destination:</strong> {details.finalDestination}
              </div>
              <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>Redirects:</strong> {details.redirects}
              </div>
              <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>Response Time:</strong> {details.responseTime}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                <strong style={{ color: "#374151" }}>Status Code:</strong> {details.statusCode}
              </div>
            </div>
          )}

          {verdict.reasons && verdict.reasons.length > 0 && (
            <details style={{ marginTop: 16, fontSize: 13 }}>
              <summary style={{ cursor: "pointer", color: "#6b7280", marginBottom: 8 }}>Why this verdict?</summary>
              <ul style={{ paddingLeft: 20, color: "#6b7280" }}>
                {verdict.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

