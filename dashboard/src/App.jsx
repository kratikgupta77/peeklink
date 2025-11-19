import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login.jsx";
import SignupPage from "./pages/Signup.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import ShortenPage from "./pages/ShortenPage.jsx";
import ClicksPage from "./pages/ClicksPage.jsx";
import VerdictsPage from "./pages/VerdictsPage.jsx";
import ReferrersPage from "./pages/ReferrersPage.jsx";
import LinksPage from "./pages/LinksPage.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/shorten" replace />} />
        <Route path="/shorten" element={<ShortenPage />} />
        <Route path="/clicks" element={<ClicksPage />} />
        <Route path="/verdicts" element={<VerdictsPage />} />
        <Route path="/referrers" element={<ReferrersPage />} />
        <Route path="/links" element={<LinksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/shorten" replace />} />
    </Routes>
  );
}
