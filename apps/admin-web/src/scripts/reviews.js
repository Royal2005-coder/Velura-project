import { reviewApi } from "./review-api.js";

const state = { rows: [], count: 0, active: "all", selected: null, currentPage: 1, itemsPerPage: 10 };
const panel = document.querySelector("#review-panel");
const overlay = document.querySelector("#review-overlay");
const statusLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã ẩn" };

export function escapeReviewHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function icon(name) {
  return `<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#${escapeReviewHtml(name)}" /></svg>`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function stars(value) {
  const rating = Math.max(0, Math.min(5, Number(value || 0)));
  return `<span class="admin-review-snippet__stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)} <small>${rating}/5</small></span>`;
}

function statusBadge(status) {
  return `<span class="admin-badge admin-badge--review-${escapeReviewHtml(status)}">${escapeReviewHtml(statusLabels[status] || status)}</span>`;
}

function filteredRows() {
  if (state.active === "pending") return state.rows.filter((row) => row.status === "pending" && !row.is_flagged_urgent);
  if (state.active === "urgent") return state.rows.filter((row) => row.is_flagged_urgent || Number(row.rating) <= 2);
  if (state.active === "processed") return state.rows.filter((row) => row.status !== "pending" || row.admin_reply);
  return state.rows;
}

function filters() {
  return `<form class="admin-filter-bar admin-order-filter-bar" data-review-filter>
    <div class="admin-filter-bar__search"><label class="admin-search-field">${icon("search")}<input class="admin-form-control" name="q" type="search" placeholder="Nội dung hoặc sản phẩm..." data-review-search /></label></div>
    <div class="admin-filter-bar__filters">
      <label class="admin-form-group"><select class="admin-form-control" name="rating" data-review-stars aria-label="Số sao"><option value="">Tất cả số sao</option>${[5,4,3,2,1].map((value) => `<option value="${value}">${value} sao</option>`).join("")}</select></label>
      <label class="admin-form-group"><select class="admin-form-control" name="status" data-review-status aria-label="Trạng thái"><option value="">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã ẩn</option></select></label>
      <label class="admin-form-group"><select class="admin-form-control" name="alert" data-review-alert aria-label="Cảnh báo"><option value="">Tất cả cảnh báo</option><option value="urgent">Khẩn cấp</option><option value="normal">Bình thường</option></select></label>
    </div>
    <div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm" type="submit">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset">Đặt lại</button></div>
  </form>`;
}

function actions(row) {
  const id = escapeReviewHtml(row.review_id);
  return `<div class="admin-review-actions"><button class="admin-icon-button admin-icon-button--sm" title="Xem chi tiết" data-review-detail="${id}">${icon("eye")}</button>
    <button class="admin-icon-button admin-icon-button--sm" title="Thao tác" data-review-menu="${id}">${icon("edit")}</button>
    <div class="admin-dropdown admin-table-action-menu admin-review-action-menu" id="review-menu-${id}" hidden>
      <button data-review-detail="${id}">${icon("eye")}<span>Xem chi tiết</span></button>
      ${row.status !== "approved" ? `<button data-review-action="approve" data-review-id="${id}">${icon("check")}<span>Phê duyệt</span></button>` : ""}
      <button data-review-action="reply" data-review-id="${id}">${icon("edit")}<span>Phản hồi</span></button>
      ${row.status !== "rejected" ? `<button class="admin-review-action-menu__danger" data-review-action="hide" data-review-id="${id}">${icon("lock")}<span>Ẩn đánh giá</span></button>` : ""}
      <button data-review-action="escalate" data-review-id="${id}">${icon("support")}<span>Tạo ticket CSKH</span></button>
    </div></div>`;
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
  if (totalPages <= 1) return "";
  
  let buttons = "";
  buttons += `<button type="button" data-review-page="${state.currentPage - 1}" ${state.currentPage === 1 ? "disabled" : ""}>←</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 6) {
      if (i !== 1 && i !== totalPages && Math.abs(state.currentPage - i) > 1) {
        if (i === 2 && state.currentPage > 3) {
          buttons += `<span class="pagination-ellipsis">...</span>`;
        } else if (i === totalPages - 1 && state.currentPage < totalPages - 2) {
          buttons += `<span class="pagination-ellipsis">...</span>`;
        }
        continue;
      }
    }
    buttons += `<button type="button" class="${state.currentPage === i ? "is-active" : ""}" data-review-page="${i}">${i}</button>`;
  }
  
  buttons += `<button type="button" data-review-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? "disabled" : ""}>→</button>`;
  return `<nav class="admin-pagination">${buttons}</nav>`;
}

function table() {
  const activeRows = filteredRows();
  const totalItems = activeRows.length;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }

  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const pagedRows = activeRows.slice(start, end);

  if (!pagedRows.length) return `<div class="admin-order-empty">${icon("star")}<strong>Không có đánh giá phù hợp</strong><span>Dữ liệu được tải trực tiếp từ Supabase.</span></div>`;
  return `<div class="admin-table-wrap"><table class="admin-table admin-table--content admin-data-table"><thead><tr><th class="cell-description">Đánh giá</th><th class="cell-primary">Sản phẩm</th><th>Khách hàng</th><th class="cell-status">Cảnh báo</th><th class="cell-status">Trạng thái</th><th class="cell-date">Ngày tạo</th><th class="cell-action">Thao tác</th></tr></thead><tbody>${pagedRows.map((row) => `<tr>
    <td class="cell-description"><div class="admin-review-snippet">${stars(row.rating)}<p>${escapeReviewHtml(row.comment || "—")}</p></div></td>
    <td class="cell-primary"><div class="admin-review-product"><strong>${escapeReviewHtml(row.product?.name || "—")}</strong><small>${escapeReviewHtml(row.product?.sku || row.product_id)}</small></div></td>
    <td><span class="admin-order-code">${escapeReviewHtml(row.user_id)}</span></td>
    <td class="cell-status">${row.is_flagged_urgent ? '<span class="admin-badge admin-badge--danger">Khẩn cấp</span>' : '<span class="admin-badge admin-badge--neutral">Bình thường</span>'}</td>
    <td class="cell-status">${statusBadge(row.status)}</td><td class="cell-date">${escapeReviewHtml(formatDate(row.submitted_at))}</td><td class="cell-action">${actions(row)}</td></tr>`).join("")}</tbody></table></div>`;
}

function updateKpis() {
  const values = [state.count, state.rows.filter((r) => r.status === "pending").length, state.rows.filter((r) => r.is_flagged_urgent || Number(r.rating) <= 2).length, state.rows.filter((r) => r.status === "rejected").length, state.rows.filter((r) => r.is_flagged_urgent).length];
  document.querySelectorAll(".admin-review-kpis .admin-kpi-card__value").forEach((node, index) => { node.textContent = String(values[index] || 0); });
  document.querySelectorAll("[data-review-tab] span").forEach((node) => {
    const tab = node.parentElement.dataset.reviewTab;
    node.textContent = String(tab === "all" ? state.count : tab === "pending" ? values[1] : tab === "urgent" ? values[2] : state.rows.filter((r) => r.status !== "pending").length);
  });
}

function render() {
  if (state.active === "logs") return loadLogs();
  const activeRows = filteredRows();
  const totalItems = activeRows.length;
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = Math.min(start + state.itemsPerPage, totalItems);
  const showStart = totalItems === 0 ? 0 : start + 1;

  panel.innerHTML = `${filters()}${table()}<div class="admin-card__footer"><p class="admin-table-note">Hiển thị ${showStart} - ${end} / ${totalItems} đánh giá</p>${renderPagination(totalItems)}</div>`;
  updateKpis();
}

async function load(params = {}) {
  panel.innerHTML = '<div class="admin-order-empty"><strong>Đang tải đánh giá...</strong></div>';
  try {
    const result = await reviewApi.list({ ...params, limit: 100 });
    state.rows = result.rows || [];
    state.count = result.count ?? state.rows.length;
    render();
  } catch (error) { showError(error); }
}

async function loadLogs() {
  panel.innerHTML = '<div class="admin-order-empty"><strong>Đang tải nhật ký...</strong></div>';
  try {
    const result = await reviewApi.auditLogs({ limit: 100 });
    const rows = result.rows || [];
    panel.innerHTML = `<div class="admin-table-wrap admin-table-wrap--scroll"><table class="admin-table admin-table--log"><thead><tr><th class="cell-date">Thời gian</th><th>Đối tượng</th><th>Vai trò</th><th>Hành động</th><th class="cell-description">Thay đổi</th></tr></thead><tbody>${rows.map((log) => `<tr><td>${escapeReviewHtml(formatDate(log.timestamp))}</td><td>${escapeReviewHtml(log.target_id)}</td><td>${escapeReviewHtml(log.actor_role)}</td><td>${escapeReviewHtml(log.action)}</td><td><span class="cell-description-content">${escapeReviewHtml(JSON.stringify(log.new_value || {}))}</span></td></tr>`).join("") || '<tr><td colspan="5">Chưa có nhật ký</td></tr>'}</tbody></table></div>`;
  } catch (error) { showError(error); }
}

async function openDetail(id) {
  overlay.innerHTML = '<div class="admin-drawer-backdrop" data-review-close></div><aside class="admin-drawer admin-drawer--wide"><div class="admin-drawer__body">Đang tải...</div></aside>';
  try {
    const row = await reviewApi.get(id);
    state.selected = row;
    overlay.innerHTML = `<div class="admin-drawer-backdrop" data-review-close></div><aside class="admin-drawer admin-drawer--wide"><header class="admin-drawer__header"><div><p class="admin-product-code">${escapeReviewHtml(row.review_id)}</p><h2 class="admin-section__title">${escapeReviewHtml(row.product?.name || "Đánh giá")}</h2><div class="admin-status-group">${stars(row.rating)}${statusBadge(row.status)}</div></div><button class="admin-icon-button" data-review-close>×</button></header><div class="admin-drawer__body"><h3 class="admin-drawer__section">Nội dung</h3><p class="admin-review-original">${escapeReviewHtml(row.comment || "—")}</p>${row.admin_reply ? `<div class="admin-review-response"><strong>Phản hồi Velura</strong><br>${escapeReviewHtml(row.admin_reply)}</div>` : ""}<dl class="admin-data-list"><div><dt>Đơn hàng</dt><dd>${escapeReviewHtml(row.order_id)}</dd></div><div><dt>Khách hàng</dt><dd>${escapeReviewHtml(row.user_id)}</dd></div><div><dt>Ngày gửi</dt><dd>${escapeReviewHtml(formatDate(row.submitted_at))}</dd></div></dl></div></aside>`;
  } catch (error) { overlay.innerHTML = ""; toast(error.message, true); }
}

function openAction(type, id) {
  const row = state.rows.find((item) => item.review_id === id);
  if (!row) return;
  const textarea = type === "approve" ? '<textarea class="admin-form-control admin-form-textarea" name="actionNote" maxlength="500" placeholder="Ghi chú nội bộ"></textarea>' : `<textarea class="admin-form-control admin-form-textarea" name="value" minlength="${type === "reply" ? 1 : 10}" maxlength="2000" required></textarea>`;
  const titles = { approve: "Phê duyệt đánh giá", hide: "Ẩn đánh giá", reply: "Phản hồi đánh giá", escalate: "Tạo ticket CSKH" };
  overlay.innerHTML = `<div class="admin-modal-overlay"><section class="admin-modal"><form data-review-action-form data-type="${type}" data-review-id="${escapeReviewHtml(id)}"><header class="admin-modal__header"><h2>${titles[type]}</h2><button class="admin-icon-button" type="button" data-review-close>×</button></header><div class="admin-modal__body"><p>${escapeReviewHtml(row.comment || "—")}</p><label class="admin-form-group"><span class="admin-form-label">${type === "reply" ? "Nội dung phản hồi" : "Lý do / ghi chú"}</span>${textarea}</label></div><footer class="admin-modal__footer"><button class="admin-btn admin-btn--ghost" type="button" data-review-close>Đóng</button><button class="admin-btn admin-btn--secondary" type="submit">Xác nhận</button></footer></form></section></div>`;
}

async function submitAction(form) {
  const row = state.rows.find((item) => item.review_id === form.dataset.reviewId);
  const type = form.dataset.type;
  const value = form.value?.value || "";
  const payload = { expectedVersion: row.version };
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    if (type === "approve") await reviewApi.approve(row.review_id, { ...payload, actionNote: form.actionNote.value });
    if (type === "hide") await reviewApi.hide(row.review_id, { ...payload, reason: value });
    if (type === "reply") await reviewApi.reply(row.review_id, { ...payload, reply: value });
    if (type === "escalate") await reviewApi.escalate(row.review_id, { ...payload, reason: value });
    overlay.innerHTML = "";
    toast("Thao tác đã được cập nhật trên Supabase.");
    await load();
  } catch (error) { toast(error.message, true); }
  finally { submit.disabled = false; }
}

function exportCsv() {
  const rows = [["review_id","product_id","rating","status","submitted_at"], ...filteredRows().map((r) => [r.review_id,r.product_id,r.rating,r.status,r.submitted_at])];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv" })); link.download = "velura-reviews.csv"; link.click(); URL.revokeObjectURL(link.href);
}

function toast(message, error = false) {
  const node = document.querySelector("#review-toast"); node.textContent = message; node.classList.toggle("is-error", error); node.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { node.hidden = true; }, 3500);
}
function showError(error) { panel.innerHTML = `<div class="admin-order-empty">${icon("alert")}<strong>Không thể tải dữ liệu</strong><span>${escapeReviewHtml(error.message)}</span><button class="admin-btn admin-btn--secondary" data-review-retry>Thử lại</button></div>`; }

document.addEventListener("click", (event) => {
  const pageBtn = event.target.closest("[data-review-page]");
  if (pageBtn) {
    const page = Number(pageBtn.dataset.reviewPage);
    if (!Number.isNaN(page) && page > 0) {
      state.currentPage = page;
      render();
    }
    return;
  }

  const button = event.target.closest("button"); if (!button) return;
  if (button.dataset.reviewTab) {
    state.active = button.dataset.reviewTab;
    state.currentPage = 1;
    document.querySelectorAll("[data-review-tab]").forEach((tab) => tab.classList.toggle("admin-tab--active", tab === button));
    render();
  }
  if (button.dataset.reviewOpenLogs !== undefined) { state.active = "logs"; state.currentPage = 1; render(); }
  if (button.dataset.reviewSidebar !== undefined) document.querySelector(".admin-layout").classList.toggle("admin-layout--sidebar-collapsed");
  if (button.dataset.reviewMenu) { document.querySelectorAll(".admin-review-action-menu").forEach((menu) => { menu.hidden = true; }); document.querySelector(`#review-menu-${CSS.escape(button.dataset.reviewMenu)}`).hidden = false; }
  if (button.dataset.reviewDetail) openDetail(button.dataset.reviewDetail);
  if (button.dataset.reviewAction) openAction(button.dataset.reviewAction, button.dataset.reviewId);
  if (button.dataset.reviewClose !== undefined) overlay.innerHTML = "";
  if (button.dataset.reviewRetry !== undefined) load();
  if (button.dataset.reviewExport !== undefined) exportCsv();
});
panel.addEventListener("submit", (event) => {
  if (event.target.matches("[data-review-filter]")) {
    event.preventDefault();
    state.currentPage = 1;
    load(Object.fromEntries(new FormData(event.target)));
  }
});
panel.addEventListener("reset", () => {
  state.currentPage = 1;
  setTimeout(() => load(), 0);
});
overlay.addEventListener("submit", (event) => { if (event.target.matches("[data-review-action-form]")) { event.preventDefault(); submitAction(event.target); } });

load();
