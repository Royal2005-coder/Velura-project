import { apiRequest } from "./api.js";
import { addToCart, showToast } from "./cart.js";

const GUEST_ID_KEY = "velura_chat_guest_id";
const SESSION_ID_KEY = "velura_chat_session_id";
const MODE_KEY = "chatbotStateMode";
const DEFAULT_GREETING =
  "Xin chào! Tôi là AI Stylist của Velura. Tôi có thể giúp bạn tìm kiếm sản phẩm, gợi ý outfit, hoặc tư vấn phong cách. Bạn cần hỗ trợ gì không?";

export function initChatbot() {
  const containers = Array.from(document.querySelectorAll(".chatbot-widget, .chatbot-page"));
  if (!containers.length) return;

  const state = {
    guestId: getOrCreateGuestId(),
    mode: localStorage.getItem(MODE_KEY) || "guest",
    sessionId: localStorage.getItem(SESSION_ID_KEY) || "",
    sessions: [],
    messages: [localGreeting()],
    productsById: new Map(),
    loading: false,
    handoffActive: false
  };

  containers.forEach((container) => bindChatContainer(container, state));
  bindSidebar(state);
  loadSessions(state).catch((error) => {
    console.error("[CHATBOT] Không thể tải lịch sử trò chuyện:", error);
    if (!state.messages.length) state.messages = [localGreeting()];
    renderAll(containers, state);
  });
}

function bindChatContainer(container, state) {
  const togglers = container.querySelectorAll(".js-chatbot-toggle");
  const form = container.querySelector(".js-chatbot-form");
  const input = container.querySelector(".js-chatbot-input");
  const switcher = container.querySelector(".js-chatbot-state-select");
  const attachBtn = container.querySelector(".chatbot-attach-btn");
  const imgInput = document.getElementById("img-input");
  const newChatBtn = container.querySelector(".js-new-chat");

  togglers.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      container.classList.toggle("chatbot-widget--open");
      if (container.classList.contains("chatbot-widget--open")) {
        setTimeout(() => input?.focus(), 250);
        scrollMessages(container, false);
      }
    });
  });

  if (switcher) {
    switcher.value = state.mode;
    switcher.addEventListener("change", () => {
      state.mode = switcher.value || "guest";
      localStorage.setItem(MODE_KEY, state.mode);
      renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state);
    });
  }

  attachBtn?.addEventListener("click", () => imgInput?.click());

  newChatBtn?.addEventListener("click", async () => {
    state.sessionId = "";
    localStorage.removeItem(SESSION_ID_KEY);
    state.messages = [localGreeting()];
    state.handoffActive = false;
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state);
    input?.focus();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input?.value.trim();
    if (!text || state.loading) return;
    input.value = "";
    await sendChatMessage(state, text);
  });

  container.querySelectorAll(".js-quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!input) return;
      input.value = chip.textContent.trim();
      input.focus();
    });
  });

  container.addEventListener("click", async (event) => {
    const btn = event.target.closest(".js-chat-product-cart");
    if (btn) {
      const product = state.productsById.get(btn.dataset.productId);
      addProductToCart(product);
      return;
    }

    const saveOutfitBtn = event.target.closest(".js-save-outfit");
    if (saveOutfitBtn) {
      event.preventDefault();
      await handleSaveOutfit(state, saveOutfitBtn.dataset.messageId, saveOutfitBtn.dataset.sessionId);
    }
  });

  const messagesContainer = container.querySelector(".chatbot-messages");
  const scrollBtn = container.querySelector(".chatbot-scroll-bottom");
  messagesContainer?.addEventListener("scroll", () => {
    const nearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 120;
    state._userScrolled = !nearBottom;
    if (scrollBtn) scrollBtn.style.display = nearBottom ? "none" : "flex";
  });
  scrollBtn?.addEventListener("click", () => {
    scrollMessages(container, true);
    state._userScrolled = false;
    if (scrollBtn) scrollBtn.style.display = "none";
  });

  renderContainer(container, state, false);
}

