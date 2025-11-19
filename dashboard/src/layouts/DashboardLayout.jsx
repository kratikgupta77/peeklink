import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/shorten", label: "Shorten & Preview" },
  { to: "/clicks", label: "Clicks by Day" },
  { to: "/verdicts", label: "Verdict Breakdown" },
  { to: "/referrers", label: "Top Referrers" },
  { to: "/links", label: "My Links" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { clearToken } = useAuth();

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f9fafb" }}>
      <header style={{ background: "white", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>PeekLink Dashboard</h1>
          <button onClick={logout} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", background: "white" }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: isActive ? "#111827" : "white",
                color: isActive ? "white" : "#111827",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

