import React, { useState } from "react";
import ShortenForm from "../Components/ShortenForm.jsx";
import PreviewCard from "../Components/PreviewCard.jsx";

export default function ShortenPage() {
  const [linkId, setLinkId] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ShortenForm onCreated={setLinkId} />
      {linkId ? (
        <PreviewCard linkId={linkId} />
      ) : (
        <div style={{ border: "1px dashed #d1d5db", padding: 24, borderRadius: 16, background: "white" }}>
          <p style={{ margin: 0 }}>
            Paste a URL above to generate a short link and see the security preview.
          </p>
        </div>
      )}
    </div>
  );
}