function bindSidebar(state) {
  const sidebar = document.querySelector(".js-chatbot-sidebar");
  const closeSidebarBtn = document.querySelector(".js-close-sidebar");
  const openSidebarBtn = document.querySelector(".js-open-sidebar");
  const sessionsContainer = document.querySelector(".js-chatbot-sessions");

  closeSidebarBtn?.addEventListener("click", () => sidebar?.classList.add("is-collapsed"));
  openSidebarBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    sidebar?.classList.toggle("is-collapsed");
  });

  sessionsContainer?.addEventListener("click", async (event) => {
    const deleteBtn = event.target.closest(".js-delete-session");
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      await deleteSession(state, deleteBtn.dataset.id);
      return;
    }

    const item = event.target.closest(".chatbot-session-item");
    if (!item?.dataset.id) return;
    state.sessionId = item.dataset.id;
    localStorage.setItem(SESSION_ID_KEY, state.sessionId);
    await loadMessages(state, state.sessionId);
  });
}

async function loadSessions(state) {
  const data = await apiRequest(`/api/v1/chat/sessions?guestId=${encodeURIComponent(state.guestId)}&limit=50`);
  state.sessions = data.rows || [];
  if (!state.sessionId || !state.sessions.some((session) => session.session_id === state.sessionId)) {
    state.sessionId = state.sessions[0]?.session_id || "";
  }
  if (state.sessionId) {
    localStorage.setItem(SESSION_ID_KEY, state.sessionId);
    await loadMessages(state, state.sessionId, false);
  } else {
    state.messages = [localGreeting()];
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state);
  }
}

async function loadMessages(state, sessionId, reloadSessions = true) {
  const data = await apiRequest(`/api/v1/chat/${encodeURIComponent(sessionId)}/messages?guestId=${encodeURIComponent(state.guestId)}&limit=150`);
  state.messages = data.messages?.length ? data.messages : [localGreeting()];
  state.handoffActive = data.session?.handoff_status === "requested" || data.session?.handoff_status === "assigned";
  rememberProducts(state, data.products || []);
  if (reloadSessions) {
    const sessions = await apiRequest(`/api/v1/chat/sessions?guestId=${encodeURIComponent(state.guestId)}&limit=50`);
    state.sessions = sessions.rows || state.sessions;
  }
  renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
}

async function sendChatMessage(state, text) {
  state.loading = true;
  const tempUser = {
    message_id: `tmp-user-${Date.now()}`,
    sender: "user",
    text,
    created_at: new Date().toISOString(),
    metadata: {}
  };
  const typing = {
    message_id: "typing",
    sender: "bot",
    text: "Velura đang tìm gợi ý phù hợp...",
    created_at: new Date().toISOString(),
    metadata: { typing: true }
  };
  state.messages = state.messages.filter((msg) => !msg.metadata?.local_greeting).concat([tempUser, typing]);
  renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);

  try {
    const payload = {
      sessionId: state.sessionId || undefined,
      guestId: state.guestId,
      mode: state.mode,
      message: text
    };
    const data = await apiRequest("/api/v1/chat/messages", {
      method: "POST",
      body: payload
    });
    if (data.session?.session_id) {
      state.sessionId = data.session.session_id;
      localStorage.setItem(SESSION_ID_KEY, state.sessionId);
    }
    if (data.handoff) {
      state.handoffActive = true;
    }
    rememberProducts(state, data.products || []);
    state.messages = state.messages.filter((msg) => msg.message_id !== tempUser.message_id && msg.message_id !== "typing");
    state.messages = state.messages.concat(data.messages || []);
    await refreshSessionsQuietly(state);
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
  } catch (error) {
    const unavailable = [
      "SERVICE_ROLE_REQUIRED",
      "CHAT_SERVICE_UNAVAILABLE",
      "SUPABASE_NETWORK_ERROR",
      "SUPABASE_TIMEOUT"
    ].includes(error.code) || error.status >= 500;
    state.messages = state.messages.filter((msg) => msg.message_id !== "typing").concat({
      message_id: `err-${Date.now()}`,
      sender: "bot",
      text: unavailable
        ? "Hệ thống tư vấn đang tạm thời chưa kết nối được. Bạn vui lòng thử lại sau ít phút."
        : (error.message || "Mình chưa thể kết nối hệ thống tư vấn. Bạn thử lại giúp mình nhé."),
      created_at: new Date().toISOString(),
      metadata: { error: true, error_code: error.code || "CHAT_REQUEST_FAILED" }
    });
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
  } finally {
    state.loading = false;
  }
}

