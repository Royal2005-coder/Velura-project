// Admin Auth Guard — uses auth-core.js for session management
import { getSession as coreGetSession, ROLE_PAGES, logout as coreLogout } from './auth-core.js';

function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split("/").pop().replace(".html", "");
  return file;
}

function getSession() {
  return coreGetSession();
}

function checkAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "./login.html";
    return null;
  }

  const page = getCurrentPage();
  const allowed = ROLE_PAGES[session.role] || [];

  // Check if user must change password
  if (session.mustChangePassword && page !== "change-password") {
    window.location.href = "./change-password.html";
    return null;
  }

  if (!allowed.includes(page)) {
    window.location.href = `./${allowed[0] || "login"}.html`;
    return null;
  }

  return session;
}

function logout() {
  coreLogout();
  window.location.href = "./login.html";
}

function updateSidebarForRole(session) {
  if (!session) return;
  const allowed = ROLE_PAGES[session.role] || [];

  const sidebar = document.querySelector(".admin-sidebar__nav");
  if (!sidebar) return;

  const allItems = sidebar.querySelectorAll(".admin-menu-item, .admin-menu-group");
  allItems.forEach(item => {
    const href = item.getAttribute("href") || "";
    const summary = item.querySelector("summary");
    const subNav = item.querySelector(".admin-menu-subnav");

    if (summary && subNav) {
      const subLinks = subNav.querySelectorAll("a");
      let hasAllowed = false;
      subLinks.forEach(link => {
        const subHref = link.getAttribute("href") || "";
        const subPage = subHref.replace("./", "").replace(".html", "");
        if (allowed.includes(subPage)) {
          hasAllowed = true;
          link.style.display = "";
        } else {
          link.style.display = "none";
        }
      });
      item.style.display = hasAllowed ? "" : "none";
    } else if (href) {
      const itemPage = href.replace("./", "").replace(".html", "");
      item.style.display = allowed.includes(itemPage) ? "" : "none";
    }
  });

  // Update profile
  const profile = document.querySelector(".admin-profile__copy strong");
  if (profile) profile.textContent = session.name;
  const roleEl = document.querySelector(".admin-profile__copy small");
  if (roleEl) roleEl.textContent = session.role;
  const avatarEl = document.querySelector(".admin-profile__avatar");
  if (avatarEl) avatarEl.textContent = session.avatar || session.name.slice(0, 2).toUpperCase();

  // Add logout
  if (!document.querySelector("[data-admin-logout]")) {
    const actions = document.querySelector(".admin-topbar__actions");
    if (actions) {
      const logoutBtn = document.createElement("button");
      logoutBtn.className = "admin-btn admin-btn--ghost admin-btn--sm";
      logoutBtn.type = "button";
      logoutBtn.dataset.adminLogout = "";
      logoutBtn.textContent = "Đăng xuất";
      actions.appendChild(logoutBtn);
    }
  }
}

export { checkAuth, logout, updateSidebarForRole, getCurrentPage, getSession, ROLE_PAGES };
