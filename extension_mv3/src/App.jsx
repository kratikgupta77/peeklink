import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/Login.jsx";
import ShortenPage from "./pages/ShortenPage.jsx";

function AppContent() {
  const { token } = useAuth();
  
  if (!token) {
    return <LoginPage />;
  }
  
  return <ShortenPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

