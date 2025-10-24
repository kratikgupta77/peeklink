import React, { useState } from "react";
import ShortenForm from "./Components/ShortenForm.jsx";
import PreviewCard from "./Components/PreviewCard.jsx";
import Dashboard from "./Components/Dashboard.jsx";   // ⟵ add this

export default function App() {
  const [linkId, setLinkId] = useState(null);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 20, maxWidth: 1120, margin: "0 auto" }}>
      {/* Header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>PeekLink Dashboard (dev)</h1>

      {/* Existing Shorten + Preview flow */}
      <ShortenForm onCreated={setLinkId} />
      {linkId && (
        <div style={{ marginTop: 24 }}>
          <PreviewCard linkId={linkId} />
        </div>
      )}

      {/* Divider */}
      <hr style={{ margin: "32px 0", borderColor: "#eee" }} />

      {/* New Creator Analytics section */}
      <Dashboard />
    </div>
  );
}
