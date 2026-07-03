import { apiRequest } from "./api.js";

export function initTrackOrder() {
  const container = document.querySelector(".track-order-page");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  // DOM elements
  const searchInput = document.getElementById("js-track-search-input");
  const searchBtn = document.getElementById("js-track-search-btn");
  const trackCodeEl = document.getElementById("js-track-code");
  const trackStatusEl = document.getElementById("js-track-status");
  const timelineEl = document.getElementById("js-track-timeline");
  const etaCard = document.getElementById("js-track-eta-card");
  const etaDateEl = document.getElementById("js-track-eta-date");
  const shipperCard = document.getElementById("js-track-shipper-card");
  const shipperAvatarEl = document.getElementById("js-track-shipper-avatar");
  const shipperNameEl = document.getElementById("js-track-shipper-name");
  const shipperPhoneEl = document.getElementById("js-track-shipper-phone");
  const shipperPlateEl = document.getElementById("js-track-shipper-plate");
  const recipientNameEl = document.getElementById("js-track-recipient");
  const addressTextEl = document.getElementById("js-track-address");
  const phoneEl = document.getElementById("js-track-phone");

  // Setup search input initial value
  if (orderId && searchInput) {
    searchInput.value = orderId;
  }

  // Load initial order if provided in URL
  if (orderId) {
    fetchOrderTracking(orderId);
  }

  // Add Event Listeners
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }

  function handleSearch() {
    const val = searchInput.value.trim();
    if (!val) {
      alert("Vui lòng nhập mã đơn hàng hoặc mã vận đơn.");
      return;
    }
    // Clean code formatting (like prefix #)
    const cleaned = val.replace("#", "");
    
    // First try fetching directly by ID
    container.style.opacity = "0.5";
    apiRequest(`/api/user/orders/${cleaned}`)
      .then(order => {
        container.style.opacity = "1";
        renderTracking(order);
      })
      .catch(() => {
        apiRequest("/api/user/orders")
          .then(res => {
            container.style.opacity = "1";
            const orders = Array.isArray(res) ? res : (res.orders || []);
            const match = orders.find(o => 
              o.order_id === cleaned || 
              o.tracking_code === cleaned ||
              (o.tracking_code && o.tracking_code.toLowerCase() === cleaned.toLowerCase())
            );
            if (match) {
              // Fetch full detail for the matched order
              fetchOrderTracking(match.order_id);
            } else {
              showError("Không tìm thấy đơn hàng tương ứng với mã tra cứu.");
            }
          })
          .catch(err => {
            container.style.opacity = "1";
            showError(`Không thể tra cứu: ${err.message}`);
          });
      });
  }

  function fetchOrderTracking(id) {
    container.style.opacity = "0.5";
    apiRequest(`/api/user/orders/${id}`)
      .then(order => {
        container.style.opacity = "1";
        renderTracking(order);
      })
      .catch(err => {
        container.style.opacity = "1";
        showError(`Lỗi tải hành trình đơn hàng: ${err.message}`);
      });
  }

  function renderTracking(order) {
    // 1. Set codes and status
    const trackingCode = order.tracking_code || order.order_id.slice(0, 8).toUpperCase();
    if (trackCodeEl) trackCodeEl.textContent = `#${trackingCode}`;
    
    const statusLabels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      preparing: "Đang đóng gói",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      completed: "Hoàn thành",
      cancelled: "Đã hủy"
    };

    const statusText = statusLabels[order.status] || order.status;
    if (trackStatusEl) {
      trackStatusEl.textContent = statusText;
      trackStatusEl.className = `track-status-badge track-status-badge--${order.status}`;
    }

    // 2. Render Timeline Steps dynamically
    renderTimeline(order);

    // 3. ETA Card Info
    if (etaCard) {
      if (order.status === "cancelled" || order.status === "delivered" || order.status === "completed") {
        etaCard.style.display = "none";
      } else {
        etaCard.style.display = "block";
        if (etaDateEl) {
          const eta = new Date(order.created_at);
          eta.setDate(eta.getDate() + 3); // Expected delivery in 3 days
          etaDateEl.textContent = `${eta.getDate().toString().padStart(2, '0')}/${(eta.getMonth() + 1).toString().padStart(2, '0')}/${eta.getFullYear()}`;
        }
      }
    }

    // 4. Shipper Details
    if (shipperCard) {
      if (order.status === "shipping") {
        shipperCard.style.display = "block";
        const shipperName = order.shipper_name || "Trần Văn Hùng";
        const shipperPhone = order.shipper_phone || "0905 678 234";
        const shipperPlate = order.shipper_plate || "59-K1 234.56";

        if (shipperNameEl) shipperNameEl.textContent = shipperName;
        if (shipperPhoneEl) shipperPhoneEl.textContent = shipperPhone;
        if (shipperPlateEl) shipperPlateEl.textContent = shipperPlate;
        if (shipperAvatarEl) {
          shipperAvatarEl.textContent = shipperName.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
        }
      } else {
        shipperCard.style.display = "none";
      }
    }

    // 5. Recipient Details
    if (recipientNameEl) recipientNameEl.textContent = order.shipping_name || "Chưa cập nhật";
    if (addressTextEl) addressTextEl.textContent = order.shipping_address || "Chưa cập nhật";
    if (phoneEl) phoneEl.textContent = order.shipping_phone || "Chưa cập nhật";
  }

  function renderTimeline(order) {
    if (!timelineEl) return;
    timelineEl.innerHTML = "";

    const dateObj = new Date(order.created_at);
    const formatDate = (daysToAdd, hour, min) => {
      const d = new Date(dateObj);
      d.setDate(d.getDate() + daysToAdd);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} • ${hour}:${min}`;
    };

    const steps = [
      { key: "placed", title: "Đã đặt hàng", desc: "Velura Online Store", time: formatDate(0, "10", "32") },
      { key: "confirmed", title: "Đã xác nhận", desc: "Trung tâm xử lý đơn hàng - TP.HCM", time: formatDate(0, "11", "05") },
      { key: "preparing", title: "Đang đóng gói", desc: "Kho Velura - Quận 7, TP.HCM", time: formatDate(0, "15", "48") },
      { key: "shipping", title: "Đang giao hàng", desc: "Bưu cục Quận 1 - Đang trên đường giao", time: formatDate(1, "08", "20") },
      { key: "delivered", title: "Đã giao thành công", desc: order.shipping_address || "Địa chỉ nhận hàng", time: formatDate(2, "14", "15") }
    ];

    if (order.status === "cancelled") {
      timelineEl.innerHTML = `
        <div class="track-step track-step--completed">
          <div class="track-step__marker">
            <span class="track-step__dot">×</span>
          </div>
          <div class="track-step__content">
            <h3 class="track-step__title" style="color: #d9534f;">Đơn hàng đã bị hủy</h3>
            <time class="track-step__time">${formatDate(0, "10", "32")}</time>
            <p class="track-step__desc">Lý do: ${order.cancelled_reason || "Khách hàng yêu cầu hủy"}</p>
          </div>
        </div>
      `;
      return;
    }

    const statusOrder = ["pending", "confirmed", "preparing", "shipping", "delivered", "completed"];
    const currentIdx = statusOrder.indexOf(order.status === "completed" ? "delivered" : order.status);

    steps.forEach((step, idx) => {
      let stateClass = "track-step--pending";
      let isCompleted = false;

      if (idx < currentIdx) {
        stateClass = "track-step--completed";
        isCompleted = true;
      } else if (idx === currentIdx) {
        stateClass = "track-step--active";
      }

      const stepDiv = document.createElement("div");
      stepDiv.className = `track-step ${stateClass}`;
      
      let markerContent = `<span class="track-step__dot"></span>`;
      if (isCompleted) {
        markerContent = `
          <span class="track-step__dot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        `;
      } else if (idx === currentIdx) {
        // Icon for active step (a small truck or checkmark depending on stage)
        markerContent = `
          <span class="track-step__dot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        `;
      }

      stepDiv.innerHTML = `
        <div class="track-step__marker">
          ${markerContent}
          ${idx < steps.length - 1 ? '<span class="track-step__line"></span>' : ''}
        </div>
        <div class="track-step__content">
          <h3 class="track-step__title">${step.title}</h3>
          <time class="track-step__time">${idx <= currentIdx ? step.time : "Dự kiến"}</time>
          <p class="track-step__desc">${step.desc}</p>
        </div>
      `;
      timelineEl.appendChild(stepDiv);
    });
  }

  function showError(msg) {
    alert(msg);
  }
}
