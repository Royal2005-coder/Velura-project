import { apiRequest } from "./api.js";

export function initMyOrders() {
  const pageContainer = document.querySelector(".page-my-orders");
  if (!pageContainer) return;

  const orderListContainer = document.getElementById("js-order-list");
  const filterTabs = document.querySelectorAll(".order-tab");
  const searchInput = document.getElementById("js-search-orders");

  // Receipt Modal Elements
  const receiptModal = document.getElementById("js-confirm-receipt-modal");
  const closeReceiptBtns = document.querySelectorAll(".js-close-confirm");
  const skipConfirmBtn = document.querySelector(".js-btn-skip-confirm");
  const goReviewBtn = document.querySelector(".js-btn-go-review");

  let allOrders = [];
  let currentTab = "all";
  let searchQuery = "";
  let activeConfirmOrderId = null;

  // Load orders from API
  function loadOrders() {
    if (orderListContainer) {
      orderListContainer.innerHTML = `<div style="text-align: center; padding: 48px 0; color: var(--soft);">Đang tải danh sách đơn hàng...</div>`;
    }

    apiRequest("/api/user/orders")
      .then(data => {
        allOrders = data.orders || [];
        renderAndFilter();
      })
      .catch(err => {
        if (orderListContainer) {
          orderListContainer.innerHTML = `<div style="text-align: center; padding: 48px 0; color: #d9534f;">Không thể tải danh sách đơn hàng: ${err.message}</div>`;
        }
      });
  }

  function renderAndFilter() {
    if (!orderListContainer) return;

    // Filter list
    const filtered = allOrders.filter(order => {
      const orderId = order.order_id;
      const trackingCode = (order.tracking_code || order.order_id || "").toLowerCase();
      
      // Determine status (check sessionStorage override first)
      const localState = sessionStorage.getItem(`order_status_${orderId}`);
      let status = order.status;
      if (localState === "delivered_not_reviewed" || localState === "reviewed") {
        status = "delivered";
      }

      const matchesTab = (currentTab === "all" || status === currentTab);
      const matchesSearch = (searchQuery === "" || trackingCode.includes(searchQuery) || orderId.toLowerCase().includes(searchQuery));

      return matchesTab && matchesSearch;
    });

    if (filtered.length === 0) {
      orderListContainer.innerHTML = `
        <div style="text-align: center; padding: 64px 0; color: var(--soft);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; color: #A18265;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p style="margin: 0; font-size: 0.9375rem; font-weight: 500;">Không tìm thấy đơn hàng nào.</p>
        </div>
      `;
      return;
    }

    const statusLabels = {
      pending: "Chờ xác nhận",
      shipping: "Đang giao",
      delivered: "Hoàn thành",
      cancelled: "Đã hủy"
    };

    orderListContainer.innerHTML = filtered.map(order => {
      const orderId = order.order_id;
      const trackingCode = order.tracking_code || order.order_id.slice(0, 8).toUpperCase();
      const dateObj = new Date(order.created_at);
      const formattedDate = `Đặt ngày ${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} • ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

      // Check local state overrides
      const localState = sessionStorage.getItem(`order_status_${orderId}`);
      let status = order.status;
      if (localState === "delivered_not_reviewed" || localState === "reviewed") {
        status = "delivered";
      }

      const statusLabel = statusLabels[status] || status;

      // Format price
      const totalFormatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total_amount);

      // Products HTML
      const productsHtml = (order.items || []).map(item => `
        <div class="order-product-item">
          <img class="order-product-item__image" src="${item.product_image || '/src/assets/images/placeholder.jpg'}" alt="${item.product_name}" />
          <span class="order-product-item__name">${item.product_name} (x${item.quantity})</span>
        </div>
      `).join("");

      // Action buttons
      let actionsHtml = "";
      if (status === "shipping") {
        actionsHtml = `
          <button class="btn btn--success js-btn-confirm-delivery" data-id="${orderId}" type="button">Xác nhận giao thành công</button>
          <a href="/src/pages/account/order-detail.html?id=${orderId}" class="btn btn--primary btn-detail-action">Chi tiết &gt;</a>
        `;
      } else if (status === "delivered") {
        const isReviewed = localState === "reviewed" || sessionStorage.getItem(`order_reviewed_${orderId}`) === "true";
        actionsHtml = `
          ${isReviewed 
            ? `<button class="btn btn--outline" disabled type="button">Đã đánh giá</button>` 
            : `<button class="btn btn--primary js-btn-review-trigger" data-id="${orderId}" type="button">Đánh giá &gt;</button>`}
          <a href="/src/pages/account/return-request.html?orderId=${orderId}" class="btn btn--outline js-btn-return">Đổi/Trả</a>
          <a href="/src/pages/account/order-detail.html?id=${orderId}" class="btn btn--primary btn-detail-action">Chi tiết &gt;</a>
        `;
      } else {
        actionsHtml = `
          <a href="/src/pages/account/order-detail.html?id=${orderId}" class="btn btn--primary btn-detail-action">Chi tiết &gt;</a>
        `;
      }

      const itemCount = (order.items || []).reduce((acc, cur) => acc + cur.quantity, 0);

      return `
        <div class="order-card" data-order-id="${orderId}" data-status="${status}">
          <div class="order-card__header">
            <div class="order-card__header-left">
              <span class="order-card__id">#${trackingCode}</span>
              <span class="order-card__date">${formattedDate}</span>
            </div>
            <span class="order-card__status-badge order-card__status-badge--${status}">${statusLabel}</span>
          </div>

          <div class="order-card__products">
            ${productsHtml}
          </div>

          <div class="order-card__footer">
            <div class="order-card__footer-left">
              <span class="order-card__count">Tổng cộng (${itemCount} sản phẩm)</span>
              <span class="order-card__total">${totalFormatted}</span>
            </div>
            <div class="order-card__actions" id="actions-${orderId}">
              ${actionsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    bindCardActions();
  }

  function bindCardActions() {
    // 1. Confirm Delivery click
    const confirmBtns = orderListContainer.querySelectorAll(".js-btn-confirm-delivery");
    confirmBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const orderId = btn.getAttribute("data-id");
        openConfirmReceiptModal(orderId);
      });
    });

    // 2. Review trigger click
    const reviewBtns = orderListContainer.querySelectorAll(".js-btn-review-trigger");
    reviewBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const orderId = btn.getAttribute("data-id");
        window.location.href = `/src/pages/account/product-review.html?id=${orderId}`;
      });
    });
  }

  function openConfirmReceiptModal(orderId) {
    activeConfirmOrderId = orderId;
    if (receiptModal) {
      receiptModal.classList.add("is-visible");
    }
  }

  function closeConfirmReceiptModal() {
    if (receiptModal) {
      receiptModal.classList.remove("is-visible");
    }
    activeConfirmOrderId = null;
  }

  function setupPopupActions() {
    closeReceiptBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        closeConfirmReceiptModal();
      });
    });

    if (skipConfirmBtn) {
      skipConfirmBtn.addEventListener("click", () => {
        if (activeConfirmOrderId) {
          sessionStorage.setItem(`order_status_${activeConfirmOrderId}`, "delivered_not_reviewed");
          renderAndFilter();
          createToast("Đã xác nhận nhận hàng thành công!");
        }
        closeConfirmReceiptModal();
      });
    }

    if (goReviewBtn) {
      goReviewBtn.addEventListener("click", () => {
        if (activeConfirmOrderId) {
          const orderId = activeConfirmOrderId;
          closeConfirmReceiptModal();
          window.location.href = `/src/pages/account/product-review.html?id=${orderId}`;
        }
      });
    }
  }

  function setupFiltering() {
    // Tabs filtering
    filterTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        filterTabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");

        currentTab = tab.getAttribute("data-tab");
        renderAndFilter();
      });
    });

    // Search query filtering
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.toLowerCase().trim();
        renderAndFilter();
      });
    }
  }

  function createToast(message) {
    const existing = document.querySelector(".velura-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "velura-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: #734724;
      color: #fff;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Load live orders on init
  loadOrders();
  setupPopupActions();
  setupFiltering();
}
