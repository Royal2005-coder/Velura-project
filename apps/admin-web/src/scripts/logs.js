import { auditLogApi } from "./audit-log-api.js";

const state = { rows: [], filtered: [], tab: "all" };
const panel = document.querySelector("#log-panel");
const overlay = document.querySelector("#log-overlay");

export function escapeAuditHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}
function icon(name) { return `<svg class="admin-line-icon"><use href="../../assets/icons/admin-icons.svg#${escapeAuditHtml(name)}"></use></svg>`; }
function date(value) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "-" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed); }
function filters() { return `<form class="admin-filter-bar admin-log-filter" data-log-filter><div class="admin-filter-bar__search"><label class="admin-search-field">${icon("search")}<input class="admin-form-control" name="q" placeholder="Tìm hành động, đối tượng hoặc admin" data-log-search></label></div><div class="admin-filter-bar__filters"><select class="admin-form-control" name="module" data-log-module><option value="">Tất cả phân hệ</option>${["accounts", "products", "orders", "reviews", "returns", "support", "pricing", "promotions", "vouchers", "system"].map((value) => `<option value="${value}">${value}</option>`).join("")}</select><select class="admin-form-control" name="result" data-log-result><option value="">Tất cả kết quả</option><option value="success">Thành công</option><option value="failure">Thất bại</option></select></div><div class="admin-filter-bar__actions"><button class="admin-btn admin-btn--filter admin-btn--sm">Lọc</button><button class="admin-btn admin-btn--ghost admin-btn--sm" type="reset">Đặt lại</button></div></form>`; }
function table() {
  if (!state.filtered.length) return '<div class="admin-log-empty"><strong>Không có nhật ký phù hợp</strong><p>Dữ liệu được đọc từ audit_log theo RLS.</p></div>';
  return `<div class="admin-table-wrap admin-table-wrap--scroll"><table class="admin-table admin-table--log admin-data-table admin-log-table"><thead><tr><th class="cell-date">Thời gian</th><th class="cell-primary">Người thực hiện</th><th>Vai trò</th><th>Phân hệ</th><th>Hành động</th><th>Đối tượng</th><th>IP</th><th class="cell-action">Chi tiết</th></tr></thead><tbody>${state.filtered.map((row) => `<tr><td class="cell-date">${escapeAuditHtml(date(row.timestamp))}</td><td class="cell-primary">${escapeAuditHtml(row.actor_id || "system")}</td><td>${escapeAuditHtml(row.actor_role || "-")}</td><td><span class="admin-log-module">${escapeAuditHtml(row.module)}</span></td><td>${escapeAuditHtml(row.action)}</td><td>${escapeAuditHtml(row.target_id || "-")}</td><td>${escapeAuditHtml(row.ip_address || "-")}</td><td class="cell-action"><button class="admin-icon-button admin-icon-button--sm" data-log-detail="${escapeAuditHtml(row.audit_id)}">${icon("eye")}</button></td></tr>`).join("")}</tbody></table></div><div class="admin-log-footer"><p class="admin-table-note">Hiển thị ${state.filtered.length} / ${state.rows.length} nhật ký</p></div>`;
}
function render() {
  panel.innerHTML = filters() + table();
  updateKpis();
}

function updateKpis() {
  const today = new Date().toDateString();
  const todayRows = state.rows.filter((row) => new Date(row.timestamp).toDateString() === today);
  
  const successCount = state.rows.filter(r => !String(r.action).toLowerCase().includes("fail") && !String(r.action).toLowerCase().includes("error")).length;
  const failureCount = state.rows.filter(r => String(r.action).toLowerCase().includes("fail") || String(r.action).toLowerCase().includes("error")).length;
  const blockedCount = state.rows.filter(r => String(r.action).toLowerCase().includes("block") || String(r.action).toLowerCase().includes("deny") || String(r.action).toLowerCase().includes("refuse")).length;
  const securityCount = state.rows.filter(r => String(r.action).toLowerCase().includes("auth") || String(r.action).toLowerCase().includes("login") || String(r.action).toLowerCase().includes("role") || String(r.action).toLowerCase().includes("permission")).length;

  const values = [todayRows.length, successCount, failureCount, blockedCount, securityCount];
  document.querySelectorAll(".admin-log-kpis .admin-kpi-card__value").forEach((node, index) => {
    node.textContent = String(values[index] || 0);
  });

  // Calculate tab counts
  const allCount = state.rows.length;
  const adminCount = state.rows.filter(r => ["accounts", "products", "orders", "pricing", "promotions", "vouchers", "returns", "reviews", "support"].includes(r.module)).length;
  const systemCount = state.rows.filter(r => r.module === "system" || !r.module).length;
  const aiCount = state.rows.filter(r => r.module === "ai").length;

  const tabCounts = { all: allCount, admin: adminCount, system: systemCount, ai: aiCount };
  document.querySelectorAll("[data-log-tab]").forEach((node) => {
    const tabName = node.dataset.logTab;
    const span = node.querySelector("span");
    if (span) span.textContent = String(tabCounts[tabName] ?? 0);
  });
}

