import { accountApi } from "./account-api.js";

const state = { accounts: [], requests: [], logs: [], tab: "all", filtered: [], currentPage: 1, itemsPerPage: 10 };
const panel = document.querySelector("#panel");
const overlay = document.querySelector("#overlay");
const roles = [
  "admin_viewer",
  "admin_operator_sanpham",
  "admin_operator_donhang",
  "admin_operator_cskh_dt",
  "admin_operator_gia_km",
  "admin_operator_danhgia_review",
  "super_admin"
];

export function countWords(value) {
  const text = String(value || "").trim();
  return text ? text.split(/\s+/u).filter(Boolean).length : 0;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function icon(name) {
  return `<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#${escapeHtml(name)}"></use></svg>`;
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
  if (totalPages <= 1) return "";
  
  let buttons = "";
  buttons += `<button type="button" data-account-page="${state.currentPage - 1}" ${state.currentPage === 1 ? "disabled" : ""}>←</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 6) {
      if (i !== 1 && i !== totalPages && Math.abs(state.currentPage - i) > 1) {
        if (i === 2 && state.currentPage > 3) {
          buttons += `<span class="pagination-ellipsis" style="padding: 0 4px; color: var(--muted);">...</span>`;
        } else if (i === totalPages - 1 && state.currentPage < totalPages - 2) {
          buttons += `<span class="pagination-ellipsis" style="padding: 0 4px; color: var(--muted);">...</span>`;
        }
        continue;
      }
    }
    buttons += `<button type="button" class="${state.currentPage === i ? "is-active" : ""}" data-account-page="${i}">${i}</button>`;
  }
  
  buttons += `<button type="button" data-account-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? "disabled" : ""}>→</button>`;
  return `<nav class="admin-pagination">${buttons}</nav>`;
}

function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
}

function status(row) {
  return row.is_active ? "active" : row.lock_type === "permanent" ? "locked_perm" : "locked_temp";
}

function badge(value) {
  const text = {
    active: "Đang hoạt động",
    locked_temp: "Khóa tạm thời",
    locked_perm: "Khóa vĩnh viễn",
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    expired: "Hết hạn"
  }[value] || value;
  return `<span class="admin-badge admin-badge--${
    value === "active" || value === "approved" ? "success" : value === "pending" ? "pending" : "danger"
  }">${escapeHtml(text)}</span>`;
}

function updateKpis() {
  const values = [
    state.accounts.length,
    state.accounts.filter((row) => row.is_active).length,
    state.accounts.filter((row) => !row.is_active).length,
    state.requests.filter((row) => row.status === "pending").length
  ];
  document.querySelectorAll(".admin-kpi-grid--accounts .admin-kpi-card__value").forEach((node, index) => {
    node.textContent = String(values[index] || 0);
  });
  document.querySelectorAll("[data-tab] span").forEach((node) => {
    const tab = node.parentElement.dataset.tab;
    node.textContent = String(
      tab === "all" ? values[0] : tab === "locked" ? values[2] : tab === "promotions" ? values[3] : state.logs.length
    );
  });
}

function filterBar() {
  return `
    <form class="admin-filter-bar admin-order-filter-bar" data-account-filter>
      <label class="admin-search-field">
        ${icon("search")}
        <input class="admin-form-control" name="q" placeholder="Tìm tên, email hoặc số điện thoại">
      </label>
      <select class="admin-form-control" name="role">
        <option value="">Tất cả loại tài khoản</option>
        <option value="member">Thành viên</option>
        <option value="admin">Quản trị viên</option>
      </select>
      <div class="admin-filter-bar__actions">
        <button class="admin-btn admin-btn--filter admin-btn--sm">Lọc</button>
        <button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset">Đặt lại</button>
      </div>
    </form>
  `;
}

