/**
 * Policy Tabs Module — Velura
 * Xử lý chuyển đổi qua lại giữa các Tab Chính sách và Điều khoản
 * Đảm bảo hiệu ứng mượt mà và tự động cuộn thông minh khi đổi nội dung
 */

export function initPolicyTabs() {
  const tabs = document.querySelectorAll(".js-policy-tab");
  const panels = document.querySelectorAll(".js-policy-panel");
  const contentArea = document.querySelector(".policy-content");

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", function () {
      const targetId = tab.getAttribute("data-policy-tab");
      const targetPanel = document.getElementById(`policy-panel-${targetId}`);

      if (!targetPanel) return;

      // 1. Loại bỏ class hoạt động cũ
      tabs.forEach(t => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(p => p.classList.remove("is-active"));

      // 2. Thêm class hoạt động mới
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      targetPanel.classList.add("is-active");

      // 3. Cuộn trang mượt mà (Smooth scroll)
      if (window.innerWidth < 992) {
        // Trên thiết bị di động, tự động cuộn xuống phần nội dung chi tiết
        if (contentArea) {
          const headerHeight = 80; // Trừ hao phần header cố định (nếu có)
          const elementPosition = contentArea.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      } else {
        // Trên Desktop, nếu người dùng cuộn quá sâu xuống dưới,
        // cuộn nhẹ để nội dung hiển thị tối ưu nhất trong tầm mắt
        const rect = contentArea.getBoundingClientRect();
        if (rect.top < 0) {
          contentArea.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}
