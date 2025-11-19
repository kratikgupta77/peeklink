import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ShortenForm from "../components/ShortenForm.jsx";
import PreviewCard from "../components/PreviewCard.jsx";

export default function ShortenPage() {
  const { token, clearToken } = useAuth();
  const [createdLinkId, setCreatedLinkId] = useState(null);

  function handleCreated(linkId) {
    setCreatedLinkId(linkId);
  }

  function handleLogout() {
    clearToken();
    setCreatedLinkId(null);
  }

  function openDashboard() {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: "http://127.0.0.1:5173" });
    } else {
      window.open("http://127.0.0.1:5173", "_blank");
    }
  }

  return (
    <div style={{ padding: 16, background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>PeekLink</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={openDashboard}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <ShortenForm onCreated={handleCreated} />
      
      {createdLinkId && (
        <div style={{ marginTop: 16 }}>
          <PreviewCard linkId={createdLinkId} />
        </div>
      )}
    </div>
  );
}

