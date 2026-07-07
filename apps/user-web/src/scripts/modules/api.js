// Velura Frontend API Client Module

const API_URL = "http://127.0.0.1:8787";


/**
 * Check if there is any valid session (real JWT or dev-mock).
 * Used by UI components to determine login state without making API calls.
 */
export function isSessionValid() {
  const token = localStorage.getItem("velura_token");
  if (token) return true;
  const rawUser = localStorage.getItem("velura_user");
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      return !!user.is_dev_mock;
    } catch { return false; }
  }
  return false;
}

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
        // Do NOT automatically clear the session or redirect here.
        // Reasons:
        //  1. The route guard in main.js already protects account pages based on localStorage.
        //  2. A 401 from an optional API (e.g. style-quiz, wishlist) should NOT log the user out.
        //  3. A DB/server issue returning 401 does NOT mean the JWT is actually invalid.
        //
        // Dev-mock sessions are also safe — they never send a real token anyway.
        // Page-level modules are responsible for showing appropriate error messages.
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
    if (!(error.status)) {
      // Network error (fetch itself failed) — do NOT touch auth session.
      // This prevents wiping the session when the API server is temporarily down.
      console.error(`[API ERROR] ${path}:`, error);
      throw error;
    }
    console.error(`[API ERROR] ${path}:`, error);
    throw error;
  }
}