function detail(id) {
  const row = state.rows.find((item) => item.audit_id === id);
  if (!row) return;
  overlay.innerHTML = `<div class="admin-drawer-backdrop" data-log-close></div><aside class="admin-drawer admin-log-drawer"><header class="admin-drawer__header"><div><small>${escapeAuditHtml(row.audit_id)}</small><h2>Chi tiết nhật ký</h2></div><button class="admin-icon-button" data-log-close>×</button></header><div class="admin-drawer__body"><dl class="admin-data-list">${Object.entries(row).map(([key, value]) => `<div><dt>${escapeAuditHtml(key)}</dt><dd>${escapeAuditHtml(typeof value === "object" ? JSON.stringify(value) : value)}</dd></div>`).join("")}</dl></div></aside>`;
}

async function load() {
  panel.innerHTML = '<div class="admin-log-empty"><strong>Đang tải audit_log từ Supabase...</strong></div>';
  try {
    const result = await auditLogApi.list({ limit: 100 });
    state.rows = result.rows || [];
    applyFilterAndRender();
  } catch (error) {
    panel.innerHTML = `<div class="admin-log-empty"><strong>${escapeAuditHtml(error.message)}</strong></div>`;
  }
}

function applyFilterAndRender() {
  let filtered = [...state.rows];
  
  // Apply tab filter
  if (state.tab === "admin") {
    filtered = filtered.filter(r => ["accounts", "products", "orders", "pricing", "promotions", "vouchers", "returns", "reviews", "support"].includes(r.module));
  } else if (state.tab === "system") {
    filtered = filtered.filter(r => r.module === "system" || !r.module);
  } else if (state.tab === "ai") {
    filtered = filtered.filter(r => r.module === "ai");
  }

  // Apply form filter (q, module, result)
  const form = document.querySelector("[data-log-filter]");
  if (form) {
    const data = new FormData(form);
    const q = String(data.get("q") || "").toLowerCase();
    const module = data.get("module");
    const result = data.get("result");

    if (module) {
      filtered = filtered.filter(r => r.module === module);
    }
    if (result) {
      if (result === "success") {
        filtered = filtered.filter(r => !String(r.action).toLowerCase().includes("fail") && !String(r.action).toLowerCase().includes("error"));
      } else if (result === "failure") {
        filtered = filtered.filter(r => String(r.action).toLowerCase().includes("fail") || String(r.action).toLowerCase().includes("error"));
      }
    }
    if (q) {
      filtered = filtered.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }
  }

  state.filtered = filtered;
  render();
}

document.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-log-detail]");
  if (detailButton) detail(detailButton.dataset.logDetail);
  
  if (event.target.closest("[data-log-close]")) overlay.innerHTML = "";
  if (event.target.closest("[data-log-refresh]")) load();
  
  const tab = event.target.closest("[data-log-tab]");
  if (tab) {
    document.querySelectorAll("[data-log-tab]").forEach((node) => node.classList.toggle("admin-tab--active", node === tab));
    state.tab = tab.dataset.logTab;
    applyFilterAndRender();
  }
  
  if (event.target.closest("[data-log-export]")) {
    const blob = new Blob([JSON.stringify(state.filtered, null, 2)], { type: "application/json" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "velura-audit-log.json" });
    link.click();
    URL.revokeObjectURL(link.href);
  }
});

document.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-log-filter]")) return;
  event.preventDefault();
  applyFilterAndRender();
});

document.addEventListener("reset", (event) => {
  if (event.target.matches("[data-log-filter]")) {
    setTimeout(() => {
      applyFilterAndRender();
    });
  }
});

load();
