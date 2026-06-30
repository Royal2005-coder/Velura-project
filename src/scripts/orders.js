import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  var orders = db.getOrders();

  var statusLabels = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị hàng", shipping: "Đang giao hàng", completed: "Hoàn thành", cancelled: "Đã hủy", held: "Tạm giữ" };
  var paymentLabels = { unpaid: "Chờ thanh toán", paid: "Đã thanh toán", error: "Lỗi thanh toán", refunded: "Đã hoàn tiền", no_refund: "Không cần hoàn tiền" };
  var transitions = { pending: ["confirmed", "held", "cancelled"], confirmed: ["preparing", "held", "cancelled"], preparing: ["shipping", "held"], shipping: ["completed", "held"], held: ["confirmed", "preparing", "cancelled"], completed: [], cancelled: [] };
  var panel = document.querySelector("#order-panel");
  var overlay = document.querySelector("#order-overlay");
  var active = "all";

  function icon(name) { return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '" /></svg>'; }
  function money(value) { return value.toLocaleString("vi-VN") + "đ"; }
  function orderBadge(status) { return '<span class="admin-badge admin-badge--order-' + status + '">' + statusLabels[status] + "</span>"; }
  function paymentBadge(status) { return '<span class="admin-badge admin-badge--payment-' + status + '">' + paymentLabels[status] + "</span>"; }
  function refundBadge(status) { var map = { refunded: ["Đã hoàn tiền", "success"], no_refund: ["Không cần hoàn tiền", "neutral"], pending_refund: ["Chờ hoàn tiền", "pending"], failed: ["Hoàn tiền hủy đơn thất bại", "danger"] }; var item = map[status] || map.no_refund; return '<span class="admin-badge admin-badge--' + item[1] + '">' + item[0] + "</span>"; }
  function attention(order) {
    if (order.orderStatus === "held") return '<span class="admin-order-attention admin-order-attention--alert">' + icon("alert") + "Nghi ngờ rủi ro</span>";
    if (order.paymentStatus === "error") return '<span class="admin-order-attention admin-order-attention--alert">' + icon("credit-card") + "Lỗi thanh toán</span>";
    if (order.orderStatus === "pending") return '<span class="admin-order-attention admin-order-attention--info">' + icon("clock") + "Cần xác nhận</span>";
    return '<span class="admin-order-attention">— Bình thường</span>';
  }
  function customer(order) { return '<div class="admin-order-customer"><strong>' + order.customer.name + '</strong><small>' + order.customer.phone + " · " + order.customer.email + "</small></div>"; }
  function filterMarkup() {
    return '<form class="admin-filter-bar admin-order-filter-bar" data-order-filter>' +
      '<label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-order-search placeholder="Mã đơn hàng, tên khách, số điện thoại..." /></label>' +
      '<label class="admin-form-group"><select class="admin-form-control" aria-label="Trạng thái đơn hàng" data-order-status><option value="">Tất cả trạng thái</option><option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="preparing">Đang chuẩn bị hàng</option><option value="shipping">Đang giao hàng</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option><option value="held">Tạm giữ</option></select></label>' +
      '<label class="admin-form-group"><select class="admin-form-control" aria-label="Thanh toán" data-payment-status><option value="">Tất cả thanh toán</option><option value="unpaid">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="error">Lỗi thanh toán</option><option value="refunded">Đã hoàn tiền</option></select></label>' +
      '<label class="admin-form-group"><input class="admin-form-control" aria-label="Ngày tạo" type="date" data-order-date /></label>' +
      '<div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-order-reset>Đặt lại</button></div></form>';
  }
  function actionMenu(order) {
    var actions = '<button data-order-drawer="' + order.id + '">' + icon("eye") + "<span>Xem chi tiết</span></button>" +
      '<button data-order-modal="status" data-order-id="' + order.id + '">' + icon("settings") + "<span>Cập nhật trạng thái thủ công</span></button>";
    actions += '<button data-order-log="' + order.id + '">' + icon("log") + "<span>Xem nhật ký</span></button>";
    if (order.paymentStatus === "error") actions += '<button data-order-modal="payment" data-order-id="' + order.id + '">' + icon("credit-card") + "<span>Xử lý thanh toán lỗi</span></button>";
    if (order.canCancel) actions += '<button class="admin-order-action-menu__danger" data-order-modal="cancel" data-order-id="' + order.id + '">' + icon("lock") + "<span>Hủy đơn hàng</span></button>";
    return '<div class="admin-order-actions"><button class="admin-icon-button admin-icon-button--sm" type="button" title="Xem chi tiết" aria-label="Xem chi tiết" data-order-drawer="' + order.id + '">' + icon("eye") + '</button><button class="admin-icon-button admin-icon-button--sm" type="button" title="Thao tác đơn hàng" aria-label="Thao tác đơn hàng" data-order-menu="' + order.id + '">' + icon("edit") + '</button><div class="admin-dropdown admin-table-action-menu admin-order-action-menu" id="order-menu-' + order.id + '" hidden>' + actions + "</div></div>";
  }
  function table(rows, variant) {
    if (!rows.length) return '<div class="admin-order-empty">' + icon("cart") + "<strong>Không có đơn hàng phù hợp</strong><span>Thử điều chỉnh điều kiện tìm kiếm hoặc bộ lọc.</span></div>";
    if (variant === "cancelled") return '<div class="admin-table-wrap"><table class="admin-table admin-data-table"><thead><tr><th>Mã đơn hàng</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái trước khi hủy</th><th>Lý do hủy</th><th>Hoàn tiền hủy đơn</th><th>Ngày hủy</th><th>Thao tác</th></tr></thead><tbody>' + rows.map(function (o) { return '<tr><td><span class="admin-order-code">' + o.id + '</span><small class="admin-order-subtext">' + o.createdAt + '</small></td><td>' + customer(o) + '</td><td class="admin-order-amount">' + money(o.total) + '</td><td>' + orderBadge(o.prevStatus) + '</td><td>' + o.cancelReason + '</td><td>' + refundBadge(o.refundStatus) + '</td><td>' + o.updatedAt + '</td><td>' + actionMenu(o) + '</td></tr>'; }).join("") + "</tbody></table></div>";
    return '<div class="admin-table-wrap"><table class="admin-table admin-data-table"><thead><tr><th>Mã đơn hàng</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái đơn hàng</th><th>Thanh toán</th><th>Cần xử lý</th><th>Thao tác</th></tr></thead><tbody>' + rows.map(function (o) { return '<tr><td><span class="admin-order-code">' + o.id + '</span><small class="admin-order-subtext">' + o.createdAt + '</small></td><td>' + customer(o) + '</td><td class="admin-order-amount">' + money(o.total) + '</td><td>' + orderBadge(o.orderStatus) + '</td><td>' + paymentBadge(o.paymentStatus) + '</td><td>' + attention(o) + '</td><td>' + actionMenu(o) + '</td></tr>'; }).join("") + "</tbody></table></div>";
  }
  function pager(text) { return '<div class="admin-card__footer"><p class="admin-table-note">' + text + '</p><nav class="admin-pagination" aria-label="Phân trang"><button type="button" title="Trang trước">←</button><button class="is-active" type="button">1</button><button type="button">2</button><button type="button" title="Trang sau">→</button></nav></div>'; }

  function getOrderLogs() {
    return db.getLogs().filter(function (log) { return log.module === "orders"; });
  }

  function logsTable() {
    var logs = getOrderLogs();
    return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Thời gian</th><th>Mã đơn hàng</th><th>Người / nguồn thực hiện</th><th>Hành động</th><th>Trạng thái cũ → mới</th><th>Kết quả</th><th>Chi tiết</th></tr></thead><tbody>' + logs.map(function (log) {
      var time = log.time + " " + log.clock;
      var transition = log.changes && log.changes.length > 0 ? log.changes.map(function (c) { return c[0] + ": " + c[1] + " → " + c[2]; }).join("; ") : "—";
      return '<tr><td>' + time + '</td><td><span class="admin-order-code">' + log.target + '</span></td><td>' + log.actor + '</td><td>' + log.actionLabel + '</td><td>' + transition + '</td><td><span class="admin-badge admin-badge--' + log.result + '">' + (log.result === "success" ? "Thành công" : log.result === "warning" ? "Cảnh báo" : "Thất bại") + '</span></td><td><button class="admin-icon-button admin-icon-button--sm" title="Xem chi tiết" data-order-log="' + log.target + '">' + icon("eye") + '</button></td></tr>';
    }).join("") + "</tbody></table></div>" + pager("Hiển thị " + logs.length + " mục");
  }

  function render() {
    var rows = orders;
    if (active === "attention") rows = orders.filter(function (o) { return o.orderStatus === "pending" || o.orderStatus === "held" || o.paymentStatus === "error"; });
    if (active === "payment") rows = orders.filter(function (o) { return o.paymentStatus === "error"; });
    if (active === "cancelled") rows = orders.filter(function (o) { return o.orderStatus === "cancelled"; });
    if (active === "logs") { panel.innerHTML = '<div class="admin-filter-bar admin-order-filter-bar"><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-order-log-search placeholder="Tìm mã đơn hàng, người thực hiện..." /></label><label class="admin-form-group"><span class="admin-form-label">Hành động</span><select class="admin-form-control" data-log-action><option value="">Tất cả hành động</option><option>Hủy đơn hàng</option><option>Cập nhật vận chuyển</option><option>Tạm giữ rủi ro</option></select></label><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--ghost admin-btn--sm" type="button" data-order-reset>Đặt lại</button></div></div>' + logsTable(); return; }
    var totalAll = orders.length;
    var note = active === "cancelled" ? "Hiển thị " + rows.length + " / " + orders.filter(function (o) { return o.orderStatus === "cancelled"; }).length + " đơn hủy" : "Hiển thị " + rows.length + " / " + totalAll + " đơn hàng";
    var intro = active === "cancelled" ? '<div class="admin-note">Theo dõi các đơn hàng đã hủy trong quy trình quản lý đơn hàng. Trạng thái hoàn tiền chỉ áp dụng cho đơn thanh toán online bị hủy trước khi hoàn tất.</div>' : "";
    panel.innerHTML = filterMarkup() + intro + table(rows, active === "cancelled" ? "cancelled" : "all") + pager(note);
  }
  function getOrder(id) { return orders.filter(function (o) { return o.id === id; })[0]; }

  function syncOrder(updatedOrder) {
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === updatedOrder.id) { orders[i] = updatedOrder; break; }
    }
    db.saveOrders(orders);
  }

  function optimisticSave(order) {
    var fresh = db.getOrderById(order.id);
    if (db.isConflictSimulated()) {
      toast("Xung đột dữ liệu: đơn hàng đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
      return false;
    }
    if (fresh && fresh.version !== order.version) {
      toast("Xung đột dữ liệu: đơn hàng đã bị thay đổi bởi người khác. Vui lòng tải lại trang.");
      return false;
    }
    order.version = (order.version || 0) + 1;
    order.updatedAt = getFormattedDate() + " " + getFormattedTime();
    syncOrder(order);
    return true;
  }

  function cancelOrder(order, reason) {
    if (transitions[order.orderStatus].indexOf("cancelled") < 0) {
      toast("Trạng thái hiện tại không cho phép hủy đơn.");
      return;
    }
    var prevStatus = order.orderStatus;
    order.items.forEach(function (item) { db.updateProductStock(item.sku, item.qty); });
    order.prevStatus = prevStatus;
    order.orderStatus = "cancelled";
    order.cancelReason = reason;
    order.cancelledBy = "Phạm Thu Hương";
    order.canCancel = false;
    if (order.paymentStatus === "paid") { order.refundStatus = "pending_refund"; } else { order.refundStatus = "no_refund"; }
    if (!optimisticSave(order)) return;
    db.addLog("Phạm Thu Hương", "ACC003", "Admin quản trị", "admin", "orders", "cancel", "Hủy đơn hàng", order.id, "Đơn hàng " + order.id, "success", "normal", "Đơn hàng " + order.id + " bị hủy bởi admin. Lý do: " + reason, [["Trạng thái đơn", statusLabels[prevStatus], "Đã hủy"], ["Lý do", "—", reason]], { "Mã đơn": order.id, "Khách hàng": order.customer.name, "Tổng tiền": money(order.total) });
    if (order.paymentStatus === "paid") {
      db.queueEmail(order.customer.email, "Thông báo hủy đơn " + order.id, "Kính gửi " + order.customer.name + ",\n\nĐơn hàng " + order.id + " của bạn đã bị hủy. Lý do: " + reason + ".\n\nTiền thanh toán sẽ được hoàn lại trong vòng 3-5 ngày làm việc.\n\nTrân trọng,\nVelura");
    } else {
      db.queueEmail(order.customer.email, "Thông báo hủy đơn " + order.id, "Kính gửi " + order.customer.name + ",\n\nĐơn hàng " + order.id + " của bạn đã bị hủy. Lý do: " + reason + ".\n\nTrân trọng,\nVelura");
    }
    render();
    toast("Đã hủy đơn hàng " + order.id + ".");
  }

  function resolvePaymentError(order, result, reason) {
    var prevStatus = order.paymentStatus;
    if (result === "Xác nhận thanh toán thành công") {
      order.paymentStatus = "paid";
    } else if (result === "Phê duyệt thanh toán thủ công") {
      order.paymentStatus = "paid";
    } else if (result === "Hủy đơn hàng") {
      if (transitions[order.orderStatus].indexOf("cancelled") < 0) {
        toast("Trạng thái hiện tại không cho phép hủy đơn.");
        return;
      }
      cancelOrder(order, "Thanh toán lỗi: " + reason);
      return;
    }
    if (!optimisticSave(order)) return;
    db.addLog("Phạm Thu Hương", "ACC003", "Admin quản trị", "admin", "orders", "payment_resolve", "Xử lý thanh toán lỗi", order.id, "Đơn hàng " + order.id, "success", "normal", "Thanh toán đơn " + order.id + " đã được xử lý: " + result, [["Thanh toán", paymentLabels[prevStatus], paymentLabels[order.paymentStatus]]], { "Mã đơn": order.id, "Khách hàng": order.customer.name, "Kết quả": result });
    db.queueEmail(order.customer.email, "Cập nhật thanh toán đơn " + order.id, "Kính gửi " + order.customer.name + ",\n\nĐơn hàng " + order.id + " của bạn đã được xử lý thanh toán: " + result + ".\n\nTrân trọng,\nVelura");
    render();
    toast("Đã xử lý thanh toán lỗi đơn " + order.id + ".");
  }

  function updateStatus(order, newStatus, reason) {
    if (transitions[order.orderStatus].indexOf(newStatus) < 0) {
      toast("Chuyển trạng thái không hợp lệ: " + statusLabels[order.orderStatus] + " → " + statusLabels[newStatus]);
      return;
    }
    var prevStatus = order.orderStatus;
    order.orderStatus = newStatus;
    if (newStatus === "cancelled") {
      order.canCancel = false;
      order.cancelReason = reason;
      order.cancelledBy = "Phạm Thu Hương";
      order.prevStatus = prevStatus;
      if (order.paymentStatus === "paid") { order.refundStatus = "pending_refund"; } else { order.refundStatus = "no_refund"; }
      order.items.forEach(function (item) { db.updateProductStock(item.sku, item.qty); });
    }
    if (!optimisticSave(order)) return;
    db.addLog("Phạm Thu Hương", "ACC003", "Admin quản trị", "admin", "orders", "status_update", "Cập nhật trạng thái", order.id, "Đơn hàng " + order.id, "success", "normal", "Đơn hàng " + order.id + " chuyển từ " + statusLabels[prevStatus] + " sang " + statusLabels[newStatus], [["Trạng thái đơn", statusLabels[prevStatus], statusLabels[newStatus]], ["Lý do", "—", reason]], { "Mã đơn": order.id, "Khách hàng": order.customer.name, "Tổng tiền": money(order.total) });
    db.queueEmail(order.customer.email, "Cập nhật trạng thái đơn " + order.id, "Kính gửi " + order.customer.name + ",\n\nĐơn hàng " + order.id + " đã chuyển sang trạng thái: " + statusLabels[newStatus] + ".\n\nLý do: " + reason + "\n\nTrân trọng,\nVelura");
    render();
    toast("Đã cập nhật trạng thái đơn " + order.id + " sang " + statusLabels[newStatus] + ".");
  }

  function openDrawer(order, tab) {
    var subtotal = order.items.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var drawerTabs = ["overview", "products", "payment", "history"];
    tab = tab || "overview";
    function tabContent() {
      if (tab === "products") return '<h3 class="admin-drawer__section">Sản phẩm trong đơn</h3><div class="admin-order-product-list">' + order.items.map(function (item) { return '<article class="admin-order-product"><div><strong>' + item.name + '</strong><small>' + item.sku + " · " + item.variant + " · SL: " + item.qty + '</small></div><div class="admin-order-product__price">' + money(item.price * item.qty) + '<br><small>' + money(item.price) + '/sản phẩm</small></div></article>'; }).join("") + '</div><div class="admin-order-totals"><div><span>Tạm tính</span><span>' + money(subtotal) + '</span></div><div><span>Phí vận chuyển</span><span>0đ</span></div><div><strong>Tổng thanh toán</strong><strong>' + money(order.total) + '</strong></div></div>';
      if (tab === "payment") return '<h3 class="admin-drawer__section">Thông tin thanh toán</h3><dl class="admin-data-list"><div><dt>Phương thức thanh toán</dt><dd>' + order.paymentMethod + '</dd></div><div><dt>Trạng thái thanh toán</dt><dd>' + paymentBadge(order.paymentStatus) + '</dd></div><div><dt>Tổng thanh toán</dt><dd>' + money(order.total) + '</dd></div><div><dt>Mã giao dịch</dt><dd>' + (order.paymentError ? order.paymentError.transaction : "—") + '</dd></div></dl>' + (order.paymentError ? '<div class="admin-order-danger-note">Phát hiện chênh lệch ' + money(order.paymentError.system - order.paymentError.actual) + ' giữa số tiền đơn và số tiền ghi nhận thực tế.</div>' : "");
      if (tab === "history") return '<h3 class="admin-drawer__section">Trạng thái &amp; lịch sử</h3><div class="admin-timeline"><div class="admin-timeline__item"><strong>' + statusLabels[order.orderStatus] + '</strong><span>' + order.updatedAt + " · " + (order.orderStatus === "shipping" ? "Vận chuyển" : "Hệ thống") + '</span></div><div class="admin-timeline__item"><strong>Đơn hàng được tạo</strong><span>' + order.createdAt + " · Hệ thống</span></div></div>";
      return '<h3 class="admin-drawer__section">Thông tin khách hàng</h3><dl class="admin-data-list"><div><dt>Khách hàng</dt><dd>' + order.customer.name + '</dd></div><div><dt>Số điện thoại</dt><dd>' + order.customer.phone + '</dd></div><div><dt>Email</dt><dd>' + order.customer.email + '</dd></div><div><dt>Địa chỉ giao hàng</dt><dd>' + order.customer.address + '</dd></div></dl><h3 class="admin-drawer__section">Tổng quan đơn hàng</h3><div class="admin-order-summary"><div class="admin-order-summary__item"><span>Tổng thanh toán</span><strong>' + money(order.total) + '</strong></div><div class="admin-order-summary__item"><span>Phương thức</span><strong>' + order.paymentMethod + '</strong></div></div><dl class="admin-data-list"><div><dt>Ngày tạo đơn</dt><dd>' + order.createdAt + '</dd></div><div><dt>Đơn vị vận chuyển</dt><dd>' + (order.carrier || "Chưa bàn giao") + '</dd></div><div><dt>Mã vận đơn</dt><dd>' + (order.trackingCode || "—") + '</dd></div></dl>' + (order.riskNote ? '<div class="admin-order-warning">' + order.riskNote + '</div>' : "") + (order.cancelReason ? '<div class="admin-order-danger-note">Đơn được hủy bởi ' + order.cancelledBy + ". Lý do: " + order.cancelReason + '</div>' : "");
    }
    overlay.innerHTML = '<div class="admin-drawer-backdrop" data-order-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><p class="admin-product-code">' + order.id + '</p><h2 class="admin-section__title">Đơn hàng của ' + order.customer.name + '</h2><div class="admin-status-group">' + orderBadge(order.orderStatus) + paymentBadge(order.paymentStatus) + '</div></div><button class="admin-icon-button" type="button" data-order-close aria-label="Đóng">×</button></header><nav class="admin-drawer__tabs">' + drawerTabs.map(function (name) { var labels = { overview: "Tổng quan", products: "Sản phẩm", payment: "Thanh toán", history: "Trạng thái & lịch sử" }; return '<button class="admin-drawer__tab' + (name === tab ? " is-active" : "") + '" type="button" data-order-drawer-tab="' + name + '" data-order-id="' + order.id + '">' + labels[name] + '</button>'; }).join("") + '</nav><div class="admin-drawer__body">' + tabContent() + '<h3 class="admin-drawer__section">Hành động nhanh</h3><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-order-modal="status" data-order-id="' + order.id + '">' + icon("settings") + "Cập nhật trạng thái</button>" + (order.canCancel ? '<button class="admin-btn admin-btn--danger admin-btn--sm" type="button" data-order-modal="cancel" data-order-id="' + order.id + '">' + icon("lock") + "Hủy đơn</button>" : "") + (order.paymentStatus === "error" ? '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-order-modal="payment" data-order-id="' + order.id + '">Xử lý lỗi thanh toán</button>' : "") + '</div></div></aside>';
  }
  function modal(type, order) {
    var title = "", body = "", confirm = "Xác nhận", cls = "admin-btn--secondary";
    if (type === "status") {
      title = "Cập nhật trạng thái thủ công";
      var options = transitions[order.orderStatus].map(function (s) { return '<option value="' + s + '">' + statusLabels[s] + "</option>"; }).join("");
      body = '<div class="admin-info-grid"><div><dt>Mã đơn hàng</dt><dd>' + order.id + '</dd></div><div><dt>Trạng thái hiện tại</dt><dd>' + orderBadge(order.orderStatus) + '</dd></div></div><div class="admin-order-warning">Cập nhật trạng thái thủ công chỉ dùng cho trường hợp ngoại lệ khi luồng tự động gặp sự cố hoặc cần admin can thiệp.</div><label class="admin-form-group"><span class="admin-form-label">Trạng thái mới <b>*</b></span><select class="admin-form-control" name="newStatus" required><option value="">Chọn trạng thái</option>' + options + '</select></label><label class="admin-form-group"><span class="admin-form-label">Lý do can thiệp <b>*</b></span><textarea class="admin-form-control admin-form-textarea" name="reason" minlength="10" required placeholder="Nhập lý do cập nhật..."></textarea><small class="admin-form-helper">Lý do phải có ít nhất 10 ký tự.</small></label>';
    } else if (type === "cancel") {
      title = "Hủy đơn hàng"; confirm = "Xác nhận hủy đơn"; cls = "admin-btn--danger";
      body = '<div class="admin-info-grid"><div><dt>Mã đơn hàng</dt><dd>' + order.id + '</dd></div><div><dt>Trạng thái hiện tại</dt><dd>' + orderBadge(order.orderStatus) + '</dd></div><div><dt>Thanh toán</dt><dd>' + paymentBadge(order.paymentStatus) + '</dd></div><div><dt>Tổng tiền</dt><dd>' + money(order.total) + '</dd></div></div><div class="admin-order-warning">' + (order.paymentStatus === "paid" ? "Sau khi hủy, hệ thống sẽ khởi tạo hoàn tiền qua cổng thanh toán." : "Đơn chưa thanh toán hoặc COD, không cần hoàn tiền.") + '</div><label class="admin-form-group"><span class="admin-form-label">Lý do hủy <b>*</b></span><textarea class="admin-form-control admin-form-textarea" name="reason" minlength="10" required placeholder="Nhập lý do hủy đơn..."></textarea><small class="admin-form-helper">Lý do phải có ít nhất 10 ký tự.</small></label>';
    } else if (type === "payment") {
      title = "Xử lý thanh toán lỗi"; var error = order.paymentError;
      body = '<div class="admin-info-grid"><div><dt>Mã đơn hàng</dt><dd>' + order.id + '</dd></div><div><dt>Mã giao dịch</dt><dd>' + error.transaction + '</dd></div><div><dt>Số tiền hệ thống</dt><dd>' + money(error.system) + '</dd></div><div><dt>Số tiền thực tế</dt><dd>' + money(error.actual) + '</dd></div></div><div class="admin-order-danger-note">Chênh lệch ' + money(error.system - error.actual) + '. Cần đối chiếu trước khi xác nhận xử lý.</div><label class="admin-form-group"><span class="admin-form-label">Kết quả đối chiếu <b>*</b></span><select class="admin-form-control" name="paymentResult" required><option value="">Chọn kết quả</option><option>Xác nhận thanh toán thành công</option><option>Phê duyệt thanh toán thủ công</option><option>Hủy đơn hàng</option></select></label><label class="admin-form-group"><span class="admin-form-label">Ghi chú xử lý</span><textarea class="admin-form-control admin-form-textarea" name="reason" minlength="10" placeholder="Nhập ghi chú xử lý..."></textarea><small class="admin-form-helper">Nếu can thiệp thủ công, lý do phải có ít nhất 10 ký tự.</small></label>';
    } else { title = "Không thể hủy đơn hàng"; confirm = "Đã hiểu"; body = '<div class="admin-order-danger-note">Đơn hàng này không còn ở trạng thái cho phép hủy. Hệ thống sẽ giữ nguyên trạng thái hiện tại.</div>'; }
    overlay.innerHTML = '<div class="admin-modal-overlay"><section class="admin-modal"><form data-order-modal-form data-order-type="' + type + '" data-order-id="' + (order ? order.id : "") + '"><header class="admin-modal__header"><h2>' + title + '</h2><button class="admin-icon-button" type="button" data-order-close>×</button></header><div class="admin-modal__body">' + body + '</div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-order-close>Hủy</button><button class="admin-btn ' + cls + '" type="submit">' + confirm + '</button></footer></form></section></div>';
  }
  function toast(text) { var node = document.querySelector("#order-toast"); node.textContent = text; node.hidden = false; window.setTimeout(function () { node.hidden = true; }, 2600); }
  function applyFilters() {
    var query = (panel.querySelector("[data-order-search]") || {}).value || "";
    var status = (panel.querySelector("[data-order-status]") || {}).value || "";
    var payment = (panel.querySelector("[data-payment-status]") || {}).value || "";
    panel.querySelectorAll("tbody tr").forEach(function (row) { var text = row.textContent.toLowerCase(); row.hidden = (!!query && text.indexOf(query.toLowerCase()) < 0) || (!!status && text.indexOf(statusLabels[status].toLowerCase()) < 0) || (!!payment && text.indexOf(paymentLabels[payment].toLowerCase()) < 0); });
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.orderTab) { active = button.dataset.orderTab; document.querySelectorAll("[data-order-tab]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab === button); }); render(); }
    if (button.dataset.orderOpenLogs !== undefined) { active = "logs"; document.querySelectorAll("[data-order-tab]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab.dataset.orderTab === "logs"); }); render(); }
    if (button.dataset.orderSidebar !== undefined) document.querySelector(".admin-layout").classList.toggle("admin-layout--sidebar-collapsed");
    if (button.dataset.orderMenu) { document.querySelectorAll(".admin-order-action-menu").forEach(function (menu) { menu.hidden = true; }); var menu = document.querySelector("#order-menu-" + button.dataset.orderMenu); menu.hidden = false; menu.classList.remove("admin-dropdown--up"); if (menu.getBoundingClientRect().bottom > window.innerHeight - 12) menu.classList.add("admin-dropdown--up"); }
    if (button.dataset.orderDrawer) openDrawer(getOrder(button.dataset.orderDrawer));
    if (button.dataset.orderDrawerTab) openDrawer(getOrder(button.dataset.orderId), button.dataset.orderDrawerTab);
    if (button.dataset.orderModal) { var order = getOrder(button.dataset.orderId); if (button.dataset.orderModal === "cancel" && !order.canCancel) modal("cannotCancel", order); else modal(button.dataset.orderModal, order); }
    if (button.dataset.orderLog) { active = "logs"; document.querySelectorAll("[data-order-tab]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab.dataset.orderTab === "logs"); }); render(); toast("Đã chuyển đến nhật ký của " + button.dataset.orderLog + "."); }
    if (button.dataset.orderClose !== undefined) overlay.innerHTML = "";
    if (button.dataset.orderReset !== undefined) render();
    if (button.dataset.orderExport !== undefined) toast("Đã chuẩn bị danh sách đơn hàng mẫu.");
    if (!button.closest(".admin-order-actions")) document.querySelectorAll(".admin-order-action-menu").forEach(function (menu) { menu.hidden = true; });
  });
  panel.addEventListener("input", function (event) { if (event.target.matches("[data-order-search], [data-order-status], [data-payment-status]")) applyFilters(); if (event.target.matches("[data-order-log-search]")) { var query = event.target.value.toLowerCase(); panel.querySelectorAll("tbody tr").forEach(function (row) { row.hidden = row.textContent.toLowerCase().indexOf(query) < 0; }); } });
  panel.addEventListener("change", function (event) { if (event.target.matches("[data-order-status], [data-payment-status]")) applyFilters(); });
  panel.addEventListener("submit", function (event) { if (event.target.matches("[data-order-filter]")) { event.preventDefault(); applyFilters(); } });
  overlay.addEventListener("submit", function (event) {
    if (!event.target.matches("[data-order-modal-form]")) return;
    event.preventDefault();
    var form = event.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var type = form.dataset.orderType;
    var orderId = form.dataset.orderId;
    var order = getOrder(orderId);
    if (type === "cancel") {
      var reason = form.reason.value;
      cancelOrder(order, reason);
    } else if (type === "status") {
      var newStatus = form.newStatus.value;
      var reason = form.reason.value;
      updateStatus(order, newStatus, reason);
    } else if (type === "payment") {
      var result = form.paymentResult.value;
      var reason = form.reason.value || "";
      resolvePaymentError(order, result, reason);
    } else {
      toast("Đã ghi nhận thao tác.");
    }
    overlay.innerHTML = "";
  });
  render();
}());
