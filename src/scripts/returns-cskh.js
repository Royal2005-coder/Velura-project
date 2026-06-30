import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  const icon = (name) => `<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#${name}"></use></svg>`;

  let returns = db.getReturns();
  let tickets = db.getTickets();

  /* ── 48-hour deadline enforcement ── */
  function autoExpireReturns() {
    const now = Date.now();
    let changed = false;
    returns.forEach((r) => {
      if (r.status !== "Chờ xử lý" && r.status !== "Đang xử lý") return;
      const created = new Date(r.createdAt).getTime();
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      if (hoursElapsed > 48) {
        r.status = "Hết hạn";
        r.action = "Tự động từ chối";
        r.version++;
        changed = true;
        db.addLog("Hệ thống", "SYS", "system", "auto", "Đổi trả", "auto-expire", "Tự động hết hạn", r.id, r.customer, "success", "warning", `Yêu cầu ${r.id} đã hết hạn 48h`, null, null);
        db.queueEmail(r.contact, `Yêu cầu ${r.id} đã hết hạn`, `Yêu cầu đổi/trả ${r.id} của bạn đã vượt quá thời hạn 48 giờ và bị từ chối tự động.`);
      }
    });
    if (changed) db.saveReturns(returns);
  }

  /* ── Deadline helpers ── */
  function computeDeadlineHours(createdAt) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.round(48 - (now - created) / (1000 * 60 * 60)));
  }

  function deadlineText(createdAt) {
    const hours = computeDeadlineHours(createdAt);
    if (hours <= 0) return "Hết hạn";
    if (hours < 24) return `Còn ${hours} giờ`;
    return `Còn ${Math.round(hours / 24)} ngày`;
  }

  /* ── Badge helpers ── */
  const badge = (text, kind = "neutral") => `<span class="admin-badge admin-badge--${kind}">${text}</span>`;
  const statusKind = (text) => {
    if (text.includes("Còn") || text === "Cao" || text.includes("Đang")) return "warning";
    if (text.includes("Chờ") || text === "Mới") return "pending";
    if (text.includes("Đã") || text === "Hết hạn") return text === "Hết hạn" ? "danger" : "success";
    return "neutral";
  };
  const deadlineKind = (hours) => {
    if (hours <= 8) return "danger";
    if (hours <= 24) return "warning";
    return "pending";
  };
  const supportPriorityKind = (text) => ({
    "Cao": "danger",
    "Trung bình": "warning",
    "Thấp": "neutral"
  }[text] || "neutral");
  const supportStatusKind = (text) => {
    if (text === "Mới") return "pending";
    if (text === "Đang xử lý" || text === "Chuyển bộ phận") return "warning";
    if (text === "Đã giải quyết") return "success";
    if (text === "Đã phản hồi") return "review-replied";
    return "neutral";
  };
  const csatKind = (text) => {
    if (text === "Đã gửi") return "success";
    if (text === "Chờ gửi") return "pending";
    return "neutral";
  };

  /* ── Row renderers ── */
  const account = (name, detail) => `<div class="admin-order-customer"><strong>${name}</strong><small>${detail}</small></div>`;
  const requestCode = (id, date, order) => `<div class="admin-order-customer"><strong>${id}</strong><small>${order} · ${date}</small></div>`;
  const actionButtons = (id, type) => `<div class="admin-table-actions"><button class="admin-icon-button admin-icon-button--sm" type="button" title="Xem chi tiết" data-detail="${type}:${id}">${icon("eye")}</button><div class="admin-action-menu"><button class="admin-icon-button admin-icon-button--sm" type="button" title="Thao tác ${type === "returns" ? "đổi trả" : "CSKH"}" data-menu="${type}:${id}">${icon("edit")}</button><div class="admin-dropdown admin-table-action-menu" hidden id="menu-${type}-${id}">${menuItems(id, type)}</div></div></div>`;
  const menuItems = (id, type) => type === "returns"
    ? `<button type="button" data-detail="returns:${id}">${icon("eye")}<span>Xem chi tiết</span></button><button type="button" data-modal="refund:${id}">${icon("credit-card")}<span>Xác nhận hoàn tiền</span></button><button type="button" data-modal="exchange:${id}">${icon("box")}<span>Tạo đơn đổi hàng</span></button><button type="button" data-log="${id}">${icon("log")}<span>Xem nhật ký</span></button><button class="admin-table-action-menu__danger" type="button" data-modal="reject:${id}">${icon("lock")}<span>Từ chối yêu cầu</span></button>`
    : `<button type="button" data-detail="support:${id}">${icon("eye")}<span>Xem chi tiết</span></button><button type="button" data-modal="reply:${id}">${icon("edit")}<span>Phản hồi khách hàng</span></button><button type="button" data-modal="forward:${id}">${icon("support")}<span>Chuyển tiếp bộ phận</span></button><button type="button" data-log="${id}">${icon("log")}<span>Xem nhật ký</span></button><button class="admin-table-action-menu__danger" type="button" data-modal="close:${id}">${icon("lock")}<span>Đóng phiếu</span></button>`;

  /* ── Table rendering ── */
  function renderRows() {
    document.querySelector("#returns-body").innerHTML = returns.map((r) =>
      `<tr>
        <td>${requestCode(r.id, r.createdAt, r.orderId)}</td>
        <td>${badge(r.type)}</td>
        <td>${badge(deadlineText(r.createdAt), deadlineKind(computeDeadlineHours(r.createdAt)))}</td>
        <td>${badge(r.status, statusKind(r.status))}</td>
        <td>${r.action}</td>
        <td>${actionButtons(r.id, "returns")}</td>
      </tr>`
    ).join("");
    document.querySelector("#support-body").innerHTML = tickets.map((t) =>
      `<tr>
        <td>${account(t.id, t.createdAt)}</td>
        <td>${account(t.customer, t.contact)}</td>
        <td>${badge(t.type, "neutral")}</td>
        <td>${t.content}</td>
        <td>${badge(t.priority, supportPriorityKind(t.priority))}</td>
        <td>${badge(t.status, supportStatusKind(t.status))}</td>
        <td>${badge(t.csat, csatKind(t.csat))}</td>
        <td>${actionButtons(t.id, "support")}</td>
      </tr>`
    ).join("");
  }

  /* ── Finders ── */
  function findRecord(type, id) {
    const data = type === "returns" ? returns : tickets;
    return data.find((r) => r.id === id);
  }

  /* ── Drawer content ── */
  function drawerBody(type, row, tab) {
    const isReturn = type === "returns";
    if (tab === "overview") {
      const fields = isReturn
        ? `<div><dt>Đơn hàng</dt><dd>${row.orderId}</dd></div><div><dt>Khách hàng</dt><dd>${row.customer}</dd></div><div><dt>Liên hệ</dt><dd>${row.contact}</dd></div><div><dt>Loại yêu cầu</dt><dd>${row.type}</dd></div><div><dt>Sản phẩm</dt><dd>${row.product}</dd></div><div><dt>Thời hạn xử lý</dt><dd>${deadlineText(row.createdAt)}</dd></div>`
        : `<div><dt>Khách hàng</dt><dd>${row.customer}</dd></div><div><dt>Liên hệ</dt><dd>${row.contact}</dd></div><div><dt>Loại hỗ trợ</dt><dd>${row.type}</dd></div><div><dt>Ưu tiên</dt><dd>${row.priority}</dd></div><div><dt>Trạng thái</dt><dd>${row.status}</dd></div><div><dt>CSAT</dt><dd>${row.csat}</dd></div>`;
      const summary = isReturn
        ? `<h3 class="admin-drawer__section">Sản phẩm & minh chứng</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Khách đã gửi yêu cầu đổi/trả sản phẩm.</strong><p>Ảnh sản phẩm và lý do yêu cầu được lưu kèm phiếu.</p></div></div><h3 class="admin-drawer__section">Hành động nhanh</h3><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" data-modal="refund:${row.id}">Hoàn tiền</button><button class="admin-btn admin-btn--outline admin-btn--sm" data-modal="exchange:${row.id}">Tạo đơn đổi</button><button class="admin-btn admin-btn--danger admin-btn--sm" data-modal="reject:${row.id}">Từ chối</button></div>`
        : `<h3 class="admin-drawer__section">Lịch sử trao đổi gần đây</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Khách hàng</strong><p>${row.content}</p></div></div><h3 class="admin-drawer__section">Hành động nhanh</h3><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" data-modal="reply:${row.id}">Phản hồi</button><button class="admin-btn admin-btn--outline admin-btn--sm" data-modal="forward:${row.id}">Chuyển tiếp</button><button class="admin-btn admin-btn--filter admin-btn--sm" data-modal="close:${row.id}">Đóng phiếu</button></div>`;
      return `<h3 class="admin-drawer__section">Thông tin cơ bản</h3><dl class="admin-data-list">${fields}</dl>${summary}`;
    }
    if (tab === "evidence") return `<h3 class="admin-drawer__section">Sản phẩm & minh chứng</h3><dl class="admin-data-list"><div><dt>Sản phẩm yêu cầu</dt><dd>${row.product}</dd></div><div><dt>Lý do</dt><dd>Sản phẩm có lỗi hoặc không phù hợp nhu cầu.</dd></div><div><dt>Minh chứng</dt><dd>03 ảnh sản phẩm đã đính kèm</dd></div></dl><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Khách đã gửi minh chứng</strong><p>Ảnh và nội dung yêu cầu được lưu cùng phiếu.</p></div></div>`;
    if (tab === "processing") return `<h3 class="admin-drawer__section">Xử lý phiếu</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Chờ nhân viên xác nhận</strong><p>Kiểm tra điều kiện đổi/trả và đối chiếu đơn hàng trước khi xử lý.</p></div></div><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" data-modal="refund:${row.id}">Hoàn tiền</button><button class="admin-btn admin-btn--outline admin-btn--sm" data-modal="exchange:${row.id}">Tạo đơn đổi</button><button class="admin-btn admin-btn--danger admin-btn--sm" data-modal="reject:${row.id}">Từ chối</button></div>`;
    if (tab === "history") return `<h3 class="admin-drawer__section">Lịch sử xử lý</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Tiếp nhận yêu cầu</strong><p>Hệ thống · ${row.createdAt}</p></div></div><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Chờ nhân viên xử lý</strong><p>Phạm Thu Hương · ${row.createdAt}</p></div></div>`;
    if (tab === "conversation") return `<h3 class="admin-drawer__section">Lịch sử trao đổi</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Khách hàng</strong><p>${row.content}</p></div></div><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Hệ thống</strong><p>Phiếu đã được tiếp nhận và đang chờ phản hồi.</p></div></div>`;
    if (tab === "internal") return `<h3 class="admin-drawer__section">Xử lý nội bộ</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Phân công</strong><p>Nhân viên CSKH đang phụ trách phiếu này.</p></div></div><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" data-modal="reply:${row.id}">Phản hồi</button><button class="admin-btn admin-btn--outline admin-btn--sm" data-modal="forward:${row.id}">Chuyển tiếp</button><button class="admin-btn admin-btn--filter admin-btn--sm" data-modal="close:${row.id}">Đóng phiếu</button></div>`;
    if (tab === "csat") return `<h3 class="admin-drawer__section">CSAT</h3><dl class="admin-data-list"><div><dt>Trạng thái khảo sát</dt><dd>${row.csat}</dd></div><div><dt>Điểm đánh giá</dt><dd>Chưa có phản hồi</dd></div></dl>`;
    return `<h3 class="admin-drawer__section">Nhật ký</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Phiếu được tạo</strong><p>Hệ thống · ${row.createdAt}</p></div></div>`;
  }

  function openDrawer(type, id, activeTab = "overview") {
    const row = findRecord(type, id);
    const isReturn = type === "returns";
    const tabs = isReturn
      ? [["overview", "Tổng quan"], ["evidence", "Sản phẩm & minh chứng"], ["processing", "Xử lý"], ["history", "Lịch sử xử lý"]]
      : [["overview", "Tổng quan"], ["conversation", "Lịch sử trao đổi"], ["internal", "Xử lý nội bộ"], ["csat", "CSAT"], ["history", "Nhật ký"]];
    document.querySelector("#service-layer").innerHTML = `<div class="admin-drawer-backdrop" data-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><span class="admin-product-code">${row.id} · ${row.createdAt}</span><h2 class="admin-card__title">${isReturn ? row.orderId : row.customer}</h2><div>${badge(row.status, statusKind(row.status))}</div></div><button class="admin-icon-button" type="button" data-close title="Đóng">×</button></header><div class="admin-drawer__tabs">${tabs.map(([key, label]) => `<button class="admin-drawer__tab ${key === activeTab ? "is-active" : ""}" type="button" data-drawer-tab="${type}:${id}:${key}">${label}</button>`).join("")}</div><div class="admin-drawer__body">${drawerBody(type, row, activeTab)}</div></aside>`;
  }

  /* ── Modal ── */
  function openModal(action, id) {
    const type = ["refund", "exchange", "reject"].includes(action) ? "returns" : "support";
    const record = findRecord(type, id);
    const titles = { refund: "Xác nhận hoàn tiền", exchange: "Tạo đơn đổi hàng", reject: "Từ chối yêu cầu", reply: "Phản hồi khách hàng", forward: "Chuyển tiếp bộ phận", close: "Đóng phiếu hỗ trợ" };
    const specialField = action === "exchange"
      ? `<label class="admin-form-group"><span class="admin-form-label">Sản phẩm thay thế *</span><select class="admin-form-control" required><option value="">Chọn sản phẩm</option><option>Áo sơ mi linen cổ V</option><option>Blazer cropped bouclé</option></select></label>`
      : action === "forward"
        ? `<label class="admin-form-group"><span class="admin-form-label">Bộ phận tiếp nhận *</span><select class="admin-form-control" required><option value="">Chọn bộ phận</option><option>Đơn hàng</option><option>Kho vận</option><option>Thanh toán</option></select></label>`
        : "";
    document.querySelector("#service-layer").innerHTML = `<div class="admin-modal-overlay"><section class="admin-modal"><form id="service-form" data-action="${action}" data-id="${id}"><header class="admin-modal__header"><h2>${titles[action]}</h2><button class="admin-icon-button" type="button" data-close title="Đóng">×</button></header><div class="admin-modal__body"><dl class="admin-info-grid"><div><dt>Mã phiếu</dt><dd>${record.id}</dd></div><div><dt>Khách hàng</dt><dd>${record.customer}</dd></div></dl>${action === "refund" ? `<p class="admin-note">Hoàn tiền chỉ áp dụng cho phiếu đổi/trả đã được duyệt, không dùng để hủy đơn hàng.</p><label class="admin-form-group"><span class="admin-form-label">Số tiền hoàn *</span><input class="admin-form-control" required type="number" value="450000"></label>` : specialField}<label class="admin-form-group"><span class="admin-form-label">Lý do / ghi chú xử lý *</span><textarea class="admin-form-control admin-form-textarea" required minlength="10" placeholder="Nhập nội dung tối thiểu 10 ký tự..."></textarea><small class="admin-form-helper">Lý do phải có ít nhất 10 ký tự.</small></label></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-close>Hủy</button><button class="admin-btn admin-btn--secondary" type="submit">Xác nhận</button></footer></form></section></div>`;
  }

  /* ── Toast ── */
  function toast(message) {
    const target = document.querySelector("#service-toast");
    target.textContent = message;
    target.hidden = false;
    window.setTimeout(() => { target.hidden = true; }, 2200);
  }

  /* ── Action handlers ── */
  function handleRefund(id) {
    const r = returns.find((r) => r.id === id);
    if (!r) return;
    const form = document.querySelector("#service-form");
    const amount = Number(form.querySelector('input[type="number"]').value);
    r.status = "Đã hoàn tiền";
    r.action = "Hoàn tiền thành công";
    r.version++;
    db.saveReturns(returns);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "Đổi trả", "refund", "Xác nhận hoàn tiền", r.id, r.customer, "success", "info", `Hoàn tiền ${amount.toLocaleString("vi-VN")}đ cho ${r.id}`, null, null);
    db.queueEmail(r.contact, `Hoàn tiền thành công - ${r.id}`, `Yêu cầu ${r.id} đã được xử lý. Số tiền ${amount.toLocaleString("vi-VN")}đ sẽ được hoàn về tài khoản trong 3-5 ngày làm việc.`);
    toast(`Đã hoàn tiền ${amount.toLocaleString("vi-VN")}đ cho ${r.id}`);
    renderRows();
  }

  function handleExchange(id) {
    const r = returns.find((r) => r.id === id);
    if (!r) return;
    const form = document.querySelector("#service-form");
    const newProduct = form.querySelector("select").value;
    r.status = "Đã duyệt";
    r.action = "Tạo đơn đổi hàng";
    r.version++;
    db.saveReturns(returns);
    const orders = db.getOrders();
    const newOrder = {
      id: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, "0")}`,
      createdAt: getFormattedDate(),
      customer: r.customer,
      contact: r.contact,
      product: newProduct,
      status: "Đang xử lý",
      type: "Đổi hàng"
    };
    orders.push(newOrder);
    db.saveOrders(orders);
    db.updateProductStock(r.product, 1);
    db.updateProductStock(newProduct, -1);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "Đổi trả", "exchange", "Tạo đơn đổi hàng", r.id, r.customer, "success", "info", `Tạo đơn ${newOrder.id} đổi ${r.product} → ${newProduct} cho ${r.id}`, null, null);
    db.queueEmail(r.contact, `Đổi hàng thành công - ${r.id}`, `Yêu cầu đổi hàng ${r.id} đã được duyệt. Đơn hàng mới ${newOrder.id} (${newProduct}) đang được xử lý.`);
    toast(`Đã tạo đơn ${newOrder.id} cho ${r.id}`);
    renderRows();
  }

  function handleReject(id) {
    const r = returns.find((r) => r.id === id);
    if (!r) return;
    const form = document.querySelector("#service-form");
    const reason = form.querySelector("textarea").value;
    r.status = "Đã từ chối";
    r.action = "Từ chối yêu cầu";
    r.reason = reason;
    r.version++;
    db.saveReturns(returns);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "Đổi trả", "reject", "Từ chối yêu cầu", r.id, r.customer, "success", "warning", `Từ chối ${r.id}: ${reason}`, null, null);
    db.queueEmail(r.contact, `Yêu cầu ${r.id} bị từ chối`, `Yêu cầu đổi/trả ${r.id} của bạn đã bị từ chối. Lý do: ${reason}`);
    toast(`Đã từ chối yêu cầu ${r.id}`);
    renderRows();
  }

  function handleReply(id) {
    const t = tickets.find((t) => t.id === id);
    if (!t) return;
    const form = document.querySelector("#service-form");
    const message = form.querySelector("textarea").value;
    t.status = "Đã phản hồi";
    t.version++;
    db.saveTickets(tickets);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "CSKH", "reply", "Phản hồi khách hàng", t.id, t.customer, "success", "info", `Phản hồi ${t.id}: ${message}`, null, null);
    db.queueEmail(t.contact, `Phản hồi từ Velura - ${t.id}`, `Nhân viên CSKH đã phản hồi yêu cầu ${t.id}: ${message}`);
    toast(`Đã phản hồi khách hàng cho ${t.id}`);
    renderRows();
  }

  function handleForward(id) {
    const t = tickets.find((t) => t.id === id);
    if (!t) return;
    const form = document.querySelector("#service-form");
    const department = form.querySelector("select").value;
    t.status = "Chuyển bộ phận";
    t.version++;
    db.saveTickets(tickets);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "CSKH", "forward", "Chuyển tiếp bộ phận", t.id, t.customer, "success", "info", `Chuyển ${t.id} sang ${department}`, null, null);
    toast(`Đã chuyển ${t.id} sang ${department}`);
    renderRows();
  }

  function handleClose(id) {
    const t = tickets.find((t) => t.id === id);
    if (!t) return;
    const form = document.querySelector("#service-form");
    const reason = form.querySelector("textarea").value;
    t.status = "Đã đóng";
    t.csat = "Chờ gửi";
    t.version++;
    db.saveTickets(tickets);
    db.addLog("Phạm Thu Hương", "CSKH-001", "CSKH", "action", "CSKH", "close", "Đóng phiếu", t.id, t.customer, "success", "info", `Đóng ${t.id}: ${reason}`, null, null);
    toast(`Đã đóng phiếu ${t.id}`);
    renderRows();
  }

  function handleCSATSweep() {
    tickets.forEach((t) => {
      if (t.status !== "Đã giải quyết" || t.csat !== "Chờ gửi") return;
      t.csat = "Đã gửi";
      t.version++;
    });
    db.saveTickets(tickets);
  }

  /* ── Event: clicks ── */
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.zone) {
      document.querySelectorAll("[data-zone]").forEach((tab) => {
        tab.classList.toggle("admin-tab--active", tab === button);
        tab.setAttribute("aria-selected", String(tab === button));
      });
      ["returns", "support", "logs"].forEach((zone) => {
        document.querySelector(`#${zone}-panel`).hidden = zone !== button.dataset.zone;
      });
    }
    if (button.dataset.menu) {
      document.querySelectorAll(".admin-table-action-menu").forEach((menu) => { menu.hidden = true; });
      const [type, id] = button.dataset.menu.split(":");
      const menu = document.querySelector(`#menu-${type}-${id}`);
      menu.hidden = false;
      if (menu.getBoundingClientRect().bottom > window.innerHeight - 12) menu.classList.add("admin-dropdown--up");
    }
    if (button.dataset.detail) { const [type, id] = button.dataset.detail.split(":"); openDrawer(type, id); }
    if (button.dataset.drawerTab) {
      const [type, id, tab] = button.dataset.drawerTab.split(":");
      openDrawer(type, id, tab);
    }
    if (button.dataset.modal) { const [action, id] = button.dataset.modal.split(":"); openModal(action, id); }
    if (button.dataset.close !== undefined) document.querySelector("#service-layer").innerHTML = "";
    if (button.dataset.reset !== undefined) {
      document.querySelectorAll("input[type='search']").forEach((input) => { input.value = ""; });
      document.querySelectorAll("tbody tr").forEach((row) => { row.hidden = false; });
    }
    if (button.dataset.export !== undefined) toast("Đã chuẩn bị danh sách mẫu để xuất.");
    if (button.dataset.showLog !== undefined || button.dataset.log !== undefined) {
      document.querySelector("[data-zone='logs']").click();
      toast("Đã mở nhật ký xử lý.");
    }
    if (button.dataset.sidebarToggle !== undefined) {
      const layout = document.querySelector("#admin-layout");
      const sidebar = document.querySelector("#admin-sidebar");
      if (window.innerWidth > 768) {
        layout.classList.toggle("admin-layout--sidebar-collapsed");
      } else {
        sidebar.classList.toggle("is-open");
      }
    }
  });

  /* ── Event: search ── */
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!input.matches("[data-table-search], #global-search")) return;
    const query = input.value.trim().toLocaleLowerCase("vi");
    const scope = input.dataset.tableSearch ? document.querySelector(`#${input.dataset.tableSearch}-body`) : document;
    scope.querySelectorAll("tr").forEach((row) => { row.hidden = !row.textContent.toLocaleLowerCase("vi").includes(query); });
  });

  /* ── Event: form submit ── */
  document.querySelector("#service-layer").addEventListener("submit", (event) => {
    if (event.target.id !== "service-form") return;
    event.preventDefault();
    if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;
    const handlers = { refund: handleRefund, exchange: handleExchange, reject: handleReject, reply: handleReply, forward: handleForward, close: handleClose };
    if (handlers[action]) handlers[action](id);
    document.querySelector("#service-layer").innerHTML = "";
  });

  /* ── Init ── */
  autoExpireReturns();
  handleCSATSweep();
  renderRows();
}());
