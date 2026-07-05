import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

export class OrderApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const orderApi = {
  list(params = {}) {
    return request(`/api/v1/admin/orders${query(params)}`);
  },
  get(orderId) {
    return request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}`);
  },
  auditLogs(orderId, params = {}) {
    return request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/audit-logs${query(params)}`);
  },
  changeStatus(orderId, payload) {
    return request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/change-status`, { method: "POST", body: payload });
  },
  cancel(orderId, payload) {
    return request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/cancel`, { method: "POST", body: payload });
  },
  resolvePayment(orderId, paymentId, payload) {
    return request(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/payments/${encodeURIComponent(paymentId)}/resolve`, {
      method: "POST",
      body: payload
    });
  }
};

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new OrderApiError(401, "AUTH_REQUIRED", "Phiên đăng nhập chưa sẵn sàng");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(options.body !== undefined ? { "content-type": "application/json" } : {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    const error = payload?.error || {};
    throw new OrderApiError(response.status, error.code || "ORDER_API_ERROR", error.message || "Không thể xử lý yêu cầu đơn hàng", error.details);
  }
  return payload;
}

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  return search.size ? `?${search}` : "";
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}
