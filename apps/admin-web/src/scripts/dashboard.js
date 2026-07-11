import { API_BASE_URL, getAccessToken } from "./supabase-auth.js";

(function () {
  "use strict";

  var root = document.querySelector("[data-dashboard]");
  if (!root) return;

  var overlay = document.querySelector("#dashboard-overlay");
  var loadError = false;
  var toast = document.querySelector("#dashboard-toast");
  var sidebar = document.querySelector("#admin-sidebar");
  var backdrop = document.querySelector("[data-dashboard-sidebar-close]");

  function icon(name) {
    return '<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#' + name + '"></use></svg>';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 2400);
  }

  function closeOverlay() {
    overlay.innerHTML = "";
  }

  function fmtNum(n) { return Number(n).toLocaleString("vi-VN"); }
  function fmtMoney(n) {
    var abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(n);
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c];
    });
  }

  function updateDashboardUI(data) {
    loadError = false;
    var opsPanel = document.querySelector("#dashboard-operations");
    if (opsPanel) {
      var kpis = opsPanel.querySelectorAll(".dashboard-kpi");
      if (kpis.length >= 5) {
        kpis[0].querySelector("strong").textContent = fmtNum(data.operations.pendingOrders);
        kpis[0].querySelector("small").textContent = fmtNum(data.operations.paymentErrors) + " thanh toán lỗi";

        kpis[1].querySelector("strong").textContent = fmtNum(data.operations.openReturns);
        kpis[2].querySelector("strong").textContent = fmtNum(data.operations.openSupportTickets);
        kpis[3].querySelector("strong").textContent = fmtNum(data.operations.lowStockProducts);

        kpis[4].querySelector("strong").textContent = fmtNum(data.business.pendingReviews);
        kpis[4].querySelector("small").textContent = fmtNum(data.operations.urgentReviews) + " đánh giá tiêu cực";
      }

      var alertCountBtn = opsPanel.querySelector("[data-dashboard-drawer='alerts']");
      if (alertCountBtn) {
        var totalAlerts = data.operations.openReturns + data.operations.paymentErrors + data.operations.lowStockProducts + data.operations.openSupportTickets;
        alertCountBtn.textContent = "Xem tất cả " + totalAlerts;
      }

      // Update alerts list on operations panel
      var alertList = opsPanel.querySelector(".dashboard-alert-list");
      if (alertList) {
        alertList.innerHTML = `
          <article class="dashboard-alert dashboard-alert--critical"><span class="admin-badge admin-badge--danger dashboard-alert__level">Khẩn cấp</span><div><h4>${fmtNum(data.operations.openReturns)} phiếu đổi/trả cần xử lý</h4><p>Đổi trả &amp; CSKH · Tải trực tiếp từ Supabase</p></div><a href="./returns-cskh.html#returns">Xem phiếu</a></article>
          <article class="dashboard-alert dashboard-alert--critical"><span class="admin-badge admin-badge--danger dashboard-alert__level">Khẩn cấp</span><div><h4>${fmtNum(data.operations.paymentErrors)} đơn hàng thanh toán lỗi cần kiểm tra</h4><p>Quản lý đơn hàng · Cảnh báo hệ thống</p></div><a href="./orders.html">Kiểm tra</a></article>
          <article class="dashboard-alert dashboard-alert--high"><span class="admin-badge admin-badge--warning dashboard-alert__level">Cao</span><div><h4>${fmtNum(data.operations.lowStockProducts)} sản phẩm dưới mức tồn kho tối thiểu</h4><p>Sản phẩm &amp; tồn kho · Tồn kho thấp</p></div><a href="./products.html">Xem tồn kho</a></article>
          <article class="dashboard-alert dashboard-alert--medium"><span class="admin-badge admin-badge--pending dashboard-alert__level">Trung bình</span><div><h4>${fmtNum(data.operations.openSupportTickets)} phiếu hỗ trợ khách hàng chờ phản hồi</h4><p>Đổi trả &amp; CSKH · Phiếu mới nhận</p></div><a href="./returns-cskh.html#support">Xem hỗ trợ</a></article>
        `;
      }

      // Update health list cards dynamically
      var healthList = opsPanel.querySelector(".dashboard-health-list");
      if (healthList) {
        var ordersStatus = (data.operations.pendingOrders > 0 || data.operations.paymentErrors > 0) ? "warning" : "success";
        var ordersStatusLabel = ordersStatus === "warning" ? "Cần chú ý" : "Tốt";
        
        var productsStatus = data.operations.lowStockProducts > 0 ? "danger" : "success";
        var productsStatusLabel = productsStatus === "danger" ? "Rủi ro" : "Tốt";
        
        var reviewsStatus = data.business.pendingReviews > 0 ? "warning" : "success";
        var reviewsStatusLabel = reviewsStatus === "warning" ? "Cần chú ý" : "Tốt";
        
        var returnsStatus = (data.operations.openReturns > 0 || data.operations.openSupportTickets > 0) ? "warning" : "success";
        var returnsStatusLabel = returnsStatus === "warning" ? "Cần chú ý" : "Tốt";

        healthList.innerHTML = `
          <a class="dashboard-health-card" href="./orders.html">
            <div class="dashboard-health-card__head">
              <i>${icon("cart")}</i>
              <span class="admin-badge admin-badge--${ordersStatus}">${ordersStatusLabel}</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--${ordersStatus}"></span>
              <strong>Đơn hàng</strong>
            </div>
            <small>${fmtNum(data.operations.pendingOrders)} cần xử lý · ${fmtNum(data.operations.paymentErrors)} thanh toán lỗi</small>
          </a>
          <a class="dashboard-health-card" href="./products.html">
            <div class="dashboard-health-card__head">
              <i>${icon("box")}</i>
              <span class="admin-badge admin-badge--${productsStatus}">${productsStatusLabel}</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--${productsStatus}"></span>
              <strong>Sản phẩm &amp; tồn kho</strong>
            </div>
            <small>${fmtNum(data.operations.lowStockProducts)} dưới tồn tối thiểu</small>
          </a>
          <a class="dashboard-health-card" href="./reviews.html">
            <div class="dashboard-health-card__head">
              <i>${icon("star")}</i>
              <span class="admin-badge admin-badge--${reviewsStatus}">${reviewsStatusLabel}</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--${reviewsStatus}"></span>
              <strong>Đánh giá</strong>
            </div>
            <small>${fmtNum(data.business.pendingReviews)} chờ duyệt</small>
          </a>
          <a class="dashboard-health-card" href="./returns-cskh.html">
            <div class="dashboard-health-card__head">
              <i>${icon("support")}</i>
              <span class="admin-badge admin-badge--${returnsStatus}">${returnsStatusLabel}</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--${returnsStatus}"></span>
              <strong>Đổi trả &amp; CSKH</strong>
            </div>
            <small>${fmtNum(data.operations.openReturns)} phiếu còn hạn · ${fmtNum(data.operations.openSupportTickets)} ticket chờ</small>
          </a>
          <a class="dashboard-health-card" href="./promotions.html">
            <div class="dashboard-health-card__head">
              <i>${icon("tag")}</i>
              <span class="admin-badge admin-badge--success">Tốt</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--success"></span>
              <strong>Giá &amp; khuyến mãi</strong>
            </div>
            <small>Hoạt động bình thường</small>
          </a>
          <a class="dashboard-health-card" href="./accounts.html">
            <div class="dashboard-health-card__head">
              <i>${icon("users")}</i>
              <span class="admin-badge admin-badge--success">Tốt</span>
            </div>
            <div class="dashboard-health-card__title">
              <span class="dashboard-health-dot dashboard-health-dot--success"></span>
              <strong>Tài khoản &amp; hệ thống</strong>
            </div>
            <small>Không có cảnh báo bảo mật mới</small>
          </a>
        `;
      }

      // Update dynamic tasks list
      var taskList = opsPanel.querySelector(".dashboard-task-list");
      var taskCount = opsPanel.querySelector(".dashboard-action-queue .dashboard-section__count");
      if (taskList) {
        var tasks = [
          {
            index: "01",
            title: `Duyệt ${fmtNum(data.operations.openReturns)} phiếu đổi/trả cần xử lý`,
            desc: "Đổi trả & CSKH · Hạn trong tuần này",
            badge: "Cao",
            badgeClass: "admin-badge--danger",
            link: "./returns-cskh.html#returns"
          },
          {
            index: "02",
            title: `Kiểm tra ${fmtNum(data.operations.paymentErrors)} đơn thanh toán lỗi`,
            desc: "Quản lý đơn hàng · Cảnh báo hệ thống",
            badge: "Cao",
            badgeClass: "admin-badge--danger",
            link: "./orders.html"
          },
          {
            index: "03",
            title: `Phản hồi ${fmtNum(data.operations.urgentReviews)} đánh giá tiêu cực`,
            desc: "Quản lý đánh giá · Trong hôm nay",
            badge: "Vừa",
            badgeClass: "admin-badge--warning",
            link: "./reviews.html"
          },
          {
            index: "04",
            title: `Bổ sung tồn kho cho ${fmtNum(data.operations.lowStockProducts)} sản phẩm`,
            desc: "Quản lý sản phẩm · Tồn kho thấp",
            badge: "Vừa",
            badgeClass: "admin-badge--warning",
            link: "./products.html"
          }
        ];
        taskList.innerHTML = tasks.map(t => `
          <a href="${t.link}"><span class="dashboard-task__index">${t.index}</span><div><strong>${t.title}</strong><small>${t.desc}</small></div><span class="admin-badge ${t.badgeClass}">${t.badge}</span></a>
        `).join("");
        if (taskCount) {
          taskCount.textContent = tasks.length + " việc";
        }
      }

      // Update recent activity timeline
      var timeline = opsPanel.querySelector(".dashboard-timeline");
      if (timeline && data.recentLogs) {
        if (data.recentLogs.length === 0) {
          timeline.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--muted); font-size: 0.85rem;">
              Chưa có hoạt động gần đây
            </div>
          `;
        } else {
          timeline.innerHTML = data.recentLogs.slice(0, 5).map(log => {
            var date = new Date(log.timestamp);
            var timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
            var actor = log.actor_name || log.actor_id || "Hệ thống";
            
            var actionVerb = "";
            if (log.action === "create") actionVerb = "Tạo mới";
            else if (log.action === "update") actionVerb = "Cập nhật";
            else if (log.action === "delete") actionVerb = "Xóa";
            else if (log.action === "approve") actionVerb = "Duyệt";
            else if (log.action === "reject") actionVerb = "Từ chối";
            else actionVerb = log.action || "Thao tác";

            var targetModule = "";
            if (log.module === "orders") targetModule = "đơn hàng";
            else if (log.module === "product" || log.module === "products") targetModule = "sản phẩm";
            else if (log.module === "reviews") targetModule = "đánh giá";
            else if (log.module === "accounts") targetModule = "tài khoản";
            else if (log.module === "returns" || log.module === "return_exchange") targetModule = "yêu cầu đổi trả";
            else targetModule = log.module || "";

            var desc = actionVerb + " " + targetModule;
            if (log.target_id) {
              desc += " #" + log.target_id.slice(0, 8);
            }

            var moduleLabel = "Hệ thống";
            if (log.module === "orders") moduleLabel = "Đơn hàng";
            else if (log.module === "product" || log.module === "products") moduleLabel = "Sản phẩm";
            else if (log.module === "reviews") moduleLabel = "Đánh giá";
            else if (log.module === "accounts") moduleLabel = "Tài khoản";
            else if (log.module === "returns" || log.module === "return_exchange") moduleLabel = "Đổi trả & CSKH";

            return `
              <article>
                <time>${timeStr}</time>
                <span></span>
                <div>
                  <strong>${escapeHtml(actor)}</strong>
                  <p>${escapeHtml(desc)}</p>
                  <small>${escapeHtml(moduleLabel)} · Thành công</small>
                </div>
              </article>
            `;
          }).join("");
        }
      }
    }

    var busPanel = document.querySelector("#dashboard-business");
    if (busPanel) {
      var kpis = busPanel.querySelectorAll(".dashboard-kpi");
      if (kpis.length >= 5) {
        kpis[0].querySelector("strong").textContent = fmtMoney(data.business.revenue);
        kpis[1].querySelector("strong").textContent = fmtNum(data.business.orderCount);

        kpis[2].querySelector("strong").textContent = fmtMoney(data.business.averageOrderValue || 0);

        kpis[3].querySelector("strong").textContent = (data.business.completionRate ?? 100) + "%";

        kpis[4].querySelector("strong").textContent = fmtMoney(data.business.promotionBudgetUsed);
      }

      // Update best categories ranking
      var rankingContainer = busPanel.querySelector(".dashboard-ranking");
      if (rankingContainer && data.business.categoryContributions) {
        rankingContainer.innerHTML = data.business.categoryContributions.map(cat => `
          <div>
            <span>${escapeHtml(cat.name)}</span>
            <i style="--pct: ${cat.pct}%"><b style="width: ${cat.pct}%"></b></i>
            <strong>${fmtMoney(cat.revenue)} <small>${cat.pct}%</small></strong>
          </div>
        `).join("");
      }

      // Update best selling products
      var productsContainer = busPanel.querySelector(".dashboard-products");
      if (productsContainer && data.business.bestSellers) {
        productsContainer.innerHTML = data.business.bestSellers.map((prod, index) => {
          var num = String(index + 1).padStart(2, "0");
          return `
            <article>
              <span>${num}</span>
              <div>
                <strong>${escapeHtml(prod.name)}</strong>
                <small>${escapeHtml(prod.sku)} · ${fmtNum(prod.qty)} đã bán</small>
              </div>
              <b>${fmtMoney(prod.revenue)}</b>
              <em class="admin-badge admin-badge--${prod.statusClass}">${escapeHtml(prod.stockStatus)}</em>
            </article>
          `;
        }).join("");
      }

      // Update promotion impact stats
      var promoStats = busPanel.querySelector(".dashboard-impact-stats");
      if (promoStats) {
        promoStats.innerHTML = `
          <div><small>Đơn có khuyến mãi</small><strong>${fmtNum(data.business.promoOrdersCount)}</strong></div>
          <div><small>Tổng giá trị giảm</small><strong>${fmtMoney(data.business.totalDiscount)}</strong></div>
          <div><small>Campaign tốt nhất</small><strong>${escapeHtml(data.business.bestCampaign)}</strong></div>
          <div><small>Voucher dùng nhiều</small><strong>${escapeHtml(data.business.mostUsedVoucher)}</strong></div>
        `;
      }

      // Update chart dynamically
      var chartContainer = busPanel.querySelector(".dashboard-chart__bars");
      var gridContainer = busPanel.querySelector(".dashboard-chart__grid");
      if (chartContainer && data.business.revenueTrend && data.business.revenueTrend.length > 0) {
        var trend = data.business.revenueTrend;
        var maxRevenue = Math.max.apply(null, trend.map(function(p) { return p.revenue; })) || 1;
        var maxOrders = Math.max.apply(null, trend.map(function(p) { return p.orderCount; })) || 1;

        chartContainer.innerHTML = trend.map(function(p) {
          var pctBar = Math.round((p.revenue / maxRevenue) * 90) + 10;
          var pctOrders = Math.round((p.orderCount / maxOrders) * 90) + 10;
          return `
            <div style="--bar: ${pctBar}%; --orders: ${pctOrders}%;">
              <i title="Doanh thu: ${fmtMoney(p.revenue)}"></i>
              <b title="Số đơn: ${p.orderCount} đơn"></b>
              <span>${escapeHtml(p.dateStr)}</span>
            </div>
          `;
        }).join("");

        if (gridContainer) {
          gridContainer.innerHTML = `
            <span>${fmtMoney(maxRevenue)}</span>
            <span>${fmtMoney(maxRevenue * 2 / 3)}</span>
            <span>${fmtMoney(maxRevenue / 3)}</span>
            <span>0</span>
          `;
        }
      }
    }
  }

  async function loadDashboard(params) {
    var token = getAccessToken();
    if (!token) {
      console.warn("[Dashboard] Không có access token, bỏ qua tải dữ liệu.");
      return;
    }
    try {
      var query = "";
      if (params && params.range) {
        query = "?range=" + params.range;
      } else if (params && params.from && params.to) {
        query = "?from=" + params.from + "&to=" + params.to;
      } else {
        var activeRangeBtn = document.querySelector("[data-dashboard-range].is-active");
        var activeRange = activeRangeBtn ? activeRangeBtn.dataset.dashboardRange : "week";
        if (activeRange !== "custom") {
          query = "?range=" + activeRange;
        } else {
          var fromVal = document.querySelector("[data-dashboard-date-from]").value;
          var toVal = document.querySelector("[data-dashboard-date-to]").value;
          if (fromVal && toVal) {
            query = "?from=" + fromVal + "&to=" + toVal;
          }
        }
      }

      var response = await fetch(API_BASE_URL + "/api/admin/dashboard" + query, {
        headers: {
          authorization: "Bearer " + token,
          accept: "application/json"
        }
      });
      if (!response.ok) {
        var errBody = null;
        try { errBody = await response.json(); } catch { /* ignore */ }
        var errMsg = errBody?.error?.message || "Không thể tải dữ liệu dashboard (HTTP " + response.status + ")";
        throw new Error(errMsg);
      }
      var data = await response.json();
      updateDashboardUI(data);
    } catch (err) {
      loadError = true;
      console.error("[Dashboard] Load error:", err);
      showToast(err.message || "Lỗi kết nối tới server");
    }
  }

  function openDrawer(type, insightKey) {
    var content = "";
    var title = "Cảnh báo vận hành";
    if (type === "alerts") {
      content = '<p class="admin-note">Cảnh báo được tổng hợp từ các phân hệ. Dashboard chỉ hiển thị các mục có mức ưu tiên cao nhất.</p><div class="dashboard-drawer-list"><a href="./returns-cskh.html"><strong>Yêu cầu đổi/trả mới nhận</strong><span>Mở CSKH</span></a><a href="./orders.html"><strong>Đơn hàng cần xử lý</strong><span>Mở đơn hàng</span></a><a href="./products.html"><strong>Sản phẩm dưới tồn tối thiểu</strong><span>Mở tồn kho</span></a><a href="./promotions.html"><strong>Chiến dịch khuyến mãi hoạt động</strong><span>Mở khuyến mãi</span></a><a href="./reviews.html"><strong>Đánh giá chưa phản hồi</strong><span>Mở đánh giá</span></a></div>';
    } else {
      var insights = {
        linen: { title: "Áo linen tăng trưởng tốt", description: "Doanh thu nhóm áo linen tăng trưởng tốt, chủ yếu từ khách hàng quay lại.", first: "+18%", second: "42,6M", action: "./products.html", actionLabel: "Xem nhóm sản phẩm" },
        aov: { title: "AOV thay đổi nhẹ", description: "Giá trị đơn trung bình biến động khi áp dụng các chương trình khuyến mãi mùa hè.", first: "-3%", second: "420K", action: "./promotions.html", actionLabel: "Xem hiệu quả khuyến mãi" },
        stock: { title: "Sản phẩm bán chạy sắp hết hàng", description: "Các sản phẩm đóng góp doanh thu cao đang chạm ngưỡng tồn kho tối thiểu.", first: "Mức thấp", second: "31%", action: "./products.html", actionLabel: "Xem tồn kho" },
        voucher: { title: "Voucher khách mới hoạt động", description: "Mã voucher khuyến khích khách hàng đăng ký tài khoản và phát sinh đơn hàng đầu tiên.", first: "12%", second: "5 ngày", action: "./promotions.html", actionLabel: "Xem voucher" }
      };
      var item = insights[insightKey] || insights.linen;
      title = "Insight kinh doanh";
      content = '<span class="admin-badge admin-badge--warning">Cần xem xét</span><h3 class="admin-drawer__section">' + item.title + '</h3><p>' + item.description + '</p><div class="dashboard-drawer-metric"><div><small>Thay đổi</small><strong>' + item.first + '</strong></div><div><small>Giá trị liên quan</small><strong>' + item.second + '</strong></div></div><p class="admin-note">Dữ liệu là tín hiệu gợi ý. Admin nên mở phân hệ liên quan để kiểm tra chi tiết trước khi hành động.</p><a class="admin-btn admin-btn--secondary" href="' + item.action + '">' + item.actionLabel + '</a>';
    }
    overlay.innerHTML = '<div class="admin-drawer-backdrop" data-dashboard-close></div><aside class="admin-drawer admin-drawer--wide dashboard-drawer" aria-modal="true" role="dialog"><header class="admin-drawer__header"><div><small>TỔNG QUAN DASHBOARD</small><h2>' + title + '</h2></div><button class="admin-icon-button" type="button" data-dashboard-close aria-label="Đóng">×</button></header><div class="admin-drawer__body">' + content + '</div></aside>';
  }

  function openReport() {
    overlay.innerHTML = '<div class="admin-modal-overlay" role="presentation"><section class="admin-modal admin-modal--lg" role="dialog" aria-modal="true" aria-labelledby="dashboard-report-title"><header class="admin-modal__header"><div><small>BÁO CÁO NHANH</small><h2 id="dashboard-report-title">Xuất báo cáo Dashboard</h2></div><button class="admin-icon-button" type="button" data-dashboard-close aria-label="Đóng">×</button></header><div class="admin-modal__body"><p>Chọn nội dung cần tổng hợp. Báo cáo sử dụng khoảng thời gian đang chọn trên Dashboard.</p><label class="admin-form-group"><span class="admin-form-label">Khoảng thời gian</span><select class="admin-form-control" data-report-period><option>Hôm nay</option><option selected>7 ngày qua</option><option>30 ngày qua</option><option>Tháng này</option></select></label><div class="dashboard-report-options"><label class="dashboard-report-option"><input type="radio" name="report-type" checked><span>Tổng quan điều hành<small>Cảnh báo, hàng đợi xử lý và tình trạng phân hệ.</small></span></label><label class="dashboard-report-option"><input type="radio" name="report-type"><span>Kết quả kinh doanh<small>Doanh thu, đơn hàng, sản phẩm và tác động khuyến mãi.</small></span></label><label class="dashboard-report-option"><input type="radio" name="report-type"><span>Báo cáo tổng hợp<small>Kết hợp hai góc nhìn trong một báo cáo.</small></span></label></div></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-dashboard-close>Hủy</button><button class="admin-btn admin-btn--secondary" type="button" data-dashboard-export>' + icon("download") + 'Xuất báo cáo</button></footer></section></div>';
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest("[data-dashboard-tab]");
    if (tab) {
      var name = tab.dataset.dashboardTab;
      document.querySelectorAll("[data-dashboard-tab]").forEach(function (button) {
        var active = button === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll("[data-dashboard-panel]").forEach(function (panel) { panel.hidden = panel.dataset.dashboardPanel !== name; });
      return;
    }

    var rangeButton = event.target.closest("[data-dashboard-range]");
    if (rangeButton) {
      var range = rangeButton.dataset.dashboardRange;
      document.querySelectorAll("[data-dashboard-range]").forEach(function (button) {
        var active = button === rangeButton;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      document.querySelector("[data-dashboard-custom-period]").hidden = range !== "custom";
      if (range !== "custom") {
        var rangeLabels = { day: "hôm nay", week: "tuần này", month: "tháng này" };
        showToast("Đã chuyển dữ liệu sang " + rangeLabels[range] + ".");
        loadDashboard({ range: range });
      }
      return;
    }

    var drawerTrigger = event.target.closest("[data-dashboard-drawer]");
    if (drawerTrigger) {
      openDrawer(drawerTrigger.dataset.dashboardDrawer, drawerTrigger.dataset.insight);
      return;
    }

    if (event.target.closest("[data-dashboard-report]")) {
      openReport();
      return;
    }

    if (event.target.closest("[data-dashboard-export]")) {
      closeOverlay();
      showToast("Đã chuẩn bị báo cáo Dashboard.");
      return;
    }

    if (event.target.closest("[data-dashboard-close]")) {
      closeOverlay();
      return;
    }

    var refresh = event.target.closest("[data-dashboard-refresh]");
    if (refresh) {
      root.classList.add("dashboard-refreshing");
      refresh.disabled = true;
      loadDashboard().finally(function () {
        root.classList.remove("dashboard-refreshing");
        refresh.disabled = false;
        showToast("Dữ liệu Dashboard đã được làm mới.");
      });
      return;
    }

    var sideButton = event.target.closest("[data-dashboard-sidebar]");
    if (sideButton) {
      if (window.innerWidth > 768) {
        var collapsed = !root.classList.contains("admin-layout--sidebar-collapsed");
        root.classList.toggle("admin-layout--sidebar-collapsed", collapsed);
        sideButton.setAttribute("aria-expanded", String(!collapsed));
        sideButton.setAttribute("aria-label", collapsed ? "Mở sidebar" : "Đóng sidebar");
        sideButton.title = collapsed ? "Mở sidebar" : "Đóng sidebar";
      } else {
        var open = !sidebar.classList.contains("is-open");
        sidebar.classList.toggle("is-open", open);
        backdrop.hidden = !open;
        sideButton.setAttribute("aria-expanded", String(open));
      }
    }
  });

  backdrop.addEventListener("click", function () {
    sidebar.classList.remove("is-open");
    backdrop.hidden = true;
  });

  document.querySelector("[data-dashboard-custom-period]").addEventListener("submit", function (event) {
    event.preventDefault();
    var from = document.querySelector("[data-dashboard-date-from]").value;
    var to = document.querySelector("[data-dashboard-date-to]").value;
    if (!from || !to) {
      showToast("Vui lòng chọn đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (from > to) {
      showToast("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }
    showToast("Đã áp dụng khoảng thời gian đã chọn.");
    loadDashboard({ from: from, to: to });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeOverlay();
  });

  loadDashboard();
}());
