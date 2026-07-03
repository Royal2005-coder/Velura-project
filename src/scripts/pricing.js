import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  var products = [];
  var history = [];
  var panel = document.querySelector("#pricing-panel");
  var overlay = document.querySelector("#pricing-overlay");
  var activeRows = products.slice();

  function icon(name) { return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '"></use></svg>'; }
  function money(value) { return value === null ? "—" : value.toLocaleString("vi-VN") + "đ"; }
  function discount(item) { return item.sale && item.sale < item.original ? Math.round((1 - item.sale / item.original) * 100) : 0; }
  function toast(text) { var node = document.querySelector("#pricing-toast"); node.textContent = text; node.hidden = false; window.setTimeout(function () { node.hidden = true; }, 2400); }
  function productCell(item) { return '<div class="admin-price-product admin-product-cell"><img src="' + item.image + '" alt=""><span><strong>' + item.name + '</strong><small>' + item.colors + ' màu · ' + item.sizes + ' kích thước</small></span></div>'; }
  function badge(item) { return '<span class="admin-badge admin-badge--' + item.statusClass + '">' + item.priceStatus + '</span>'; }
  function discountBadge(item) { var value = discount(item); return value ? '<span class="admin-badge admin-badge--pending">-' + value + "%</span>" : '<span class="admin-badge admin-badge--neutral">Không giảm</span>'; }
  function actionMenu(item) {
    var menu = '<button data-price-drawer="' + item.id + '">' + icon("eye") + "<span>Xem chi tiết</span></button>";
    if (item.priceStatus === "Thiếu giá bán") {
      menu += '<button data-price-modal="update" data-price-id="' + item.id + '">' + icon("edit") + "<span>Bổ sung giá bán</span></button>";
      menu += '<button data-price-history="' + item.id + '">' + icon("log") + "<span>Xem lịch sử giá</span></button>";
      menu += '<button data-price-drawer-tab="alerts" data-price-id="' + item.id + '">' + icon("alert") + "<span>Xem cảnh báo giá</span></button>";
    } else if (item.priceStatus === "Cần kiểm tra") {
      menu += '<button data-price-modal="update" data-price-id="' + item.id + '">' + icon("edit") + "<span>Cập nhật giá sản phẩm</span></button>";
      menu += '<button data-price-modal="variant" data-price-id="' + item.id + '">' + icon("settings") + "<span>Cập nhật giá biến thể</span></button>";
      menu += '<button data-price-history="' + item.id + '">' + icon("log") + "<span>Xem lịch sử giá</span></button>";
      menu += '<button data-price-drawer-tab="alerts" data-price-id="' + item.id + '">' + icon("alert") + "<span>Xem cảnh báo giá</span></button>";
    } else {
      menu += '<button data-price-modal="update" data-price-id="' + item.id + '">' + icon("edit") + "<span>Cập nhật giá sản phẩm</span></button>";
      menu += '<button data-price-modal="variant" data-price-id="' + item.id + '">' + icon("settings") + "<span>Cập nhật giá biến thể</span></button>";
      menu += '<button data-price-history="' + item.id + '">' + icon("log") + "<span>Xem lịch sử giá</span></button>";
      menu += '<button class="admin-product-action-menu__danger" data-price-modal="mark-check" data-price-id="' + item.id + '">' + icon("refresh") + "<span>Đánh dấu cần kiểm tra</span></button>";
    }
    return '<div class="admin-table-actions"><button class="admin-icon-button admin-icon-button--sm" title="Xem chi tiết" aria-label="Xem chi tiết" data-price-drawer="' + item.id + '">' + icon("eye") + '</button><span class="admin-product-actions"><button class="admin-icon-button admin-icon-button--sm" title="Thao tác giá" aria-label="Thao tác giá" data-price-menu="' + item.id + '">' + icon("edit") + '</button><span class="admin-dropdown admin-table-action-menu admin-product-action-menu" id="price-menu-' + item.id + '" hidden>' + menu + "</span></span></div>";
  }
  function kpis() {
    var data = [["Tổng sản phẩm", products.length, "box"], ["Đang giảm giá", products.filter(function (p) { return discount(p); }).length, "tag"], ["Thiếu giá bán", products.filter(function (p) { return p.sale === null; }).length, "alert"], ["Cần kiểm tra giá", products.filter(function (p) { return p.priceStatus === "Cần kiểm tra"; }).length, "refresh"], ["Cập nhật hôm nay", 3, "clock"]];
    document.querySelector("#pricing-kpis").innerHTML = data.map(function (k) { return '<article class="admin-kpi-card"><div class="admin-kpi-card__head"><p class="admin-kpi-card__label">' + k[0] + '</p><span class="admin-kpi-card__icon">' + icon(k[2]) + '</span></div><strong class="admin-kpi-card__value">' + k[1] + "</strong></article>"; }).join("");
  }
  function filters() {
    return '<form class="admin-filter-bar admin-order-filter-bar" data-price-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-price-search placeholder="Tên sản phẩm hoặc SKU"></label><select class="admin-form-control" data-price-category><option value="">Tất cả danh mục</option><option>Áo</option><option>Áo khoác</option><option>Váy</option><option>Phụ kiện</option><option>Combo/outfit</option></select><select class="admin-form-control" data-price-status><option value="">Tất cả trạng thái giá</option><option>Có giảm giá</option><option>Không giảm giá</option><option>Thiếu giá bán</option><option>Cần kiểm tra</option></select><div class="admin-price-range"><input class="admin-form-control" type="number" data-price-min placeholder="Từ giá"><input class="admin-form-control" type="number" data-price-max placeholder="Đến giá"></div><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-price-reset>Đặt lại</button></div></form>';
  }
  function table(rows) {
    if (!rows.length) return '<div class="admin-state-panel">' + icon("search") + '<strong>Không tìm thấy sản phẩm phù hợp</strong><span>Hãy thử thay đổi từ khóa hoặc bộ lọc.</span><button class="admin-btn admin-btn--ghost admin-btn--sm" type="button" data-price-reset>Đặt lại bộ lọc</button></div>';
    return '<div class="admin-table-wrap"><table class="admin-table admin-price-table"><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá gốc</th><th>Giá bán</th><th>Giảm giá</th><th>Trạng thái giá</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>' + rows.map(function (item) {
      return '<tr><td>' + productCell(item) + '</td><td>' + item.category + '</td><td class="' + (discount(item) ? "admin-price-old" : "") + '">' + money(item.original) + '</td><td class="admin-price-current">' + money(item.sale) + '</td><td>' + discountBadge(item) + '</td><td>' + badge(item) + '</td><td>' + item.updated + '<small class="admin-order-subtext">' + item.updatedBy + '</small></td><td>' + actionMenu(item) + '</td></tr>';
    }).join("") + '</tbody></table></div><div class="admin-card__footer"><p class="admin-table-note">Hiển thị ' + rows.length + " / " + products.length + ' sản phẩm</p><nav class="admin-pagination" aria-label="Phân trang"><button type="button">←</button><button class="is-active" type="button">1</button><button type="button">2</button><button type="button">→</button></nav></div>';
  }
  function render(rows) { activeRows = rows || products.slice(); panel.innerHTML = filters() + table(activeRows); }
  function getProduct(id) { return products.filter(function (item) { return item.id === id; })[0]; }
  function historyTable() { return '<div class="admin-filter-bar admin-order-filter-bar"><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" data-price-history-search placeholder="Tìm SKU, người thao tác hoặc ghi chú..."></label><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--outline admin-btn--sm admin-price-back-btn" type="button" data-price-back><span aria-hidden="true">←</span> Quay lại danh sách giá</button></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Đối tượng</th><th>Giá gốc cũ -> mới</th><th>Giá bán cũ -> mới</th><th>Ghi chú</th><th>Kết quả</th></tr></thead><tbody>' + history.map(function (row) { return '<tr><td>' + row.time + '</td><td>' + row.actor + '</td><td>' + row.productId + '</td><td>' + money(row.originalOld) + " -> " + money(row.originalNew) + '</td><td>' + money(row.saleOld) + " -> " + money(row.saleNew) + '</td><td>' + row.note + '</td><td><span class="admin-badge admin-badge--success">' + row.result + '</span></td></tr>'; }).join("") + '</tbody></table></div><div class="admin-card__footer"><p class="admin-table-note">Hiển thị ' + history.length + ' mục lịch sử giá</p></div>'; }
  function drawer(item, tab) {
    tab = tab || "overview";
    var tabs = { overview: "Tổng quan giá", variants: "Giá theo biến thể", history: "Lịch sử giá", alerts: "Cảnh báo giá" };
    function content() {
      if (tab === "variants") return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Biến thể</th><th>SKU biến thể</th><th>Giá gốc</th><th>Giá bán</th><th>Giảm giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody><tr><td>M / Trắng</td><td>' + item.id + '-M-WHT</td><td>' + money(item.original) + '</td><td>' + money(item.sale) + '</td><td>' + discountBadge(item) + '</td><td>' + badge(item) + '</td><td><button class="admin-btn admin-btn--outline admin-btn--sm" data-price-modal="variant" data-price-id="' + item.id + '">Cập nhật giá biến thể</button></td></tr></tbody></table></div>';
      if (tab === "history") return historyTable();
      if (tab === "alerts") return '<ul class="admin-price-alert-list"><li>' + (item.sale === null ? "Thiếu giá bán. Cần bổ sung trước khi hiển thị." : "Không thiếu giá bán.") + '</li><li>' + (item.sale && item.sale > item.original ? "Giá bán lớn hơn giá gốc. Cần kiểm tra." : "Giá bán không vượt giá gốc.") + '</li><li>Dữ liệu chưa ghi nhận xung đột từ admin khác.</li></ul>';
      return '<dl class="admin-data-list"><div><dt>Tên sản phẩm</dt><dd>' + item.name + '</dd></div><div><dt>SKU</dt><dd>' + item.id + '</dd></div><div><dt>Danh mục</dt><dd>' + item.category + '</dd></div><div><dt>Trạng thái sản phẩm</dt><dd>' + item.productStatus + '</dd></div><div><dt>Giá gốc hiện tại</dt><dd>' + money(item.original) + '</dd></div><div><dt>Giá bán hiện tại</dt><dd>' + money(item.sale) + '</dd></div><div><dt>% giảm tự động</dt><dd>' + (discount(item) ? discount(item) + "%" : "Không giảm") + '</dd></div><div><dt>Cập nhật gần nhất</dt><dd>' + item.updated + " - " + item.updatedBy + '</dd></div></dl><div class="admin-note">' + item.note + "</div>";
    }
    overlay.innerHTML = '<div class="admin-drawer-backdrop" data-price-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><p class="admin-product-code">' + item.id + '</p><h2 class="admin-section__title">' + item.name + '</h2><div class="admin-status-group"><span class="admin-badge admin-badge--active">' + item.productStatus + "</span>" + badge(item) + '</div></div><button class="admin-icon-button" type="button" data-price-close>×</button></header><nav class="admin-drawer__tabs">' + Object.keys(tabs).map(function (key) { return '<button class="admin-drawer__tab' + (key === tab ? " is-active" : "") + '" type="button" data-price-drawer-tab="' + key + '" data-price-id="' + item.id + '">' + tabs[key] + "</button>"; }).join("") + '</nav><div class="admin-drawer__body">' + content() + '</div></aside>';
  }
  function modal(type, item) {
    if (type === "permission") return simpleModal("Không đủ quyền", "Bạn không có quyền cập nhật giá. Admin chỉ xem chỉ được xem dữ liệu và xuất báo cáo.", "Đã hiểu");
    if (type === "conflict") return simpleModal("Dữ liệu giá đã thay đổi", "Giá sản phẩm này vừa được cập nhật bởi admin khác. Vui lòng tải lại dữ liệu mới nhất trước khi tiếp tục.", "Tải lại dữ liệu");
    if (type === "error") return simpleModal("Không thể cập nhật giá", "Hệ thống gặp lỗi khi cập nhật giá sản phẩm. Vui lòng thử lại sau.", "Thử lại");
    if (type === "mark-check") return simpleModal("Đánh dấu cần kiểm tra", "Sản phẩm sẽ được đưa vào nhóm cần kiểm tra giá để rà soát trước khi tiếp tục cập nhật.", "Xác nhận");
    var title = type === "variant" ? "Cập nhật giá biến thể" : "Cập nhật giá sản phẩm";
    overlay.innerHTML = '<div class="admin-modal-overlay"><section class="admin-modal admin-modal--lg"><form data-price-form><header class="admin-modal__header"><div><p class="admin-product-code">' + item.id + '</p><h2>' + title + '</h2></div><button class="admin-icon-button" type="button" data-price-close>×</button></header><div class="admin-modal__body"><div class="admin-info-grid"><div><dt>Sản phẩm</dt><dd>' + item.name + '</dd></div><div><dt>Biến thể</dt><dd>' + (type === "variant" ? "M / Trắng" : item.variants) + '</dd></div><div><dt>Giá gốc hiện tại</dt><dd>' + money(item.original) + '</dd></div><div><dt>Giá bán hiện tại</dt><dd>' + money(item.sale) + '</dd></div></div><label class="admin-form-group"><span class="admin-form-label">Giá gốc mới *</span><input class="admin-form-control" type="number" min="0" name="original" required value="' + item.original + '"></label><label class="admin-form-group"><span class="admin-form-label">Giá bán mới *</span><input class="admin-form-control" type="number" min="0" name="sale" required value="' + (item.sale || "") + '"></label><label class="admin-form-group"><span class="admin-form-label">Ghi chú thay đổi</span><textarea class="admin-form-control admin-form-textarea" name="note" placeholder="Nhập ghi chú nội bộ"></textarea></label><div class="admin-price-preview" data-price-preview><span>Preview hiển thị ngoài website</span><p><s>' + money(item.original) + '</s> <strong>' + money(item.sale) + '</strong> <span class="admin-price-discount">' + (discount(item) ? "-" + discount(item) + "%" : "Không giảm") + '</span></p></div></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-price-close>Hủy</button><button class="admin-btn admin-btn--secondary" type="submit">Xác nhận cập nhật</button></footer></form></section></div>';
  }
  function simpleModal(title, message, action) { overlay.innerHTML = '<div class="admin-modal-overlay"><section class="admin-modal admin-modal--sm"><header class="admin-modal__header"><h2>' + title + '</h2><button class="admin-icon-button" type="button" data-price-close>×</button></header><div class="admin-modal__body">' + message + '</div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--secondary" type="button" data-price-close>' + action + "</button></footer></section></div>"; }
  function applyFilters() {
    var q = (panel.querySelector("[data-price-search]") || {}).value || "";
    var category = (panel.querySelector("[data-price-category]") || {}).value || "";
    var priceStatus = (panel.querySelector("[data-price-status]") || {}).value || "";
    var min = Number((panel.querySelector("[data-price-min]") || {}).value || 0);
    var max = Number((panel.querySelector("[data-price-max]") || {}).value || 0);
    var rows = products.filter(function (item) {
      var text = (item.name + " " + item.id).toLowerCase();
      var price = item.sale || 0;
      return (!q || text.indexOf(q.toLowerCase()) >= 0) && (!category || item.category === category) && (!priceStatus || (priceStatus === "Có giảm giá" ? discount(item) : priceStatus === "Không giảm giá" ? !discount(item) && item.sale !== null : item.priceStatus === priceStatus)) && (!min || price >= min) && (!max || price <= max);
    });
    render(rows);
  }
  function loadProducts() {
    var dbProducts = db.getProducts();
    products = dbProducts.map(function (p) {
      var colorsCount = (p.colors || "").split(",").filter(function (c) { return c.trim(); }).length;
      var sizesCount = (p.sizes || "").split(",").filter(function (s) { return s.trim(); }).length;
      var sale = p.price || null;
      var original = p.originalPrice || 0;
      var priceStatus = "Đủ giá";
      var statusClass = "active";
      if (sale === null) { priceStatus = "Thiếu giá bán"; statusClass = "danger"; }
      else if (sale > original) { priceStatus = "Cần kiểm tra"; statusClass = "warning"; }
      else if (sale < original) { priceStatus = "Đang giảm giá"; statusClass = "success"; }
      var productStatus = p.status === "hidden" ? "Tạm ẩn" : "Đang bán";
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        colors: colorsCount,
        sizes: sizesCount,
        variants: p.colors + " · " + p.sizes,
        original: original,
        sale: sale,
        productStatus: productStatus,
        priceStatus: priceStatus,
        statusClass: statusClass,
        updated: p.updatedAt,
        updatedBy: "Hệ thống",
        note: p.description || ""
      };
    });
  }
  function loadHistory() {
    history = db.getPriceHistory();
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.pricingSidebar !== undefined) document.querySelector(".admin-layout").classList.toggle("admin-layout--sidebar-collapsed");
    if (button.dataset.pricingExport !== undefined) toast("Đã chuẩn bị danh sách giá sản phẩm.");
    if (button.dataset.pricingOpenLogs !== undefined) { panel.innerHTML = historyTable(); toast("Đang xem lịch sử giá."); }
    if (button.dataset.priceMenu) { document.querySelectorAll(".admin-product-action-menu").forEach(function (menu) { menu.hidden = true; }); var menu = document.querySelector("#price-menu-" + button.dataset.priceMenu); menu.hidden = false; menu.classList.remove("admin-dropdown--up"); if (menu.getBoundingClientRect().bottom > window.innerHeight - 12) menu.classList.add("admin-dropdown--up"); }
    if (button.dataset.priceDrawer) drawer(getProduct(button.dataset.priceDrawer));
    if (button.dataset.priceDrawerTab) drawer(getProduct(button.dataset.priceId), button.dataset.priceDrawerTab);
    if (button.dataset.priceModal) modal(button.dataset.priceModal, getProduct(button.dataset.priceId));
    if (button.dataset.priceHistory) drawer(getProduct(button.dataset.priceHistory), "history");
    if (button.dataset.priceClose !== undefined) overlay.innerHTML = "";
    if (button.dataset.priceReset !== undefined) render();
    if (button.dataset.priceBack !== undefined) render();
    if (!button.closest(".admin-table-actions")) document.querySelectorAll(".admin-product-action-menu").forEach(function (menu) { menu.hidden = true; });
  });
  panel.addEventListener("submit", function (event) { if (event.target.matches("[data-price-filter]")) { event.preventDefault(); applyFilters(); } });
  panel.addEventListener("input", function (event) { if (event.target.matches("[data-price-search]")) applyFilters(); });
  panel.addEventListener("input", function (event) { if (event.target.matches("[data-price-history-search]")) { var query = event.target.value.toLowerCase(); panel.querySelectorAll("tbody tr").forEach(function (row) { row.hidden = row.textContent.toLowerCase().indexOf(query) < 0; }); } });
  overlay.addEventListener("input", function (event) {
    if (!event.target.closest("[data-price-form]")) return;
    var form = event.target.closest("form");
    var original = Number(form.elements.original.value || 0);
    var sale = Number(form.elements.sale.value || 0);
    var percent = original && sale < original ? Math.round((1 - sale / original) * 100) : 0;
    form.querySelector("[data-price-preview] p").innerHTML = "<s>" + money(original) + "</s> <strong>" + money(sale) + '</strong> <span class="admin-price-discount">' + (percent ? "-" + percent + "%" : "Không giảm") + "</span>";
  });
  overlay.addEventListener("submit", function (event) {
    if (!event.target.matches("[data-price-form]")) return;
    event.preventDefault();
    if (!event.target.checkValidity()) { toast("Dữ liệu giá không hợp lệ."); return; }
    var form = event.target;
    var newOriginal = Number(form.elements.original.value || 0);
    var newSale = Number(form.elements.sale.value || 0);
    var note = form.elements.note.value || "";
    var productId = overlay.querySelector("[data-price-id]").dataset.priceId;
    var item = getProduct(productId);
    if (!item) { toast("Không tìm thấy sản phẩm."); return; }
    if (newSale < 0) { toast("Giá bán không được âm."); return; }
    if (db.isDbError()) { modal("error"); return; }
    if (db.isConflictSimulated()) { modal("conflict"); return; }
    try {
      var dbProducts = db.getProducts();
      var dbProduct = dbProducts.find(function (p) { return p.id === productId; });
      if (!dbProduct) { toast("Không tìm thấy sản phẩm trong database."); return; }
      var oldOriginal = dbProduct.originalPrice;
      var oldSale = dbProduct.price;
      dbProduct.originalPrice = newOriginal;
      dbProduct.price = newSale;
      dbProduct.updatedAt = getFormattedDate();
      dbProduct.version = (dbProduct.version || 0) + 1;
      db.saveProducts(dbProducts);
      var result = "Thành công";
      if (newSale !== null && newSale > newOriginal) result = "Cần kiểm tra";
      db.addPriceHistory("Phạm Thu Hương", productId, oldOriginal, newOriginal, oldSale, newSale, note || "Cập nhật giá", result);
      db.addLog("Phạm Thu Hương", "ACC003", "Admin quản trị", "admin", "pricing", "update", "Cập nhật giá", productId, item.name, "success", "normal", "Cập nhật giá " + productId + " từ " + money(oldOriginal) + "/" + money(oldSale) + " sang " + money(newOriginal) + "/" + money(newSale) + ".", [["Giá gốc", money(oldOriginal), money(newOriginal)], ["Giá bán", money(oldSale), money(newSale)], ["Lý do", "—", note || "Cập nhật giá"]], { "Sản phẩm": item.name, "SKU": productId, "Danh mục": item.category });
      loadProducts();
      loadHistory();
      kpis();
      render();
      overlay.innerHTML = "";
      toast("Đã cập nhật giá sản phẩm.");
    } catch (e) {
      modal("error");
    }
  });
  loadProducts();
  loadHistory();
  kpis();
  render();
}());
