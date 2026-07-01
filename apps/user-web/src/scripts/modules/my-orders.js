/**
 * Velura — My Orders Module
 */

export function initMyOrders() {
  const filterTabs = document.querySelectorAll(".order-tab");
  const orderCards = document.querySelectorAll(".order-card");
  const searchInput = document.getElementById("js-search-orders");
  
  // Intermediate Receipt Confirmation Modal Elements
  const receiptModal = document.getElementById("js-confirm-receipt-modal");
  const closeReceiptBtns = document.querySelectorAll(".js-close-confirm");
  const skipConfirmBtn = document.querySelector(".js-btn-skip-confirm");
  const goReviewBtn = document.querySelector(".js-btn-go-review");

  let activeConfirmOrderId = null;

  // 1. Initial State Check & Restore from SessionStorage
  function restoreOrderStates() {
    orderCards.forEach(card => {
      const orderId = card.getAttribute("data-order-id");
      const savedState = sessionStorage.getItem(`order_status_${orderId}`);
      if (savedState) {
        applyOrderState(card, orderId, savedState);
      }
    });
  }

  function applyOrderState(card, orderId, state) {
    const badge = card.querySelector(".order-card__status-badge");
    const actionsContainer = document.getElementById(`actions-${orderId}`);

    if (state === "delivered_not_reviewed") {
      // Update badge to Completed (Đã giao / Hoàn thành)
      card.setAttribute("data-status", "delivered");
      if (badge) {
        badge.className = "order-card__status-badge order-card__status-badge--delivered";
        badge.textContent = "Đã giao";
      }

      // Update action buttons to Show Review trigger
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <button class="btn btn--primary js-btn-review-trigger" type="button">Đánh giá &gt;</button>
          <a href="/src/pages/account/order-detail.html" class="btn btn--primary btn-detail-action">Chi tiết &gt;</a>
        `;
        // Rebind review click trigger
        const reviewBtn = actionsContainer.querySelector(".js-btn-review-trigger");
        if (reviewBtn) {
          reviewBtn.addEventListener("click", () => {
            window.location.href = `/src/pages/account/product-review.html?id=${orderId}`;
          });
        }
      }
    } else if (state === "reviewed") {
      // Update badge to Completed (Đã giao / Hoàn thành)
      card.setAttribute("data-status", "delivered");
      if (badge) {
        badge.className = "order-card__status-badge order-card__status-badge--delivered";
        badge.textContent = "Đã giao";
      }

      // Update action buttons to Disabled "Đã đánh giá"
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <button class="btn btn--outline" disabled type="button">Đã đánh giá</button>
          <a href="/src/pages/account/order-detail.html" class="btn btn--primary btn-detail-action">Chi tiết &gt;</a>
        `;
      }
    }
  }

  // 2. Open / Close Confirm Receipt Modal
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

  // 3. Confirm Delivery Action
  function setupDeliveryConfirmation() {
    const confirmBtns = document.querySelectorAll(".js-btn-confirm-delivery");
    confirmBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".order-card");
        if (card) {
          const orderId = card.getAttribute("data-order-id");
          openConfirmReceiptModal(orderId);
        }
      });
    });

    // Bind existing evaluation triggers to redirect directly
    const existingReviewBtns = document.querySelectorAll(".js-btn-review-trigger");
    existingReviewBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".order-card");
        if (card) {
          const orderId = card.getAttribute("data-order-id");
          window.location.href = `/src/pages/account/product-review.html?id=${orderId}`;
        }
      });
    });
  }

  // 4. Modal actions
  function setupPopupActions() {
    // Close / Dismiss
    closeReceiptBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        closeConfirmReceiptModal();
      });
    });

    // Skip (Bỏ qua) -> Mark as delivered_not_reviewed
    if (skipConfirmBtn) {
      skipConfirmBtn.addEventListener("click", () => {
        if (activeConfirmOrderId) {
          const card = document.querySelector(`.order-card[data-order-id="${activeConfirmOrderId}"]`);
          if (card) {
            sessionStorage.setItem(`order_status_${activeConfirmOrderId}`, "delivered_not_reviewed");
            applyOrderState(card, activeConfirmOrderId, "delivered_not_reviewed");
            createToast("Đã xác nhận nhận hàng thành công!");
          }
        }
        closeConfirmReceiptModal();
      });
    }

    // Go to Review -> Redirect
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

  // 5. Tabs dynamic filter & search query match
  function setupFiltering() {
    let currentTab = "all";
    let searchQuery = "";

    function filterOrders() {
      orderCards.forEach(card => {
        const orderId = card.getAttribute("data-order-id").toLowerCase();
        const orderStatus = card.getAttribute("data-status");

        const matchesTab = (currentTab === "all" || orderStatus === currentTab);
        const matchesSearch = (searchQuery === "" || orderId.includes(searchQuery));

        if (matchesTab && matchesSearch) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    }

    // Tabs filtering
    filterTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        filterTabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");

        currentTab = tab.getAttribute("data-tab");
        filterOrders();
      });
    });

    // Search query filtering
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.toLowerCase().trim();
        filterOrders();
      });
    }
  }

  // Helper function to create premium toast alerts
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

    // Fade-in
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 50);

    // Fade-out and clean
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Launch initial execution
  restoreOrderStates();
  setupDeliveryConfirmation();
  setupPopupActions();
  setupFiltering();
}
