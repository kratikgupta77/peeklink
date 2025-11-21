// API helper for electron app
// Provides consistent error handling and token refresh

export function getAccessToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("access") || "";
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken") || localStorage.getItem("refresh") || "";
}

export async function apiFetch(url, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });
  
  // If we get a 401, the token might be expired - try to refresh it
  if (response.status === 401 && token) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        // Get API base from the original URL
        const urlObj = new URL(url, window.location.origin);
        const apiBase = `${urlObj.protocol}//${urlObj.host}`;
        
        const refreshResp = await fetch(`${apiBase}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          if (data.access) {
            localStorage.setItem("accessToken", data.access);
            localStorage.setItem("access", data.access);
            if (data.refresh) {
              localStorage.setItem("refreshToken", data.refresh);
              localStorage.setItem("refresh", data.refresh);
            }
            // Retry the original request with new token
            headers.set("Authorization", `Bearer ${data.access}`);
            return fetch(url, { ...init, headers });
          }
        }
      } catch (e) {
        console.error("Token refresh failed:", e);
        // If refresh fails, clear tokens - user will need to log in again
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("refresh");
      }
    } else {
      // No refresh token, clear access token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access");
    }
  }
  
  return response;
}

// Helper to parse error messages from API responses
export async function parseApiError(response, defaultMessage = "An error occurred") {
  if (!response.ok) {
    let msg = `API ${response.status}`;
    try {
      const errJson = await response.json();
      msg = errJson.message || errJson.error || errJson.detail || msg;
      // Provide user-friendly messages for common errors
      if (msg.includes("readonly") || msg.includes("permission") || msg.includes("Database permission")) {
        msg = "Database permission error. Please contact the administrator to fix database permissions.";
      } else if (msg.includes("database") || msg.includes("Database error")) {
        msg = "Database error. Please try again or contact the administrator.";
      } else if (response.status === 401) {
        msg = "Authentication failed. Please log in again.";
      } else if (response.status === 403) {
        msg = msg || "Access forbidden";
      } else if (response.status === 500) {
        msg = msg || "Server error. Please try again.";
        console.error("API 500 Error:", errJson);
      }
    } catch (_) {
      // If we can't parse JSON, use status text
      msg = `API Error ${response.status}: ${response.statusText || "Unknown error"}`;
    }
    return msg;
  }
  return null;
}

