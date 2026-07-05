import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

export class PricingApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "PricingApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const pricingApi = {
  listPriceHistory(params = {}) {
    return request(`/api/v1/admin/pricing/history${query(params)}`);
  },
  auditLogs(params = {}) {
    return request(`/api/v1/admin/pricing/audit-logs${query(params)}`);
  },
  changePrice(productId, body) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/change-price`, { method: "POST", body });
  },
  listPromotions(params = {}) {
    return request(`/api/v1/admin/promotions${query(params)}`);
  },
  getPromotion(promotionId) {
    return request(`/api/v1/admin/promotions/${encodeURIComponent(promotionId)}`);
  },
  createPromotion(body) {
    return request("/api/v1/admin/promotions", { method: "POST", body });
  },
  updatePromotion(promotionId, body) {
    return request(`/api/v1/admin/promotions/${encodeURIComponent(promotionId)}`, { method: "PATCH", body });
  },
  activatePromotion(promotionId, body) {
    return request(`/api/v1/admin/promotions/${encodeURIComponent(promotionId)}/activate`, { method: "POST", body });
  },
  pausePromotion(promotionId, body) {
    return request(`/api/v1/admin/promotions/${encodeURIComponent(promotionId)}/pause`, { method: "POST", body });
  },
  listVouchers(params = {}) {
    return request(`/api/v1/admin/vouchers${query(params)}`);
  },
  getVoucher(voucherId) {
    return request(`/api/v1/admin/vouchers/${encodeURIComponent(voucherId)}`);
  },
  createVoucher(body) {
    return request("/api/v1/admin/vouchers", { method: "POST", body });
  },
  updateVoucher(voucherId, body) {
    return request(`/api/v1/admin/vouchers/${encodeURIComponent(voucherId)}`, { method: "PATCH", body });
  },
  toggleVoucher(voucherId) {
    return request(`/api/v1/admin/vouchers/${encodeURIComponent(voucherId)}/toggle`, { method: "POST" });
  },
  getStatistics() {
    return request("/api/v1/admin/pricing/statistics");
  }
};

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new PricingApiError(401, "AUTH_REQUIRED", "Not authenticated");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(options.body !== undefined ? { "content-type": "application/json" } : {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = payload?.error || {};
    throw new PricingApiError(response.status, error.code || "PRICING_API_ERROR", error.message || "Request failed", error.details);
  }
  return payload;
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
