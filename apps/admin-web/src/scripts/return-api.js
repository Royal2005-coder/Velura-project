import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

export class ReturnApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ReturnApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const returnApi = {
  listReturns(params = {}) {
    return request(`/api/v1/admin/returns${query(params)}`);
  },
  getReturn(returnId) {
    return request(`/api/v1/admin/returns/${encodeURIComponent(returnId)}`);
  },
  approveRefund(returnId, body) {
    return request(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/approve-refund`, { method: "POST", body });
  },
  approveExchange(returnId, body) {
    return request(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/approve-exchange`, { method: "POST", body });
  },
  reject(returnId, body) {
    return request(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/reject`, { method: "POST", body });
  },
  updateStatus(returnId, body) {
    return request(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/update-status`, { method: "POST", body });
  },
  listTickets(params = {}) {
    return request(`/api/v1/admin/support-tickets${query(params)}`);
  },
  getTicket(ticketId) {
    return request(`/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}`);
  },
  assignTicket(ticketId, body) {
    return request(`/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/assign`, { method: "POST", body });
  },
  respondTicket(ticketId, body) {
    return request(`/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/respond`, { method: "POST", body });
  },
  closeTicket(ticketId, body) {
    return request(`/api/v1/admin/support-tickets/${encodeURIComponent(ticketId)}/close`, { method: "POST", body });
  },
  listChatSessions(params = {}) {
    return request(`/api/v1/admin/chat-sessions${query(params)}`);
  },
  getChatMessages(sessionId, params = {}) {
    return request(`/api/v1/admin/chat-sessions/${encodeURIComponent(sessionId)}/messages${query(params)}`);
  },
  assignChatSession(sessionId, status) {
    return request(`/api/v1/admin/chat-sessions/${encodeURIComponent(sessionId)}/assign`, { method: "POST", body: { status } });
  },
  sendAgentReply(sessionId, message) {
    return request(`/api/v1/admin/chat-sessions/${encodeURIComponent(sessionId)}/reply`, { method: "POST", body: { message } });
  },
  auditLogs(params = {}) {
    return request(`/api/v1/admin/service-audit-logs${query(params)}`);
  },
  async uploadEvidence(file) {
    const token = getAccessToken();
    if (!token) throw new ReturnApiError(401, "AUTH_REQUIRED", "Not authenticated");
    const formData = new FormData();
    formData.append("file", file, file.name);
    
    const response = await fetch(`${API_BASE_URL}/api/user/upload/evidence`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`
      },
      body: formData
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = payload?.error || {};
      throw new ReturnApiError(response.status, error.code || "UPLOAD_ERROR", error.message || "Failed to upload file");
    }
    return payload;
  }
};

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new ReturnApiError(401, "AUTH_REQUIRED", "Not authenticated");
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
    throw new ReturnApiError(response.status, error.code || "RETURN_API_ERROR", error.message || "Request failed", error.details);
  }
  return payload;
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}
