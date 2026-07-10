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
  let userReviews = [];
  let userReturns = [];
  let currentTab = "all";
  let searchQuery = "";
  let activeConfirmOrderId = null;

  // Load orders, reviews, and returns from API
  function loadOrders() {
    if (orderListContainer) {
      orderListContainer.innerHTML = `<div style="text-align: center; padding: 48px 0; color: var(--soft);">Đang tải danh sách đơn hàng...</div>`;
    }

    Promise.all([
      apiRequest("/api/user/reviews").catch(() => ({ reviews: [] })),
      apiRequest("/api/user/orders").catch(() => ({ orders: [] })),
      apiRequest("/api/user/returns").catch(() => ({ returns: [] }))
    ]).then(([reviewData, orderData, returnData]) => {
      userReviews = reviewData.reviews || [];
      allOrders = orderData.orders || [];
      userReturns = returnData.returns || [];

      if (allOrders.length === 0 && !orderData.orders) {
        if (orderListContainer) {
          orderListContainer.innerHTML = `<div style="text-align: center; padding: 48px 0; color: #d9534f;">Không thể tải danh sách đơn hàng.</div>`;
        }
        return;
      }

      renderNotifications();
      renderAndFilter();
    });
  }

  // Render notification banners for rejected reviews
  function renderNotifications() {
    const container = document.getElementById("js-notifications-container");
    if (!container) return;

    const rejectedReviews = userReviews.filter(r => r.status === "rejected");
    if (rejectedReviews.length === 0) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    rejectedReviews.forEach(review => {
      const order = allOrders.find(o => o.order_id === review.order_id);
      const trackingCode = order ? (order.tracking_code || order.order_id.slice(0, 8).toUpperCase()) : "N/A";
      
      html += `
        <div class="review-notification-banner" style="
          background-color: #FFF2F2;
          border: 1px solid #FFCCD2;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(220, 53, 69, 0.08);
        ">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 1.25rem; margin-top: -2px;">⚠️</span>
            <div>
              <h4 style="margin: 0 0 4px; font-size: 0.9375rem; color: #DC3545; font-weight: 600;">Đánh giá bị từ chối kiểm duyệt</h4>
              <p style="margin: 0; font-size: 0.875rem; color: #555; line-height: 1.4;">
                Đánh giá của bạn cho đơn hàng <strong>#${trackingCode}</strong> không đạt tiêu chuẩn kiểm duyệt.
                <br>Lý do: <span style="color: #DC3545; font-weight: 500;">${review.rejection_reason || "Nội dung hoặc hình ảnh không phù hợp"}</span>.
              </p>
            </div>
          </div>
          <button class="btn btn--primary js-btn-re-review" data-order-id="${review.order_id}" style="
            background-color: #DC3545;
            border-color: #DC3545;
            color: #fff;
            padding: 8px 16px;
            font-size: 0.8125rem;
            white-space: nowrap;
            border-radius: 6px;
            cursor: pointer;
          ">Đánh giá lại</button>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll(".js-btn-re-review").forEach(btn => {
      btn.addEventListener("click", () => {
        const oId = btn.getAttribute("data-order-id");
        window.location.href = `/src/pages/account/product-review.html?id=${oId}`;
      });
    });
  }

  function getTabForStatus(status) {
    if (["pending", "confirmed", "preparing"].includes(status)) {
      return "pending";
    }
    if (status === "shipping") {
      return "shipping";
    }
    if (["delivered", "completed"].includes(status)) {
      return "delivered";
    }
    if (["cancelled", "failed_delivery"].includes(status)) {
      return "cancelled";
    }
    return "all";
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

      const tabForStatus = getTabForStatus(status);
      const matchesTab = (currentTab === "all" || tabForStatus === currentTab);
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
      confirmed: "Đã xác nhận",
      preparing: "Đang đóng gói",
      shipping: "Đang giao",
      delivered: "Đã giao hàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      failed_delivery: "Giao thất bại"
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

      // Determine CSS class for status badge
      let badgeClass = status;
      if (["pending", "confirmed", "preparing"].includes(status)) {
        badgeClass = "pending";
      } else if (["delivered", "completed"].includes(status)) {
        badgeClass = "delivered";
      } else if (status === "failed_delivery") {
        badgeClass = "cancelled";
      }

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
      } else if (status === "delivered" || status === "completed") {
        // Check if there is an existing review for this order
        const orderReview = userReviews.find(r => r.order_id === orderId);
        
        let reviewBtnHtml = "";
        if (orderReview) {
          if (orderReview.status === "rejected") {
            reviewBtnHtml = `<button class="btn js-btn-review-trigger" data-id="${orderId}" type="button" style="background-color: #DC3545; border-color: #DC3545; color: #fff;">Đánh giá lại &gt;</button>`;
          } else if (orderReview.status === "pending") {
            reviewBtnHtml = `<button class="btn btn--outline" disabled type="button">Đang duyệt...</button>`;
          } else {
            reviewBtnHtml = `<button class="btn btn--outline" disabled type="button">Đã đánh giá</button>`;
          }
        } else {
          reviewBtnHtml = `<button class="btn btn--primary js-btn-review-trigger" data-id="${orderId}" type="button">Đánh giá &gt;</button>`;
        }

        // Check if there is an existing return for this order
        const orderReturn = userReturns.find(r => r.order_id === orderId);
        let returnBtnHtml = "";
        if (orderReturn) {
          returnBtnHtml = `<a href="/src/pages/account/order-detail.html?id=${orderId}" class="btn btn--outline js-btn-return">Theo dõi Đổi/Trả</a>`;
        } else {
          const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at || order.created_at);
          const now = new Date();
          const diffMs = now - deliveryDate;
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours <= 48) {
            returnBtnHtml = `<a href="/src/pages/account/return-request.html?orderId=${orderId}" class="btn btn--primary js-btn-return">Đổi/Trả</a>`;
          }
        }

        actionsHtml = `
          ${reviewBtnHtml}
          ${returnBtnHtml}
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
            <span class="order-card__status-badge order-card__status-badge--${badgeClass}">${statusLabel}</span>
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
      skipConfirmBtn.addEventListener("click", async () => {
        if (activeConfirmOrderId) {
          try {
            await apiRequest("/api/user/orders", { method: "PATCH", body: JSON.stringify({ order_id: activeConfirmOrderId, status: "delivered" }) });
            sessionStorage.setItem(`order_status_${activeConfirmOrderId}`, "delivered_not_reviewed");
            createToast("Đã xác nhận nhận hàng thành công!");
            loadOrders();
          } catch (err) {
            createToast("Lỗi: " + err.message);
          }
        }
        closeConfirmReceiptModal();
      });
    }

    if (goReviewBtn) {
      goReviewBtn.addEventListener("click", async () => {
        if (activeConfirmOrderId) {
          const orderId = activeConfirmOrderId;
          try {
            await apiRequest("/api/user/orders", { method: "PATCH", body: JSON.stringify({ order_id: orderId, status: "delivered" }) });
            sessionStorage.setItem(`order_status_${orderId}`, "delivered_not_reviewed");
            closeConfirmReceiptModal();
            window.location.href = `/src/pages/account/product-review.html?id=${orderId}`;
          } catch (err) {
            createToast("Lỗi: " + err.message);
            closeConfirmReceiptModal();
          }
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
