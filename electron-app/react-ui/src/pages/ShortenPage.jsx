import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ShortenForm from "../components/ShortenForm.jsx";
import PreviewTab from "../components/PreviewTab.jsx";

export default function ShortenPage() {
  const { token, clearToken } = useAuth();
  const [activeTab, setActiveTab] = useState("shorten");
  const [createdLinkId, setCreatedLinkId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  function handleCreated(linkId, shortUrl) {
    setCreatedLinkId(linkId);
    setPreviewUrl("");
  }

  function handlePreview(url) {
    setPreviewUrl(url);
    setActiveTab("preview");
    setCreatedLinkId(null);
  }

  function handleLogout() {
    clearToken();
    setCreatedLinkId(null);
    setPreviewUrl("");
  }

  function openAnalytics() {
    const dashboardBase = localStorage.getItem("dashboardBase") || "http://127.0.0.1:5173";
    const storedToken = token;
    
    if (storedToken) {
      const url = `${dashboardBase}?token=${encodeURIComponent(storedToken)}`;
      window.open(url, "_blank");
    } else {
      window.open(dashboardBase, "_blank");
    }
  }

  function openSettings() {
    // In Electron, we can show a settings dialog or window
    // For now, just show an alert with instructions
    alert("Settings:\n\nAPI Base: " + (localStorage.getItem("apiBase") || "http://127.0.0.1:8000") + "\n\nTo change settings, edit localStorage in DevTools (F12)");
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#ffffff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, background: "#111827", borderRadius: 4 }}></div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>PeekLink</h2>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
        <button
          onClick={() => setActiveTab("shorten")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "shorten" ? "#111827" : "transparent",
            color: activeTab === "shorten" ? "#ffffff" : "#374151",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Shorten
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          style={{
            flex: 1,
            padding: "12px",
            background: activeTab === "preview" ? "#111827" : "transparent",
            color: activeTab === "preview" ? "#ffffff" : "#374151",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {activeTab === "shorten" && (
          <ShortenForm onCreated={handleCreated} onPreview={handlePreview} />
        )}
        {activeTab === "preview" && (
          <PreviewTab url={previewUrl} linkId={createdLinkId} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        display: "flex", 
        borderTop: "1px solid #e5e7eb", 
        background: "#ffffff",
        zIndex: 1000
      }}>
        {activeTab === "shorten" && (
          <button
            onClick={openAnalytics}
            style={{
              flex: 1,
              padding: "12px",
              background: "#111827",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Analytics
          </button>
        )}
        <button
          onClick={openSettings}
          style={{
            flex: activeTab === "shorten" ? 1 : "1 1 50%",
            padding: "12px",
            background: "#111827",
            color: "#ffffff",
            border: "none",
            borderLeft: activeTab === "shorten" ? "1px solid #374151" : "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Settings
        </button>
        <button
          onClick={handleLogout}
          style={{
            flex: activeTab === "shorten" ? 1 : "1 1 50%",
            padding: "12px",
            background: "#111827",
            color: "#ffffff",
            border: "none",
            borderLeft: "1px solid #374151",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

