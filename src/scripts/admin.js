import { db, getFormattedDate, getFormattedTime } from './db.js';
import { getUsers as getAuthUsers, updateUser as updateAuthUser } from './auth-core.js';

(function () {
  "use strict";

  const app = document.querySelector("#account-app");
  if (!app) return;

  // Global Session details — use current logged-in user
  function getCurrentActor() {
    try {
      const session = JSON.parse(localStorage.getItem("velura_current_session"));
      if (session) return { name: session.name, id: session.id, role: session.role };
    } catch {}
    return { name: "Phạm Thu Hương", id: "ADM-001", role: "Admin quản trị" };
  }
  const CURRENT_ACTOR = getCurrentActor();

  // Helper functions
  function getDeadlineDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${dd}/${mm}/${y}`;
  }

  function parseDate(str) {
    const parts = str.split("/");
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  function countWords(text) {
    if (!text) return 0;
    const cleanText = text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).filter(w => w.length > 0).length;
  }

  // Load state from DB
  let accounts = db.getAccounts();
  let reqs = db.getReqs();

  let activeTab = "all";
  let searchWord = "";
  let roleFilterVal = "";
  let statusFilterVal = "";

  // Elements
  let panel = null;
  let overlay = null;

  const labels = {
    active: "Đang hoạt động",
    locked_temp: "Khóa tạm thời",
    locked_perm: "Khóa vĩnh viễn",
    pending: "Chờ phê duyệt",
    approved: "Đã duyệt",
    overdue: "Quá hạn"
  };

  const cls = {
    active: "active",
    locked_temp: "warning",
    locked_perm: "danger",
    pending: "pending",
    approved: "success",
    overdue: "danger"
  };

  function icon(id) {
    return `<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#${id}" /></svg>`;
  }

  function badge(s) {
    return `<span class="admin-badge admin-badge--${cls[s]}">${labels[s] || s}</span>`;
  }

  function person(a) {
    return `
      <div class="admin-person">
        <span class="admin-avatar">${a.avatar || a.name.slice(0, 2).toUpperCase()}</span>
        <span>
          <strong>${a.name}${a.flag === "super" ? " ★" : ""}</strong>
          <small>${a.email}</small>
        </span>
      </div>
    `;
  }

  function role(x) {
    return `<span class="admin-role-badge">${x}</span>`;
  }

  function action(a) {
    const isLocked = a.status.indexOf("locked") === 0;
    return `
      <div class="admin-action-menu">
        <button class="admin-icon-button admin-icon-button--sm" data-menu="${a.id}" title="Thao tác tài khoản" aria-label="Thao tác tài khoản">
          ${icon('edit')}
        </button>
        <div class="admin-dropdown admin-account-action-menu" id="menu-${a.id}" hidden>
          <button data-drawer="${a.id}">${icon('eye')}<span>Xem chi tiết</span></button>
          <button data-modal="role" data-id="${a.id}">${icon('edit')}<span>Thay đổi vai trò</span></button>
          <button data-tab="logs" data-log-user="${a.id}">${icon('log')}<span>Xem nhật ký</span></button>
          ${isLocked 
            ? `<button class="admin-account-action-menu__success" data-modal="unlock" data-id="${a.id}">${icon('unlock')}<span>Mở khóa</span></button>` 
            : `<button class="admin-account-action-menu__danger" data-modal="lock" data-id="${a.id}">${icon('lock')}<span>Khóa tài khoản</span></button>`
          }
        </div>
      </div>
    `;
  }

  function tableAll(list) {
    if (!list.length) {
      return `
        <div class="admin-empty-state">
          ${icon('search')}
          <strong>Không tìm thấy tài khoản phù hợp</strong>
          <p>Thử nhập từ khóa hoặc bộ lọc khác.</p>
        </div>
      `;
    }
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
            ${list.map(a => `
              <tr>
                <td>${person(a)}</td>
                <td>${a.type}</td>
                <td>${role(a.role)}</td>
                <td>${badge(a.status)}${a.flag === "promotion" ? ' ⏰' : ''}</td>
                <td>${a.last}</td>
                <td>
                  <button class="admin-icon-button admin-icon-button--sm" data-drawer="${a.id}" title="Xem chi tiết" aria-label="Xem chi tiết">
                    ${icon('eye')}
                  </button>
                  ${action(a)}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function filters(kind) {
    return `
      <div class="admin-filter-bar">
        <label class="admin-search-field">
          ${icon('search')}
          <input class="admin-form-control" data-search="${kind}" value="${searchWord}" placeholder="Tìm theo tên, email, mã tài khoản..." />
        </label>
        <select class="admin-form-control" data-role="${kind}">
          <option value="">Tất cả vai trò</option>
          <option ${roleFilterVal === "Member" ? "selected" : ""}>Member</option>
          <option ${roleFilterVal === "Admin quản lý sản phẩm" ? "selected" : ""}>Admin quản lý sản phẩm</option>
          <option ${roleFilterVal === "Admin quản lý đơn hàng" ? "selected" : ""}>Admin quản lý đơn hàng</option>
          <option ${roleFilterVal === "Admin quản trị" ? "selected" : ""}>Admin quản trị</option>
        </select>
        ${kind === "all" ? `
          <select class="admin-form-control" data-status="all">
            <option value="">Tất cả trạng thái</option>
            <option value="active" ${statusFilterVal === "active" ? "selected" : ""}>Đang hoạt động</option>
            <option value="locked_temp" ${statusFilterVal === "locked_temp" ? "selected" : ""}>Khóa tạm thời</option>
            <option value="locked_perm" ${statusFilterVal === "locked_perm" ? "selected" : ""}>Khóa vĩnh viễn</option>
            <option value="pending" ${statusFilterVal === "pending" ? "selected" : ""}>Chờ phê duyệt</option>
          </select>
        ` : ''}
        <button class="admin-btn admin-btn--filter admin-btn--sm" type="button" data-filter-btn="${kind}">Lọc</button>
        <button class="admin-btn admin-btn--ghost admin-btn--sm" data-reset="${kind}">Đặt lại</button>
      </div>
    `;
  }

  function buildLogsTable() {
    const list = db.getLogs().filter(l => l.module === "accounts");
    if (!list.length) {
      return `<div class="admin-empty-state">${icon('log')}<strong>Không có nhật ký tài khoản nào</strong></div>`;
    }
    return `
      <div class="admin-filter-bar">
        <label class="admin-search-field">
          ${icon('search')}
          <input class="admin-form-control" data-log-search placeholder="Tìm người thao tác, tài khoản tác động..." />
        </label>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thao tác</th>
              <th>Tài khoản bị tác động</th>
              <th>Hành động</th>
              <th>Trạng thái cũ → mới</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(l => `
              <tr>
                <td>${l.time}<br><small>${l.clock}</small></td>
                <td><strong>${l.actor}</strong><br><small>${l.actorId}</small></td>
                <td>${l.targetName || l.target}</td>
                <td>${l.actionLabel}</td>
                <td>${l.changes && l.changes[0] ? `${l.changes[0][1]} → ${l.changes[0][2]}` : '—'}</td>
                <td>
                  <span class="admin-badge admin-badge--${l.result === "success" ? "success" : "danger"}">
                    ${l.result === "success" ? "Thành công" : l.result === "conflict" ? "Xung đột" : "Thất bại"}
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function buildReqsTable() {
    // Overdue check on load
    const now = new Date();
    reqs = db.getReqs().map(r => {
      const deadlineDate = parseDate(r.deadline);
      const diffTime = deadlineDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let nextStatus = r.status;
      if (r.status === "pending" && diffDays < 0) {
        nextStatus = "overdue";
      }
      return { ...r, left: diffDays, status: nextStatus };
    });
    
    // Save updated request status if any changed
    db.saveReqs(reqs);

    if (!reqs.length) {
      return `<div class="admin-empty-state">${icon('users')}<strong>Không có yêu cầu nâng quyền nào</strong></div>`;
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã yêu cầu</th>
              <th>Tài khoản</th>
              <th>Vai trò hiện tại</th>
              <th>Vai trò đề xuất</th>
              <th>Người gửi</th>
              <th>Thời hạn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${reqs.map(r => `
              <tr>
                <td>${r.id}</td>
                <td><strong>${r.name}</strong><br><small>${r.email}</small></td>
                <td>${role(r.current)}</td>
                <td>${role(r.proposed)}</td>
                <td>${r.by}</td>
                <td>
                  ${r.deadline}
                  <br>
                  <small class="${r.left < 0 ? 'color-error' : ''}">
                    ${r.status === "approved" ? 'Đã duyệt' : r.left > 0 ? `${r.left} ngày còn lại` : `Quá hạn ${Math.abs(r.left)} ngày`}
                  </small>
                </td>
                <td>${badge(r.status)}</td>
                <td>
                  ${r.status === "pending" ? `
                    <button class="admin-btn admin-btn--sm admin-btn--approve" data-req-approve="${r.id}">Duyệt</button>
                    <button class="admin-btn admin-btn--sm admin-btn--danger" data-req-reject="${r.id}">Từ chối</button>
                  ` : r.status === "overdue" ? `
                    <button class="admin-btn admin-btn--sm admin-btn--ghost" data-req-cleanup="${r.id}">Xóa (Hủy)</button>
                  ` : '—'}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // Load all accounts — try auth-core first, fallback to db
  function loadAllAccounts() {
    try {
      const authUsers = typeof getAuthUsers === "function" ? getAuthUsers() : [];
      if (authUsers && authUsers.length) {
        return authUsers.map(u => ({
          id: u.id || "",
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          type: u.type === "admin" ? "Admin" : "Member",
          role: u.role || "Member",
          status: u.status === "active" ? "active" : "locked_perm",
          last: u.lastLogin || "Chưa đăng nhập",
          created: u.createdAt || "",
          avatar: u.avatar || "",
          version: u.version || 1,
          isAuthUser: true,
          mustChangePassword: u.mustChangePassword,
          isGoogleUser: u.isGoogleUser,
          reason: "",
          lockType: "",
          lockedBy: "",
          lockedAt: "",
          flag: ""
        }));
      }
    } catch (e) {
      console.warn("[Admin] loadAllAccounts fallback:", e);
    }
    return db.getAccounts();
  }

  function render() {
    accounts = loadAllAccounts();
    reqs = db.getReqs();

    // KPI Summary counts
    const totalCount = accounts.length;
    const activeCount = accounts.filter(a => a.status === "active").length;
    const lockedCount = accounts.filter(a => a.status.indexOf("locked") === 0).length;
    const pendingCount = reqs.filter(r => r.status === "pending").length;

    // Update KPI UI counts
    const cards = app.querySelectorAll(".admin-kpi-card__value");
    if (cards.length >= 4) {
      cards[0].textContent = totalCount;
      cards[1].textContent = activeCount;
      cards[2].textContent = lockedCount;
      cards[3].textContent = pendingCount;
    }

    // Filter Accounts lists
    let filteredList = accounts;
    if (activeTab === "locked") {
      filteredList = accounts.filter(a => a.status.indexOf("locked") === 0);
    }

    if (searchWord) {
      const q = searchWord.toLowerCase();
      filteredList = filteredList.filter(a => 
        a.id.toLowerCase().includes(q) || 
        a.name.toLowerCase().includes(q) || 
        a.email.toLowerCase().includes(q)
      );
    }

    if (roleFilterVal) {
      filteredList = filteredList.filter(a => a.role === roleFilterVal);
    }

    if (statusFilterVal && activeTab === "all") {
      filteredList = filteredList.filter(a => a.status === statusFilterVal);
    }

    // Render Panel contents
    if (activeTab === "all" || activeTab === "locked") {
      panel.innerHTML = filters(activeTab) + tableAll(filteredList) + `
        <div class="admin-card__footer">
          <p class="admin-table-note">Hiển thị ${filteredList.length} / ${accounts.length} tài khoản</p>
        </div>
      `;
    } else if (activeTab === "promotions") {
      panel.innerHTML = buildReqsTable();
    } else {
      panel.innerHTML = buildLogsTable();
    }

    addPager();
  }

  function showToast(message) {
    const toast = document.querySelector("#admin-toast");
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 2400);
    }
  }

  // MODALS RENDER
  function modal(type, a) {
    let title = {
      lock: "Khóa tài khoản",
      unlock: "Mở khóa tài khoản",
      role: "Thay đổi vai trò"
    }[type] || "Thông báo";

    let body = "";
    let confirmBtn = "Xác nhận";
    let btnClass = type === "lock" ? "admin-btn--danger" : "admin-btn--secondary";

    const infoMarkup = a ? `
      <div class="admin-info-grid">
        <div><dt>Mã tài khoản</dt><dd>${a.id}</dd></div>
        <div><dt>Họ tên</dt><dd>${a.name}</dd></div>
        <div><dt>Email</dt><dd>${a.email}</dd></div>
        <div><dt>Vai trò hiện tại</dt><dd>${role(a.role)}</dd></div>
      </div>
    ` : "";

    if (type === "lock") {
      // Last Super Admin Validation Check (Rule AD_ACCOUNT_10)
      const activeSuperAdmins = accounts.filter(ac => ac.role === "Admin quản trị" && ac.status === "active");
      if (a.role === "Admin quản trị" && a.status === "active" && activeSuperAdmins.length <= 1) {
        title = "Không thể khóa tài khoản này";
        body = `
          <div class="admin-order-danger-note">
            Tài khoản này là quản trị viên quản trị cuối cùng hoạt động trong hệ thống.
            Hệ thống bắt buộc phải duy trì ít nhất một tài khoản Quản trị viên quản trị để duy trì và khôi phục hệ thống.
          </div>
        `;
        confirmBtn = "Đã hiểu";
        btnClass = "admin-btn--ghost";
        type = "warning";
      } else {
        body = `
          ${infoMarkup}
          <label class="admin-form-group">
            <span class="admin-form-label">Mức độ khóa *</span>
            <select class="admin-form-control" name="lockType" required>
              <option value="locked_temp">Khóa tạm thời (có thể mở lại)</option>
              <option value="locked_perm">Khóa vĩnh viễn (lưu trữ lịch sử)</option>
            </select>
          </label>
          <label class="admin-form-group">
            <span class="admin-form-label">Lý do khóa tài khoản *</span>
            <textarea class="admin-form-control admin-form-textarea" name="reason" minlength="15" required placeholder="Nhập lý do khóa chi tiết..."></textarea>
            <small class="admin-form-helper">Lý do phải dài hơn 10 từ (khoảng 15 ký tự) để phục vụ kiểm toán.</small>
          </label>
        `;
      }
    } else if (type === "unlock") {
      body = `
        ${infoMarkup}
        <label class="admin-form-group">
          <span class="admin-form-label">Lý do mở khóa tài khoản *</span>
          <textarea class="admin-form-control admin-form-textarea" name="reason" minlength="15" required placeholder="Nhập lý do mở khóa chi tiết..."></textarea>
          <small class="admin-form-helper">Lý do mở khóa phải chứa nhiều hơn 10 từ.</small>
        </label>
      `;
    } else if (type === "role") {
      body = `
        ${infoMarkup}
        <label class="admin-form-group">
          <span class="admin-form-label">Vai trò đề xuất *</span>
          <select class="admin-form-control" name="newRole" required>
            <option value="Member">Member</option>
            <option value="Admin chỉ xem">Admin chỉ xem</option>
            <option value="Admin quản lý sản phẩm">Admin quản lý sản phẩm</option>
            <option value="Admin quản lý đơn hàng">Admin quản lý đơn hàng</option>
            <option value="Admin quản trị">Admin quản trị</option>
          </select>
        </label>
        <div class="admin-alert" id="elevated-alert" style="display:none;">
          ⚠️ Nâng quyền lên **Admin quản trị** bắt buộc phải trải qua bước phê duyệt từ một Admin quản trị khác và chờ duyệt tối đa 10 ngày.
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="admin-modal-overlay">
        <section class="admin-modal" role="dialog" aria-modal="true">
          <form id="account-modal-form" data-type="${type}" data-id="${a ? a.id : ''}">
            <header class="admin-modal__header">
              <h2>${title}</h2>
              <button class="admin-icon-button" type="button" data-close>×</button>
            </header>
            <div class="admin-modal__body">
              ${body}
            </div>
            <footer class="admin-modal__footer">
              <button class="admin-btn admin-btn--ghost" type="button" data-close>Hủy</button>
              ${type !== "warning" 
                ? `<button class="admin-btn ${btnClass}" type="submit">${confirmBtn}</button>` 
                : `<button class="admin-btn admin-btn--secondary" type="button" data-close>Đã hiểu</button>`
              }
            </footer>
          </form>
        </section>
      </div>
    `;

    // Dynamic warning alert in role selection
    const roleSelect = overlay.querySelector("select[name=newRole]");
    if (roleSelect) {
      const alertBox = overlay.querySelector("#elevated-alert");
      roleSelect.addEventListener("change", (e) => {
        if (e.target.value === "Admin quản trị") {
          alertBox.style.display = "flex";
        } else {
          alertBox.style.display = "none";
        }
      });
      // Initial trigger
      if (roleSelect.value === "Admin quản trị") alertBox.style.display = "flex";
    }
  }

  function drawer(a) {
    overlay.innerHTML = `
      <div class="admin-drawer-backdrop" data-close></div>
      <aside class="admin-drawer">
        <header class="admin-drawer__header">
          ${person(a)}
          <button class="admin-icon-button" data-close>×</button>
        </header>
        <div class="admin-drawer__body">
          ${badge(a.status)} ${role(a.role)}
          <h2 class="admin-drawer__section">Thông tin cơ bản</h2>
          <dl class="admin-data-list">
            <div><dt>Mã tài khoản</dt><dd>${a.id}</dd></div>
            <div><dt>Loại tài khoản</dt><dd>${a.type}</dd></div>
            <div><dt>Số điện thoại</dt><dd>${a.phone}</dd></div>
            <div><dt>Ngày tạo</dt><dd>${a.created}</dd></div>
            <div><dt>Đăng nhập gần nhất</dt><dd>${a.last}</dd></div>
            <div><dt>Database Version ID</dt><dd>v${a.version}</dd></div>
          </dl>
          ${a.reason ? `
            <h2 class="admin-drawer__section">Thông tin khóa/mở khóa</h2>
            <div class="admin-alert">
              <strong>Mức độ:</strong> ${a.lockType || "Không có"}<br>
              <strong>Lý do:</strong> ${a.reason}<br>
              <small>Thao tác bởi: ${a.lockedBy || 'Hệ thống'} vào lúc ${a.lockedAt || '—'}</small>
            </div>
          ` : ''}
          <h2 class="admin-drawer__section">Hành động nhanh</h2>
          <div class="admin-action-row">
            <button class="admin-btn admin-btn--outline admin-btn--sm" data-modal="role" data-id="${a.id}">Thay đổi vai trò</button>
            <button class="admin-btn admin-btn--${a.status.indexOf("locked") === 0 ? "secondary" : "danger"} admin-btn--sm" data-modal="${a.status.indexOf("locked") === 0 ? "unlock" : "lock"}" data-id="${a.id}">
              ${a.status.indexOf("locked") === 0 ? "Mở khóa" : "Khóa tài khoản"}
            </button>
          </div>
        </div>
      </aside>
    `;
  }

  // SAVE & EXCEPTION SIMULATIONS
  function handleAccountSave(updatedList, logEntry, emailToQueue) {
    // 1. Transaction Database Error Rollback Simulation
    if (db.isDbError()) {
      alert("Lỗi kết nối cơ sở dữ liệu (DATABASE_CONNECTION_TIMEOUT). Thao tác thay đổi đã được rollback tự động để bảo vệ tính nhất quán dữ liệu.");
      render();
      return false;
    }

    // 2. Optimistic Locking (Version Conflict) Simulation
    if (db.isConflictSimulated()) {
      alert("Xung đột thao tác đồng thời: Dữ liệu tài khoản đã bị thay đổi bởi một quản trị viên khác trong lúc bạn làm việc. Vui lòng tải lại thông tin mới nhất.");
      db.toggleConflictSimulated(false); // Reset check
      render();
      return false;
    }

    // Actual Version mismatch checking for production-readiness
    if (logEntry && logEntry.target) {
      const liveAccounts = db.read("velura_accounts");
      const currentInDb = liveAccounts.find(x => x.id === logEntry.target);
      const locallyAttempted = updatedList.find(x => x.id === logEntry.target);
      if (currentInDb && locallyAttempted && currentInDb.version !== locallyAttempted.version) {
        alert("Xung đột thao tác đồng thời (DATA_VERSION_CONFLICT): Tài khoản đã được chỉnh sửa ở một phiên làm việc khác. Phiên cập nhật của bạn đã bị từ chối.");
        render();
        return false;
      }
      
      // Increment version upon successful write
      if (locallyAttempted) {
        locallyAttempted.version = (locallyAttempted.version || 1) + 1;
      }
    }

    // 3. Write to DB
    try {
      db.saveAccounts(updatedList);
      accounts = updatedList;

      // Add audit logs
      if (logEntry) {
        db.addLog(
          CURRENT_ACTOR.name, CURRENT_ACTOR.id, CURRENT_ACTOR.role,
          logEntry.type, logEntry.module, logEntry.action, logEntry.actionLabel,
          logEntry.target, logEntry.targetName, logEntry.result, logEntry.severity,
          logEntry.summary, logEntry.changes, logEntry.context
        );
      }

      // Add email to queue
      if (emailToQueue) {
        db.queueEmail(emailToQueue.to, emailToQueue.subject, emailToQueue.body);
      }

      return true;
    } catch (e) {
      alert("Lỗi hệ thống khi lưu trữ: " + e.message);
      render();
      return false;
    }
  }

  // EVENT LISTENERS
  document.addEventListener("click", function (e) {
    const b = e.target.closest("button");
    if (!b) return;

    if (b.dataset.tab) {
      activeTab = b.dataset.tab;
      document.querySelectorAll(".admin-tab").forEach(x => {
        x.classList.toggle("admin-tab--active", x === b);
      });
      render();
    }

    // Log redirection for specific user
    if (b.dataset.logUser) {
      activeTab = "logs";
      document.querySelectorAll(".admin-tab").forEach(x => {
        x.classList.toggle("admin-tab--active", x.dataset.tab === "logs");
      });
      render();
      const logSearchInput = panel.querySelector("[data-log-search]");
      if (logSearchInput) {
        logSearchInput.value = b.dataset.logUser;
        // Trigger manual filter
        const query = b.dataset.logUser.toLowerCase();
        panel.querySelectorAll("tbody tr").forEach(r => {
          r.hidden = !r.textContent.toLowerCase().includes(query);
        });
      }
    }

    if (b.dataset.menu) {
      document.querySelectorAll(".admin-dropdown").forEach(x => x.hidden = true);
      const menu = document.querySelector("#menu-" + b.dataset.menu);
      if (menu) {
        menu.hidden = false;
        menu.classList.remove("admin-dropdown--up");
        if (menu.getBoundingClientRect().bottom > window.innerHeight - 12) {
          menu.classList.add("admin-dropdown--up");
        }
      }
    }

    if (b.dataset.drawer) {
      const item = accounts.find(ac => ac.id === b.dataset.drawer);
      if (item) drawer(item);
    }

    if (b.dataset.modal) {
      const item = accounts.find(ac => ac.id === b.dataset.id);
      modal(b.dataset.modal, item);
    }

    if (b.dataset.close) {
      overlay.innerHTML = "";
    }

    if (b.dataset.reset) {
      searchWord = "";
      roleFilterVal = "";
      statusFilterVal = "";
      render();
    }

    if (b.dataset.export) {
      showToast("Đã xuất danh sách tài khoản mẫu thành công.");
      db.addLog(
        CURRENT_ACTOR.name, CURRENT_ACTOR.id, CURRENT_ACTOR.role,
        "admin", "accounts", "export", "Xuất tài khoản", "ALL", "Tất cả tài khoản",
        "success", "normal", "Người quản lý xuất toàn bộ danh sách tài khoản thành viên dưới dạng excel."
      );
    }

    // Close actions menus if clicking elsewhere
    if (!e.target.closest(".admin-action-menu")) {
      document.querySelectorAll(".admin-dropdown").forEach(x => x.hidden = true);
    }

    // Promotion approvals (Rule AD_ACCOUNT_14)
    if (b.dataset.reqApprove) {
      const reqId = b.dataset.reqApprove;
      const request = reqs.find(r => r.id === reqId);
      if (request) {
        const liveAccounts = db.getAccounts();
        const account = liveAccounts.find(x => x.id === request.accountId);
        if (account) {
          account.role = request.proposed;
          account.type = "Admin";
          account.flag = "super"; // Promoted to admin quản trị
          
          request.status = "approved";
          db.saveReqs(reqs);

          const logEntry = {
            type: "admin",
            module: "accounts",
            action: "approve",
            actionLabel: "Phê duyệt nâng quyền",
            target: account.id,
            targetName: account.name,
            result: "success",
            severity: "normal",
            summary: `Admin phê duyệt nâng quyền cho tài khoản ${account.name} lên ${request.proposed}.`,
            changes: [["Vai trò", request.current, request.proposed]],
            context: { Email: account.email }
          };

          const emailToQueue = {
            to: account.email,
            subject: "Chúc mừng: Yêu cầu nâng quyền quản trị của bạn đã được phê duyệt",
            body: `Chào ${account.name},\nYêu cầu nâng quyền tài khoản của bạn lên vai trò ${request.proposed} đã được duyệt thành công bởi ${CURRENT_ACTOR.name}. Vui lòng đăng nhập lại để nhận quyền.`
          };

          if (handleAccountSave(liveAccounts, logEntry, emailToQueue)) {
            showToast(`Đã duyệt yêu cầu nâng quyền cho ${account.name}.`);
            render();
          }
        }
      }
    }

    if (b.dataset.reqReject) {
      const reqId = b.dataset.reqReject;
      const request = reqs.find(r => r.id === reqId);
      if (request) {
        request.status = "rejected";
        db.saveReqs(reqs);

        db.addLog(
          CURRENT_ACTOR.name, CURRENT_ACTOR.id, CURRENT_ACTOR.role,
          "admin", "accounts", "reject", "Từ chối yêu cầu",
          request.accountId, request.name, "success", "attention",
          `Từ chối yêu cầu nâng quyền cho tài khoản ${request.name} từ ${request.current} lên ${request.proposed}.`,
          [],
          { "Người gửi": request.by, "Lý do": "Không đủ điều kiện bảo mật" }
        );

        // Queue email notification
        db.queueEmail(request.email, "Thông báo: Từ chối yêu cầu nâng quyền quản trị", `Chào ${request.name},\nYêu cầu nâng vai trò quản trị của bạn lên ${request.proposed} đã bị từ chối sau khi xem xét chi tiết từ hội đồng quản trị hệ thống.`);

        showToast(`Đã từ chối yêu cầu nâng quyền.`);
        render();
      }
    }

    if (b.dataset.reqCleanup) {
      // Overdue cleanup (Hủy thao tác)
      const reqId = b.dataset.reqCleanup;
      reqs = reqs.filter(r => r.id !== reqId);
      db.saveReqs(reqs);
      showToast("Đã xóa yêu cầu nâng quyền đã hết hạn.");
      render();
    }
  });

  if (app) {
    app.addEventListener("input", function (e) {
      if (e.target.dataset.search) {
        searchWord = e.target.value;
        render();
      }
      if (e.target.dataset.logSearch) {
        const q = e.target.value.toLowerCase();
        panel.querySelectorAll("tbody tr").forEach(r => {
          r.hidden = !r.textContent.toLowerCase().includes(q);
        });
      }
    });

    app.addEventListener("change", function (e) {
      if (e.target.dataset.role) {
        roleFilterVal = e.target.value;
        render();
      }
      if (e.target.dataset.status) {
        statusFilterVal = e.target.value;
        render();
      }
    });
  }

  // Modal Submit Logic with full validation
  function handleOverlaySubmit(e) {
    if (e.target.id !== "account-modal-form") return;
    e.preventDefault();

    const form = e.target;
    const type = form.dataset.type;
    const accountId = form.dataset.id;
    const account = accounts.find(ac => ac.id === accountId);

    if (!account) return;

    const liveAccounts = JSON.parse(JSON.stringify(accounts)); // Deep copy for potential rollbacks
    const localTarget = liveAccounts.find(ac => ac.id === accountId);

    let logEntry = null;
    let emailToQueue = null;

    if (type === "lock") {
      const lockType = form.elements.lockType.value;
      const reason = form.elements.reason.value;

      // Rule AD_ACCOUNT_08 Word Count Validation (> 10 words)
      const wordCount = countWords(reason);
      if (wordCount <= 10) {
        alert(`Dữ liệu không hợp lệ: Lý do khóa tài khoản chỉ có ${wordCount} từ. Quy tắc hệ thống bắt buộc lý do khóa phải dài hơn 10 từ để đảm bảo tính minh bạch.`);
        return;
      }

      const oldStatus = localTarget.status;
      localTarget.status = lockType;
      localTarget.lockType = lockType === "locked_temp" ? "Tạm thời" : "Vĩnh viễn";
      localTarget.reason = reason;
      localTarget.lockedBy = CURRENT_ACTOR.name;
      localTarget.lockedAt = `${getFormattedDate()} ${getFormattedTime()}`;

      // Also update auth-core user store
      if (localTarget.isAuthUser) {
        updateAuthUser(localTarget.id, { status: "locked" });
      }

      logEntry = {
        type: "admin",
        module: "accounts",
        action: "lock",
        actionLabel: "Khóa tài khoản",
        target: localTarget.id,
        targetName: localTarget.name,
        result: "success",
        severity: "attention",
        summary: `Admin khóa tài khoản ${localTarget.name} (${lockType === "locked_temp" ? "tạm thời" : "vĩnh viễn"}) vì lý do: ${reason}`,
        changes: [["Trạng thái", labels[oldStatus], labels[lockType]], ["Lý do khóa", "—", reason]],
        context: { Email: localTarget.email, "Cấp độ khóa": lockType }
      };

      emailToQueue = {
        to: localTarget.email,
        subject: "Cảnh báo: Tài khoản Velura của bạn đã bị khóa",
        body: `Chào ${localTarget.name},\nTài khoản thành viên của bạn tại Velura đã bị khóa ${lockType === "locked_temp" ? "Tạm thời" : "Vĩnh viễn"} bởi Ban Quản Trị.\nLý do: ${reason}\n\nNếu có khiếu nại, vui lòng liên hệ bộ phận hỗ trợ khách hàng để được hỗ trợ giải quyết.`
      };

      if (handleAccountSave(liveAccounts, logEntry, emailToQueue)) {
        overlay.innerHTML = "";
        showToast(`Đã khóa tài khoản ${localTarget.name}.`);
        render();
      }
    } 
    else if (type === "unlock") {
      const reason = form.elements.reason.value;

      // Rule AD_ACCOUNT_09 Word Count Validation (> 10 words)
      const wordCount = countWords(reason);
      if (wordCount <= 10) {
        alert(`Dữ liệu không hợp lệ: Lý do mở khóa chỉ có ${wordCount} từ. Quy tắc hệ thống bắt buộc lý do mở khóa phải dài hơn 10 từ.`);
        return;
      }

      const oldStatus = localTarget.status;
      localTarget.status = "active";
      localTarget.reason = "";
      localTarget.lockType = "";
      localTarget.lockedBy = "";
      localTarget.lockedAt = "";

      // Also update auth-core user store
      if (localTarget.isAuthUser) {
        updateAuthUser(localTarget.id, { status: "active" });
      }

      logEntry = {
        type: "admin",
        module: "accounts",
        action: "unlock",
        actionLabel: "Mở khóa tài khoản",
        target: localTarget.id,
        targetName: localTarget.name,
        result: "success",
        severity: "normal",
        summary: `Admin mở khóa tài khoản ${localTarget.name}. Lý do mở khóa: ${reason}`,
        changes: [["Trạng thái", labels[oldStatus], "Đang hoạt động"], ["Lý do mở khóa", "—", reason]],
        context: { Email: localTarget.email }
      };

      emailToQueue = {
        to: localTarget.email,
        subject: "Thông báo: Tài khoản Velura của bạn đã được mở khóa",
        body: `Chào ${localTarget.name},\nTài khoản thành viên của bạn tại Velura đã được mở khóa hoạt động trở lại thành công.\nChúc bạn có những trải nghiệm mua sắm tuyệt vời tại Velura!`
      };

      if (handleAccountSave(liveAccounts, logEntry, emailToQueue)) {
        overlay.innerHTML = "";
        showToast(`Đã mở khóa tài khoản ${localTarget.name}.`);
        render();
      }
    } 
    else if (type === "role") {
      const newRole = form.elements.newRole.value;

      // Elevated permissions checking (Rule AD_ACCOUNT_13)
      if (newRole === "Admin quản trị") {
        // Create pending request
        const currentReqs = db.getReqs();
        
        // Prevent duplicate pending request
        const exists = currentReqs.some(r => r.accountId === localTarget.id && r.status === "pending");
        if (exists) {
          alert("Lỗi: Tài khoản này đã có một yêu cầu nâng quyền đang ở trạng thái chờ phê duyệt.");
          overlay.innerHTML = "";
          return;
        }

        const newReq = {
          id: `REQ${Date.now().toString().slice(-3)}${Math.floor(10 + Math.random()*90)}`,
          accountId: localTarget.id,
          name: localTarget.name,
          email: localTarget.email,
          current: localTarget.role,
          proposed: newRole,
          by: CURRENT_ACTOR.name,
          deadline: getDeadlineDate(10), // 10 days duration
          left: 10,
          status: "pending"
        };
        currentReqs.unshift(newReq);
        db.saveReqs(currentReqs);

        db.addLog(
          CURRENT_ACTOR.name, CURRENT_ACTOR.id, CURRENT_ACTOR.role,
          "admin", "accounts", "request", "Gửi yêu cầu nâng quyền",
          localTarget.id, localTarget.name, "success", "normal",
          `Gửi yêu cầu nâng quyền Admin quản trị cho tài khoản ${localTarget.name}. Yêu cầu chuyển sang hàng đợi chờ phê duyệt.`,
          [["Trạng thái", localTarget.role, "Chờ phê duyệt"]],
          { "Đề xuất": newRole, "Thời hạn": newReq.deadline }
        );

        overlay.innerHTML = "";
        showToast("Đã gửi yêu cầu nâng quyền lên Admin quản trị. Chờ phê duyệt.");
        render();
      } else {
        // Direct role updates (Rule AD_ACCOUNT_12)
        const oldRole = localTarget.role;
        localTarget.role = newRole;
        localTarget.type = newRole === "Member" ? "Member" : "Admin";

        // Also update auth-core user store if this is an auth user
        if (localTarget.isAuthUser) {
          updateAuthUser(localTarget.id, {
            role: newRole,
            type: newRole === "Member" ? "customer" : "admin"
          });
        }

        logEntry = {
          type: "admin",
          module: "accounts",
          action: "role",
          actionLabel: "Thay đổi vai trò",
          target: localTarget.id,
          targetName: localTarget.name,
          result: "success",
          severity: "normal",
          summary: `Admin cập nhật trực tiếp vai trò của tài khoản ${localTarget.name} từ ${oldRole} sang ${newRole}.`,
          changes: [["Vai trò", oldRole, newRole]],
          context: { Email: localTarget.email }
        };

        if (handleAccountSave(liveAccounts, logEntry, null)) {
          overlay.innerHTML = "";
          showToast(`Đã thay đổi vai trò tài khoản thành ${newRole}.`);
          render();
        }
      }
    }
  }

  // Render initialization
  panel = document.querySelector("#panel");
  overlay = document.querySelector("#overlay");
  if (!panel) {
    console.error("[Admin] #panel not found in DOM");
    panel = document.createElement("div");
  }
  if (overlay) overlay.addEventListener("submit", handleOverlaySubmit);

  render();
  db.renderSimPanel();

  function addPager() {
    if (activeTab === "logs" && !panel.querySelector("[data-reset=logs]")) {
      const filtersBar = panel.querySelector(".admin-filter-bar");
      if (filtersBar) {
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "admin-btn admin-btn--ghost admin-btn--sm";
        resetBtn.dataset.reset = "logs";
        resetBtn.textContent = "Đặt lại";
        filtersBar.appendChild(resetBtn);
      }
    }

    if (panel.querySelector(".admin-pagination")) return;

    const footer = panel.querySelector(".admin-card__footer");
    if (!footer) return;

    const nav = document.createElement("nav");
    nav.className = "admin-pagination admin-pagination--right";
    nav.setAttribute("aria-label", "Phân trang");
    nav.innerHTML = `
      <button type="button" title="Trang trước" disabled>←</button>
      <button class="is-active" type="button">1</button>
      <button type="button" disabled>2</button>
      <button type="button" title="Trang sau" disabled>→</button>
    `;
    footer.appendChild(nav);
  }

  // Trigger rendering sim panel on window width changes if needed
  window.addEventListener("resize", () => {
    db.renderSimPanel();
  });
})();
