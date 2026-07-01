/**
 * Collections Filter Module — Velura
 * Quản lý lọc bộ sưu tập theo tab trên trang collections.html
 */

export function initCollectionsFilter() {
  const tabs = document.querySelectorAll(".collections-tab");
  const collections = document.querySelectorAll(".collection-detail");

  if (!tabs.length || !collections.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", function () {
      // Đổi trạng thái active của tab
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const filterValue = tab.getAttribute("data-filter");

      // Lọc các khối bộ sưu tập tương ứng
      collections.forEach(col => {
        const category = col.getAttribute("data-category");
        if (filterValue === "all" || category === filterValue) {
          col.classList.remove("hidden");
        } else {
          col.classList.add("hidden");
        }
      });
    });
  });
}
