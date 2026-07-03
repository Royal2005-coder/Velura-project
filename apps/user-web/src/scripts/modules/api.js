// Velura Frontend API Client Module
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

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("velura_token");
        localStorage.removeItem("velura_user");
        const currentPath = window.location.pathname;
        if (currentPath.includes("/pages/account/") && !currentPath.includes("track-order.html")) {
          window.location.href = "/src/pages/auth/signin.html";
        }
      }
      const error = new Error(data.error?.message || data.message || `Lỗi API (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`[API ERROR] ${path}:`, error);
    throw error;
  }
}
