import { apiRequest } from "./api.js";

export function initOrderDetail() {
  const container = document.querySelector(".order-detail-page");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  if (!orderId) {
    showError("Không tìm thấy mã đơn hàng trong URL.");
    return;
  }

  // DOM Elements
  const orderCodeEl = document.getElementById("js-order-code");
  const orderDateEl = document.getElementById("js-order-date");
  const orderStatusEl = document.getElementById("js-order-status");
  const trackingCodeEl = document.getElementById("js-tracking-code");
  const trackBtnEl = document.getElementById("js-track-btn");
  const timelineEl = document.getElementById("js-detail-timeline");
  const productsCountEl = document.getElementById("js-products-count");
  const productsListEl = document.getElementById("js-products-list");
  const shippingNameEl = document.getElementById("js-shipping-name");
  const shippingPhoneEl = document.getElementById("js-shipping-phone");
  const shippingAddressEl = document.getElementById("js-shipping-address");
  const paymentMethodEl = document.getElementById("js-payment-method");
  const subtotalEl = document.getElementById("js-subtotal");
  const shippingFeeEl = document.getElementById("js-shipping-fee");
  const discountEl = document.getElementById("js-discount");
  const totalAmountEl = document.getElementById("js-total-amount");
  const actionCardEl = document.getElementById("js-action-card");

  function loadOrderDetail() {
    container.style.opacity = "0.5";
    
    apiRequest(`/api/user/orders/${orderId}`)
      .then(order => {
        container.style.opacity = "1";
        renderOrder(order);
      })
      .catch(err => {
        container.style.opacity = "1";
        showError(`Không thể tải chi tiết đơn hàng: ${err.message}`);
      });
  }

  function renderOrder(order) {
    const trackingCode = order.tracking_code || order.order_id.slice(0, 8).toUpperCase();
    const dateObj = new Date(order.created_at);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    // 1. Header Info
    if (orderCodeEl) orderCodeEl.textContent = trackingCode;
    if (orderDateEl) orderDateEl.textContent = `Ngày đặt: ${formattedDate}`;

    // Status Label mapping
    const statusLabels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      preparing: "Đang chuẩn bị",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy"
    };

    const statusText = statusLabels[order.status] || order.status;
    if (orderStatusEl) {
      orderStatusEl.textContent = statusText;
      orderStatusEl.className = `detail-status-badge detail-status-badge--${order.status}`;
    }

    // Tracking
    if (trackingCodeEl) trackingCodeEl.textContent = order.tracking_code || "Chưa có";
    if (trackBtnEl) {
      trackBtnEl.href = `./track-order.html?id=${order.order_id}`;
      if (order.status === "pending" || order.status === "cancelled") {
        trackBtnEl.style.display = "none";
      } else {
        trackBtnEl.style.display = "inline-flex";
      }
    }

    // 2. Render Timeline
    renderTimeline(order);

    // 3. Products List
    const items = order.items || [];
    if (productsCountEl) productsCountEl.textContent = `Sản phẩm (${items.length})`;
    if (productsListEl) {
      productsListEl.innerHTML = "";
      items.forEach(item => {
        const itemPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unit_price);
        const itemDiv = document.createElement("div");
        itemDiv.className = "detail-product-item";
        itemDiv.innerHTML = `
          <div class="detail-product-img">
            <img src="${item.product_image || '../../assets/images/product-silk-blazer.png'}" alt="${item.product_name}" />
          </div>
          <div class="detail-product-info">
            <h3 class="detail-product-name">${item.product_name}</h3>
            <div class="detail-product-meta">Số lượng: x${item.quantity}</div>
            <div class="detail-product-price">${itemPrice}</div>
          </div>
        `;
        productsListEl.appendChild(itemDiv);
      });
    }

    // 4. Shipping Info
    if (shippingNameEl) shippingNameEl.textContent = order.shipping_name || "Chưa cập nhật";
    if (shippingPhoneEl) shippingPhoneEl.textContent = order.shipping_phone || "Chưa cập nhật";
    if (shippingAddressEl) shippingAddressEl.textContent = order.shipping_address || "Chưa cập nhật";

    // 5. Billing & Total
    if (paymentMethodEl) paymentMethodEl.innerHTML = `Phương thức: <span class="text-bold">${order.payment_method}</span>`;
    
    const subtotalVal = order.subtotal || 0;
    const shippingVal = order.shipping_fee || 0;
    const discountVal = order.discount_amount || 0;
    const totalVal = order.total_amount || 0;

    const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
    if (subtotalEl) subtotalEl.textContent = formatter.format(subtotalVal);
    if (shippingFeeEl) shippingFeeEl.textContent = formatter.format(shippingVal);
    if (discountEl) discountEl.textContent = `-${formatter.format(discountVal)}`;
    if (totalAmountEl) totalAmountEl.textContent = formatter.format(totalVal);

    // 6. Actions Card
    renderActions(order);
  }

  function renderTimeline(order) {
    if (!timelineEl) return;
    timelineEl.innerHTML = "";

    const steps = [
      { key: "placed", title: "Đặt hàng thành công", desc: "Đơn hàng đã được ghi nhận trên hệ thống." },
      { key: "confirmed", title: "Đã xác nhận", desc: "Velura đã xác nhận thông tin đơn hàng." },
      { key: "preparing", title: "Đang chuẩn bị hàng", desc: "Sản phẩm đang được đóng gói tại kho." },
      { key: "shipping", title: "Đang giao hàng", desc: "Đơn hàng đã bàn giao cho đơn vị vận chuyển." },
      { key: "delivered", title: "Đã giao hàng", desc: "Giao hàng thành công." }
    ];

    // Determine current status index
    const statusOrder = ["pending", "confirmed", "preparing", "shipping", "delivered", "completed"];
    const currentIdx = statusOrder.indexOf(order.status === "completed" ? "delivered" : order.status);

    if (order.status === "cancelled") {
      timelineEl.innerHTML = `
        <div class="detail-timeline-item detail-timeline-item--completed">
          <div class="detail-timeline-marker">
            <span class="detail-timeline-dot" style="background-color: var(--soft);">×</span>
          </div>
          <div class="detail-timeline-content">
            <h3 class="detail-timeline-title">Đơn hàng đã hủy</h3>
            <p style="color: var(--soft); font-size: 0.8125rem; margin-top: 4px;">Lý do: ${order.cancelled_reason || "Hủy bởi khách hàng"}</p>
          </div>
        </div>
      `;
      return;
    }

    steps.forEach((step, idx) => {
      let stateClass = "detail-timeline-item--pending";
      let isCompleted = false;

      if (idx < currentIdx) {
        stateClass = "detail-timeline-item--completed";
        isCompleted = true;
      } else if (idx === currentIdx) {
        stateClass = "detail-timeline-item--active";
      }

      const timelineItem = document.createElement("div");
      timelineItem.className = `detail-timeline-item ${stateClass}`;
      timelineItem.innerHTML = `
        <div class="detail-timeline-marker">
          <span class="detail-timeline-dot">
            ${isCompleted ? `
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ` : ""}
          </span>
          ${idx < steps.length - 1 ? '<span class="detail-timeline-line"></span>' : ''}
        </div>
        <div class="detail-timeline-content">
          <h3 class="detail-timeline-title">${step.title}</h3>
          <p style="color: var(--soft); font-size: 0.8125rem; margin-top: 2px;">${step.desc}</p>
        </div>
      `;
      timelineEl.appendChild(timelineItem);
    });
  }

  function renderActions(order) {
    if (!actionCardEl) return;
    actionCardEl.innerHTML = `<h3 class="detail-action-title">Hành động</h3>`;

    if (order.status === "pending") {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn--outline btn-cancel-order";
      cancelBtn.textContent = "Hủy đơn hàng";
      cancelBtn.style.cssText = "width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid var(--border); background: transparent; cursor: pointer; border-radius: 4px; font-weight: 500;";
      cancelBtn.addEventListener("click", () => handleCancelOrder(order.order_id));
      actionCardEl.appendChild(cancelBtn);
    } else if (order.status === "shipping") {
      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "btn btn--primary btn-confirm-delivery";
      confirmBtn.textContent = "Xác nhận đã nhận hàng";
      confirmBtn.style.cssText = "width: 100%; padding: 12px; margin-bottom: 12px; background: var(--terracotta); color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: 500;";
      confirmBtn.addEventListener("click", () => handleConfirmDelivery(order.order_id));
      actionCardEl.appendChild(confirmBtn);
    } else if (order.status === "delivered" || order.status === "completed") {
      const reviewBtn = document.createElement("button");
      reviewBtn.type = "button";
      reviewBtn.className = "btn btn--primary btn-review-order";
      reviewBtn.textContent = "Viết đánh giá sản phẩm";
      reviewBtn.style.cssText = "width: 100%; padding: 12px; margin-bottom: 12px; background: var(--terracotta); color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: 500;";
      reviewBtn.addEventListener("click", () => {
        window.location.href = `/src/pages/account/product-review.html?id=${order.order_id}`;
      });
      actionCardEl.appendChild(reviewBtn);

      const returnBtn = document.createElement("button");
      returnBtn.type = "button";
      returnBtn.className = "btn btn--outline btn-return-order";
      returnBtn.textContent = "Yêu cầu Đổi/Trả hàng";
      returnBtn.style.cssText = "width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid var(--border); background: transparent; cursor: pointer; border-radius: 4px; font-weight: 500;";
      returnBtn.addEventListener("click", () => {
        window.location.href = `/src/pages/account/return-request.html?orderId=${order.order_id}`;
      });
      actionCardEl.appendChild(returnBtn);
    }

    const supportBtn = document.createElement("button");
    supportBtn.type = "button";
    supportBtn.className = "detail-support-btn";
    supportBtn.textContent = "Liên hệ hỗ trợ";
    supportBtn.addEventListener("click", () => {
      alert("Cảm ơn bạn. Bộ phận CSKH Velura sẽ liên hệ với bạn qua số điện thoại đăng ký.");
    });
    actionCardEl.appendChild(supportBtn);
  }

  function handleCancelOrder(id) {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    apiRequest(`/api/user/orders`, { method: "PATCH", body: { order_id: id, status: "cancelled" } })
      .then(() => {
        alert("Hủy đơn hàng thành công!");
        loadOrderDetail();
      })
      .catch(err => {
        alert(`Không thể hủy đơn hàng: ${err.message}`);
      });
  }

  function handleConfirmDelivery(id) {
    if (!confirm("Bạn xác nhận đã nhận đầy đủ sản phẩm và muốn hoàn thành đơn hàng?")) return;

    apiRequest(`/api/user/orders`, { method: "PATCH", body: { order_id: id, status: "delivered" } })
      .then(() => {
        alert("Xác nhận đã nhận hàng thành công!");
        loadOrderDetail();
      })
      .catch(err => {
        alert(`Không thể xác nhận nhận hàng: ${err.message}`);
      });
  }

  function showError(msg) {
    if (productsListEl) {
      productsListEl.innerHTML = `<div style="padding: 24px 0; color: #d9534f; text-align: center;">Lỗi: ${msg}</div>`;
    }
  }

  loadOrderDetail();
}
