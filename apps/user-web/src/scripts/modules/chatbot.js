import { apiRequest } from "./api.js";
import { addToCart, showToast } from "./cart.js";

const GUEST_ID_KEY = "velura_chat_guest_id";
const SESSION_ID_KEY = "velura_chat_session_id";
const MODE_KEY = "chatbotStateMode";
const VELURA_STYLIST_GREETING =
  "Xin chào, mình là **Velura Stylist** - trợ lý thời trang AI của cửa hàng Velura.\n\n" +
  "Mình ở đây để giúp bạn mua sắm dễ hơn, chọn đồ có gu hơn và được chăm sóc đúng lúc hơn.\n\n" +
  "**Mình có thể hỗ trợ bạn:**\n" +
  "- Gợi ý outfit theo dịp mặc: đi làm, đi chơi, dự tiệc, du lịch hoặc hẹn hò\n" +
  "- Tìm sản phẩm Velura theo phong cách, màu sắc, ngân sách và chất liệu bạn thích\n" +
  "- Tư vấn size theo chiều cao, cân nặng, số đo và dáng người\n" +
  "- Gợi ý cách phối đồ, phụ kiện và bảng màu để tổng thể thanh lịch hơn\n" +
  "- Hỗ trợ tra cứu đơn hàng, chính sách giao hàng, đổi trả và thanh toán\n" +
  "- Tạo ticket hoặc kết nối nhân viên CSKH khi bạn cần hỗ trợ trực tiếp\n\n" +
  "**Bạn có thể bắt đầu bằng:**\n" +
  "- \"Gợi ý outfit công sở thanh lịch\"\n" +
  "- \"Tìm váy dự tiệc dưới 800.000đ\"\n" +
  "- \"Tư vấn size cho mình: cao 1m60, nặng 50kg\"\n" +
  "- \"Mình muốn gặp CSKH\"";

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
  loadSessions(state).catch(() => {
    if (!state.messages.length) state.messages = [localGreeting()];
    renderAll(containers, state);
  });
  startChatPolling(state);
}

function isChatVisible() {
  return document.querySelector(".chatbot-page") || document.querySelector(".chatbot-widget.chatbot-widget--open");
}

