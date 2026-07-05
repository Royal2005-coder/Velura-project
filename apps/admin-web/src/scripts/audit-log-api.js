import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

export const auditLogApi = {
  async list(params = {}) {
    const token = getAccessToken();
    if (!token) throw new Error("Authentication required");
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value != null)).toString();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs${query ? `?${query}` : ""}`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Cannot load audit logs");
    return payload;
  }
};
