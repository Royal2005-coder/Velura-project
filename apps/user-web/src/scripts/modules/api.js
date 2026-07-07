// Velura Frontend API Client Module
import { clearAuthSession } from "./auth-session.js";

const API_URL = "http://127.0.0.1:8787";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("velura_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let fetchOptions = { ...options, headers };
  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, fetchOptions);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
        const currentPath = window.location.pathname;
        if (currentPath.includes("/pages/account/") && !currentPath.includes("track-order.html")) {
          window.location.href = "/src/pages/auth/signin.html";
        }
      }
      const error = new Error(data.error?.message || data.message || `Lỗi API (${response.status})`);
      error.status = response.status;
      error.code = data.error?.code || data.code || "API_ERROR";
      error.details = data.error?.details || data.details;
      error.requestId = data.error?.requestId || response.headers.get("x-request-id") || "";
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`[API ERROR] ${path}:`, error);
    throw error;
  }
}
