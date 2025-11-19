// Small fetch wrapper that always adds the Bearer token.
// It also avoids double-prefixing when you pass "/api/..." yourself.

export function getAccess() {
  return localStorage.getItem("access") || "";
}

// dashboard/src/lib/api.js
export async function apiFetch(path, init = {}) {
  let url;
  if (/^https?:\/\//i.test(path)) {
    url = path;                                  // absolute URL
  } else if (path.startsWith("/api/") || path.startsWith("/score")) {
    url = path;                                  // pass through /api/* and /score
  } else {
    url = `/api${path.startsWith("/") ? "" : "/"}${path}`;
  }

  const headers = new Headers(init.headers || {});
  const t = localStorage.getItem("access") || "";
  if (t && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${t}`);

  return fetch(url, { ...init, headers });
}
