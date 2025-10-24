import React, { useEffect, useState } from "react";

export default function Health() {
  const [ver, setVer] = useState({ count: null, latest: null });
  useEffect(() => {
    fetch("/score/health") // optional; if you added /health use "/health"
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setVer({ count: d.count ?? null, latest: d.latest ?? null }))
      .catch(() => {}); // ignore in dev
  }, []);
  if (!ver.count && !ver.latest) return null;

  return (
    <div style={{ fontSize: 13, opacity: 0.8 }}>
      Model: {ver.count ? `${ver.count} phish URLs` : "…"} {ver.latest ? `(${ver.latest})` : ""}
    </div>
  );
}
