(function () {
  "use strict";

  var root = document.querySelector("[data-dashboard]");
  if (!root) return;

  var overlay = document.querySelector("#dashboard-overlay");
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

  function openDrawer(type, insightKey) {
    var content = "";
    var title = "Cảnh báo vận hành";
    if (type === "alerts") {
      content = '<p class="admin-note">8 cảnh báo được tổng hợp từ các phân hệ. Dashboard chỉ hiển thị các mục có mức ưu tiên cao nhất.</p><div class="dashboard-drawer-list"><a href="./returns-cskh.html"><strong>3 phiếu đổi/trả sắp hết hạn</strong><span>Mở CSKH</span></a><a href="./orders.html"><strong>5 đơn thanh toán lỗi</strong><span>Mở đơn hàng</span></a><a href="./products.html"><strong>4 sản phẩm dưới tồn tối thiểu</strong><span>Mở tồn kho</span></a><a href="./promotions.html"><strong>2 campaign gần hết ngân sách</strong><span>Mở khuyến mãi</span></a><a href="./reviews.html"><strong>6 đánh giá tiêu cực cần phản hồi</strong><span>Mở đánh giá</span></a></div>';
    } else {
      var insights = {
        linen: { title: "Áo linen tăng trưởng tốt", description: "Doanh thu nhóm áo linen tăng 18% trong 7 ngày, chủ yếu từ khách hàng quay lại.", first: "18%", second: "42,6M", action: "./products.html", actionLabel: "Xem nhóm sản phẩm" },
        aov: { title: "AOV giảm khi chạy khuyến mãi", description: "Giá trị đơn trung bình giảm 3% trong Flash Sale dù số lượng đơn tăng 21%.", first: "-3%", second: "420K", action: "./promotions.html", actionLabel: "Xem hiệu quả khuyến mãi" },
        stock: { title: "Sản phẩm bán chạy sắp hết hàng", description: "4 sản phẩm đóng góp 31% doanh thu đang dưới mức tồn tối thiểu.", first: "4 SP", second: "31%", action: "./products.html", actionLabel: "Xem tồn kho" },
        voucher: { title: "Voucher khách mới có tỷ lệ dùng thấp", description: "Nhóm voucher dành cho khách mới chỉ đạt 12% lượt sử dụng sau 5 ngày phát hành.", first: "12%", second: "5 ngày", action: "./promotions.html", actionLabel: "Xem voucher" }
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
      window.setTimeout(function () {
        root.classList.remove("dashboard-refreshing");
        refresh.disabled = false;
        showToast("Dữ liệu Dashboard đã được làm mới.");
      }, 650);
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
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeOverlay();
  });
}());
