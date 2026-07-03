import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  var products = db.getProducts();

  var layout = document.querySelector(".admin-layout");
  var tableBody = document.querySelector("#product-list");
  var searchInput = document.querySelector("[data-product-search]");
  var categoryFilter = document.querySelector("[data-product-category]");
  var statusFilter = document.querySelector("[data-product-status]");
  var stockFilter = document.querySelector("[data-product-stock]");
  var stopModal = document.querySelector("#product-stop-modal");
  var stopForm = document.querySelector("[data-product-stop-form]");
  var stopProductId = "";

  function formatPrice(value) {
    return value.toLocaleString('vi-VN') + 'đ';
  }

  function icon(name) {
    return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '" /></svg>';
  }

  function statusBadge(status) {
    if (status === "active") return '<span class="admin-badge admin-badge--active">Đang bán</span>';
    if (status === "hidden") return '<span class="admin-badge admin-badge--warning">Tạm ẩn</span>';
    return '<span class="admin-badge admin-badge--neutral">Ngừng kinh doanh</span>';
  }

  function statusLabel(status) {
    if (status === "active") return "Đang bán";
    if (status === "hidden") return "Tạm ẩn";
    return "Ngừng kinh doanh";
  }

  function showToast(message) {
    var toast = document.querySelector("#product-toast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 2400);
  }

  function tryShowToast(message) {
    try { showToast(message); } catch (e) { /* toast element missing */ }
  }

  function stockClass(stock) {
    if (stock === 0) return "admin-stock--out";
    if (stock < 10) return "admin-stock--low";
    return "admin-stock--ok";
  }

  function roleTag(category) { return '<span class="admin-role-badge">' + category + '</span>'; }

  function renderProducts() {
    products = db.getProducts();
    var query = searchInput.value.trim().toLowerCase();
    var rows = products.filter(function (product) {
      var matchSearch = !query || (product.name + product.id).toLowerCase().includes(query);
      var matchCategory = !categoryFilter.value || product.category === categoryFilter.value;
      var matchStatus = !statusFilter.value || product.status === statusFilter.value;
      var matchStock = !stockFilter.value || (stockFilter.value === "low" && product.stock > 0 && product.stock < 10) || (stockFilter.value === "out" && product.stock === 0);
      return matchSearch && matchCategory && matchStatus && matchStock;
    });

    tableBody.innerHTML = rows.map(function (product) {
      return '<tr>' +
        '<td><div class="admin-table__entity"><img src="' + product.image + '" alt="' + product.name + '"><span><strong>' + product.name + '</strong><small>' + product.detail + '</small></span></div></td>' +
        '<td>' + product.id + '</td>' +
        '<td><span class="admin-role-badge">' + product.category + '</span></td>' +
        '<td>' + formatPrice(product.price) + '</td>' +
        '<td><span class="admin-stock ' + stockClass(product.stock) + '">' + product.stock + '</span></td>' +
        '<td>' + statusBadge(product.status) + '</td>' +
        '<td>' + product.updatedAt + '</td>' +
        '<td><div class="admin-table-actions"><button class="admin-icon-button admin-icon-button--sm" title="Xem chi tiết" aria-label="Xem chi tiết" data-product-drawer="' + product.id + '">' + icon("eye") + '</button><span class="admin-product-actions"><button class="admin-icon-button admin-icon-button--sm" title="Thao tác sản phẩm" aria-label="Thao tác sản phẩm" data-product-menu="' + product.id + '">' + icon("edit") + '</button><span class="admin-dropdown admin-table-action-menu" id="product-menu-' + product.id + '" hidden><button data-product-drawer="' + product.id + '">' + icon("eye") + '<span>Xem chi tiết</span></button><button data-product-modal="product-form" data-product-id="' + product.id + '">' + icon("edit") + '<span>Cập nhật sản phẩm</span></button><button>' + icon("log") + '<span>Xem nhật ký</span></button><button class="admin-table-action-menu__danger">' + icon("lock") + '<span>Ngừng bán</span></button></span></span></div></td>' +
      '</tr>';
    }).join("");
  }

  function openProductModal(productId) {
    var product = productId ? products.find(function (item) { return item.id === productId; }) : null;
    var modal = document.querySelector("#product-form");
    var title = modal.querySelector("#product-form-title");
    var form = modal.querySelector("[data-product-form]");
    title.textContent = product ? "Cập nhật sản phẩm" : "Thêm sản phẩm";
    form.reset();
    if (product) {
      form.elements.name.value = product.name;
      form.elements.sku.value = product.id;
      form.elements.category.value = product.category;
      form.elements.price.value = product.price;
      form.elements.stock.value = product.stock;
      form.elements.status.value = product.status;
    }
    modal.hidden = false;
  }

  function openProductDrawer(productId) {
    var product = products.find(function (item) { return item.id === productId; });
    if (!product) return;
    var drawer = document.querySelector("#product-detail");
    var sizesHtml = (product.sizes || "").split(",").map(function (s) { return '<span>' + s.trim() + '</span>'; }).join("");
    var colorsHtml = (product.colors || "").split(",").map(function (c) { return '<span>' + c.trim() + '</span>'; }).join("");
    drawer.innerHTML = '<header class="admin-drawer__header"><div class="admin-product-drawer-title"><img src="' + product.image + '" alt="' + product.name + '"><div><h2 class="admin-section__title">' + product.name + '</h2><p class="admin-product-code">' + product.id + '</p><div>' + statusBadge(product.status) + ' ' + roleTag(product.category) + '</div></div></div><button class="admin-icon-button" data-product-close>×</button></header><div class="admin-drawer__body"><h3 class="admin-drawer__section">Thông tin cơ bản</h3><div class="admin-product-basic-list"><div><span>Mã sản phẩm</span><strong>' + product.id + '</strong></div><div><span>Danh mục</span><strong>' + product.category + '</strong></div><div><span>Ngày cập nhật</span><strong>' + product.updatedAt + '</strong></div><div><span>Phiên bản</span><strong>v' + (product.version || 1) + '</strong></div></div><p class="admin-product-detail-label">Mô tả</p><p class="admin-product-description">' + (product.description || '') + '</p><h3 class="admin-drawer__section">Giá và tồn kho</h3><div class="admin-product-stat-grid"><div><span>Giá bán</span><strong>' + formatPrice(product.price) + '</strong>' + (product.originalPrice ? '<small>' + formatPrice(product.originalPrice) + '</small>' : '') + '</div><div><span>Tồn kho</span><strong>' + product.stock + '</strong><small>/ ngưỡng ' + (product.minStock || 10) + '</small></div></div><h3 class="admin-drawer__section">Biến thể</h3><p class="admin-product-detail-label">Size</p><div class="admin-product-chips">' + (sizesHtml || '<span>—</span>') + '</div><p class="admin-product-detail-label">Màu sắc</p><div class="admin-product-chips">' + (colorsHtml || '<span>—</span>') + '</div><h3 class="admin-drawer__section">AI tags &amp; SEO</h3><p class="admin-product-detail-label">✧ Thẻ AI</p><div class="admin-product-ai-tags"><span>#' + product.category.toLowerCase().replace(/\s+/g, '') + '</span><span>#velura</span></div><p class="admin-product-seo">◎ ' + product.name + ' – Velura</p><h3 class="admin-drawer__section">Hành động nhanh</h3><div class="admin-action-row"><button class="admin-btn admin-btn--secondary admin-btn--sm" data-product-modal="product-form" data-product-id="' + product.id + '">' + icon("edit") + ' Cập nhật</button><button class="admin-btn admin-btn--danger admin-btn--sm">⊠ Ngừng bán</button></div><h3 class="admin-drawer__section">Nhật ký gần đây</h3><div class="admin-log-item"><span class="admin-state-icon"></span><div><strong>Cập nhật sản phẩm</strong><br><small>' + product.updatedAt + '</small></div></div></div>';
    drawer.dataset.productId = productId;
    drawer.hidden = false;
    document.querySelector(".admin-drawer-backdrop").hidden = false;
  }

  function updateStopModalCopy(status) {
    var discontinued = status === "discontinued";
    var submit = document.querySelector("[data-product-stop-submit]");
    submit.textContent = discontinued ? "Xác nhận ngừng kinh doanh" : "Xác nhận tạm ẩn";
    submit.classList.toggle("admin-btn--danger", discontinued);
    submit.classList.toggle("admin-btn--secondary", !discontinued);
  }

  function openProductStopModal(productId) {
    var product = products.find(function (item) { return item.id === productId; });
    if (!product) return;
    stopProductId = productId;
    stopForm.reset();
    document.querySelector("[data-product-stop-name]").textContent = product.name;
    document.querySelector("[data-product-stop-sku]").textContent = product.id;
    document.querySelector("[data-product-stop-status]").textContent = statusLabel(product.status);
    document.querySelector("[data-product-stop-stock]").textContent = product.stock + " sản phẩm";
    updateStopModalCopy("hidden");
    stopModal.hidden = false;
  }

  document.addEventListener("click", function (event) {
    var sidebarToggle = event.target.closest("[data-product-sidebar]");
    var modalTrigger = event.target.closest("[data-product-modal]");
    var drawerTrigger = event.target.closest("[data-product-drawer]");
    var closeTrigger = event.target.closest("[data-product-close]");
    var tabTrigger = event.target.closest("[data-product-tab]");
    var menuTrigger = event.target.closest("[data-product-menu]");
    var filterTrigger = event.target.closest("[data-product-filter-apply]");
    var stopTrigger = event.target.closest(".admin-table-action-menu__danger, #product-detail .admin-btn--danger");
    var stopCloseTrigger = event.target.closest("[data-product-stop-close]");

    if (sidebarToggle) layout.classList.toggle("admin-layout--sidebar-collapsed");
    if (modalTrigger) openProductModal(modalTrigger.dataset.productId || "");
    if (drawerTrigger) openProductDrawer(drawerTrigger.dataset.productDrawer);
    if (menuTrigger) { var menu = document.querySelector("#product-menu-" + menuTrigger.dataset.productMenu); document.querySelectorAll(".admin-table-action-menu").forEach(function (item) { item.hidden = true; }); menu.hidden = false; menu.classList.remove("admin-dropdown--up"); if (menu.getBoundingClientRect().bottom > window.innerHeight - 12) menu.classList.add("admin-dropdown--up"); }
    if (stopTrigger) {
      var actionMenu = stopTrigger.closest("[id^='product-menu-']");
      var targetId = actionMenu ? actionMenu.id.replace("product-menu-", "") : document.querySelector("#product-detail").dataset.productId;
      if (actionMenu) actionMenu.hidden = true;
      openProductStopModal(targetId);
    }
    if (stopCloseTrigger) stopModal.hidden = true;
    if (closeTrigger) {
      document.querySelector("#product-form").hidden = true;
      document.querySelector("#product-detail").hidden = true;
      document.querySelector(".admin-drawer-backdrop").hidden = true;
    }
    if (tabTrigger) {
      document.querySelectorAll("[data-product-tab]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab === tabTrigger); });
      document.querySelectorAll("[data-product-panel]").forEach(function (panel) { panel.hidden = panel.dataset.productPanel !== tabTrigger.dataset.productTab; });
    }
    if (filterTrigger) renderProducts();
  });

  [searchInput, categoryFilter, statusFilter, stockFilter].forEach(function (control) {
    control.addEventListener("input", renderProducts);
    control.addEventListener("change", renderProducts);
  });

  document.querySelector("[data-product-filter]").addEventListener("reset", function () {
    window.setTimeout(renderProducts, 0);
  });

  document.querySelector("[data-product-form]").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.target;
    var name = form.elements.name.value.trim();
    var sku = form.elements.sku.value.trim();
    var category = form.elements.category.value;
    var price = parseInt(form.elements.price.value, 10) || 0;
    var stock = parseInt(form.elements.stock.value, 10) || 0;
    var status = form.elements.status.value || "active";

    if (!name || !sku) {
      tryShowToast("Vui lòng điền tên và mã sản phẩm.");
      return;
    }

    var allProducts = db.getProducts();
    var existingIndex = -1;
    for (var i = 0; i < allProducts.length; i++) {
      if (allProducts[i].id === sku) { existingIndex = i; break; }
    }

    var date = getFormattedDate();

    if (existingIndex >= 0) {
      var existing = allProducts[existingIndex];
      var oldPrice = existing.price;
      var oldStock = existing.stock;
      existing.name = name;
      existing.category = category;
      existing.price = price;
      existing.stock = stock;
      existing.status = status;
      existing.updatedAt = date;
      existing.version = (existing.version || 0) + 1;

      try {
        db.saveProducts(allProducts);
        if (oldPrice !== price) {
          db.addPriceHistory("Trần Minh Tuấn", sku, existing.originalPrice || oldPrice, existing.originalPrice || price, oldPrice, price, "Cập nhật giá sản phẩm", "Thành công");
        }
        db.addLog("Trần Minh Tuấn", "ADM-012", "Admin quản lý sản phẩm", "admin", "products", "update", "Cập nhật sản phẩm", sku, name, "success", "normal",
          "Cập nhật sản phẩm " + sku + " (" + name + ").",
          [["Giá bán", formatPrice(oldPrice), formatPrice(price)], ["Tồn kho", String(oldStock), String(stock)]],
          { "Mã sản phẩm": sku, "Danh mục": category }
        );
        tryShowToast("Đã cập nhật sản phẩm " + name + ".");
      } catch (e) {
        tryShowToast("Lỗi lưu database. Thao tác bị hủy.");
      }
    } else {
      var newProduct = {
        id: sku,
        name: name,
        category: category,
        originalPrice: price,
        price: price,
        stock: stock,
        minStock: 10,
        status: status,
        updatedAt: date,
        image: "../../assets/images/product-silk-blazer.png",
        detail: "",
        description: "",
        colors: "",
        sizes: "",
        version: 1
      };
      allProducts.unshift(newProduct);

      try {
        db.saveProducts(allProducts);
        db.addLog("Trần Minh Tuấn", "ADM-012", "Admin quản lý sản phẩm", "admin", "products", "create", "Thêm sản phẩm", sku, name, "success", "normal",
          "Tạo mới sản phẩm " + sku + " (" + name + ").",
          [["Mã SKU", "—", sku], ["Giá bán", "—", formatPrice(price)], ["Tồn kho", "—", String(stock)]],
          { "Mã sản phẩm": sku, "Danh mục": category }
        );
        tryShowToast("Đã thêm sản phẩm " + name + ".");
      } catch (e) {
        tryShowToast("Lỗi lưu database. Thao tác bị hủy.");
      }
    }

    document.querySelector("#product-form").hidden = true;
    renderProducts();
  });

  stopForm.addEventListener("change", function (event) {
    if (event.target.name === "nextStatus") updateStopModalCopy(event.target.value);
  });

  stopForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var allProducts = db.getProducts();
    var product = allProducts.find(function (item) { return item.id === stopProductId; });
    if (!product) return;
    var nextStatus = stopForm.elements.nextStatus.value;
    var oldStatus = product.status;
    product.status = nextStatus;
    product.updatedAt = getFormattedDate();
    product.version = (product.version || 0) + 1;

    try {
      db.saveProducts(allProducts);
      var actionType = nextStatus === "hidden" ? "hide" : "discontinue";
      var actionLabel = nextStatus === "hidden" ? "Tạm ẩn sản phẩm" : "Ngừng kinh doanh sản phẩm";
      var summary = nextStatus === "hidden"
        ? "Tạm ẩn sản phẩm " + product.id + " (" + product.name + ")."
        : "Ngừng kinh doanh sản phẩm " + product.id + " (" + product.name + ").";
      var severity = nextStatus === "discontinued" ? "attention" : "normal";
      db.addLog("Trần Minh Tuấn", "ADM-012", "Admin quản lý sản phẩm", "admin", "products", actionType, actionLabel, product.id, product.name, "success", severity,
        summary,
        [["Trạng thái", statusLabel(oldStatus), statusLabel(nextStatus)]],
        { "Mã sản phẩm": product.id, "Danh mục": product.category }
      );
    } catch (e) {
      tryShowToast("Lỗi lưu database. Thao tác bị hủy.");
      return;
    }

    stopModal.hidden = true;
    document.querySelector("#product-detail").hidden = true;
    document.querySelector(".admin-drawer-backdrop").hidden = true;
    renderProducts();
    tryShowToast(nextStatus === "hidden" ? "Đã tạm ẩn sản phẩm." : "Đã ngừng kinh doanh sản phẩm.");
  });

  renderProducts();
})();
