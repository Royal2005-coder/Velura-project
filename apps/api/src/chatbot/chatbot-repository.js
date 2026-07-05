import { randomUUID } from "node:crypto";
import { HttpError } from "../http.js";
import { insertRow, selectOne, selectRows, updateRows } from "../supabase.js";
import { CHAT_MESSAGE_SELECT, CHAT_PRODUCT_SELECT, CHAT_SESSION_SELECT } from "./chatbot-constants.js";

export function createChatbotRepository() {
  return {
    async listSessions(filters) {
      const query = {
        select: CHAT_SESSION_SELECT,
        is_active: "eq.true",
        order: "updated_at.desc",
        limit: filters.limit,
        offset: filters.offset
      };
      if (filters.profileUserId) query.profile_user_id = `eq.${filters.profileUserId}`;
      else query.guest_id = `eq.${filters.guestId}`;
      return withChatError(() => selectRows("chat_session", query));
    },

    async listAdminSessions(filters) {
      const query = {
        select: CHAT_SESSION_SELECT,
        order: "updated_at.desc",
        limit: filters.limit,
        offset: filters.offset
      };
      if (filters.handoffOnly) query.handoff_status = "in.(requested,assigned)";
      if (filters.ticketId) query.support_ticket_id = `eq.${filters.ticketId}`;
      return withChatError(() => selectRows("chat_session", query));
    },

    async getSession(sessionId) {
      return withChatError(() => selectOne("chat_session", {
        select: CHAT_SESSION_SELECT,
        session_id: `eq.${sessionId}`
      }));
    },

    async createSession(input) {
      return withChatError(() => insertRow("chat_session", {
        session_id: randomUUID(),
        user_id: input.authUserId || null,
        profile_user_id: input.profileUserId || null,
        guest_id: input.guestId || null,
        title: input.title,
        source: "chatbot",
        is_active: true,
        handoff_status: "ai",
        last_message_preview: input.lastMessagePreview || null,
        last_message_at: new Date().toISOString(),
        metadata: input.metadata || {}
      }));
    },

    async updateSession(sessionId, patch) {
      const rows = await withChatError(() => updateRows("chat_session", {
        session_id: `eq.${sessionId}`
      }, {
        ...patch,
        updated_at: new Date().toISOString()
      }));
      return rows[0] || null;
    },

    async closeSession(sessionId) {
      const rows = await withChatError(() => updateRows("chat_session", {
        session_id: `eq.${sessionId}`
      }, {
        is_active: false,
        handoff_status: "closed",
        updated_at: new Date().toISOString()
      }));
      return rows[0] || null;
    },

    async listMessages(sessionId, limit = 100) {
      return withChatError(() => selectRows("chat_message", {
        select: CHAT_MESSAGE_SELECT,
        session_id: `eq.${sessionId}`,
        order: "created_at.asc",
        limit
      }));
    },

    async insertMessage(input) {
      return withChatError(() => insertRow("chat_message", {
        message_id: randomUUID(),
        session_id: input.sessionId,
        sender: input.sender,
        text: input.text,
        metadata: input.metadata || {},
        product_ids: input.productIds || [],
        created_at: new Date().toISOString()
      }));
    },

    async searchProducts(query, limit = 6) {
      const value = sanitizeSearch(query);
      const request = {
        select: CHAT_PRODUCT_SELECT,
        status: "eq.on_sale",
        order: "is_featured.desc,updated_at.desc",
        limit
      };
      if (value) {
        request.or = `(name.ilike.*${value}*,sku.ilike.*${value}*,description.ilike.*${value}*)`;
      }
      return withChatError(() => selectRows("product", request));
    },

    async listProductsByIds(productIds) {
      const ids = uniqueUuidList(productIds);
      if (!ids.length) return { rows: [], count: 0 };
      return withChatError(() => selectRows("product", {
        select: CHAT_PRODUCT_SELECT,
        product_id: `in.(${ids.join(",")})`,
        status: "eq.on_sale",
        limit: Math.min(ids.length, 12)
      }));
    },

    async insertAiLog(input) {
      return withChatError(() => insertRow("ai_log", {
        log_type: "chatbot_session",
        user_id: input.profileUserId || null,
        session_id: null,
        messages: input.messages || [],
        recommended_products: input.recommendedProducts || [],
        clicked_products: null,
        purchased_products: null,
        ctr: null,
        quiz_results: input.quizResults || null,
        escalated_to_human: Boolean(input.escalatedToHuman),
        created_at: new Date().toISOString()
      }));
    },

    async createSupportTicket(input) {
      return withChatError(() => insertRow("support_ticket", {
        ticket_id: randomUUID(),
        user_id: input.profileUserId || null,
        guest_phone: input.guestPhone || null,
        guest_email: input.guestEmail || null,
        title: input.title,
        description: input.description,
        priority: input.priority || "high",
        status: "open",
        admin_reply: null,
        ai_log_id: input.aiLogId || null,
        created_at: new Date().toISOString()
      }));
    },

    async queueEmail(input) {
      if (!input.recipient) return null;
      return withChatError(() => insertRow("email_outbox", {
        recipient: input.recipient,
        template_code: input.templateCode,
        subject: input.subject,
        body: input.body,
        related_user_id: input.relatedUserId || null,
        metadata: input.metadata || {}
      }));
    }
  };
}

function sanitizeSearch(value) {
  return String(value || "")
    .replace(/[%,*()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function uniqueUuidList(values) {
  const seen = new Set();
  const ids = [];
  for (const value of Array.isArray(values) ? values : []) {
    const id = String(value || "").trim();
    if (!isUuid(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function withChatError(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpError && error.code === "SUPABASE_ERROR") {
      const databaseCode = error.details?.message || error.details?.code || "CHATBOT_DATABASE_ERROR";
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      throw new HttpError(status, databaseCode, chatbotErrorMessage(databaseCode), error.details);
    }
    throw error;
  }
}

function chatbotErrorMessage(code) {
  const messages = {
    INVALID_TEXT_REPRESENTATION: "Invalid chat identifier",
    CHATBOT_DATABASE_ERROR: "Chat database operation failed"
  };
  return messages[code] || "Chat database operation failed";
}