function accountTable() {
  const rows = state.tab === "locked" ? state.filtered.filter((row) => !row.is_active) : state.filtered;
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / state.itemsPerPage) || 1;
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }

  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const pagedRows = rows.slice(start, end);

  if (!pagedRows.length) {
    return `
      <div class="admin-empty-state">
        <strong>Không có tài khoản phù hợp</strong>
        <p>Dữ liệu được tải trực tiếp từ Supabase.</p>
      </div>
    `;
  }
  return `
    <div class="admin-table-wrap">
      <table class="admin-table admin-data-table">
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Loại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Đăng nhập gần nhất</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${pagedRows.map((row) => `
            <tr>
              <td>
                <div class="admin-person">
                  <span class="admin-avatar">${escapeHtml((row.full_name || row.email || "U").slice(0, 2).toUpperCase())}</span>
                  <span>
                    <strong>${escapeHtml(row.full_name || "Chưa cập nhật")}</strong>
                    <small>${escapeHtml(row.email || row.phone || "-")}</small>
                  </span>
                </div>
              </td>
              <td>${escapeHtml(row.role)}</td>
              <td><span class="admin-role-badge">${escapeHtml(row.admin_role || "member")}</span></td>
              <td>${badge(status(row))}</td>
              <td>${escapeHtml(date(row.last_login_at))}</td>
              <td>
                <div class="admin-table-actions">
                  <button class="admin-icon-button admin-icon-button--sm" data-account-detail="${escapeHtml(row.user_id)}" title="Xem chi tiết">${icon("eye")}</button>
                  <button class="admin-icon-button admin-icon-button--sm" data-account-action="${row.is_active ? "lock" : "unlock"}:${escapeHtml(row.user_id)}" title="${row.is_active ? "Khóa" : "Mở khóa"} tài khoản">${icon(row.is_active ? "lock" : "unlock")}</button>
                  <button class="admin-icon-button admin-icon-button--sm" data-account-action="role:${escapeHtml(row.user_id)}" title="Thay đổi vai trò">${icon("edit")}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function requestTable() {
  if (!state.requests.length) return '<div class="admin-empty-state"><strong>Không có yêu cầu nâng quyền</strong></div>';
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Yêu cầu</th>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Hết hạn</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${state.requests.map((row) => `
            <tr>
              <td>${escapeHtml(row.request_id)}</td>
              <td>${escapeHtml(row.target_user_id)}</td>
              <td>${escapeHtml(row.requested_role)}</td>
              <td>${date(row.expires_at)}</td>
              <td>${badge(row.status)}</td>
              <td>
                <div class="admin-table-actions">
                  ${row.status === "pending"
                    ? `<button class="admin-btn admin-btn--secondary admin-btn--sm" data-request="approve:${escapeHtml(row.request_id)}">Duyệt</button>
                       <button class="admin-btn admin-btn--danger admin-btn--sm" data-request="reject:${escapeHtml(row.request_id)}">Từ chối</button>`
                    : "-"
                  }
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function logTable() {
  if (!state.logs.length) return '<div class="admin-empty-state"><strong>Chưa có nhật ký tài khoản</strong></div>';
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người thực hiện</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
            <th>Dữ liệu cũ</th>
            <th>Dữ liệu mới</th>
          </tr>
        </thead>
        <tbody>
          ${state.logs.map((row) => `
            <tr>
              <td>${date(row.timestamp)}</td>
              <td>${escapeHtml(row.actor_id || "system")}</td>
              <td>${escapeHtml(row.action)}</td>
              <td>${escapeHtml(row.target_id)}</td>
              <td><div class="admin-log-json">${escapeHtml(JSON.stringify(row.old_value || {}))}</div></td>
              <td><div class="admin-log-json">${escapeHtml(JSON.stringify(row.new_value || {}))}</div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function skeletalTable() {
  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Loại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Đăng nhập gần nhất</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${Array(5).fill(0).map(() => `
            <tr class="admin-table-row-skeleton">
              <td>
                <div class="admin-person-skeleton">
                  <div class="admin-avatar-skeleton skeleton-pulse"></div>
                  <div class="admin-person-copy-skeleton">
                    <div class="skeleton-line skeleton-line--name skeleton-pulse"></div>
                    <div class="skeleton-line skeleton-line--email skeleton-pulse"></div>
                  </div>
                </div>
              </td>
              <td><div class="skeleton-line skeleton-line--role skeleton-pulse"></div></td>
              <td><div class="skeleton-line skeleton-line--role-badge skeleton-pulse"></div></td>
              <td><div class="skeleton-line skeleton-line--badge skeleton-pulse"></div></td>
              <td><div class="skeleton-line skeleton-line--date skeleton-pulse"></div></td>
              <td>
                <div class="admin-actions-skeleton">
                  <div class="admin-btn-skeleton skeleton-pulse"></div>
                  <div class="admin-btn-skeleton skeleton-pulse"></div>
                  <div class="admin-btn-skeleton skeleton-pulse"></div>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function render() {
  const rows = state.tab === "locked" ? state.filtered.filter((row) => !row.is_active) : state.filtered;
  const totalItems = rows.length;
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = Math.min(start + state.itemsPerPage, totalItems);
  const showStart = totalItems === 0 ? 0 : start + 1;

  panel.innerHTML = state.tab === "promotions" ? requestTable() : state.tab === "logs" ? logTable() : `${filterBar()}${accountTable()}<div class="admin-card__footer"><p class="admin-table-note">Hiển thị ${showStart} - ${end} / ${totalItems} tài khoản</p>${renderPagination(totalItems)}</div>`;
  updateKpis();
}

function detail(id) {
  const row = state.accounts.find((item) => item.user_id === id);
  if (!row) return;
  overlay.innerHTML = `
    <div class="admin-drawer-backdrop" data-account-close></div>
    <aside class="admin-drawer admin-drawer--wide">
      <header class="admin-drawer__header">
        <div>
          <p class="admin-product-code">${escapeHtml(row.user_id)}</p>
          <h2>${escapeHtml(row.full_name || row.email)}</h2>
        </div>
        <button class="admin-icon-button" data-account-close>×</button>
      </header>
      <div class="admin-drawer__body">
        <dl class="admin-data-list">
          ${Object.entries(row).map(([key, value]) => `
            <div>
              <dt>${escapeHtml(key)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    </aside>
  `;
}

function updateLockTypeFields(form) {
  const lockType = form.elements.lockType.value;
  let expiryGroup = form.querySelector("#lock-until-group");
  if (lockType === "temporary") {
    if (!expiryGroup) {
      const group = document.createElement("div");
      group.className = "admin-form-group";
      group.id = "lock-until-group";
      group.innerHTML = `
        <span class="admin-form-label">Thời hạn khóa</span>
        <input type="datetime-local" class="admin-form-control" name="lockedUntil" required>
      `;
      const lockTypeGroup = form.elements.lockType.closest(".admin-form-group");
      lockTypeGroup.after(group);
    }
  } else {
    if (expiryGroup) expiryGroup.remove();
  }
}

function accountModal(action, id) {
  const row = state.accounts.find((item) => item.user_id === id);
  if (!row) return;

  let roleFields = "";
  if (action === "role") {
    roleFields = `
      <label class="admin-form-group">
        <span class="admin-form-label">Loại tài khoản</span>
        <select class="admin-form-control" name="role">
          <option value="member">Thành viên</option>
          <option value="admin" ${row.role === "admin" ? "selected" : ""}>Quản trị viên</option>
        </select>
      </label>
      <label class="admin-form-group" id="admin-role-group" ${row.role !== "admin" ? "hidden" : ""}>
        <span class="admin-form-label">Vai trò quản trị</span>
        <select class="admin-form-control" name="adminRole">
          <option value="">Không có</option>
          ${roles.map((role) => `<option value="${role}" ${row.admin_role === role ? "selected" : ""}>${role}</option>`).join("")}
        </select>
      </label>
    `;
  } else if (action === "lock") {
    roleFields = `
      <label class="admin-form-group">
        <span class="admin-form-label">Loại khóa</span>
        <select class="admin-form-control" name="lockType">
          <option value="temporary">Tạm thời</option>
          <option value="permanent">Vĩnh viễn</option>
        </select>
      </label>
      <div class="admin-form-group" id="lock-until-group">
        <span class="admin-form-label">Thời hạn khóa</span>
        <input type="datetime-local" class="admin-form-control" name="lockedUntil" required>
      </div>
    `;
  }

  const reasonField = action !== "role"
    ? `
      <label class="admin-form-group">
        <span class="admin-form-label">Lý do (yêu cầu chi tiết hơn 10 từ)</span>
        <textarea class="admin-form-control admin-form-textarea" name="reason" placeholder="Nhập lý do chi tiết để mở khóa hoặc khóa tài khoản..." required></textarea>
        <span class="admin-form-helper" data-word-counter>Số từ: 0 / tối thiểu 11 từ</span>
      </label>
    `
    : "";

  overlay.innerHTML = `
    <div class="admin-modal-overlay">
      <section class="admin-modal">
        <form data-account-form data-action="${action}" data-id="${escapeHtml(id)}">
          <header class="admin-modal__header">
            <h2>${action === "role" ? "Thay đổi vai trò" : action === "lock" ? "Khóa tài khoản" : "Mở khóa tài khoản"}</h2>
            <button class="admin-icon-button" type="button" data-account-close>×</button>
          </header>
          <div class="admin-modal__body">
            ${roleFields}
            ${reasonField}
            <div class="admin-form-error" data-error-field hidden></div>
          </div>
          <footer class="admin-modal__footer">
            <button class="admin-btn admin-btn--ghost" type="button" data-account-close>Hủy</button>
            <button class="admin-btn admin-btn--secondary">Xác nhận</button>
          </footer>
        </form>
      </section>
    </div>
  `;
}

function requestModal(decision, id) {
  const row = state.requests.find((item) => item.request_id === id);
  if (!row) return;

  const noteLabel = decision === "reject" ? "Lý do từ chối (yêu cầu chi tiết hơn 10 từ)" : "Ghi chú phê duyệt (tùy chọn)";
  const notePlaceholder = decision === "reject" ? "Nhập lý do từ chối cụ thể..." : "Nhập ghi chú hoặc hướng dẫn...";
  const counterText = decision === "reject" ? '<span class="admin-form-helper" data-word-counter>Số từ: 0 / tối thiểu 11 từ</span>' : "";

  overlay.innerHTML = `
    <div class="admin-modal-overlay">
      <section class="admin-modal">
        <form data-request-form data-decision="${decision}" data-id="${escapeHtml(id)}">
          <header class="admin-modal__header">
            <h2>${decision === "approve" ? "Duyệt" : "Từ chối"} yêu cầu</h2>
            <button class="admin-icon-button" type="button" data-account-close>×</button>
          </header>
          <div class="admin-modal__body">
            <label class="admin-form-group">
              <span class="admin-form-label">${noteLabel}</span>
              <textarea class="admin-form-control admin-form-textarea" name="note" placeholder="${notePlaceholder}" ${decision === "reject" ? "required" : ""}></textarea>
              ${counterText}
            </label>
            <div class="admin-form-error" data-error-field hidden></div>
          </div>
          <footer class="admin-modal__footer">
            <button class="admin-btn admin-btn--ghost" type="button" data-account-close>Hủy</button>
            <button class="admin-btn admin-btn--secondary">Xác nhận</button>
          </footer>
        </form>
      </section>
    </div>
  `;
}

async function load() {
  panel.innerHTML = skeletalTable();
  try {
    const [accounts, requests, logs] = await Promise.all([
      accountApi.list({ limit: 100 }),
      accountApi.listRoleRequests({ limit: 100 }),
      accountApi.listAuditLogs({ limit: 100 })
    ]);
    state.accounts = accounts.rows || [];
    state.filtered = [...state.accounts];
    state.requests = requests.rows || [];
    state.logs = logs.rows || [];
    render();
  } catch (error) {
    panel.innerHTML = `<div class="admin-empty-state"><strong>${escapeHtml(error.message || "Không thể tải dữ liệu")}</strong></div>`;
  }
}

// Global Event Listeners
document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) {
    state.tab = tab.dataset.tab;
    state.currentPage = 1;
    document.querySelectorAll("[data-tab]").forEach((node) => node.classList.toggle("admin-tab--active", node.dataset.tab === state.tab));
    render();
  }
  const pageBtn = event.target.closest("[data-account-page]");
  if (pageBtn) {
    const page = Number(pageBtn.dataset.accountPage);
    if (!Number.isNaN(page) && page > 0) {
      state.currentPage = page;
      render();
    }
    return;
  }
  const detailButton = event.target.closest("[data-account-detail]");
  if (detailButton) detail(detailButton.dataset.accountDetail);
  const actionButton = event.target.closest("[data-account-action]");
  if (actionButton) accountModal(...actionButton.dataset.accountAction.split(":"));
  const requestButton = event.target.closest("[data-request]");
  if (requestButton) requestModal(...requestButton.dataset.request.split(":"));
  if (event.target.closest("[data-account-close]")) overlay.innerHTML = "";
  if (event.target.closest("[data-export]")) {
    const blob = new Blob([JSON.stringify(state.filtered, null, 2)], { type: "application/json" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "velura-accounts.json" });
    link.click();
    URL.revokeObjectURL(link.href);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-account-form] select[name='role']")) {
    const select = event.target;
    const form = select.closest("form");
    const adminRoleGroup = form.querySelector("#admin-role-group");
    if (adminRoleGroup) {
      adminRoleGroup.hidden = (select.value !== "admin");
    }
  }
  if (event.target.matches("[data-account-form] select[name='lockType']")) {
    const select = event.target;
    const form = select.closest("form");
    updateLockTypeFields(form);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches(".admin-form-textarea[name='reason']") || event.target.matches(".admin-form-textarea[name='note']")) {
    const textarea = event.target;
    const form = textarea.closest("form");
    const count = countWords(textarea.value);
    const counter = form.querySelector("[data-word-counter]");
    if (counter) {
      counter.textContent = `Số từ: ${count} / tối thiểu 11 từ`;
      counter.style.color = count > 10 ? "var(--terracotta)" : "var(--error)";
    }
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.matches("[data-account-filter]")) {
    event.preventDefault();
    const data = new FormData(event.target);
    const q = String(data.get("q") || "").toLowerCase();
    const role = data.get("role");
    state.filtered = state.accounts.filter((row) =>
      (!role || row.role === role) &&
      (!q || `${row.full_name} ${row.email} ${row.phone}`.toLowerCase().includes(q))
    );
    state.currentPage = 1;
    render();
    return;
  }

  if (event.target.matches("[data-account-form]")) {
    event.preventDefault();
    const form = event.target;
    const row = state.accounts.find((item) => item.user_id === form.dataset.id);
    const errorNode = form.querySelector("[data-error-field]");
    if (errorNode) {
      errorNode.hidden = true;
      errorNode.textContent = "";
    }

    // Client-side word count validation
    if (form.dataset.action !== "role") {
      const reason = form.elements.reason.value.trim();
      const wordCount = countWords(reason);
      if (wordCount <= 10) {
        if (errorNode) {
          errorNode.textContent = `Lý do quá ngắn (hiện tại: ${wordCount} từ, yêu cầu tối thiểu 11 từ).`;
          errorNode.hidden = false;
        }
        return;
      }
    }

    try {
      if (form.dataset.action === "lock") {
        const lockType = form.elements.lockType.value;
        const lockedUntil = lockType === "temporary" ? new Date(form.elements.lockedUntil.value).toISOString() : null;
        await accountApi.lock(row.user_id, {
          lockType,
          reason: form.elements.reason.value.trim(),
          expectedVersion: row.version,
          lockedUntil
        });
      }
      if (form.dataset.action === "unlock") {
        await accountApi.unlock(row.user_id, {
          reason: form.elements.reason.value.trim(),
          expectedVersion: row.version
        });
      }
      if (form.dataset.action === "role") {
        const isTargetAdmin = form.elements.role.value === "admin";
        await accountApi.changeRole(row.user_id, {
          role: form.elements.role.value,
          adminRole: isTargetAdmin ? form.elements.adminRole.value : null,
          expectedVersion: row.version
        });
      }
      overlay.innerHTML = "";
      await load();
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error.message;
        errorNode.hidden = false;
      } else {
        window.alert(error.message);
      }
    }
    return;
  }

  if (event.target.matches("[data-request-form]")) {
    event.preventDefault();
    const form = event.target;
    const row = state.requests.find((item) => item.request_id === form.dataset.id);
    const errorNode = form.querySelector("[data-error-field]");
    if (errorNode) {
      errorNode.hidden = true;
      errorNode.textContent = "";
    }

    if (form.dataset.decision === "reject") {
      const note = form.elements.note.value.trim();
      const wordCount = countWords(note);
      if (wordCount <= 10) {
        if (errorNode) {
          errorNode.textContent = `Ghi chú từ chối quá ngắn (hiện tại: ${wordCount} từ, yêu cầu tối thiểu 11 từ).`;
          errorNode.hidden = false;
        }
        return;
      }
    }

    try {
      await accountApi.reviewRoleRequest(row.request_id, form.dataset.decision, {
        expectedVersion: row.version,
        note: form.elements.note.value.trim()
      });
      overlay.innerHTML = "";
      await load();
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error.message;
        errorNode.hidden = false;
      } else {
        window.alert(error.message);
      }
    }
  }
});

document.addEventListener("reset", (event) => {
  if (event.target.matches("[data-account-filter]")) {
    setTimeout(() => {
      state.filtered = [...state.accounts];
      state.currentPage = 1;
      render();
    });
  }
});

load();
