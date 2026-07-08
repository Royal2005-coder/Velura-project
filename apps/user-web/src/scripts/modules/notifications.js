import { apiRequest } from "./api.js";

export async function fetchNotifications() {
  try {
    const res = await apiRequest("/api/user/notifications");
    if (res && res.success) {
      return res.notifications || [];
    }
  } catch (err) {
    console.warn("Could not fetch notifications:", err.message);
  }
  return [];
}

export async function markAsRead(id) {
  try {
    // Avoid API request for mocked fallbacks
    if (id.includes("-default")) return true;
    const res = await apiRequest(`/api/user/notifications/${id}/read`, { method: "POST" });
    return res && res.success;
  } catch (err) {
    console.error("Failed to mark notification as read:", err.message);
    return false;
  }
}

export async function markAllAsRead() {
  try {
    const res = await apiRequest("/api/user/notifications/read-all", { method: "POST" });
    return res && res.success;
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err.message);
    return false;
  }
}

function timeAgo(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${diffDay} ngày trước`;
  } catch (e) {
    return "";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function updateNotificationsUI() {
  const notifContainer = document.getElementById("js-header-notifications");
  const badge = document.getElementById("js-notifications-badge");
  const list = document.getElementById("js-notifications-list");

  if (!notifContainer) return;

  const isLoggedIn = !!localStorage.getItem("velura_token");
  if (!isLoggedIn) {
    notifContainer.style.display = "none";
    return;
  }

  // Show container
  notifContainer.style.display = "inline-flex";

  const notifications = await fetchNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Update badge
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // Render list
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = `<div class="notifications-empty">Không có thông báo nào</div>`;
    return;
  }

  list.innerHTML = notifications.map(notif => {
    const unreadClass = notif.is_read ? "" : "is-unread";
    return `
      <div class="notification-item ${unreadClass}" data-id="${notif.id}" data-link="${notif.link || ''}">
        <div class="notification-title">${escapeHtml(notif.title)}</div>
        <div class="notification-content">${escapeHtml(notif.content)}</div>
        <div class="notification-time">${timeAgo(notif.created_at)}</div>
      </div>
    `;
  }).join("");

  // Bind click handlers
  list.querySelectorAll(".notification-item").forEach(item => {
    item.addEventListener("click", async (e) => {
      const id = item.dataset.id;
      const link = item.dataset.link;

      if (item.classList.contains("is-unread")) {
        item.classList.remove("is-unread");
        await markAsRead(id);
        await updateNotificationsUI();
      }

      if (link) {
        window.location.href = link;
      }
    });
  });
}

export function initNotifications() {
  const notifContainer = document.getElementById("js-header-notifications");
  const btn = document.getElementById("js-notifications-btn");
  const markAllBtn = document.querySelector(".js-mark-all-read-btn");

  if (!notifContainer || !btn) return;

  // Toggle dropdown
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifContainer.classList.toggle("is-active");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!notifContainer.contains(e.target)) {
      notifContainer.classList.remove("is-active");
    }
  });

  // Mark all as read
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await markAllAsRead();
      await updateNotificationsUI();
    });
  }

  // Initial load
  updateNotificationsUI();

  // Periodically refresh notifications
  setInterval(() => {
    if (localStorage.getItem("velura_token")) {
      updateNotificationsUI();
    }
  }, 30000);
}