function startChatPolling(state) {
  if (state._pollTimer) return;
  state._pollTimer = setInterval(async () => {
    if (!state.sessionId || state.loading || state._polling || !isChatVisible()) return;
    state._polling = true;
    try {
      const data = await apiRequest(`/api/v1/chat/${encodeURIComponent(state.sessionId)}/messages?guestId=${encodeURIComponent(state.guestId)}&limit=150`);
      const incoming = data.messages || [];
      const baseCurrent = state.messages.filter((m) => !m.metadata?.local_greeting);
      const baseIncoming = incoming.filter((m) => !m.metadata?.local_greeting);
      const lastCurrent = baseCurrent[baseCurrent.length - 1];
      const lastIncoming = baseIncoming[baseIncoming.length - 1];
      const changed = baseIncoming.length !== baseCurrent.length ||
        (lastIncoming && lastCurrent && lastIncoming.message_id !== lastCurrent.message_id);
      const handoffNow = data.session?.handoff_status === "assigned";
      if (changed) {
        state.messages = incoming.length ? incoming : [localGreeting()];
        state.handoffActive = handoffNow;
        rememberProducts(state, data.products || []);
        rememberBlogs(state, data.blogs || []);
        renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
      } else if (state.handoffActive !== handoffNow) {
        state.handoffActive = handoffNow;
        renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
      }
    } catch (error) {
      // polling errors are non-fatal
    } finally {
      state._polling = false;
    }
  }, 4000);
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

  container.addEventListener("click", async (event) => {
    const chip = event.target.closest(".js-quick-chip");
    if (chip) {
      event.preventDefault();
      // Remove any leading emojis or spaces (e.g. '👠 ' or '💬 ') to get the clean text query
      const text = chip.textContent.trim().replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, "").replace(/^[^\w\s\u00C0-\u1EF9]+\s*/, "").trim();
      if (!text || state.loading) return;
      await sendChatMessage(state, text);
      return;
    }

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
  state.handoffActive = data.session?.handoff_status === "assigned";
  rememberProducts(state, data.products || []);
  rememberBlogs(state, data.blogs || []);
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
    text: "Velura Stylist đang chọn gợi ý phù hợp...",
    created_at: new Date().toISOString(),
    metadata: { typing: true }
  };
  const baseMessages = state.messages.filter((msg) => !msg.metadata?.local_greeting);
  state.messages = state.handoffActive ? baseMessages.concat([tempUser]) : baseMessages.concat([tempUser, typing]);
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
    if (data.handoff && data.handoff.status === "assigned") {
      state.handoffActive = true;
    }
    rememberProducts(state, data.products || []);
    rememberBlogs(state, data.blogs || []);
    state.messages = state.messages.filter((msg) => msg.message_id !== tempUser.message_id && msg.message_id !== "typing");
    state.messages = state.messages.concat(data.messages || []);
    await refreshSessionsQuietly(state);
    renderAll(document.querySelectorAll(".chatbot-widget, .chatbot-page"), state, true);
  } catch (error) {
    state.messages = state.messages.filter((msg) => msg.message_id !== "typing").concat({
      message_id: `err-${Date.now()}`,
      sender: "bot",
      text: createUnavailableReply(text, error),
      created_at: new Date().toISOString(),
      metadata: { error: true, recoverable: true }
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

  // Disable chatbot input and buttons when handoff is active
  const input = container.querySelector(".js-chatbot-input");
  const form = container.querySelector(".js-chatbot-form");
  const submitBtn = form?.querySelector("button[type='submit']");
  const attachBtn = container.querySelector(".chatbot-attach-btn");

  if (input) {
    input.disabled = false;
    if (state.handoffActive) {
      input.placeholder = "Nhân viên CSKH sẽ phản hồi tin nhắn của bạn...";
    } else {
      input.placeholder = "Nhập tin nhắn tư vấn thời trang...";
    }
  }
  if (submitBtn) {
    submitBtn.disabled = false;
  }
  if (attachBtn) {
    attachBtn.style.pointerEvents = "";
    attachBtn.style.opacity = "";
  }
}

function renderMessage(message, state) {
  if (message.metadata?.local_greeting || message.message_id === "local-greeting") {
    const activeSessionClass = state.sessionId ? "" : " chatbot-welcome-new";
    return `
      <div class="chatbot-message chatbot-message--bot chatbot-welcome-card${activeSessionClass}" style="align-self: flex-start; width: 100%; max-width: 90%; background: #fffdfb; border: 1px solid #ebdacf; border-radius: 16px; padding: 18px; box-shadow: 0 4px 15px rgba(115, 71, 36, 0.04); margin-bottom: 16px; box-sizing: border-box;">
        <div class="chatbot-welcome-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #734724; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; box-shadow: 0 2px 8px rgba(115, 71, 36, 0.2);">
            🌸
          </div>
          <div>
            <h3 style="margin: 0; color: #734724; font-size: 15px; font-weight: 600; font-family: inherit;">AI Stylist Velura</h3>
            <span style="font-size: 11px; color: #b56727; font-weight: 500; display: block;">Trợ lý thời trang & phong cách cá nhân</span>
          </div>
        </div>
        <div class="chatbot-welcome-text" style="font-size: 13px; color: #5a4b41; line-height: 1.6; margin-bottom: 16px; font-family: inherit;">
          Chào bạn thân mến, mình là <strong>AI Stylist Velura</strong>. Mình rất vui khi được hỗ trợ bạn ngày hôm nay! 🥰<br><br>
          Mình có thể gợi ý outfit, tư vấn size phù hợp dáng người, tìm sản phẩm thời trang, giải đáp chính sách hoặc kết nối với nhân viên hỗ trợ.<br><br>
          <strong>Bạn muốn bắt đầu bằng gợi ý nào dưới đây?</strong>
        </div>
        <div class="chatbot-welcome-shortcuts" style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="js-quick-chip" style="display: flex; align-items: center; gap: 8px; width: 100%; background: #ffffff; border: 1px solid #ebdacf; border-radius: 10px; padding: 10px 14px; text-align: left; font-family: inherit; font-size: 12.5px; color: #734724; cursor: pointer; transition: all 0.2s; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: auto; min-height: 38px;">
            👠 Gợi ý outfit đi tiệc sang trọng
          </button>
          <button type="button" class="js-quick-chip" style="display: flex; align-items: center; gap: 8px; width: 100%; background: #ffffff; border: 1px solid #ebdacf; border-radius: 10px; padding: 10px 14px; text-align: left; font-family: inherit; font-size: 12.5px; color: #734724; cursor: pointer; transition: all 0.2s; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: auto; min-height: 38px;">
            💼 Phối đồ công sở thanh lịch
          </button>
          <button type="button" class="js-quick-chip" style="display: flex; align-items: center; gap: 8px; width: 100%; background: #ffffff; border: 1px solid #ebdacf; border-radius: 10px; padding: 10px 14px; text-align: left; font-family: inherit; font-size: 12.5px; color: #734724; cursor: pointer; transition: all 0.2s; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: auto; min-height: 38px;">
            📏 Tư vấn size: Cao 1m62, Nặng 52kg
          </button>
          <button type="button" class="js-quick-chip" style="display: flex; align-items: center; gap: 8px; width: 100%; background: #ffffff; border: 1px solid #ebdacf; border-radius: 10px; padding: 10px 14px; text-align: left; font-family: inherit; font-size: 12.5px; color: #734724; cursor: pointer; transition: all 0.2s; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: auto; min-height: 38px;">
            📦 Chính sách đổi trả hàng như thế nào?
          </button>
          <button type="button" class="js-quick-chip" style="display: flex; align-items: center; gap: 8px; width: 100%; background: #fff3eb; border: 1px solid #f8d3c5; border-radius: 10px; padding: 10px 14px; text-align: left; font-family: inherit; font-size: 12.5px; color: #b56727; cursor: pointer; transition: all 0.2s; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: auto; min-height: 38px;">
            💬 Gặp nhân viên chăm sóc khách hàng
          </button>
        </div>
      </div>
    `;
  }

  const senderClass = message.sender === "user" ? "chatbot-message--user" : "chatbot-message--bot";
  const typingClass = message.metadata?.typing ? " chatbot-message--typing" : "";
  const agentClass = message.sender === "agent" ? " chatbot-message--agent" : "";
  const systemClass = message.metadata?.agent_joined ? " chatbot-message--system" : "";
  const productIds = collectProductIds(message);
  const productCards = productIds
    .map((id) => state.productsById.get(id))
    .filter(Boolean)
    .map((product) => renderProductCard(product))
    .join("");

  const blogIds = Array.isArray(message.metadata?.blog_ids) ? message.metadata.blog_ids : [];
  const blogCards = blogIds
    .map((id) => state.blogsById ? state.blogsById.get(id) : null)
    .filter(Boolean)
    .map((blog) => renderBlogCard(blog))
    .join("");

  const formattedText = message.metadata?.typing
    ? '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>'
    : formatBotText(message.text);

  if (message.metadata?.agent_joined) {
    return `
      <div class="chatbot-message chatbot-message--system" style="align-self: center; text-align: center; margin: 12px 0;">
        <div style="display: inline-flex; align-items: center; gap: 6px; background: #f0ebe6; border: 1px solid #e0d5c8; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: #734724; font-weight: 500;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          ${escapeHtml(message.text)}
        </div>
      </div>
    `;
  }

  return `
    <div class="chatbot-message ${senderClass}${typingClass}${agentClass}${systemClass}">
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
      ${blogCards ? `
        <div class="chat-blog-list-container" style="margin-top: 12px; border-top: 1px dashed rgba(115,71,36,0.15); padding-top: 10px;">
          <div style="font-size: 11px; font-weight: 600; color: #b56727; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">📖 Bài viết gợi ý phong cách</div>
          <div class="chat-blog-list" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin;">${blogCards}</div>
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

function renderBlogCard(blog) {
  return `
    <article class="chat-blog-card" style="flex: 0 0 200px; background: #ffffff; border: 1px solid #ebdacf; border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; font-size: 12px; box-shadow: 0 2px 6px rgba(115,71,36,0.03); box-sizing: border-box;">
      <a href="${escapeHtml(blog.detail_url)}" target="_blank" rel="noopener" style="display: block; height: 100px; overflow: hidden; border-bottom: 1px solid #ebdacf;">
        <img src="${escapeHtml(blog.image_url || '/src/assets/images/placeholder.jpg')}" alt="${escapeHtml(blog.title)}" style="width: 100%; height: 100%; object-fit: cover;">
      </a>
      <div style="padding: 10px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; gap: 8px;">
        <div>
          <h4 style="margin: 0 0 4px 0; font-size: 12px; line-height: 1.4; color: #734724; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 600; font-family: inherit;">${escapeHtml(blog.title)}</h4>
          <p style="margin: 0; color: #8e7d73; font-size: 11px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; font-family: inherit;">${escapeHtml(blog.excerpt)}</p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; color: #a49185; font-size: 10px;">
          <span>${escapeHtml(blog.author)}</span>
          <span>⏱️ ${blog.read_minutes} phút</span>
        </div>
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
        <strong>nhân viên CSKH đang hỗ trợ bạn</strong>
        <span>Tin nhắn của bạn sẽ được nhân viên phản hồi trực tiếp.</span>
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

function rememberBlogs(state, blogs) {
  if (!state.blogsById) state.blogsById = new Map();
  blogs.forEach((blog) => {
    if (blog?.blog_id) state.blogsById.set(blog.blog_id, blog);
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
    text: VELURA_STYLIST_GREETING,
    created_at: new Date().toISOString(),
    metadata: { local_greeting: true }
  };
}

function createUnavailableReply(message, error) {
  const intent = detectLocalIntent(message);
  const connectionNote = isNetworkError(error)
    ? "Hiện mình chưa kết nối được hệ thống tư vấn sản phẩm của Velura, nên chưa thể lấy dữ liệu sản phẩm/ticket trực tiếp ngay lúc này."
    : "Mình chưa xử lý trọn vẹn được yêu cầu này trong hệ thống, nên sẽ hướng dẫn bạn theo cách an toàn trước.";

  if (intent === "support") {
    return [
      "Mình đã hiểu là bạn cần **nhân viên CSKH Velura hỗ trợ trực tiếp**.",
      "",
      connectionNote,
      "",
      "Để CSKH tiếp nhận nhanh hơn khi hệ thống kết nối lại, bạn có thể nhắn thêm:",
      "- Họ tên",
      "- Số điện thoại hoặc email",
      "- Mã đơn hàng nếu có",
      "- Nội dung cần hỗ trợ hoặc khiếu nại",
      "",
      "Mình sẽ không hiển thị lỗi kỹ thuật trong cuộc trò chuyện nữa; bạn cứ gửi thông tin theo mẫu trên nhé."
    ].join("\n");
  }

  if (intent === "size") {
    return [
      "Mình chưa lấy được dữ liệu sản phẩm theo thời gian thực, nhưng vẫn có thể tư vấn size cơ bản cho bạn trước.",
      "",
      "**Bảng size tham khảo Velura:**",
      "- S: eo 62-66cm, ngực 80-84cm",
      "- M: eo 66-70cm, ngực 84-88cm",
      "- L: eo 70-74cm, ngực 88-92cm",
      "- XL: eo 74-78cm, ngực 92-96cm",
      "",
      "Bạn gửi giúp mình chiều cao, cân nặng, số đo ngực/eo/mông và dáng đồ bạn thích mặc ôm hay thoải mái, mình sẽ gợi ý size sát hơn."
    ].join("\n");
  }

  if (intent === "order") {
    return [
      connectionNote,
      "",
      "Để mình hoặc CSKH Velura tra cứu đơn hàng ngay khi hệ thống sẵn sàng, bạn gửi giúp:",
      "- Mã đơn hàng",
      "- Số điện thoại đặt hàng",
      "- Vấn đề bạn đang cần kiểm tra: giao hàng, đổi trả, thanh toán hay hoàn tiền",
      "",
      "Nếu cần người hỗ trợ ngay, bạn có thể nhắn: \"Mình muốn gặp CSKH\"."
    ].join("\n");
  }

  if (intent === "outfit") {
    return [
      "Mình đã nhận được yêu cầu gợi ý outfit của bạn. Hiện kho sản phẩm trực tuyến chưa kết nối được, nên mình gợi ý trước hướng phối đồ thanh lịch theo phong cách Velura nhé.",
      "",
      "**Gợi ý outfit công sở thanh lịch:**",
      "- Áo blouse hoặc áo lụa màu kem/trắng ngà để tạo nền mềm mại",
      "- Blazer dáng gọn màu be, nâu nhạt hoặc đen để tổng thể chuyên nghiệp",
      "- Quần ống suông hoặc chân váy midi, ưu tiên chất vải đứng phom",
      "- Phụ kiện nhỏ: thắt lưng mảnh, khuyên tai tối giản, túi đeo vai màu trung tính",
      "",
      "Để mình lọc sản phẩm Velura sát hơn khi hệ thống kết nối lại, bạn cho mình biết thêm: bạn thích tông sáng hay tối, ngân sách khoảng bao nhiêu và mặc cho môi trường công sở trang trọng hay năng động?"
    ].join("\n");
  }

  return [
    connectionNote,
    "",
    "Bạn vẫn có thể nhắn nhu cầu theo một trong các mẫu sau để mình hỗ trợ tiếp:",
    "- Gợi ý outfit theo dịp mặc, phong cách và ngân sách",
    "- Tư vấn size theo số đo",
    "- Tìm sản phẩm Velura theo màu/chất liệu",
    "- Tạo ticket hoặc gặp nhân viên CSKH",
    "",
    "Mình sẽ phản hồi theo hướng dễ hiểu và đúng phong cách Velura, không hiển thị lỗi kỹ thuật cho bạn nữa."
  ].join("\n");
}

function detectLocalIntent(message) {
  const text = normalizeVietnamese(message);
  if (/(cskh|cham soc khach hang|nhan vien|nguoi that|tu van vien|ticket|phieu ho tro|khieu nai|phan anh|hotline|ho tro truc tiep)/.test(text)) {
    return "support";
  }
  if (/(size|kich co|so do|chieu cao|can nang|vong eo|vong nguc|vong mong)/.test(text)) {
    return "size";
  }
  if (/(don hang|ma don|order|tracking|giao hang|van chuyen|doi tra|hoan tien|thanh toan)/.test(text)) {
    return "order";
  }
  if (/(outfit|phoi do|cong so|du tiec|di lam|di choi|vay|dam|ao|quan|blazer|phong cach)/.test(text)) {
    return "outfit";
  }
  return "general";
}

function normalizeVietnamese(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function isNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return !error?.status || message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
}

function getOrCreateGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!isUuid(guestId)) {
    guestId = crypto.randomUUID();
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

  const lines = html.split("\n");
  const processedLines = lines.map(line => {
    let trimmed = line.trim();
    if (/^-{3,}$/.test(trimmed)) {
      return '<hr style="border: 0; border-top: 1px dashed rgba(115,71,36,0.2); margin: 10px 0;">';
    }
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const fontSize = level === 1 ? "15.5px" : level === 2 ? "14.5px" : "13.5px";
      return `<h${level} style="margin: 8px 0 4px 0; color: #734724; font-size: ${fontSize}; font-weight: 600; font-family: inherit;">${title}</h${level}>`;
    }
    const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (listMatch) {
      const indent = listMatch[1] ? " margin-left: 14px;" : "";
      const content = listMatch[2];
      return `<span style="display: inline-block;${indent} margin-bottom: 2px;">&bull; ${content}</span>`;
    }
    return line;
  });

  html = processedLines.join("\n");
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
