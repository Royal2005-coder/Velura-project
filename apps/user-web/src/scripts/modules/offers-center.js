import { apiRequest, isSessionValid } from "./api.js";

const STATUS_LABELS = {
  AVAILABLE: "Có thể dùng",
  LOCKED: "Sắp mở khóa",
  SCHEDULED: "Sắp bắt đầu",
  USED: "Đã sử dụng",
  EXPIRED: "Hết hạn"
};

export function initOffersCenter() {
  const root = document.querySelector("[data-offers-center]");
  if (!root) return;
  if (!isSessionValid()) return;

  const list = root.querySelector(".js-offers-list");
  const tabs = Array.from(root.querySelectorAll("[data-offer-filter]"));
  if (!list) return;

  let offers = [];
  const render = (filter = "ALL") => {
    const filtered = filter === "ALL" ? offers : offers.filter((offer) => offer.status === filter);
    list.innerHTML = filtered.length ? filtered.map(renderOffer).join("") : renderEmpty(filter);
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    render(tab.dataset.offerFilter || "ALL");
  }));

  apiRequest("/api/user/offers")
    .then((payload) => {
      offers = Array.isArray(payload?.offers) ? payload.offers : [];
      render();
    })
    .catch((error) => {
      list.innerHTML = `<div class="offers-center__error" role="alert">${escapeHtml(error.message || "Không tải được ưu đãi. Vui lòng thử lại sau.")}</div>`;
    });
}

function renderOffer(offer) {
  const status = STATUS_LABELS[offer.status] || offer.status;
  const expiry = offer.valid_until ? `Hết hạn ${new Date(offer.valid_until).toLocaleDateString("vi-VN")}` : "Áp dụng theo chương trình";
  const terms = Array.isArray(offer.terms) ? offer.terms.map((term) => `<li>${escapeHtml(term)}</li>`).join("") : "";
  return `<article class="offer-card offer-card--${escapeHtml(String(offer.status || "").toLowerCase())}">
    <div class="offer-card__top">
      <span class="offer-card__badge">${escapeHtml(status)}</span>
      <span class="offer-card__expiry">${escapeHtml(expiry)}</span>
    </div>
    <h2 class="offer-card__title">${escapeHtml(offer.title || "Ưu đãi Velura")}</h2>
    <p class="offer-card__description">${escapeHtml(offer.description || "")}</p>
    ${offer.code ? `<div class="offer-card__code"><span>Mã ưu đãi</span><strong>${escapeHtml(offer.code)}</strong></div>` : ""}
    <ul class="offer-card__terms">${terms}</ul>
    <div class="offer-card__footer">
      <a class="offer-card__link" href="${escapeAttribute(offer.action?.href || "/src/pages/offers.html")}">${escapeHtml(offer.action?.label || "Xem chi tiết")} →</a>
      ${offer.min_order_value ? `<span class="offer-card__minimum">Tối thiểu ${Number(offer.min_order_value).toLocaleString("vi-VN")}đ</span>` : ""}
    </div>
  </article>`;
}

function renderEmpty(filter) {
  return `<div class="offers-center__empty">Chưa có ưu đãi ở nhóm ${escapeHtml(STATUS_LABELS[filter] || "này")}.</div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
