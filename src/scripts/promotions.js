import { db, getFormattedDate, getFormattedTime } from './db.js';

(function () {
  "use strict";

  var active = "campaigns";
  var panel = document.querySelector("#promo-panel");
  var overlay = document.querySelector("#promo-overlay");
  var rows = { campaigns: [], vouchers: [], bundles: [], budgets: [], logs: [], analytics: [] };

  /* ─── helpers ─── */
  function icon(name) { return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '"></use></svg>'; }
  function toast(text) { var node = document.querySelector("#promo-toast"); node.textContent = text; node.hidden = false; window.setTimeout(function () { node.hidden = true; }, 2400); }
  function fmt(n) { return Number(n).toLocaleString("vi-VN") + "đ"; }
  function fmtShort(n) { if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"; return fmt(n); }
  function fmtDate(s) { if (!s) return ""; var d = new Date(s); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); }
  function fmtRange(a, b) { return fmtDate(a) + " -> " + fmtDate(b); }
  function typeLabel(t) { return { percentage: "Phần trăm", fixed_amount: "Số tiền cố định", free_shipping: "Free ship" }[t] || t; }
  function statusPair(s) { return { active: ["Đang hoạt động", "success"], scheduled: ["Sắp diễn ra", "pending"], paused: ["Tạm dừng", "warning"], stopped: ["Đã dừng", "danger"], expired: ["Hết hạn", "muted"] }[s] || [s, "success"]; }
  function discountDisplay(c) {
    if (c.type === "percentage") return c.discountValue + "%";
    if (c.type === "free_shipping") return "Free ship";
    return fmt(c.discountValue);
  }
  function voucherValueDisplay(v) {
    var val = v.type === "percentage" ? v.value + "%" : v.type === "free_shipping" ? fmt(v.value) : fmt(v.value);
    return val + " / tối đa " + fmt(v.maxDiscount);
  }
  function badge(text, cls) { return '<span class="admin-badge admin-badge--' + cls + '">' + text + "</span>"; }
  function progress(percent, wide) { return '<div class="admin-progress' + (wide ? " admin-progress--wide" : "") + '"><span class="admin-progress__fill admin-progress__fill--' + percent + '"></span></div>'; }
  function actionButton(title, attrs, iconName, extraClass) { return '<button class="admin-icon-button admin-icon-button--sm ' + (extraClass || "") + '" title="' + title + '" ' + attrs + ">" + icon(iconName) + "</button>"; }
  function menuButton(title, attrs, iconName, danger) { return '<button type="button" ' + attrs + (danger ? ' class="admin-table-action-menu__danger"' : "") + ">" + icon(iconName) + "<span>" + title + "</span></button>"; }

  /* ─── data loaders ─── */
  function reloadCampaigns() {
    rows.campaigns = db.getCampaigns().map(function (c) {
      var sp = statusPair(c.status);
      return [c.name, c.code, typeLabel(c.type), discountDisplay(c), c.conditions, fmtRange(c.startAt, c.endAt), sp[0], sp[1], fmtShort(c.budgetUsed) + " / " + fmtShort(c.budgetLimit)];
    });
  }
  function reloadVouchers() {
    rows.vouchers = db.getVouchers().map(function (v) {
      var sp = statusPair(v.status);
      return [v.code, v.name, typeLabel(v.type), voucherValueDisplay(v), "Đơn từ " + fmt(v.minOrder), v.usageCount + " / " + v.usageLimit, fmtDate(v.expiresAt), sp[0], sp[1]];
    });
  }
  function reloadBundles() {
    rows.bundles = db.getBundles().map(function (b) {
      var sp = statusPair(b.status);
      return [b.name, b.code, b.productNames, fmt(b.retailTotal), fmt(b.bundlePrice), fmt(b.saving), fmtRange(b.startAt, b.endAt), sp[0], sp[1]];
    });
  }
  function reloadBudgets() {
    rows.budgets = db.getBudgets().map(function (b) {
      var sp = statusPair(b.status);
      return [b.name, b.scope, fmt(b.limit), fmt(b.used), fmt(b.remaining), b.formula, sp[0], sp[1], b.percent];
    });
  }
  function reloadLogs() {
    var map = { promotions: "Chương trình", vouchers: "Mã giảm giá", budgets: "Ngân sách", accounts: "Tài khoản", orders: "Đơn hàng", products: "Sản phẩm", system: "Hệ thống" };
    rows.logs = db.getLogs().slice(0, 50).map(function (l) {
      var summary = l.summary || (Array.isArray(l.changes) ? l.changes.map(function (c) { return c[0]; }).join(", ") : "");
      return [l.time + " " + l.clock, l.actor, map[l.module] || l.module, l.target, l.actionLabel, summary, l.result === "success" ? "Thành công" : l.result === "warning" ? "Cảnh báo" : "Thất bại"];
    });
  }
  function reloadAnalytics() {
    rows.analytics = db.getCampaigns().map(function (c) {
      return [c.name, typeLabel(c.type), String(c.voucherCount), fmt(c.budgetUsed), String(Math.round(c.budgetUsed / 410000)), fmt(c.budgetUsed), c.budgetUsed > 50000000 ? "Cao" : "Ổn định", statusPair(c.status)[0]];
    });
  }
  function reloadAll() {
    reloadCampaigns(); reloadVouchers(); reloadBundles(); reloadBudgets(); reloadLogs(); reloadAnalytics();
  }

  /* ─── KPIs ─── */
  function kpis() {
    var camps = db.getCampaigns();
    var vouchers = db.getVouchers();
    var budgets = db.getBudgets();
    var running = camps.filter(function (c) { return c.status === "active"; }).length;
    var activeV = vouchers.filter(function (v) { return v.status === "active"; }).length;
    var maxPct = budgets.reduce(function (m, b) { return Math.max(m, b.percent || 0); }, 0);
    var revenue = camps.reduce(function (s, c) { return s + (c.budgetUsed || 0); }, 0);
    var alerts = budgets.filter(function (b) { return b.status === "warning"; }).length + vouchers.filter(function (v) { return v.status === "paused"; }).length;
    var data = [
      ["Chiến dịch đang chạy", running, "clock"],
      ["Voucher hoạt động", activeV, "tag"],
      ["Ngân sách đã dùng", maxPct + "%", "alert"],
      ["Doanh thu khuyến mãi", fmtShort(revenue), "credit-card"],
      ["Cảnh báo cần xử lý", alerts, "alert"]
    ];
    document.querySelector("#promo-kpis").innerHTML = data.map(function (k) {
      return '<article class="admin-kpi-card"><div class="admin-kpi-card__head"><p class="admin-kpi-card__label">' + k[0] + '</p><span class="admin-kpi-card__icon">' + icon(k[2]) + '</span></div><strong class="admin-kpi-card__value">' + k[1] + "</strong></article>";
    }).join("");
  }

  /* ─── filter ─── */
  function filter(place) {
    return '<form class="admin-filter-bar admin-order-filter-bar" data-promo-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-promo-search placeholder="Tìm ' + place + '..."></label><select class="admin-form-control"><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Sắp diễn ra</option><option>Tạm dừng</option><option>Hết hạn</option><option>Đã dừng</option></select><select class="admin-form-control"><option>Tất cả loại</option><option>flash sale</option><option>product discount</option><option>seasonal sale</option><option>combo discount</option></select><select class="admin-form-control"><option>Tất cả cảnh báo</option><option>Sắp hết ngân sách</option><option>Sắp hết hạn</option><option>Trùng khuyến mãi</option></select><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-promo-reset>Đặt lại</button></div></form>';
  }

  /* ─── campaign board ─── */
  function campaignBoard() {
    var camps = db.getCampaigns();
    var budgets = db.getBudgets();
    var vouchers = db.getVouchers();
    return '<section class="admin-promo-board"><div class="admin-card__header"><div><h2 class="admin-card__title">Campaign Overview</h2><p class="admin-card__subtitle">Chọn một chiến dịch để điều hành ngân sách, voucher, sản phẩm áp dụng và rủi ro.</p></div><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="campaigns">Tạo chiến dịch</button></div><div class="admin-tab-content">' + filter("tên chiến dịch") + '<div class="admin-promo-campaign-cards">' + rows.campaigns.map(function (r, i) {
      var c = camps[i] || camps[0];
      var b = budgets.find(function (x) { return x.campaignId === c.id; }) || { percent: 0, remaining: 0 };
      var vCount = vouchers.filter(function (v) { return v.campaignId === c.id; }).length;
      var healthLabel = b.percent >= 80 ? "Cần chú ý" : "Tốt";
      var healthDetail = b.percent >= 80 ? (b.percent >= 90 ? "Sắp hết ngân sách" : "Cần chú ý") : "Sẵn sàng chạy";
      var alerts = b.percent >= 80 ? "1" : "0";
      return '<article class="admin-promo-campaign-card' + (i === 0 ? " is-selected" : "") + '" data-promo-open-workspace="' + i + '"><header><div><strong>' + r[0] + '</strong><small>' + r[2] + ' · ' + r[5] + '</small></div>' + badge(r[6], r[7]) + '</header><div class="admin-promo-health"><span>' + healthLabel + '</span><small>' + healthDetail + '</small></div><div><span class="admin-promo-metric">' + fmtShort(b.used) + " / " + fmtShort(b.limit) + '</span>' + progress(b.percent) + '</div><div class="admin-promo-card-metrics"><span>Sản phẩm <b>' + (c.productCount || 0) + '</b></span><span>Voucher <b>' + vCount + '</b></span><span>Ngân sách <b>' + (b.percent || 0) + '%</b></span><span>Cảnh báo <b>' + alerts + '</b></span></div><footer><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-open-workspace="' + i + '">Mở quản trị</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="button" data-promo-modal="toggle">Tạm dừng</button></footer></article>';
    }).join("") + "</div></div></section>";
  }

  /* ─── workspace ─── */
  function workspace() {
    var camp = db.getCampaigns()[0];
    if (!camp) return "";
    var sp = statusPair(camp.status);
    var b = db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { percent: 0, remaining: 0, used: 0, limit: 0 };
    var vCount = camp.voucherCount || 0;
    return '<section class="admin-card admin-promo-workspace"><div class="admin-card__header admin-promo-workspace__head"><div><p class="admin-product-code">' + camp.code + '</p><h2 class="admin-card__title">' + camp.name + '</h2><p class="admin-card__subtitle">' + typeLabel(camp.type) + ' · ' + fmtRange(camp.startAt, camp.endAt) + ' · ' + (camp.productCount || 0) + ' sản phẩm · ' + vCount + ' voucher</p><div class="admin-status-group">' + badge(sp[0], sp[1]) + (b.percent >= 80 ? badge("Cần chú ý", "warning") : "") + '</div></div><div class="admin-promo-actions"><button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-modal="campaigns">Chỉnh sửa</button><button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-modal="toggle">Tạm dừng</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="budgets">Thiết lập ngân sách</button></div></div><div class="admin-tab-content"><div class="admin-promo-command-grid">' + commandCard("Campaign Health", b.percent >= 80 ? "Cần chú ý" : "Tốt", (b.percent >= 80 ? "Cảnh báo" : "Không có cảnh báo"), b.percent >= 80 ? "Ngân sách đã dùng " + b.percent + "%, voucher sắp hết hạn" : "Sẵn sàng chạy") + commandCard("Budget Control", b.percent + "% đã dùng", "Còn " + fmtShort(b.remaining), progress(b.percent, true)) + commandCard("Voucher Control", vCount + " mã", (vCount > 0 ? Math.round(vCount * 0.82) : 0) + " hoạt động · " + (vCount > 0 ? Math.round(vCount * 0.04) : 0) + " sắp hết hạn", "") + commandCard("Product Scope", (camp.productCount || 0) + " sản phẩm", "", "") + "</div></div></section>";
  }
  function commandCard(title, value, meta, detail) {
    return '<article class="admin-promo-command-card"><span>' + title + '</span><strong>' + value + '</strong><small>' + meta + '</small><div>' + detail + "</div></article>";
  }
  function previewList(items) {
    return '<div class="admin-promo-preview-list">' + items.map(function (item) { return '<div><span>' + item[0] + '</span><strong>' + item[1] + '</strong><small>' + item[2] + "</small></div>"; }).join("") + "</div>";
  }
  function previewSection(title, subtitle, items, actionsHtml) {
    return '<article class="admin-card admin-promo-preview-section"><div class="admin-card__header"><div><h2 class="admin-card__title">' + title + '</h2><p class="admin-card__subtitle">' + subtitle + '</p></div></div><div class="admin-tab-content">' + previewList(items) + '<div class="admin-promo-actions">' + actionsHtml + "</div></div></article>";
  }
  function operationalPreviews() {
    var camp = db.getCampaigns()[0];
    var campVouchers = camp ? db.getVouchers().filter(function (v) { return v.campaignId === camp.id; }) : [];
    var b = camp ? (db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { used: 0, limit: 0, remaining: 0, percent: 0 }) : { used: 0, limit: 0, remaining: 0, percent: 0 };
    var code = camp ? camp.code : "PROMO";
    var vRows = campVouchers.map(function (v) { var sp = statusPair(v.status); return [v.code, v.usageCount + " / " + v.usageLimit, sp[0]]; });
    var recentLogs = rows.logs.slice(0, 3).map(function (l) { return [l[0].split(" ")[0] + " " + l[0].split(" ")[1], l[1], l[4]]; });
    return '<section class="admin-promo-operational-grid">' +
      previewSection("Sản phẩm áp dụng", "PROMOTION_PRODUCT cần chú ý", [["Blazer cropped bouclé", "percentage · 20", "Hợp lệ"], ["Váy maxi tiered floral", "fixed_amount · 150.000đ", "Trùng chương trình"], ["Áo sơ mi linen cổ V", "percentage · 15", "Bán tốt"]], '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-drawer="campaignProducts" data-promo-index="0">Xem tất cả sản phẩm</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="promotionProduct">Thêm sản phẩm</button>') +
      previewSection("Voucher liên kết", "VOUCHER có promo_id = " + code, vRows.length ? vRows : [["Không có voucher", "", ""]], '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-drawer="campaignVouchers" data-promo-index="0">Quản lý voucher</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="vouchers">Tạo voucher</button>') +
      previewSection("Ngân sách", "Kiểm soát theo hạn mức PROMOTION", [["Ngân sách tối đa", fmt(b.limit), "budget_limit"], ["Tổng tiền đã giảm", fmt(b.used), "total_discount_issued"], ["Còn lại", fmt(b.remaining), b.percent + "% đã dùng"]], '<button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="budgets">Thiết lập ngân sách</button>') +
      previewSection("Hiệu quả nhanh", "Đánh giá campaign có nên tiếp tục", [["Doanh thu từ campaign", fmtShort(b.used * 2.3), (Math.round(b.used * 2.3 / 410000)) + " đơn"], ["Tỷ lệ sử dụng voucher", camp ? Math.round((camp.voucherCount > 0 ? 45 : 0)) + "%" : "0%", camp ? (Math.round(camp.voucherCount * 0.45) + " / " + camp.voucherCount + " lượt") : "0"], ["Tổng giá trị giảm", fmtShort(b.used), b.percent + "% ngân sách"]], '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-report="campaign">Xem báo cáo chi tiết</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-campaign-export>Xuất báo cáo chiến dịch</button>') +
      previewSection("Nhật ký gần đây", "Thao tác mới nhất", recentLogs.length ? recentLogs : [["Chưa có nhật ký", "", ""]], '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-drawer="campaignLogs" data-promo-index="0">Xem toàn bộ nhật ký</button>') +
      "</section>";
  }

  /* ─── workspace tab content ─── */
  function workspaceContent(tab) {
    var camp = db.getCampaigns()[0];
    if (tab === "products") return '<div class="admin-promo-workspace-toolbar"><p class="admin-note">Mỗi sản phẩm trong chương trình có thể có mức giảm riêng.</p><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="promotionProduct">Thêm sản phẩm áp dụng</button></div>' + baseTable(["Sản phẩm", "Danh mục", "Giá gốc", "Hình thức giảm", "Giá trị giảm", "Giá sau giảm", "Trạng thái", "Thao tác"], [["Blazer cropped bouclé<small class='admin-order-subtext'>BCR-004</small>", "Áo khoác", "2.450.000đ", "percentage", "20", "1.960.000đ", badge("Hợp lệ", "success"), actions("campaigns", 10)], ["Váy maxi tiered floral<small class='admin-order-subtext'>VMX-012</small>", "Váy", "1.290.000đ", "fixed_amount", "150.000đ", "1.140.000đ", badge("Trùng chương trình", "warning"), actions("campaigns", 11)]]);
    if (tab === "vouchers") {
      var allV = db.getVouchers();
      var campV = camp ? allV.filter(function (v) { return v.campaignId === camp.id; }) : allV;
      var activeCount = campV.filter(function (v) { return v.status === "active"; }).length;
      var totalUsage = campV.reduce(function (s, v) { return s + v.usageCount; }, 0);
      return '<div class="admin-promo-workspace-toolbar"><div class="admin-promo-summary"><span>' + campV.length + ' mã phát hành</span><span>' + activeCount + ' còn hoạt động</span><span>' + totalUsage + ' lượt dùng</span></div><div class="admin-promo-actions"><button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-modal="vouchers">Tạo voucher cho chiến dịch</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="bulk">Sinh mã hàng loạt</button></div></div>' + baseTable(["Mã voucher", "Chiết khấu", "Giá trị / tối đa", "Điều kiện", "Lượt dùng", "Nhóm khách", "Hết hạn", "Trạng thái", "Thao tác"], rows.vouchers.map(function (r, i) { return ["<strong>" + r[0] + "</strong><small class='admin-order-subtext'>" + r[1] + "</small>", r[2], r[3], r[4], r[5], (allV[i] || {}).customerGroup || "all_users", r[6], badge(r[7], r[8]), actions("vouchers", i)]; }));
    }
    if (tab === "budget") {
      var b = camp ? (db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { limit: 0, used: 0, remaining: 0, percent: 0 }) : { limit: 0, used: 0, remaining: 0, percent: 0 };
      return promoStats([["Ngân sách tối đa", fmt(b.limit)], ["Tổng tiền đã giảm", fmt(b.used)], ["Ngân sách còn lại", fmt(b.remaining)], ["Tỷ lệ sử dụng", b.percent + "%"]]) + '<div class="admin-price-preview admin-promo-budget-panel"><span>Tiến độ ngân sách</span>' + progress(b.percent, true) + '<span>Ngân sách dự kiến = Số mã phát hành × Mức giảm tối đa mỗi mã</span><strong>' + (camp ? camp.voucherCount : 0) + ' mã × ' + fmt(camp ? camp.maxDiscount : 0) + ' = ' + fmtShort((camp ? camp.voucherCount : 0) * (camp ? camp.maxDiscount : 0)) + '</strong><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="budgets">Thiết lập ngân sách</button></div>';
    }
    if (tab === "effect") {
      var b2 = camp ? (db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { used: 0 }) : { used: 0 };
      return promoStats([["Doanh thu chiến dịch", fmtShort(b2.used * 2.3)], ["Số đơn", String(Math.round(b2.used * 2.3 / 410000))], ["Tỷ lệ dùng voucher", "45%"], ["Tổng giá trị giảm", fmtShort(b2.used)]]) + baseTable(["Chỉ số", "Giai đoạn khuyến mãi", "Giai đoạn đối chiếu", "Chênh lệch", "Nhận xét"], [["Doanh thu", fmtShort(b2.used * 2.3), fmtShort(b2.used * 1.8), "+33%", "Tăng tốt"], ["Số đơn", String(Math.round(b2.used * 2.3 / 410000)), String(Math.round(b2.used * 1.8 / 410000)), "+30%", "Ổn định"]]);
    }
    if (tab === "logs") return baseTable(["Thời gian", "Admin", "Hành động", "Nhóm", "Đối tượng", "Dữ liệu cũ -> mới", "Kết quả"], rows.logs.map(function (r) { return [r[0], r[1], r[4], r[2], r[3], r[5], badge(r[6], r[6] === "Thành công" ? "success" : "warning")]; }));
    if (camp) {
      var b3 = db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { percent: 0, used: 0 };
      return '<div class="admin-promo-overview-grid"><article class="admin-product-form__section"><h3>Thông tin chiến dịch</h3><div class="admin-promo-compact-list"><span>Tên chương trình</span><strong>' + camp.name + '</strong><span>Loại chương trình</span><strong>' + typeLabel(camp.type) + '</strong><span>Danh mục áp dụng</span><strong>' + (camp.categories ? camp.categories.join(", ") : "Tất cả") + '</strong><span>Trạng thái</span><strong>' + statusPair(camp.status)[0] + '</strong><span>Thời gian</span><strong>' + fmtRange(camp.startAt, camp.endAt) + '</strong></div></article><article class="admin-product-form__section"><h3>Tình trạng vận hành</h3>' + promoStats([["Ngân sách đã dùng", b3.percent + "%"], ["Tổng tiền đã giảm", fmtShort(b3.used)], ["Voucher liên kết", String(camp.voucherCount || 0)], ["Sản phẩm áp dụng", String(camp.productCount || 0)]]) + '</article></article></div>';
    }
    return "";
  }
  function campaignView() { return '<div class="admin-promo-console">' + campaignBoard() + workspace() + operationalPreviews() + "</div>"; }
  function viewHeader(title, desc, actionsHtml) {
    return '<div class="admin-promo-view-head"><div><h2 class="admin-card__title">' + title + '</h2><p class="admin-card__subtitle">' + desc + '</p></div><div class="admin-promo-actions">' + (actionsHtml || "") + "</div></div>";
  }
  function summaryChips(items) {
    return '<div class="admin-promo-summary admin-promo-summary--view">' + items.map(function (item) { return "<span>" + item[0] + " <b>" + item[1] + "</b></span>"; }).join("") + "</div>";
  }
  function voucherView() {
    var allV = db.getVouchers();
    var campaigns = db.getCampaigns();
    var activeCount = allV.filter(function (v) { return v.status === "active"; }).length;
    var soonExpiry = allV.filter(function (v) { return v.status === "paused"; }).length;
    var usedUp = 0;
    var independent = allV.filter(function (v) { return !v.campaignId; }).length;
    var linked = allV.filter(function (v) { return !!v.campaignId; }).length;
    var head = viewHeader("Mã giảm giá", "Quản lý các voucher khách hàng nhập hoặc chọn tại checkout, bao gồm mã độc lập và mã liên kết với chiến dịch.", '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-modal="bulk">Sinh mã hàng loạt</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="vouchers">Tạo mã giảm giá</button>');
    var summary = summaryChips([["Tất cả", String(allV.length)], ["Hoạt động", String(activeCount)], ["Sắp hết hạn", String(soonExpiry)], ["Đã dùng hết", String(usedUp)], ["Độc lập", String(independent)], ["Thuộc chiến dịch", String(linked)]]);
    var filters = '<form class="admin-filter-bar admin-order-filter-bar" data-promo-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-promo-search placeholder="Tìm code hoặc tên voucher..."></label><select class="admin-form-control"><option>Tất cả trạng thái</option><option>Hoạt động</option><option>Tạm dừng</option><option>Hết hạn</option><option>Đã dùng hết</option><option>Đã hủy</option></select><select class="admin-form-control"><option>Tất cả loại giảm</option><option>fixed_amount</option><option>percentage</option><option>free_shipping</option></select><select class="admin-form-control"><option>Tất cả liên kết</option><option>Độc lập</option><option>Thuộc chiến dịch</option></select><select class="admin-form-control"><option>Tất cả nhóm khách</option><option>new_user</option><option>loyal_user</option><option>churn_risk_user</option><option>all_users</option></select><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-promo-reset>Đặt lại</button></div></form>';
    return head + summary + filters + baseTable(["Mã voucher", "Liên kết", "Loại giảm", "Điều kiện", "Lượt dùng", "Hạn dùng", "Trạng thái", "Thao tác"], allV.map(function (v, i) {
      var r = rows.vouchers[i] || ["", "", "", "", "", "", "", "", ""];
      var campName = v.campaignId ? (campaigns.find(function (c) { return c.id === v.campaignId; }) || {}).name || "Chiến dịch" : "Độc lập";
      return ["<strong>" + r[0] + "</strong><small class='admin-order-subtext'>" + r[1] + "</small>", campName, r[2], r[4] + "<small class='admin-order-subtext'>" + (v.customerGroup || "all_users") + "</small>", r[5] + "<small class='admin-order-subtext'>1 lượt/khách</small>", r[6], badge(r[7], r[8]), actions("vouchers", i)];
    }));
  }
  function comboView() {
    var allB = db.getBundles();
    var head = viewHeader("Combo/Bundle", "Quản lý các set phối sẵn, sản phẩm thành phần, giá combo và hiệu quả bán.", '<button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-modal="bundles">Tạo combo</button>');
    var summary = summaryChips([["Tất cả", String(allB.length)], ["Đang hoạt động", String(allB.filter(function (b) { return b.status === "active"; }).length)], ["Sắp diễn ra", String(allB.filter(function (b) { return b.status === "scheduled"; }).length)], ["Cần kiểm tra giá", "0"], ["Tạm dừng", "0"]]);
    var filters = '<form class="admin-filter-bar admin-order-filter-bar" data-promo-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-promo-search placeholder="Tìm tên combo hoặc SKU..."></label><select class="admin-form-control"><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Sắp diễn ra</option><option>Tạm dừng</option><option>Hết hạn</option><option>Cần kiểm tra</option></select><select class="admin-form-control"><option>Tất cả cảnh báo giá</option><option>Cần kiểm tra giá</option><option>Giá hợp lệ</option></select><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-promo-reset>Đặt lại</button></div></form>';
    return head + summary + filters + baseTable(["Combo", "Thành phần", "Tổng giá lẻ", "Giá combo", "Tiết kiệm", "Tồn kho khả dụng", "Hiệu quả nhanh", "Trạng thái", "Thao tác"], allB.map(function (b, i) {
      var r = rows.bundles[i] || ["", "", "", "", "", "", "", "", ""];
      var effect = b.salesCount + " combo · " + fmtShort(b.revenue);
      return ["<strong>" + r[0] + "</strong><small class='admin-order-subtext'>" + r[1] + "</small>", r[2], r[3], r[4], r[5] + "<small class='admin-order-subtext'>so với giá lẻ</small>", b.salesCount + " set", effect, badge(r[7], r[8]), actions("bundles", i)];
    }));
  }
  function logView() {
    var filters = '<form class="admin-filter-bar admin-order-filter-bar" data-promo-filter><label class="admin-search-field">' + icon("search") + '<input class="admin-form-control" type="search" data-promo-search placeholder="Tìm campaign, voucher, combo..."></label><select class="admin-form-control"><option>Tất cả nhóm</option><option>Promotion</option><option>Promotion Product</option><option>Voucher</option><option>Combo</option><option>Budget</option><option>System</option></select><select class="admin-form-control"><option>Tất cả admin</option></select><input class="admin-form-control" type="date"><select class="admin-form-control"><option>Tất cả kết quả</option><option>Thành công</option><option>Thất bại</option></select><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset" data-promo-reset>Đặt lại</button></div></form>';
    return filters + baseTable(["Thời gian", "Admin", "Vai trò", "Nhóm", "Đối tượng", "Hành động", "Dữ liệu cũ -> mới", "Kết quả"], rows.logs.map(function (r) { return [r[0], r[1], "Quản trị viên", r[2], r[3], r[4], r[5], badge(r[6], r[6] === "Thành công" ? "success" : "warning")]; }));
  }
  function actionMenu(type, index) {
    var id = "promo-action-menu-" + type + "-" + index;
    var items = {
      campaigns: [menuButton("Mở workspace", 'data-promo-open-workspace="0"', "dashboard"), menuButton("Cập nhật chương trình", 'data-promo-modal="campaigns"', "edit"), menuButton("Xem ngân sách", 'data-promo-workspace-tab="budget"', "alert"), menuButton("Xem nhật ký", "data-promo-open-logs", "log"), menuButton("Tạm dừng / kích hoạt", 'data-promo-modal="toggle"', "refresh", true)],
      vouchers: [menuButton("Cập nhật mã giảm giá", 'data-promo-modal="vouchers"', "edit"), menuButton("Tạm dừng mã", 'data-promo-modal="voucherPause"', "refresh"), menuButton("Hủy mã", 'data-promo-modal="voucherCancel"', "alert", true)],
      bundles: [menuButton("Cập nhật combo", 'data-promo-modal="bundles"', "edit"), menuButton("Xem nhật ký", "data-promo-open-logs", "log"), menuButton("Dừng combo", 'data-promo-modal="comboPause"', "alert", true)],
      budgets: [menuButton("Cập nhật ngân sách", 'data-promo-modal="budgets"', "edit"), menuButton("Xem cảnh báo", 'data-promo-modal="budgetWarning"', "alert"), menuButton("Dừng chương trình liên quan", 'data-promo-modal="stoppedProgram"', "lock", true)]
    }[type] || [];
    return '<span class="admin-promo-row-actions"><button class="admin-icon-button admin-icon-button--sm" title="Thao tác" aria-label="Thao tác" data-promo-action-menu="' + id + '">' + icon("edit") + '</button><span class="admin-dropdown admin-table-action-menu" id="' + id + '" hidden>' + items.join("") + "</span></span>";
  }
  function actions(type, index) {
    var common = actionButton("Xem chi tiết", 'data-promo-drawer="' + type + '" data-promo-index="' + index + '"', "eye");
    if (type === "campaigns" || type === "vouchers" || type === "bundles" || type === "budgets") return '<div class="admin-table-actions">' + common + actionMenu(type, index) + "</div>";
    return '<div class="admin-table-actions">' + common + "</div>";
  }
  function baseTable(headers, data) { return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' + headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" + data.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + cell + "</td>"; }).join("") + "</tr>"; }).join("") + '</tbody></table></div><div class="admin-card__footer"><p class="admin-table-note">Hiển thị ' + data.length + ' mục</p><nav class="admin-pagination"><button type="button">←</button><button class="is-active" type="button">1</button><button type="button">2</button><button type="button">→</button></nav></div>'; }
  function render() {
    reloadAll();
    if (active === "vouchers") panel.innerHTML = voucherView();
    else if (active === "bundles") panel.innerHTML = comboView();
    else if (active === "logs") panel.innerHTML = logView();
    else panel.innerHTML = campaignView();
  }
  function updatePromoConditionalFields(form) {
    if (!form) return;
    var discountType = (form.querySelector("[data-promo-discount-type]") || {}).value || "";
    var scopeType = (form.querySelector("[data-promo-scope-type]") || {}).value || "";
    form.querySelectorAll("[data-promo-condition]").forEach(function (group) {
      var rule = group.dataset.promoCondition || "";
      var visible = rule === "discount:" + discountType || rule === "scope:" + scopeType;
      group.hidden = !visible;
      group.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (visible) { if (field.dataset.requiredWhenVisible === "true") field.required = true; }
        else { if (field.required) field.dataset.requiredWhenVisible = "true"; field.required = false; field.value = ""; }
      });
    });
    form.querySelectorAll("[data-promo-discount-value]").forEach(function (group) {
      var visible = group.dataset.promoDiscountValue === "discount:" + discountType;
      group.hidden = !visible;
      group.querySelectorAll("input, select, textarea").forEach(function (field) {
        field.required = visible && field.dataset.requiredWhenVisible === "true";
        if (!visible) field.value = "";
      });
    });
  }
  function definitionList(items) {
    return '<dl class="admin-data-list">' + items.map(function (item) { return "<div><dt>" + item[0] + "</dt><dd>" + item[1] + "</dd></div>"; }).join("") + "</dl>";
  }
  function promoStats(items) {
    return '<div class="admin-promo-detail-grid">' + items.map(function (item) { return '<article><span>' + item[0] + '</span><strong>' + item[1] + "</strong></article>"; }).join("") + "</div>";
  }

  /* ─── drawer content ─── */
  function drawerContent(type, source, tab) {
    var allV = db.getVouchers();
    var allLogs = db.getLogs();
    if (type === "campaignProducts") return baseTable(["Sản phẩm", "SKU", "Danh mục", "Giá gốc", "Hình thức giảm", "Giá trị giảm", "Giá sau giảm", "Trạng thái", "Thao tác"], [["Blazer cropped bouclé", "BCR-004", "Áo khoác", "2.450.000đ", "percentage", "20", "1.960.000đ", badge("Hợp lệ", "success"), actions("campaigns", 20)], ["Váy maxi tiered floral", "VMX-012", "Váy", "1.290.000đ", "fixed_amount", "150.000đ", "1.140.000đ", badge("Trùng chương trình", "warning"), actions("campaigns", 21)], ["Áo sơ mi linen cổ V", "LSV-001", "Áo", "450.000đ", "percentage", "15", "382.500đ", badge("Bán tốt", "success"), actions("campaigns", 22)]]);
    if (type === "campaignVouchers") {
      var campaigns = db.getCampaigns();
      var logModuleMap = { promotions: "Chương trình", vouchers: "Mã giảm giá", budgets: "Ngân sách" };
      var logRows = allLogs.slice(0, 20).map(function (l) { return [l.time + " " + l.clock, l.actor, logModuleMap[l.module] || l.module, l.target, l.actionLabel, l.summary || "", l.result === "success" ? "Thành công" : "Thất bại"]; });
      var vMapped = allV.map(function (v, i) {
        var r = rows.vouchers[i] || ["", "", "", "", "", "", "", "", ""];
        var campName = v.campaignId ? (campaigns.find(function (c) { return c.id === v.campaignId; }) || {}).name || "" : "";
        return [r[0], campName || r[1], r[2], r[3], r[4], r[5], v.customerGroup || "all_users", r[6], badge(r[7], r[8]), actions("vouchers", i)];
      });
      if (tab === 4 || tab === "4") {
        return baseTable(["Thời gian", "Người thao tác", "Hành động", "Nội dung"], logRows.map(function (log) { return [log[0], log[1], log[4], log[5]]; }));
      }
      return baseTable(["Mã", "Tên", "Loại giảm", "Giá trị / tối đa", "Đơn tối thiểu", "Lượt dùng", "Nhóm khách", "Hết hạn", "Trạng thái", "Thao tác"], vMapped);
    }
    if (type === "campaignLogs") {
      var logModuleMap2 = { promotions: "Chương trình", vouchers: "Mã giảm giá", budgets: "Ngân sách" };
      return baseTable(["Thời gian", "Admin", "Vai trò", "Nhóm", "Đối tượng", "Hành động", "Dữ liệu cũ -> mới", "Kết quả"], allLogs.slice(0, 30).map(function (l) { return [l.time + " " + l.clock, l.actor, "Quản trị viên", logModuleMap2[l.module] || l.module, l.target, l.actionLabel, l.summary || "", badge(l.result === "success" ? "Thành công" : "Thất bại", "success")]; }));
    }
    if (type === "logs") return definitionList([["Thời gian", source[0]], ["Người thao tác", source[1]], ["Nhóm chức năng", source[2]], ["Đối tượng", source[3]], ["Hành động", source[4]], ["Dữ liệu cũ -> mới", source[5]], ["Kết quả", badge(source[6], "success")]]);
    if ((type === "campaigns" && (tab === 4 || tab === "4")) || (type === "bundles" && (tab === 4 || tab === "4")) || (type !== "campaigns" && type !== "bundles" && type !== "campaignProducts" && type !== "campaignVouchers" && type !== "campaignLogs" && type !== "logs" && (tab === 3 || tab === "3"))) {
      var logModuleMap3 = { promotions: "Chương trình", vouchers: "Mã giảm giá", budgets: "Ngân sách" };
      return baseTable(["Thời gian", "Người thao tác", "Hành động", "Nội dung"], allLogs.slice(0, 20).map(function (log) { return [log.time + " " + log.clock, log.actor, log.actionLabel, log.summary || ""]; }));
    }
    if (type === "campaigns") {
      var camp = db.getCampaigns()[Number(index)] || db.getCampaigns()[0];
      var b = camp ? (db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { used: 0, limit: 0, remaining: 0, percent: 0 }) : { used: 0, limit: 0, remaining: 0, percent: 0 };
      if (tab === 1 || tab === "1") return definitionList([["Điều kiện áp dụng", camp ? camp.conditions : ""], ["Nhóm sản phẩm", camp && camp.categories ? camp.categories.join(", ") : "Tất cả"], ["Nhóm khách hàng", camp && camp.scopeType === "customer_group" ? "Member" : "Tất cả"], ["Ghi chú backend", "Các trường categoryIds/productIds/customerGroupId chỉ bật theo lựa chọn phạm vi trong modal."]]);
      if (tab === 2 || tab === "2") return '<div class="admin-price-preview"><span>Ngân sách tối đa</span><strong>' + fmt(b.limit) + '</strong><span>Tổng giá trị đã giảm</span><strong>' + fmt(b.used) + '</strong>' + progress(b.percent, true) + '<span>Số mã tối đa được phép phát hành: 1.000 mã</span></div>';
      if (tab === 3 || tab === "3") return promoStats([["Số đơn", String(Math.round(b.used * 2.3 / 410000))], ["Doanh thu", fmtShort(b.used * 2.3)], ["Lượt dùng", String(camp ? camp.voucherCount : 0)], ["Ngân sách đã dùng", fmtShort(b.used)]]);
      return definitionList([["Mã chương trình", camp ? camp.code : ""], ["Loại giảm", camp ? typeLabel(camp.type) : ""], ["Giá trị giảm", camp ? discountDisplay(camp) : ""], ["Thời gian hiệu lực", camp ? fmtRange(camp.startAt, camp.endAt) : ""], ["Hiệu quả ngắn", ""]]);
    }
    if (type === "vouchers") {
      var vIdx = Number(index);
      var v = allV[vIdx] || allV[0];
      if (tab === 1 || tab === "1") return definitionList([["Điều kiện dùng mã", v ? "Đơn từ " + fmt(v.minOrder) : ""], ["Lượt dùng", v ? v.usageCount + " / " + v.usageLimit : ""], ["Ngày hết hạn", v ? fmtDate(v.expiresAt) : ""], ["Ràng buộc", "Mỗi mã/mỗi khách có giới hạn riêng để backend kiểm tra trước khi áp dụng."]]);
      if (tab === 2 || tab === "2") return promoStats([["Đã dùng", v ? String(v.usageCount) : "0"], ["Tỷ lệ chuyển đổi", "18%"], ["Doanh thu từ mã", "42M"], ["Chi phí giảm", "8,1M"]]);
      return definitionList([["Mã giảm giá", v ? v.code : ""], ["Chiến dịch", v ? v.campaignId : ""], ["Loại giảm", v ? typeLabel(v.type) : ""], ["Giá trị / giảm tối đa", v ? voucherValueDisplay(v) : ""], ["Trạng thái", v ? badge(statusPair(v.status)[0], statusPair(v.status)[1]) : ""]]);
    }
    if (type === "bundles") {
      var bIdx = Number(index);
      var bObj = db.getBundles()[bIdx] || db.getBundles()[0];
      if (tab === 1 || tab === "1") return '<div class="admin-promo-composition"><button type="button" data-promo-product-detail="0"><span><strong>Áo linen cổ V</strong><small>LSV-001 · Áo · Trắng / M</small></span><span>Số lượng 1</span></button><button type="button" data-promo-product-detail="1"><span><strong>Quần culottes lưng cao</strong><small>QCL-002 · Quần · Đen / M</small></span><span>Số lượng 1</span></button><button type="button" data-promo-product-detail="2"><span><strong>Thắt lưng da bản nhỏ</strong><small>TL-003 · Phụ kiện · Nâu</small></span><span>Số lượng 1</span></button></div>';
      if (tab === 2 || tab === "2") return definitionList([["Điều kiện", "Áp dụng khi mua đủ toàn bộ sản phẩm thành phần"], ["Không cộng dồn", "Không áp dụng cùng voucher giảm trực tiếp"], ["Thời gian", bObj ? fmtRange(bObj.startAt, bObj.endAt) : ""]]);
      if (tab === 3 || tab === "3") return promoStats([["Tổng giá lẻ", bObj ? fmt(bObj.retailTotal) : ""], ["Giá combo", bObj ? fmt(bObj.bundlePrice) : ""], ["Tiết kiệm", bObj ? fmt(bObj.saving) : ""], ["Đơn combo", bObj ? String(bObj.salesCount) : "0"]]);
      return definitionList([["Mã combo", bObj ? bObj.code : ""], ["Sản phẩm thành phần", bObj ? bObj.productNames : ""], ["Tổng giá lẻ", bObj ? fmt(bObj.retailTotal) : ""], ["Giá combo", bObj ? fmt(bObj.bundlePrice) : ""], ["Thời gian", bObj ? fmtRange(bObj.startAt, bObj.endAt) : ""]]);
    }
    if (type === "budgets") {
      var bgtIdx = Number(index);
      var bgt = db.getBudgets()[bgtIdx] || db.getBudgets()[0];
      if (tab === 1 || tab === "1") return '<div class="admin-price-preview"><span>Tiến độ sử dụng</span><strong>' + (bgt ? fmt(bgt.used) : "0") + " / " + (bgt ? fmt(bgt.limit) : "0") + "</strong>" + progress(bgt ? bgt.percent : 0, true) + '<span>Còn lại ' + (bgt ? fmt(bgt.remaining) : "0") + "</span></div>";
      if (tab === 2 || tab === "2") return promoStats([["Ngân sách tổng", bgt ? fmt(bgt.limit) : ""], ["Đã dùng", bgt ? fmt(bgt.used) : ""], ["Còn lại", bgt ? fmt(bgt.remaining) : ""], ["Ngưỡng cảnh báo", "80%"]]);
      return definitionList([["Tên ngân sách", bgt ? bgt.name : ""], ["Phạm vi", bgt ? bgt.scope : ""], ["Công thức kiểm soát", bgt ? bgt.formula : ""], ["Trạng thái", bgt ? badge(statusPair(bgt.status)[0], statusPair(bgt.status)[1]) : ""], ["Quy tắc cảnh báo", "Cảnh báo khi ngân sách dự kiến hoặc thực tế vượt ngưỡng đã cấu hình."]]);
    }
    return "";
  }
  function drawer(type, index, tab) {
    tab = Number(tab || 0);
    var allData = { campaigns: db.getCampaigns(), vouchers: db.getVouchers(), bundles: db.getBundles(), budgets: db.getBudgets() };
    var source = allData[type] ? allData[type][Number(index)] : db.getCampaigns()[0];
    var displaySource = rows[type] ? rows[type][Number(index)] || rows.campaigns[0] : rows.campaigns[0];
    var specialDrawer = type === "campaignProducts" || type === "campaignVouchers" || type === "campaignLogs";
    var tabs = specialDrawer ? ["Danh sách"] : type === "logs" ? ["Chi tiết"] : type === "bundles" ? ["Tổng quan", "Sản phẩm thành phần", "Điều kiện áp dụng", "Hiệu quả", "Nhật ký"] : type === "campaigns" ? ["Tổng quan", "Phạm vi áp dụng", "Ngân sách", "Hiệu quả", "Nhật ký"] : type === "vouchers" ? ["Tổng quan", "Điều kiện sử dụng", "Hiệu quả sử dụng", "Nhật ký"] : ["Tổng quan", type === "budgets" ? "Sử dụng ngân sách" : "Phạm vi áp dụng", "Hiệu quả", "Nhật ký"];
    var statusVal, statusCls;
    if (type === "campaigns" && source) { var sp = statusPair(source.status); statusVal = sp[0]; statusCls = sp[1]; }
    else if (type === "vouchers" && source) { var sp2 = statusPair(source.status); statusVal = sp2[0]; statusCls = sp2[1]; }
    else if (type === "bundles" && source) { var sp3 = statusPair(source.status); statusVal = sp3[0]; statusCls = sp3[1]; }
    else if (type === "budgets" && source) { var sp4 = statusPair(source.status); statusVal = sp4[0]; statusCls = sp4[1]; }
    else { statusVal = "Thành công"; statusCls = "success"; }
    var title = type === "campaignProducts" ? "Sản phẩm áp dụng" : type === "campaignVouchers" ? "Voucher liên kết" : type === "campaignLogs" ? "Nhật ký chiến dịch" : source ? (source.name || source.code || source[0] || "") : "";
    var code = specialDrawer ? "SALE-SUMMER" : source ? (source.code || source[1] || "PROMO") : "PROMO";
    overlay.innerHTML = '<div class="admin-drawer-backdrop" data-promo-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><p class="admin-product-code">' + code + '</p><h2 class="admin-section__title">' + title + '</h2><div class="admin-status-group">' + badge(statusVal, statusCls) + '</div></div><div class="admin-drawer__actions">' + (type !== "logs" ? '<button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-modal="' + type + '">Chỉnh sửa</button><button class="admin-btn admin-btn--secondary admin-btn--sm" type="button" data-promo-open-logs>Xem nhật ký</button>' : "") + '<button class="admin-icon-button" data-promo-close>×</button></div></header><nav class="admin-drawer__tabs">' + tabs.map(function (name, i) { return '<button class="admin-drawer__tab' + (i === tab ? " is-active" : "") + '" type="button" data-promo-drawer="' + type + '" data-promo-index="' + index + '" data-promo-drawer-tab="' + i + '">' + name + "</button>"; }).join("") + '</nav><div class="admin-drawer__body"><h3 class="admin-drawer__section">' + tabs[tab] + '</h3>' + drawerContent(type, displaySource, tab) + "</div></aside>";
  }
  function report(scope) {
    var isCampaign = scope === "campaign";
    var camp = db.getCampaigns()[0];
    var b = camp ? (db.getBudgets().find(function (x) { return x.campaignId === camp.id; }) || { used: 0, limit: 0 }) : { used: 0, limit: 0 };
    var title = isCampaign ? "Báo cáo hiệu quả " + (camp ? camp.name : "") : "Báo cáo hiệu quả khuyến mãi";
    var code = isCampaign ? (camp ? camp.code : "") : "TOÀN MODULE";
    var stats = isCampaign
      ? promoStats([["Doanh thu từ campaign", fmtShort(b.used * 2.3)], ["Số đơn có khuyến mãi", String(Math.round(b.used * 2.3 / 410000))], ["Tỷ lệ sử dụng voucher", "45%"], ["Tổng giá trị giảm", fmtShort(b.used)], ["Hiệu quả ngân sách", b.percent >= 80 ? "Cao" : "Tốt"]])
      : promoStats([["Tỷ lệ sử dụng mã", "45%"], ["Doanh thu đơn có khuyến mãi", "224M"], ["Số đơn có khuyến mãi", "830"], ["Tổng giá trị giảm", "82M"], ["Hiệu quả nhất", camp ? camp.name : ""]]);
    var rowsData = isCampaign
      ? [["Product discount", (camp ? camp.productCount : 0) + " sản phẩm", "186", "78M", "28,4M", "61%"], ["Voucher", (camp ? camp.voucherCount : 0) + " mã", "226", "42M", "18,1M", "33%"], ["Combo", db.getBundles().length + " combo", "38", "8M", "7,9M", "6%"]]
      : rows.analytics.map(function (r) { return r; }).concat([["Voucher độc lập", "Voucher", "226", "42M", "118", "8,1M", "Ổn định", "Hoạt động"], ["Office Linen Set", "Combo", "86", "119M", "86", "16,3M", "Cao", "Đang hoạt động"]]);
    var table = isCampaign
      ? baseTable(["Nguồn giảm", "Phạm vi", "Số đơn", "Doanh thu", "Tổng giảm", "Tỷ lệ"], rowsData)
      : baseTable(["Chiến dịch", "Loại", "Lượt dùng", "Doanh thu", "Số đơn", "Tổng giảm", "Hiệu quả", "Trạng thái"], rowsData);
    var compare = isCampaign ? "" : '<h3 class="admin-drawer__section">So sánh giai đoạn</h3>' + baseTable(["Chỉ số", "Trong khuyến mãi", "Giai đoạn đối chiếu", "Chênh lệch"], [["Số đơn", "830", "620", "+34%"], ["Doanh thu", "224M", "180M", "+24%"], ["AOV", "270K", "290K", "-7%"]]);
    overlay.innerHTML = '<div class="admin-drawer-backdrop" data-promo-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><p class="admin-product-code">' + code + '</p><h2 class="admin-section__title">' + title + '</h2><p class="admin-card__subtitle">Báo cáo chỉ dùng để xem nhanh và xuất dữ liệu, không chỉnh sửa tại đây.</p></div><button class="admin-icon-button" data-promo-close>×</button></header><div class="admin-drawer__body">' + stats + '<h3 class="admin-drawer__section">So sánh hiệu quả</h3>' + table + compare + "</div></aside>";
  }
  function readonlyProductModal(index) {
    var products = [
      { name: "Áo linen cổ V", sku: "LSV-001", category: "Áo", price: "450.000đ", stock: "42", color: "Trắng", size: "M", status: "Đang bán" },
      { name: "Quần culottes lưng cao", sku: "QCL-002", category: "Quần", price: "680.000đ", stock: "28", color: "Đen", size: "M", status: "Đang bán" },
      { name: "Thắt lưng da bản nhỏ", sku: "TL-003", category: "Phụ kiện", price: "450.000đ", stock: "36", color: "Nâu", size: "Freesize", status: "Đang bán" }
    ];
    var product = products[Number(index)] || products[0];
    function field(label, value) { return '<label class="admin-form-group"><span class="admin-form-label">' + label + '</span><input class="admin-form-control" value="' + value + '" disabled></label>'; }
    overlay.innerHTML = '<div class="admin-modal-overlay"><section class="admin-modal admin-modal--lg admin-product-modal admin-promo-product-readonly"><header class="admin-modal__header"><div><p class="label-upper">Chi tiết sản phẩm</p><h2>' + product.name + '</h2></div><button class="admin-icon-button" type="button" data-promo-close>×</button></header><div class="admin-modal__body admin-product-form"><section class="admin-product-form__section"><h3>Thông tin cơ bản</h3>' + field("Tên sản phẩm", product.name) + field("Mã SKU", product.sku) + field("Danh mục", product.category) + field("Trạng thái", product.status) + '</section><section class="admin-product-form__section"><h3>Giá và tồn kho</h3>' + field("Giá bán", product.price) + field("Tồn kho", product.stock) + field("Màu sắc", product.color) + field("Kích thước", product.size) + '</section><section class="admin-product-form__section admin-product-form__section--full"><h3>Mô tả</h3><textarea class="admin-form-control admin-form-textarea" disabled>Sản phẩm thuộc combo Weekend Dress Kit. Thông tin này chỉ dùng để xem.</textarea></section></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--secondary" type="button" data-promo-close>Đóng</button></footer></section></div>';
  }
  function modal(type) {
    var simple = {
      permission: ["Không đủ quyền", "Bạn không có quyền thực hiện thao tác này. Admin chỉ xem chỉ được xem dữ liệu, thống kê và xuất báo cáo."],
      conflict: ["Xung đột dữ liệu", "Dữ liệu này vừa được cập nhật bởi Admin khác. Vui lòng tải lại dữ liệu mới nhất trước khi tiếp tục."],
      error: ["Lỗi lưu dữ liệu", "Hệ thống gặp lỗi khi lưu dữ liệu. Vui lòng thử lại sau."],
      cancelAction: ["Hủy thao tác", "Các thay đổi chưa lưu sẽ bị bỏ qua. Chỉ dùng popup này khi admin đang thoát khỏi form có dữ liệu đã nhập."]
    }[type];
    if (simple) {
      overlay.innerHTML = '<div class="admin-modal-overlay"><section class="admin-modal admin-modal--sm"><header class="admin-modal__header"><h2>' + simple[0] + '</h2><button class="admin-icon-button" type="button" data-promo-close>×</button></header><div class="admin-modal__body">' + simple[1] + '</div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--secondary" type="button" data-promo-close>Đã hiểu</button></footer></section></div>';
      return;
    }
    function input(label, name, typeName, placeholder, required, attrs) {
      return '<label class="admin-form-group"><span class="admin-form-label">' + label + (required ? ' <b>*</b>' : '') + '</span><input class="admin-form-control" name="' + name + '" type="' + (typeName || "text") + '" placeholder="' + (placeholder || "") + '"' + (required ? " required" : "") + (attrs ? " " + attrs : "") + '></label>';
    }
    function inputFull(label, name, typeName, placeholder, required, attrs) {
      return '<label class="admin-form-group admin-promo-field--full"><span class="admin-form-label">' + label + (required ? ' <b>*</b>' : '') + '</span><input class="admin-form-control" name="' + name + '" type="' + (typeName || "text") + '" placeholder="' + (placeholder || "") + '"' + (required ? " required" : "") + (attrs ? " " + attrs : "") + '></label>';
    }
    function inputWithAction(label, name, buttonText, attrs) {
      return '<label class="admin-form-group admin-promo-field--full"><span class="admin-form-label">' + label + ' <b>*</b></span><span class="admin-promo-input-action"><input class="admin-form-control" name="' + name + '" type="text" placeholder="Ví dụ: VELURA20" required ' + (attrs || "") + '><button class="admin-btn admin-btn--outline admin-btn--sm" type="button" data-promo-generate-code>' + buttonText + "</button></span></label>";
    }
    function textarea(label, name, placeholder, required, attrs) {
      return '<label class="admin-form-group admin-promo-field--full"><span class="admin-form-label">' + label + (required ? ' <b>*</b>' : '') + '</span><textarea class="admin-form-control admin-form-textarea" name="' + name + '" placeholder="' + (placeholder || "") + '"' + (required ? " required" : "") + (attrs ? " " + attrs : "") + '></textarea></label>';
    }
    function select(label, name, options, required, attrs) {
      return '<label class="admin-form-group"><span class="admin-form-label">' + label + (required ? ' <b>*</b>' : '') + '</span><select class="admin-form-control" name="' + name + '"' + (required ? " required" : "") + (attrs ? " " + attrs : "") + '><option value="">Chọn</option>' + options.map(function (option) { return "<option>" + option + "</option>"; }).join("") + "</select></label>";
    }
    function conditional(rule, body) {
      return '<div class="admin-promo-conditional admin-promo-field--full" data-promo-condition="' + rule + '" hidden>' + body + "</div>";
    }
    function discountValue(rule, label, name, typeName, placeholder) {
      return '<label class="admin-form-group admin-promo-discount-value" data-promo-discount-value="discount:' + rule + '" hidden><span class="admin-form-label">' + label + ' <b>*</b></span><input class="admin-form-control" name="' + name + '" type="' + (typeName || "text") + '" placeholder="' + placeholder + '" data-required-when-visible="true"></label>';
    }
    function discountPair(options) {
      var values = {
        "Phần trăm": discountValue("Phần trăm", "Tỷ lệ giảm (%)", "discountPercent", "number", "20"),
        "Số tiền cố định": discountValue("Số tiền cố định", "Số tiền giảm", "discountAmount", "number", "100000"),
        "Miễn phí vận chuyển": discountValue("Miễn phí vận chuyển", "Phí ship tối đa", "shippingDiscount", "number", "30000"),
        "Free ship": discountValue("Free ship", "Phí ship tối đa", "shippingDiscount", "number", "30000"),
        "percentage": discountValue("percentage", "Giá trị giảm (%)", "discountValue", "number", "15"),
        "fixed_amount": discountValue("fixed_amount", "Giá trị giảm", "discountValue", "number", "100000"),
        "free_shipping": discountValue("free_shipping", "Giá trị giảm", "discountValue", "number", "0"),
        "Mua X tặng Y": discountValue("Mua X tặng Y", "Số lượng mua X", "buyQty", "number", "2")
      };
      return select("Loại giảm", "discountType", options, true, "data-promo-discount-type") + options.map(function (option) { return values[option] || ""; }).join("");
    }
    function section(title, body, full) {
      return '<section class="admin-product-form__section' + (full ? " admin-product-form__section--full" : "") + '"><h3>' + title + '</h3><div class="admin-promo-form-grid">' + body + "</div></section>";
    }
    function comboItems() {
      return '<div class="admin-promo-combo-items admin-promo-field--full"><div class="admin-promo-combo-row"><label class="admin-form-group"><span class="admin-form-label">Sản phẩm thành phần <b>*</b></span><input class="admin-form-control" name="bundleProduct[]" placeholder="SKU hoặc tên sản phẩm" required></label><label class="admin-form-group admin-promo-combo-qty"><span class="admin-form-label">Số lượng <b>*</b></span><input class="admin-form-control" name="bundleQty[]" type="number" min="1" value="1" required></label></div><div class="admin-promo-combo-row"><label class="admin-form-group"><span class="admin-form-label">Sản phẩm thành phần</span><input class="admin-form-control" name="bundleProduct[]" placeholder="SKU hoặc tên sản phẩm"></label><label class="admin-form-group admin-promo-combo-qty"><span class="admin-form-label">Số lượng</span><input class="admin-form-control" name="bundleQty[]" type="number" min="1" value="1"></label></div><button class="admin-btn admin-btn--outline admin-btn--sm admin-promo-add-row" type="button" data-promo-add-combo>+ Thêm sản phẩm</button></div>';
    }
    function preview(titleText, lines) {
      return '<aside class="admin-product-form__section admin-promo-preview"><h3>' + titleText + '</h3><div class="admin-price-preview">' + lines.map(function (line) { return line[0] === "strong" ? "<strong>" + line[1] + "</strong>" : "<span>" + line[1] + "</span>"; }).join("") + "</div></aside>";
    }
    var title = "Tạo/Chỉnh sửa chương trình";
    var note = "Chương trình sẽ tự động kích hoạt khi đến ngày bắt đầu và tự động vô hiệu hóa khi hết thời hạn.";
    var body = "";
    if (type === "campaigns") {
      title = "Tạo chiến dịch khuyến mãi";
      body = section("Thông tin chiến dịch", inputFull("Tên chiến dịch", "name", "text", "Ví dụ: Summer Sale 2026", true) + textarea("Mô tả", "description", "Mô tả mục tiêu, nhóm sản phẩm và thông điệp chương trình", true), true) +
        section("Cấu hình giảm", discountPair(["Phần trăm", "Số tiền cố định", "Miễn phí vận chuyển", "Mua X tặng Y"]) +
          conditional("discount:Phần trăm", input("Giảm tối đa", "maxDiscountPercent", "number", "Ví dụ: 80000", false) + '<p class="admin-form-helper">Chỉ hiện khi loại giảm là Phần trăm.</p>') +
          conditional("discount:Miễn phí vận chuyển", input("Giới hạn phí ship tối đa", "shippingCap", "number", "Ví dụ: 30000", false) + '<p class="admin-form-helper">Chỉ hiện khi miễn phí vận chuyển có giới hạn ngân sách.</p>') +
          conditional("discount:Mua X tặng Y", input("Sản phẩm tặng Y", "giftSku", "text", "SKU sản phẩm tặng", true) + input("Số lượng tặng Y", "giftQty", "number", "Ví dụ: 1", true)), true) +
        section("Điều kiện và phạm vi áp dụng", input("Đơn tối thiểu", "minOrder", "number", "Ví dụ: 500000") + select("Phạm vi áp dụng", "scopeType", ["Tất cả sản phẩm", "Theo danh mục", "Theo sản phẩm", "Theo nhóm khách hàng"], true, "data-promo-scope-type") +
          conditional("scope:Theo danh mục", select("Danh mục áp dụng", "category", ["Áo", "Váy", "Phụ kiện", "Combo/outfit"], true)) +
          conditional("scope:Theo sản phẩm", textarea("Sản phẩm áp dụng", "products", "SKU hoặc tên sản phẩm, mỗi dòng một sản phẩm", true)) +
          conditional("scope:Theo nhóm khách hàng", select("Nhóm khách hàng", "customerGroup", ["Khách mới", "Member", "VIP"], true)), true) +
        section("Thời gian hiệu lực", input("Thời gian bắt đầu", "startAt", "datetime-local", "", true) + input("Thời gian kết thúc", "endAt", "datetime-local", "", true), true) +
        section("Ngân sách", input("Ngân sách tối đa", "budgetLimit", "number", "Ví dụ: 80000000", false, 'min="0" data-positive-number') + input("Số mã tối đa được phép phát hành", "maxVouchersAllowed", "number", "Hệ thống có thể tự tính", false, 'min="1" step="1" data-positive-integer') + '<p class="admin-form-helper admin-promo-field--full">Hệ thống có thể tự tính số mã tối đa dựa trên ngân sách kịch trần và mức giảm tối đa.</p>' + textarea("Ghi chú nội bộ", "note", "Thông tin vận hành cho admin", false), true);
    } else if (type === "vouchers") {
      title = "Tạo mã giảm giá";
      note = "Mã giảm giá phải duy nhất và có cấu hình loại giảm, giá trị giảm tối đa, lượt dùng, điều kiện áp dụng và ngày hết hạn.";
      var campOpts = db.getCampaigns().map(function (c) { return c.code + " - " + c.name; });
      body = section("Thông tin mã", select("Chiến dịch liên kết", "promoId", ["Để trống - Voucher độc lập"].concat(campOpts), false) + inputWithAction("Mã giảm giá", "code", "Sinh mã") + inputFull("Tên hiển thị voucher", "name", "text", "Ví dụ: Ưu đãi khách mới", true) + select("Trạng thái kích hoạt", "isActive", ["Đang kích hoạt", "Tạm dừng"], true), true) +
        section("Cấu hình chiết khấu", discountPair(["fixed_amount", "percentage", "free_shipping"]) + input("Mức giảm tối đa", "maxDiscountAmount", "number", "80000", false, 'min="0"') + input("Giá trị đơn hàng tối thiểu", "minOrderValue", "number", "400000", true, 'min="0"'), true) +
        section("Giới hạn sử dụng", input("Tổng lượt sử dụng toàn hệ thống", "usageLimitTotal", "number", "500", false, 'min="1" step="1"') + input("Số lượt dùng tối đa mỗi khách", "usageLimitPerUser", "number", "1", true, 'min="1" step="1"') + select("Danh mục áp dụng", "applicableCategories", ["Tất cả", "Áo", "Váy", "Phụ kiện", "Combo/outfit"], false) + select("Nhóm khách hàng áp dụng", "applicableUserGroup", ["new_user", "loyal_user", "churn_risk_user", "all_users"], true), true) +
        section("Thời gian hiệu lực", input("Ngày bắt đầu", "startAt", "date", "", true) + input("Ngày hết hạn", "endAt", "date", "", true), true);
    } else if (type === "bulk") {
      title = "Sinh mã hàng loạt";
      note = "Hệ thống sẽ preview ví dụ mã, tổng số mã và ước tính ngân sách tối đa trước khi phát hành.";
      body = '<div class="admin-promo-split">' +
        '<div class="admin-promo-split__main">' +
        section("Mẫu mã", input("Tiền tố mã", "prefix", "text", "VLR", true) + input("Số lượng mã", "quantity", "number", "100", true) + input("Độ dài phần ngẫu nhiên", "randomLength", "number", "6", true), true) +
        section("Cấu hình giảm", discountPair(["Phần trăm", "Số tiền cố định", "Free ship"]) + input("Giá trị giảm tối đa", "maxDiscount", "number", "80000", true) + input("Số lượt dùng mỗi mã", "perCodeUsage", "number", "1", true) + input("Số lượt dùng mỗi khách", "perCustomer", "number", "1", true), true) +
        section("Điều kiện và hạn dùng", textarea("Điều kiện áp dụng", "condition", "Đơn tối thiểu, nhóm khách hàng, danh mục áp dụng", true) + input("Ngày bắt đầu", "startAt", "date", "", true) + input("Ngày hết hạn", "expiredAt", "date", "", true), true) +
        "</div>" +
        preview("Preview phát hành", [["span", "Ví dụ mã sẽ sinh"], ["strong", "VLR-A8K21Q, VLR-L7P93M, VLR-Q4N18B"], ["span", "Ngân sách tối đa = số lượng mã x số lượt dùng mỗi mã x giá trị giảm tối đa"], ["strong", "100 x 1 x 80.000đ = 8.000.000đ"]]) +
        "</div>";
    } else if (type === "bundles") {
      title = "Tạo/Chỉnh sửa combo";
      note = "Giá combo phải thấp hơn tổng giá sản phẩm lẻ và có thời gian hiệu lực rõ ràng.";
      body = '<div class="admin-promo-split">' +
        '<div class="admin-promo-split__main">' +
        section("Thông tin combo", inputFull("Tên combo", "name", "text", "Ví dụ: Office Linen Set", true) + input("Mã combo", "code", "text", "CB-OFFICE"), true) +
        section("Sản phẩm thành phần", comboItems(), true) +
        section("Giá và điều kiện", input("Tổng giá lẻ", "retailTotal", "number", "1580000") + input("Giá combo", "bundlePrice", "number", "1390000", true) + textarea("Điều kiện áp dụng", "condition", "Thời gian, danh mục/nhóm khách hàng, điều kiện đơn hàng", true), true) +
        section("Thời gian hiệu lực", input("Thời gian bắt đầu", "startAt", "datetime-local", "", true) + input("Thời gian kết thúc", "endAt", "datetime-local", "", true), true) +
        "</div>" +
        preview("Preview giá combo", [["span", "Tổng giá lẻ"], ["strong", "1.580.000đ"], ["span", "Giá combo"], ["strong", "1.390.000đ"], ["span", "Khách tiết kiệm 190.000đ."]]) +
        "</div>";
    } else if (type === "budgets") {
      title = "Thiết lập ngân sách";
      note = "Ngân sách khuyến mãi = số lượng mã thực tế phát hành x giá trị giảm tối đa của mỗi mã.";
      var campOpts2 = db.getCampaigns().map(function (c) { return c.code + " - " + c.name; });
      body = '<div class="admin-promo-split">' +
        '<div class="admin-promo-split__main">' +
        section("Thông tin ngân sách", select("Chương trình khuyến mãi", "promoId", campOpts2, true) + input("Ngân sách tối đa", "budgetLimit", "number", "80000000", true, 'min="1" data-positive-number'), true) +
        section("Kiểm soát và cảnh báo", input("Mức giảm tối đa mỗi mã", "maxDiscount", "number", "80000", true, 'min="1" data-positive-number') + input("Số mã tối đa được phép phát hành", "maxVouchersAllowed", "number", "1000", false, 'min="1" step="1" data-positive-integer') + input("Tổng tiền đã giảm", "totalDiscountIssued", "number", "0", false, "readonly") + input("Ngưỡng cảnh báo (%)", "warningThreshold", "number", "80", true, 'min="1" max="100" data-positive-number'), true) +
        "</div>" +
        preview("Preview ngân sách", [["span", "Ngân sách tối đa"], ["strong", "80.000.000đ"], ["span", "Số mã tối đa = floor(ngân sách tối đa / mức giảm tối đa mỗi mã)"], ["strong", "floor(80.000.000 / 80.000) = 1.000 mã"], ["span", "Tổng tiền đã giảm chỉ hiển thị để đối soát, admin không nhập thủ công."]]) +
        "</div>";
    } else if (type === "toggle") {
      title = "Tạm dừng/Kích hoạt lại";
      note = "Thao tác này sẽ được lưu vào nhật ký khuyến mãi.";
      body = section("Xác nhận thao tác", select("Trạng thái hiện tại", "status", ["Đang hoạt động", "Tạm dừng", "Hết hạn", "Đã dừng"], true) + textarea("Lý do thao tác", "reason", "Nhập lý do để lưu vết vận hành", true), true);
    } else if (type === "voucherPause" || type === "voucherCancel" || type === "comboPause" || type === "budgetWarning" || type === "stoppedProgram") {
      var dangerTitle = { voucherPause: "Tạm dừng mã giảm giá", voucherCancel: "Hủy mã giảm giá", comboPause: "Dừng combo/bundle", budgetWarning: "Cảnh báo ngân sách", stoppedProgram: "Chương trình đã bị dừng" }[type];
      title = dangerTitle;
      note = type === "budgetWarning" ? "Ngân sách đang chạm ngưỡng cảnh báo. Admin cần xác nhận tăng ngân sách, giảm phạm vi hoặc dừng chương trình liên quan." : "Đây là thao tác ảnh hưởng trực tiếp đến trải nghiệm mua hàng. Luôn lưu lý do để đối soát nhật ký.";
      body = section("Xác nhận nghiệp vụ", select("Hành động", "action", type === "budgetWarning" ? ["Tăng ngân sách", "Giữ nguyên và cảnh báo", "Dừng chương trình"] : ["Tạm dừng", "Kích hoạt lại", "Hủy vĩnh viễn"], true) + textarea("Lý do", "reason", "Nhập lý do hiển thị trong nhật ký hệ thống", true) + textarea("Ghi chú nội bộ", "note", "Thông tin vận hành cho CSKH/kế toán nếu cần", false), true);
    } else {
      body = section("Thông tin khuyến mãi", input("Tên", "name", "text", "", true) + textarea("Điều kiện áp dụng", "condition", "", true), true);
    }
    var modalClass = "admin-modal admin-modal--lg admin-promo-modal" + (type === "bundles" || type === "bulk" ? " admin-promo-modal--wide" : "");
    overlay.innerHTML = '<div class="admin-modal-overlay"><section class="' + modalClass + '"><form data-promo-form data-promo-modal-type="' + type + '"><header class="admin-modal__header"><div><p class="label-upper">Quản lý khuyến mãi</p><h2>' + title + '</h2></div><button class="admin-icon-button" type="button" data-promo-close>×</button></header><div class="admin-modal__body"><div class="admin-note">' + note + '</div><div class="admin-promo-form">' + body + '</div></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-promo-close>Hủy</button><button class="admin-btn admin-btn--secondary" type="submit">Xác nhận</button></footer></form></section></div>';
    updatePromoConditionalFields(overlay.querySelector("[data-promo-form]"));
  }

  /* ─── event handlers ─── */
  document.addEventListener("click", function (event) {
    var workspaceTrigger = event.target.closest("[data-promo-open-workspace]");
    var button = event.target.closest("button");
    if (!button && !workspaceTrigger) return;
    if (workspaceTrigger && (!button || button.dataset.promoOpenWorkspace !== undefined)) {
      active = "campaigns";
      document.querySelectorAll("[data-promo-view]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab.dataset.promoView === "campaigns"); });
      render();
      document.querySelector(".admin-promo-workspace").scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (button.dataset.promoSidebar !== undefined) document.querySelector(".admin-layout").classList.toggle("admin-layout--sidebar-collapsed");
    if (button.dataset.promoView) { active = button.dataset.promoView; document.querySelectorAll("[data-promo-view]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab === button); }); render(); }
    if (button.dataset.promoOpenLogs !== undefined) { active = "logs"; overlay.innerHTML = ""; document.querySelectorAll("[data-promo-view]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab.dataset.promoView === "logs"); }); render(); }
    if (button.dataset.promoReport) { report(button.dataset.promoReport); return; }
    if (button.dataset.promoProductDetail !== undefined) { readonlyProductModal(button.dataset.promoProductDetail); return; }
    if (button.dataset.promoCampaignExport !== undefined) toast("Đã chuẩn bị báo cáo chiến dịch.");
    if (button.dataset.promoExport !== undefined) { report("module"); return; }
    if (button.dataset.promoWorkspaceTab) {
      var workspacePanel = document.querySelector("[data-promo-workspace-content]");
      if (workspacePanel) {
        document.querySelectorAll("[data-promo-workspace-tab]").forEach(function (tab) { tab.classList.toggle("admin-tab--active", tab.dataset.promoWorkspaceTab === button.dataset.promoWorkspaceTab); });
        workspacePanel.innerHTML = workspaceContent(button.dataset.promoWorkspaceTab);
      }
      document.querySelectorAll(".admin-table-action-menu").forEach(function (item) { item.hidden = true; });
      return;
    }
    if (button.dataset.promoActionMenu) {
      var menu = document.querySelector("#" + button.dataset.promoActionMenu);
      document.querySelectorAll(".admin-table-action-menu").forEach(function (item) { if (item !== menu) item.hidden = true; });
      menu.hidden = !menu.hidden;
      menu.classList.remove("admin-dropdown--up");
      if (!menu.hidden && menu.getBoundingClientRect().bottom > window.innerHeight - 12) menu.classList.add("admin-dropdown--up");
      return;
    }
    if (button.dataset.promoDrawer) drawer(button.dataset.promoDrawer, button.dataset.promoIndex || 0, button.dataset.promoDrawerTab || 0);
    if (button.dataset.promoModal) modal(button.dataset.promoModal);
    if (button.dataset.promoGenerateCode !== undefined) {
      var codeInput = button.closest(".admin-promo-input-action").querySelector("input");
      codeInput.value = "VELURA-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      codeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (button.dataset.promoAddCombo !== undefined) {
      var list = button.closest(".admin-promo-combo-items");
      var row = document.createElement("div");
      row.className = "admin-promo-combo-row";
      row.innerHTML = '<label class="admin-form-group"><span class="admin-form-label">Sản phẩm thành phần</span><input class="admin-form-control" name="bundleProduct[]" placeholder="SKU hoặc tên sản phẩm"></label><label class="admin-form-group admin-promo-combo-qty"><span class="admin-form-label">Số lượng</span><input class="admin-form-control" name="bundleQty[]" type="number" min="1" value="1"></label>';
      list.insertBefore(row, button);
    }
    if (button.dataset.promoClose !== undefined) overlay.innerHTML = "";
    if (button.dataset.promoReset !== undefined) render();
  });
  panel.addEventListener("input", function (event) { if (!event.target.matches("[data-promo-search]")) return; var query = event.target.value.toLowerCase(); panel.querySelectorAll("tbody tr").forEach(function (row) { row.hidden = row.textContent.toLowerCase().indexOf(query) < 0; }); });
  panel.addEventListener("submit", function (event) { if (event.target.matches("[data-promo-filter]")) event.preventDefault(); });
  overlay.addEventListener("submit", function (event) {
    if (!event.target.matches("[data-promo-form]")) return;
    event.preventDefault();
    var form = event.target;
    var modalType = form.dataset.promoModalType;
    var startAt = form.querySelector('[name="startAt"]');
    var endAt = form.querySelector('[name="endAt"], [name="expiredAt"]');
    var retailTotal = form.querySelector('[name="retailTotal"]');
    var bundlePrice = form.querySelector('[name="bundlePrice"]');
    form.querySelectorAll("[data-positive-number], [data-positive-integer]").forEach(function (field) {
      var value = field.value === "" ? NaN : Number(field.value);
      var isOptionalEmpty = !field.required && field.value === "";
      var invalidNumber = !isOptionalEmpty && (!Number.isFinite(value) || value <= 0);
      var invalidInteger = !isOptionalEmpty && field.dataset.positiveInteger !== undefined && !Number.isInteger(value);
      field.setCustomValidity(invalidNumber ? "Giá trị phải là số dương." : invalidInteger ? "Giá trị phải là số nguyên dương." : "");
    });
    if (startAt && endAt && startAt.value && endAt.value && endAt.value <= startAt.value) {
      endAt.setCustomValidity("Thời gian kết thúc phải sau thời gian bắt đầu.");
    } else if (endAt) {
      endAt.setCustomValidity("");
    }
    if (retailTotal && bundlePrice && retailTotal.value && bundlePrice.value && Number(bundlePrice.value) >= Number(retailTotal.value)) {
      bundlePrice.setCustomValidity("Giá combo phải thấp hơn tổng giá lẻ.");
    } else if (bundlePrice) {
      bundlePrice.setCustomValidity("");
    }
    if (!form.checkValidity()) { form.reportValidity(); return; }

    /* ─── save to db ─── */
    try {
      if (modalType === "campaigns") {
        var camps = db.getCampaigns();
        var discountType = (form.querySelector('[name="discountType"]') || {}).value || "percentage";
        var discountVal = Number((form.querySelector('[name="discountPercent"], [name="discountAmount"], [name="shippingDiscount"], [name="discountValue"]') || {}).value || 0);
        var maxDisc = Number((form.querySelector('[name="maxDiscountPercent"]') || {}).value || discountVal);
        var newCamp = {
          id: "CAMP-" + Date.now().toString().slice(-4),
          name: (form.querySelector('[name="name"]') || {}).value || "",
          code: (form.querySelector('[name="name"]') || {}).value.replace(/\s+/g, "-").toUpperCase().slice(0, 15) || "CAMP-" + Date.now(),
          type: { "Phần trăm": "percentage", "percentage": "percentage", "Số tiền cố định": "fixed_amount", "fixed_amount": "fixed_amount", "Miễn phí vận chuyển": "free_shipping", "Free ship": "free_shipping", "free_shipping": "free_shipping", "Mua X tặng Y": "percentage" }[discountType] || "percentage",
          discountValue: discountVal,
          maxDiscount: maxDisc,
          conditions: (form.querySelector('[name="minOrder"]') ? "Đơn từ " + fmt(Number(form.querySelector('[name="minOrder"]').value || 0)) : "") + (form.querySelector('[name="scopeType"]') ? ", " + form.querySelector('[name="scopeType"]').value : ""),
          scopeType: ((form.querySelector('[name="scopeType"]') || {}).value || "all").toLowerCase().replace(/\s+/g, "_"),
          categories: [form.querySelector('[name="category"]') ? form.querySelector('[name="category"]').value : ""].filter(Boolean),
          startAt: startAt ? startAt.value : "",
          endAt: endAt ? endAt.value : "",
          status: "scheduled",
          budgetLimit: Number((form.querySelector('[name="budgetLimit"]') || {}).value || 0),
          budgetUsed: 0,
          productCount: 0,
          voucherCount: 0,
          version: 1
        };
        camps.push(newCamp);
        db.saveCampaigns(camps);
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "promotions", "create", "Tạo chiến dịch", newCamp.code, newCamp.name, "success", "normal", "Tạo chiến dịch mới " + newCamp.name, [["Tên", "", newCamp.name], ["Loại", "", typeLabel(newCamp.type)]], { "Chiến dịch": newCamp.name, "Mã": newCamp.code });
        toast("Đã ghi nhận cấu hình chương trình khuyến mãi.");
      } else if (modalType === "vouchers") {
        var code = (form.querySelector('[name="code"]') || {}).value.trim().toUpperCase();
        if (!db.isVoucherCodeUnique(code)) {
          toast("Mã giảm giá '" + code + "' đã tồn tại.");
          return;
        }
        var vouchers = db.getVouchers();
        var campSel = (form.querySelector('[name="promoId"]') || {}).value;
        var campId = "";
        if (campSel && campSel !== "Để trống - Voucher độc lập") {
          var campCode = campSel.split(" - ")[0];
          var foundCamp = db.getCampaigns().find(function (c) { return c.code === campCode; });
          if (foundCamp) campId = foundCamp.id;
        }
        var discType2 = (form.querySelector('[name="discountType"]') || {}).value || "fixed_amount";
        var discVal2 = Number((form.querySelector('[name="discountValue"]') || {}).value || 0);
        var newVoucher = {
          id: "VCH-" + Date.now().toString().slice(-4),
          code: code,
          name: (form.querySelector('[name="name"]') || {}).value || "",
          campaignId: campId,
          type: discType2,
          value: discVal2,
          maxDiscount: Number((form.querySelector('[name="maxDiscountAmount"]') || {}).value || discVal2),
          minOrder: Number((form.querySelector('[name="minOrderValue"]') || {}).value || 0),
          usageLimit: Number((form.querySelector('[name="usageLimitTotal"]') || {}).value || 100),
          usageCount: 0,
          perUserLimit: Number((form.querySelector('[name="usageLimitPerUser"]') || {}).value || 1),
          expiresAt: endAt ? endAt.value : "",
          customerGroup: (form.querySelector('[name="applicableUserGroup"]') || {}).value || "all_users",
          status: (form.querySelector('[name="isActive"]') || {}).value === "Tạm dừng" ? "paused" : "active",
          version: 1
        };
        vouchers.push(newVoucher);
        db.saveVouchers(vouchers);
        if (campId) {
          var campsUpd = db.getCampaigns();
          var linked = campsUpd.find(function (c) { return c.id === campId; });
          if (linked) { linked.voucherCount = (linked.voucherCount || 0) + 1; db.saveCampaigns(campsUpd); }
        }
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "vouchers", "create", "Tạo mã giảm giá", newVoucher.code, newVoucher.name, "success", "normal", "Tạo mã giảm giá " + newVoucher.code, [["Mã", "", newVoucher.code], ["Loại", "", typeLabel(newVoucher.type)]], { "Mã": newVoucher.code, "Tên": newVoucher.name });
        toast("Đã ghi nhận mã giảm giá.");
      } else if (modalType === "bundles") {
        var bundles = db.getBundles();
        var products = [];
        form.querySelectorAll('[name="bundleProduct[]"]').forEach(function (el) { if (el.value.trim()) products.push(el.value.trim()); });
        var retailT = Number((form.querySelector('[name="retailTotal"]') || {}).value || 0);
        var bPrice = Number((form.querySelector('[name="bundlePrice"]') || {}).value || 0);
        var newBundle = {
          id: "BND-" + Date.now().toString().slice(-4),
          name: (form.querySelector('[name="name"]') || {}).value || "",
          code: (form.querySelector('[name="code"]') || {}).value || "CB-" + Date.now(),
          products: products,
          productNames: products.join(", "),
          retailTotal: retailT,
          bundlePrice: bPrice,
          saving: retailT - bPrice,
          startAt: startAt ? startAt.value.split("T")[0] || startAt.value : "",
          endAt: endAt ? endAt.value.split("T")[0] || endAt.value : "",
          status: "scheduled",
          salesCount: 0,
          revenue: 0,
          version: 1
        };
        bundles.push(newBundle);
        db.saveBundles(bundles);
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "promotions", "create_combo", "Tạo combo", newBundle.code, newBundle.name, "success", "normal", "Tạo combo " + newBundle.name + " với " + products.length + " sản phẩm", [["Tên", "", newBundle.name], ["Giá combo", "", fmt(bPrice)]], { "Combo": newBundle.name, "Mã": newBundle.code });
        toast("Đã ghi nhận combo/bundle.");
      } else if (modalType === "budgets") {
        var budgets = db.getBudgets();
        var campSel2 = (form.querySelector('[name="promoId"]') || {}).value || "";
        var campCode2 = campSel2.split(" - ")[0];
        var foundCamp2 = db.getCampaigns().find(function (c) { return c.code === campCode2; });
        var campId2 = foundCamp2 ? foundCamp2.id : "";
        var lim = Number((form.querySelector('[name="budgetLimit"]') || {}).value || 0);
        var maxD = Number((form.querySelector('[name="maxDiscount"]') || {}).value || 1);
        var maxCodes = Math.floor(lim / maxD);
        var used = foundCamp2 ? foundCamp2.budgetUsed || 0 : 0;
        var pct = lim > 0 ? Math.round((used / lim) * 100) : 0;
        var bStatus = pct >= 80 ? "warning" : "normal";
        var existingIdx = budgets.findIndex(function (b) { return b.campaignId === campId2; });
        var budgetObj = {
          id: existingIdx >= 0 ? budgets[existingIdx].id : "BGT-" + Date.now().toString().slice(-4),
          campaignId: campId2,
          name: "Ngân sách " + (foundCamp2 ? foundCamp2.name : campCode2),
          scope: "Chương trình",
          limit: lim,
          used: used,
          remaining: Math.max(0, lim - used),
          formula: maxCodes + " mã x " + fmt(maxD),
          status: bStatus,
          percent: pct,
          version: (existingIdx >= 0 ? (budgets[existingIdx].version || 0) + 1 : 1)
        };
        if (existingIdx >= 0) budgets[existingIdx] = budgetObj; else budgets.push(budgetObj);
        db.saveBudgets(budgets);
        db.checkBudgetAutoStop();
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "budgets", "update", "Thiết lập ngân sách", budgetObj.name, budgetObj.name, "success", "normal", "Thiết lập ngân sách " + fmt(lim) + " cho " + (foundCamp2 ? foundCamp2.name : ""), [["Ngân sách", existingIdx >= 0 ? fmt(budgets[existingIdx].limit || 0) : "0", fmt(lim)]], { "Chiến dịch": budgetObj.name });
        toast("Đã ghi nhận thiết lập ngân sách.");
      } else if (modalType === "toggle") {
        var newStatus = (form.querySelector('[name="status"]') || {}).value;
        var reason = (form.querySelector('[name="reason"]') || {}).value;
        var statusMap = { "Đang hoạt động": "active", "Tạm dừng": "paused", "Hết hạn": "expired", "Đã dừng": "stopped" };
        var camps3 = db.getCampaigns();
        if (camps3.length > 0) {
          var c = camps3[0];
          var oldStatus = statusPair(c.status)[0];
          c.status = statusMap[newStatus] || c.status;
          c.version = (c.version || 0) + 1;
          db.saveCampaigns(camps3);
          db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "promotions", "status_change", "Thay đổi trạng thái", c.code, c.name, "success", "normal", "Thay đổi trạng thái " + c.name + " từ " + oldStatus + " sang " + newStatus + (reason ? ". Lý do: " + reason : ""), [["Trạng thái", oldStatus, newStatus]], { "Chiến dịch": c.name, "Lý do": reason });
        }
        toast("Đã lưu thao tác thay đổi trạng thái.");
      } else if (modalType === "bulk") {
        var prefix = (form.querySelector('[name="prefix"]') || {}).value || "VLR";
        var qty = Number((form.querySelector('[name="quantity"]') || {}).value || 0);
        var maxD2 = Number((form.querySelector('[name="maxDiscount"]') || {}).value || 0);
        var vouchers2 = db.getVouchers();
        var created = 0;
        for (var i = 0; i < qty; i++) {
          var rand = Math.random().toString(36).slice(2, 8).toUpperCase();
          var newCode = prefix + "-" + rand;
          if (!db.isVoucherCodeUnique(newCode)) continue;
          vouchers2.push({
            id: "VCH-" + Date.now().toString().slice(-4) + "-" + i,
            code: newCode,
            name: prefix + " voucher",
            campaignId: "",
            type: "percentage",
            value: 15,
            maxDiscount: maxD2,
            minOrder: 0,
            usageLimit: Number((form.querySelector('[name="perCodeUsage"]') || {}).value || 1),
            usageCount: 0,
            perUserLimit: Number((form.querySelector('[name="perCustomer"]') || {}).value || 1),
            expiresAt: (form.querySelector('[name="expiredAt"]') || {}).value || "",
            customerGroup: "all_users",
            status: "active",
            version: 1
          });
          created++;
        }
        db.saveVouchers(vouchers2);
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "vouchers", "bulk_create", "Sinh mã hàng loạt", prefix, "Sinh " + created + " mã", "success", "normal", "Sinh mã hàng loạt " + created + " mã với prefix " + prefix, [["Số lượng", "0", String(created)]], { "Prefix": prefix, "Số mã": String(created) });
        toast("Đã ghi nhận cấu hình sinh mã hàng loạt.");
      } else if (modalType === "voucherPause" || modalType === "voucherCancel" || modalType === "comboPause" || modalType === "budgetWarning" || modalType === "stoppedProgram") {
        var action = (form.querySelector('[name="action"]') || {}).value || "";
        var reason2 = (form.querySelector('[name="reason"]') || {}).value || "";
        db.addLog("Phạm Thu Hương", "ADM-001", "Admin quản trị", "admin", "promotions", modalType, action, modalType, modalType, "success", "normal", action + ": " + reason2, [["Hành động", "", action]], { "Lý do": reason2 });
        toast("Đã lưu xử lý nghiệp vụ.");
      } else {
        toast("Đã ghi nhận thao tác khuyến mãi mẫu.");
      }
    } catch (e) {
      if (e.message === "DATABASE_CONNECTION_TIMEOUT") {
        toast("Lỗi lưu dữ liệu. Vui lòng thử lại sau.");
        return;
      }
      throw e;
    }
    overlay.innerHTML = "";
    render();
    kpis();
  });
  overlay.addEventListener("change", function (event) { if (event.target.matches("[data-promo-discount-type], [data-promo-scope-type]")) updatePromoConditionalFields(event.target.closest("[data-promo-form]")); });
  kpis();
  render();
}());
