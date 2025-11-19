import React from "react";

export default function AuthShell({ title, children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 32, boxShadow: "0 10px 40px rgba(15,23,42,0.08)" }}>
        <h1 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