async function refreshSessionsQuietly(state) {
  try {
    const data = await apiRequest(`/api/v1/chat/sessions?guestId=${encodeURIComponent(state.guestId)}&limit=50`);
    state.sessions = data.rows || state.sessions;
  } catch {
    // Keep current sidebar if refresh fails.
  }
}

async function deleteSession(state, sessionId) {
  if (!sessionId) return;
  try {
    await apiRequest(`/api/v1/chat/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      body: { guestId: state.guestId }
    });
    state.sessions = state.sessions.filter((session) => session.session_id !== sessionId);
    if (state.sessionId === sessionId) {
      state.sessionId = state.sessions[0]?.session_id || "";
      if (state.sessionId) {
        localStorage.setItem(SESSION_ID_KEY, state.sessionId);
        await loadMessages(state, state.sessionId, false);
      } else {
        localStorage.removeItem(SESSION_ID_KEY);
        state.messages = [localGreeting()];
      }
    }
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
  } catch (error) {
    showToast(error.message || "Không thể xóa phiên chat.");
  }
}

function renderAll(containers, state, smooth = false) {
  Array.from(containers).forEach((container) => renderContainer(container, state, smooth));
  renderSessions(state);
}

function renderContainer(container, state, smooth) {
  const messagesContainer = container.querySelector(".chatbot-messages");
  if (!messagesContainer) return;
  messagesContainer.innerHTML = state.messages.map((message) => renderMessage(message, state)).join("");
  if (state.handoffActive) {
    messagesContainer.innerHTML += renderHandoffBanner();
  }
  const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 120;
  if (smooth || isNearBottom || !state._userScrolled) {
    scrollMessages(container, smooth);
  }
  state._userScrolled = false;
}

function renderMessage(message, state) {
  const senderClass = message.sender === "user" ? "chatbot-message--user" : "chatbot-message--bot";
  const typingClass = message.metadata?.typing ? " chatbot-message--typing" : "";
  const agentClass = message.sender === "agent" ? " chatbot-message--agent" : "";
  const productIds = collectProductIds(message);
  const productCards = productIds
    .map((id) => state.productsById.get(id))
    .filter(Boolean)
    .map((product) => renderProductCard(product))
    .join("");
  const formattedText = message.metadata?.typing
    ? '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>'
    : formatBotText(message.text);
  return `
    <div class="chatbot-message ${senderClass}${typingClass}${agentClass}">
      ${message.sender === "agent" ? '<span class="chatbot-message__sender">CSKH</span>' : ""}
      <div class="chatbot-message__text">${formattedText}</div>
      ${productCards ? `
        <div class="chat-product-list">${productCards}</div>
        <div style="margin-top: 10px; text-align: left;">
          <button type="button" class="btn-save-outfit js-save-outfit" data-message-id="${escapeHtml(message.message_id)}" data-session-id="${escapeHtml(message.session_id)}" style="background: rgba(115, 71, 36, 0.1); border: 1px solid rgba(115, 71, 36, 0.2); color: #734724; font-family: inherit; font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Lưu phối đồ yêu thích
          </button>
        </div>
      ` : ""}
      <span class="chatbot-message__time">${escapeHtml(formatTime(message.created_at))}</span>
    </div>
  `;
}

function renderProductCard(product) {
  const price = formatMoney(product.sale_price || product.price || product.base_price);
  const oldPrice = product.base_price && product.sale_price && product.base_price > product.sale_price
    ? `<span class="chat-product-card__old-price">${escapeHtml(formatMoney(product.base_price))}</span>`
    : "";
  const cartDisabled = product.variant?.variant_id ? "" : "disabled";
  const isOutOfStock = product.variant && product.variant.stock_quantity <= 0;
  const stockNote = isOutOfStock
    ? '<span class="chat-product-card__stock-note">Tạm hết hàng</span>'
    : "";
  return `
    <article class="chat-product-card" data-product-id="${escapeHtml(product.product_id)}">
      <a href="${escapeHtml(product.detail_url)}" class="chat-product-card__image-link" target="_blank" rel="noopener">
        <img src="${escapeHtml(product.image_url || "/src/assets/images/placeholder.jpg")}" alt="${escapeHtml(product.name)}" loading="lazy">
      </a>
      <div class="chat-product-card__info">
        <h4 class="chat-product-card__title">${escapeHtml(product.name)}</h4>
        <p class="chat-product-card__price">${escapeHtml(price)}${oldPrice}</p>
        ${stockNote}
      </div>
      <div class="chat-product-card__actions">
        <a href="${escapeHtml(product.detail_url)}" class="btn-detail" target="_blank" rel="noopener">Xem chi tiết</a>
        ${isOutOfStock ? '' : `<button type="button" class="btn-buy js-chat-product-cart" data-product-id="${escapeHtml(product.product_id)}">Thêm vào giỏ hàng</button>`}
      </div>
    </article>
  `;
}

function renderHandoffBanner() {
  return `
    <div class="chatbot-handoff-banner">
      <div class="chatbot-handoff-banner__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <div class="chatbot-handoff-banner__text">
        <strong>Đang kết nối với nhân viên CSKH...</strong>
        <span>Vui lòng chờ trong giây lát. Nhân viên sẽ phản hồi ngay.</span>
      </div>
    </div>
  `;
}

function renderSessions(state) {
  const sessionsContainer = document.querySelector(".js-chatbot-sessions");
  if (!sessionsContainer) return;
  if (!state.sessions.length) {
    sessionsContainer.innerHTML = '<p class="history-list__empty">Chưa có lịch sử trò chuyện</p>';
    return;
  }
  sessionsContainer.innerHTML = state.sessions.map((session) => {
    const isActive = session.session_id === state.sessionId;
    const handoffBadge = session.handoff_status === "requested" || session.handoff_status === "assigned"
      ? '<span class="chatbot-session-item__badge">CSKH</span>'
      : "";
    return `
      <div class="chatbot-session-item ${isActive ? "is-active" : ""}" data-id="${escapeHtml(session.session_id)}">
        <div class="chatbot-session-item__left">
          <span class="chatbot-session-item__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          <span class="chatbot-session-item__title" title="${escapeHtml(session.title)}">
            ${escapeHtml(session.title)}
            ${handoffBadge}
            <small>${escapeHtml(formatSessionDate(session.updated_at))}</small>
          </span>
        </div>
        <button class="chatbot-session-item__delete js-delete-session" type="button" aria-label="Xóa phiên" data-id="${escapeHtml(session.session_id)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join("");
}

function addProductToCart(product) {
  if (!product?.variant?.variant_id) {
    showToast("Sản phẩm này chưa có biến thể sẵn sàng để thêm vào giỏ.");
    return;
  }
  addToCart({
    variant_id: product.variant.variant_id,
    product_id: product.product_id,
    product_name: product.name,
    product_image: product.image_url || "",
    quantity: 1,
    unit_price: product.sale_price || product.price || product.base_price,
    color: product.variant.color || "Mặc định",
    size: product.variant.size || "M"
  });
}

function rememberProducts(state, products) {
  products.forEach((product) => {
    if (product?.product_id) state.productsById.set(product.product_id, product);
  });
}

function collectProductIds(message) {
  const metadataIds = Array.isArray(message.metadata?.product_ids) ? message.metadata.product_ids : [];
  const columnIds = Array.isArray(message.product_ids) ? message.product_ids : [];
  return Array.from(new Set([...columnIds, ...metadataIds].filter(Boolean)));
}

function scrollMessages(container, smooth) {
  const messagesContainer = container.querySelector(".chatbot-messages");
  if (!messagesContainer) return;
  if (smooth) {
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });
  } else {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function localGreeting() {
  return {
    message_id: "local-greeting",
    sender: "bot",
    text: DEFAULT_GREETING,
    created_at: new Date().toISOString(),
    metadata: { local_greeting: true }
  };
}

function getOrCreateGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!isUuid(guestId)) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      guestId = crypto.randomUUID();
    } else {
      guestId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatBotText(text) {
  if (!text) return "";
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  html = html.replace(/\n/g, "<br>");
  return html;
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatSessionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "mới";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hôm nay";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

export async function syncFavoriteOutfitsOnLogin() {
  const tempFavorites = sessionStorage.getItem("velura_temporary_favorites");
  if (!tempFavorites) return;
  const favorites = JSON.parse(tempFavorites);
  if (favorites.length === 0) return;

  try {
    await apiRequest("/api/v1/chat/favorites/sync", {
      method: "POST",
      body: { favorites }
    });
    sessionStorage.removeItem("velura_temporary_favorites");
  } catch (err) {
    console.error("Failed to sync favorite outfits on login:", err);
  }
}

async function handleSaveOutfit(state, messageId, sessionId) {
  if (state.mode === "user") {
    try {
      await apiRequest("/api/v1/chat/favorites", {
        method: "POST",
        body: { messageId, sessionId }
      });
      showToast("Đã lưu phối đồ vĩnh viễn vào tủ đồ cá nhân!");
    } catch (err) {
      showToast(err.message || "Không thể lưu phối đồ.");
    }
  } else {
    // Guest mode
    const message = state.messages.find(m => m.message_id === messageId);
    if (!message) return;

    let tempFavorites = JSON.parse(sessionStorage.getItem("velura_temporary_favorites") || "[]");
    const productIds = collectProductIds(message);
    if (!tempFavorites.some(f => f.message_id === messageId)) {
      tempFavorites.push({
        message_id: messageId,
        session_id: sessionId,
        text: message.text,
        product_ids: productIds
      });
      sessionStorage.setItem("velura_temporary_favorites", JSON.stringify(tempFavorites));
    }
    showGuestWarningModal();
  }
}

function showGuestWarningModal() {
  let modal = document.getElementById("guest-warning-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "guest-warning-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.5)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "10000";
    modal.innerHTML = `
      <div class="modal-content" style="background:#fff;padding:24px;border-radius:12px;max-width:400px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.15); font-family: inherit;">
        <h4 style="margin-top:0;color:#734724;font-size:18px;">Trải nghiệm Guest</h4>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:12px 0 20px;">Bạn đang trải nghiệm dưới quyền Khách vãng lai. Vui lòng Đăng ký hoặc Đăng nhập tài khoản để lưu giữ vĩnh viễn phối đồ này vào tủ đồ cá nhân!</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button type="button" class="js-close-warning-modal" style="background:#f4f4f4;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:500;color:#1a1a1a;">Đóng</button>
          <a href="/src/pages/auth/signin.html" style="background:#734724;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:500;">Đăng nhập / Đăng ký</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".js-close-warning-modal").addEventListener("click", () => {
      modal.style.display = "none";
    });
  } else {
    modal.style.display = "flex";
  }
}

// Bắt sự kiện beforeunload trên trình duyệt
window.addEventListener("beforeunload", (e) => {
  const tempFavorites = sessionStorage.getItem("velura_temporary_favorites");
  if (tempFavorites && JSON.parse(tempFavorites).length > 0) {
    e.preventDefault();
    e.returnValue = "Bạn đang trải nghiệm dưới quyền Khách vãng lai. Lịch sử phối đồ yêu thích tạm thời sẽ bị mất nếu bạn tải lại hoặc đóng trang!";
    return e.returnValue;
  }
});
