import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

export class ProductApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ProductApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const productApi = {
  list(params = {}) {
    return request(`/api/v1/admin/products${query(params)}`);
  },
  get(productId) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}`);
  },
  categories() {
    return request("/api/v1/admin/products/categories");
  },
  variants(productId) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/variants`);
  },
  comboItems(productId) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/combo-items`);
  },
  addComboItem(productId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/combo-items`, { method: "POST", body: payload });
  },
  updateComboItem(productId, itemId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/combo-items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: payload });
  },
  removeComboItem(productId, itemId) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/combo-items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
  },
  createVariant(productId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/variants`, { method: "POST", body: payload });
  },
  lowStock() {
    return request("/api/v1/admin/products/low-stock");
  },
  auditLogs(productId = "") {
    return request(productId
      ? `/api/v1/admin/products/${encodeURIComponent(productId)}/audit-logs`
      : "/api/v1/admin/products/audit-logs");
  },
  create(payload) {
    return request("/api/v1/admin/products", { method: "POST", body: payload });
  },
  update(productId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}`, { method: "PATCH", body: payload });
  },
  changeStatus(productId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/change-status`, { method: "POST", body: payload });
  },
  updateStock(productId, payload) {
    return request(`/api/v1/admin/products/${encodeURIComponent(productId)}/update-stock`, { method: "POST", body: payload });
  },
  previewCsv(csv) {
    return request("/api/v1/admin/products/import-csv", { method: "POST", body: { csv } });
  },
  commitCsv(csv) {
    return request("/api/v1/admin/products/import-csv/commit", { method: "POST", body: { csv } });
  }
};

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new ProductApiError(401, "AUTH_REQUIRED", "Phiên đăng nhập chưa sẵn sàng");
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
    throw new ProductApiError(
      response.status,
      error.code || "PRODUCT_API_ERROR",
      error.message || "Không thể xử lý yêu cầu sản phẩm",
      error.details
    );
  }
  return payload;
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
