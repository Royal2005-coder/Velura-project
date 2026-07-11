import { apiRequest, isSessionValid } from "./api.js";

const OFFER_IDS_WITH_MODAL = new Set(["A1", "A4", "A5", "A6"]);
const BIRTHDAY_VOUCHER_CODE = "BDAY15";

export function initMonthlyOffers() {
  document.addEventListener("click", handleOfferClick);
  openOfferFromQuery();
}

function handleOfferClick(event) {
  const target = event.target.closest("[data-banner-id]");
  if (!target) return;

  const offerId = String(target.dataset.bannerId || "").trim().toUpperCase();
  if (!offerId) return;

  if (offerId === "A2") {
    event.preventDefault();
    window.location.href = "/src/pages/products/list.html?sale=true&campaign=monthly-last-days";
    return;
  }

  if (offerId === "A3") {
    event.preventDefault();
    window.location.href = "/src/pages/collections.html?type=combo&offer=monthly-combo";
    return;
  }

  if (OFFER_IDS_WITH_MODAL.has(offerId)) {
    event.preventDefault();
    openMonthlyOfferFlow(offerId);
  }
}

function openOfferFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const rawOffer = params.get("offer") || "";
  const offerId = normalizeOfferId(rawOffer);
  if (!OFFER_IDS_WITH_MODAL.has(offerId)) return;

  window.setTimeout(() => openMonthlyOfferFlow(offerId), 260);
}

function normalizeOfferId(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized.startsWith("A1") || normalized.includes("BIRTHDAY")) return "A1";
  if (normalized.startsWith("A4") || normalized.includes("LOYALTY")) return "A4";
  if (normalized.startsWith("A5") || normalized.includes("REFERRAL")) return "A5";
  if (normalized.startsWith("A6") || normalized.includes("FREESHIP")) return "A6";
  return normalized;
}

async function openMonthlyOfferFlow(offerId) {
  try {
    if (offerId === "A1") {
      await openBirthdayFlow();
      return;
    }
    if (offerId === "A4") {
      await openLoyaltyFlow();
      return;
    }
    if (offerId === "A5") {
      await openReferralFlow();
      return;
    }
    if (offerId === "A6") {
      openFreeshipModal();
    }
  } catch (error) {
    console.warn("[monthly-offers] Could not open offer flow:", error);
    openInfoModal({
      tone: "error",
      title: "Chưa mở được ưu đãi",
      body: `<p>Hệ thống chưa tải được thông tin ưu đãi ở thời điểm này. Bạn có thể thử lại sau ít phút hoặc liên hệ Velura qua hotline 1900 1212.</p>`,
      actions: [{ label: "Đóng", variant: "primary", onClick: closeOfferModal }]
    });
  }
}

async function openBirthdayFlow() {
  if (!isMember()) {
    openBirthdayGuestModal();
    return;
  }

  const profile = await getFreshProfile();
  const birthday = getBirthdayDate(profile);
  if (!birthday) {
    openBirthdayCaptureModal(profile);
    return;
  }

  if (birthday.getMonth() === new Date().getMonth()) {
    openBirthdayActiveModal(profile);
  } else {
    openBirthdayCountdownModal(profile, birthday);
  }
}

function openBirthdayGuestModal() {
  const redirect = encodeURIComponent("/src/pages/offers.html?offer=A1");
  openInfoModal({
    title: "Tháng sinh nhật của bạn, Velura có quà nhỏ",
    eyebrow: "Ưu đãi cá nhân",
    image: "/src/assets/images/banners/hot-banner-a1-birthday.png",
    body: `
      <p>Velura không bắt bạn nhập ngày sinh ngay khi đăng ký. Thay vào đó, bạn có thể bổ sung sau để nhận ưu đãi sinh nhật riêng.</p>
      <ul>
        <li>Voucher sinh nhật trong tháng của bạn.</li>
        <li>Một món quà nhỏ kèm theo đơn hàng phù hợp.</li>
        <li>Chỉ dùng để gửi ưu đãi sinh nhật, không gửi spam.</li>
      </ul>
    `,
    actions: [
      { label: "Đăng nhập để nhận quà", variant: "primary", href: `/src/pages/auth/signin.html?redirect=${redirect}` },
      { label: "Tạo tài khoản mới", variant: "ghost", href: `/src/pages/auth/signup.html?redirect=${redirect}` }
    ]
  });
}

function openBirthdayCaptureModal(profile) {
  openInfoModal({
    title: "Velura chưa biết sinh nhật của bạn",
    eyebrow: "Bổ sung thông tin",
    body: `
      <p>Bạn chỉ cần chọn ngày và tháng. Năm sinh không bắt buộc, Velura dùng thông tin này để kích hoạt ưu đãi sinh nhật.</p>
      <form class="monthly-offer-form js-birthday-form" novalidate>
        <div class="monthly-offer-form__grid">
          <label>
            <span>Ngày</span>
            <select name="day" required>
              <option value="">Ngày</option>
              ${Array.from({ length: 31 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Tháng</span>
            <select name="month" required>
              <option value="">Tháng</option>
              ${Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">Tháng ${index + 1}</option>`).join("")}
            </select>
          </label>
        </div>
        <p class="monthly-offer-form__hint">Năm sinh sẽ được lưu mặc định để phù hợp cấu trúc hồ sơ hiện tại.</p>
        <p class="monthly-offer-form__error js-birthday-error" hidden></p>
      </form>
    `,
    actions: [
      { label: "Lưu và nhận ưu đãi", variant: "primary", onClick: () => submitBirthdayForm(profile) },
      { label: "Để sau", variant: "ghost", onClick: closeOfferModal }
    ]
  });
}

async function submitBirthdayForm(profile) {
  const form = document.querySelector(".js-birthday-form");
  const errorNode = document.querySelector(".js-birthday-error");
  const day = Number(form?.elements?.day?.value || 0);
  const month = Number(form?.elements?.month?.value || 0);

  if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12 || !isValidDayMonth(day, month)) {
    showInlineError(errorNode, "Bạn chọn giúp Velura ngày và tháng sinh hợp lệ nhé.");
    return;
  }

  setModalBusy(true);
  try {
    const date_of_birth = `1900-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const updated = await apiRequest("/api/user/profile", {
      method: "PATCH",
      body: { date_of_birth }
    });
    cacheProfile(updated);
    const birthday = getBirthdayDate(updated) || new Date(date_of_birth);
    if (birthday.getMonth() === new Date().getMonth()) {
      openBirthdayActiveModal(updated);
    } else {
      openBirthdayCountdownModal(updated, birthday);
    }
  } catch (error) {
    showInlineError(errorNode, error.message || "Chưa lưu được ngày sinh. Bạn thử lại giúp Velura nhé.");
  } finally {
    setModalBusy(false);
  }
}

function openBirthdayActiveModal(profile) {
  const name = profile?.full_name || "bạn";
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString("vi-VN");
  openInfoModal({
    title: `Chúc mừng sinh nhật, ${name}!`,
    eyebrow: "Ưu đãi đã sẵn sàng",
    image: "/src/assets/images/banners/hot-banner-a1-birthday.png",
    body: `
      <p>Velura gửi bạn mã ưu đãi dùng trong tháng sinh nhật.</p>
      <div class="monthly-offer-voucher">
        <span>Mã của bạn</span>
        <strong>${BIRTHDAY_VOUCHER_CODE}</strong>
        <small>Hiệu lực đến ${escapeHtml(endOfMonth)}</small>
      </div>
      <p>Đơn hàng trong tháng sinh nhật có thể nhận thêm một món quà nhỏ từ Velura.</p>
    `,
    actions: [
      { label: "Sao chép mã", variant: "ghost", onClick: () => copyVoucher(BIRTHDAY_VOUCHER_CODE) },
      { label: "Mua sắm ngay", variant: "primary", onClick: () => goShoppingWithVoucher(BIRTHDAY_VOUCHER_CODE) }
    ]
  });
}

function openBirthdayCountdownModal(profile, birthday) {
  const birthdayMonth = birthday.getMonth() + 1;
  const nowMonth = new Date().getMonth() + 1;
  const monthsLeft = (birthdayMonth - nowMonth + 12) % 12 || 12;
  openInfoModal({
    title: "Velura đã ghi nhớ rồi",
    eyebrow: "Sinh nhật của bạn",
    body: `
      <p>Sinh nhật tháng ${birthdayMonth} của bạn còn khoảng ${monthsLeft} tháng nữa.</p>
      <ul>
        <li>Đến tháng sinh nhật, Velura sẽ kích hoạt ưu đãi riêng cho bạn.</li>
        <li>Bạn vẫn có thể xem các ưu đãi tháng này trong khi chờ.</li>
      </ul>
    `,
    actions: [
      { label: "Xem ưu đãi tháng này", variant: "primary", onClick: closeOfferModal },
      { label: "Về trang chủ", variant: "ghost", href: "/index.html" }
    ]
  });
}

async function openLoyaltyFlow() {
  if (!isMember()) {
    openInfoModal({
      title: "Khách hàng thân thiết",
      eyebrow: "Quyền lợi thành viên",
      image: "/src/assets/images/banners/hot-banner-a4-loyal.png",
      body: `
        <p>Tạo tài khoản để Velura ghi nhớ hành trình mua sắm và gợi ý cá nhân hóa cho bạn.</p>
        <ul>
          <li>Miễn phí vận chuyển cho đơn từ 500.000đ.</li>
          <li>Lưu Style Profile và gợi ý AI cá nhân hóa.</li>
          <li>Theo dõi đơn hàng, wishlist và lịch sử mua sắm.</li>
          <li>Nhận ưu đãi sinh nhật và ưu đãi tháng này.</li>
        </ul>
      `,
      actions: [
        { label: "Tạo tài khoản", variant: "primary", href: `/src/pages/auth/signup.html?redirect=${encodeURIComponent("/src/pages/offers.html?offer=A4")}` },
        { label: "Đăng nhập", variant: "ghost", href: `/src/pages/auth/signin.html?redirect=${encodeURIComponent("/src/pages/offers.html?offer=A4")}` }
      ]
    });
    return;
  }

  const profile = await getFreshProfile();
  openInfoModal({
    title: `Xin chào, ${profile?.full_name || "bạn"}`,
    eyebrow: "Tiến trình thành viên",
    image: "/src/assets/images/banners/hot-banner-a4-loyal.png",
    body: `
      <p>Tài khoản của bạn đang được Velura ghi nhận để đồng bộ hồ sơ, đơn hàng và ưu đãi cá nhân.</p>
      <div class="monthly-offer-progress">
        <span>Quyền lợi hiện có</span>
        <div><i style="width: 58%"></i></div>
        <small>Đã mở khóa freeship từ 500.000đ và gợi ý AI theo Style Profile.</small>
      </div>
      <ul>
        <li>Ngày sinh: ${profile?.date_of_birth ? "đã bổ sung" : "chưa bổ sung"}</li>
        <li>Email: ${profile?.email ? "đã xác thực thông tin liên hệ" : "chưa rõ"}</li>
        <li>Ưu đãi tiếp theo sẽ hiển thị trong mục voucher khi đủ điều kiện.</li>
      </ul>
    `,
    actions: [
      { label: "Mua sắm ngay", variant: "primary", href: "/src/pages/products/list.html" },
      { label: "Xem hồ sơ", variant: "ghost", href: "/src/pages/account/profile.html" }
    ]
  });
}

async function openReferralFlow() {
  if (!isMember()) {
    openInfoModal({
      title: "Rủ bạn bè, cả hai cùng có quà",
      eyebrow: "Chia sẻ Velura",
      image: "/src/assets/images/banners/hot-banner-a5-friend.png",
      body: `
        <p>Bạn có thể chia sẻ Velura cho bạn bè. Khi chương trình được kích hoạt, cả người giới thiệu và người được giới thiệu đều nhận ưu đãi.</p>
        <form class="monthly-offer-form js-referral-form" novalidate>
          <label>
            <span>Đã có mã bạn bè?</span>
            <input name="referralCode" type="text" maxlength="48" placeholder="Nhập mã giới thiệu" />
          </label>
          <p class="monthly-offer-form__error js-referral-error" hidden></p>
        </form>
      `,
      actions: [
        { label: "Lưu mã bạn bè", variant: "ghost", onClick: saveReferralCode },
        { label: "Đăng nhập để lấy link", variant: "primary", href: `/src/pages/auth/signin.html?redirect=${encodeURIComponent("/src/pages/offers.html?offer=A5")}` }
      ]
    });
    return;
  }

  const profile = await getFreshProfile();
  const code = buildReferralCode(profile);
  const url = `${window.location.origin}/src/pages/auth/signup.html?ref=${encodeURIComponent(code)}`;
  openInfoModal({
    title: "Link chia sẻ của bạn",
    eyebrow: "Ưu đãi bạn bè",
    image: "/src/assets/images/banners/hot-banner-a5-friend.png",
    body: `
      <p>Gửi link này cho bạn bè. Khi hệ thống referral được bật đầy đủ, mã này sẽ dùng để ghi nhận người giới thiệu.</p>
      <div class="monthly-offer-link">
        <span>${escapeHtml(url)}</span>
      </div>
      <ul>
        <li>Mã giới thiệu: ${escapeHtml(code)}</li>
        <li>Link được lưu theo tài khoản hiện tại của bạn.</li>
      </ul>
    `,
    actions: [
      { label: "Sao chép link", variant: "primary", onClick: () => copyVoucher(url, "Đã sao chép link chia sẻ") },
      { label: "Dùng voucher ngay", variant: "ghost", href: "/src/pages/cart/cart.html" }
    ]
  });
}

function openFreeshipModal() {
  openInfoModal({
    title: "Miễn phí vận chuyển từ 500.000đ",
    eyebrow: "Chính sách vận chuyển",
    image: "/src/assets/images/banners/hot-banner-a6-freeship.png",
    body: `
      <ul>
        <li>Đơn từ 500.000đ được miễn phí vận chuyển toàn quốc.</li>
        <li>Đơn dưới 500.000đ áp dụng phí tiêu chuẩn 30.000đ.</li>
        <li>TP.HCM và Hà Nội: 1 đến 3 ngày làm việc.</li>
        <li>Các tỉnh thành khác: 3 đến 5 ngày làm việc.</li>
        <li>Shipper giao tối đa 3 lần theo chính sách vận chuyển.</li>
      </ul>
    `,
    actions: [
      { label: "Mua sắm ngay", variant: "primary", href: "/src/pages/products/list.html" },
      { label: "Xem chính sách", variant: "ghost", href: "/src/pages/policies.html?tab=shipping" }
    ]
  });
}

function openInfoModal({ title, eyebrow = "", image = "", body = "", actions = [], tone = "" }) {
  closeOfferModal();
  const modal = document.createElement("div");
  modal.className = `monthly-offer-modal ${tone ? `monthly-offer-modal--${tone}` : ""}`;
  modal.innerHTML = `
    <div class="monthly-offer-modal__overlay" data-offer-close></div>
    <section class="monthly-offer-modal__panel" role="dialog" aria-modal="true" aria-labelledby="monthly-offer-title">
      <button class="monthly-offer-modal__close" type="button" data-offer-close aria-label="Đóng">×</button>
      ${image ? `<img class="monthly-offer-modal__media" src="${escapeAttribute(image)}" alt="" loading="lazy" decoding="async" />` : ""}
      ${eyebrow ? `<p class="monthly-offer-modal__eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
      <h2 class="monthly-offer-modal__title" id="monthly-offer-title">${escapeHtml(title)}</h2>
      <div class="monthly-offer-modal__body">${body}</div>
      <div class="monthly-offer-modal__actions">
        ${actions.map((action, index) => renderAction(action, index)).join("")}
      </div>
      <p class="monthly-offer-modal__toast js-offer-toast" hidden></p>
    </section>
  `;
  document.body.appendChild(modal);
  document.body.classList.add("has-monthly-offer-modal");

  modal.querySelectorAll("[data-offer-close]").forEach((node) => {
    node.addEventListener("click", () => {
      if (!modal.classList.contains("is-busy")) closeOfferModal();
    });
  });

  actions.forEach((action, index) => {
    if (typeof action.onClick !== "function") return;
    modal.querySelector(`[data-action-index="${index}"]`)?.addEventListener("click", action.onClick);
  });

  const firstFocusable = modal.querySelector("button, a, input, select");
  firstFocusable?.focus?.();
}

function renderAction(action, index) {
  const className = `monthly-offer-modal__action monthly-offer-modal__action--${action.variant || "ghost"}`;
  if (action.href) {
    return `<a class="${className}" href="${escapeAttribute(action.href)}">${escapeHtml(action.label)}</a>`;
  }
  return `<button class="${className}" type="button" data-action-index="${index}">${escapeHtml(action.label)}</button>`;
}

function closeOfferModal() {
  document.querySelector(".monthly-offer-modal")?.remove();
  document.body.classList.remove("has-monthly-offer-modal");
}

function setModalBusy(isBusy) {
  const modal = document.querySelector(".monthly-offer-modal");
  if (!modal) return;
  modal.classList.toggle("is-busy", isBusy);
  modal.querySelectorAll("button, input, select").forEach((node) => {
    node.disabled = isBusy;
  });
}

function showInlineError(node, message) {
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
}

function showToast(message) {
  const toast = document.querySelector(".js-offer-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

async function getFreshProfile() {
  try {
    const profile = await apiRequest("/api/user/profile");
    cacheProfile(profile);
    return profile;
  } catch {
    return getStoredUser() || {};
  }
}

function cacheProfile(profile) {
  if (!profile || typeof profile !== "object") return;
  const current = getStoredUser() || {};
  localStorage.setItem("velura_user", JSON.stringify({ ...current, ...profile }));
  localStorage.setItem("velura_profile", JSON.stringify({ ...current, ...profile }));
}

function isMember() {
  return isSessionValid();
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("velura_user") || "null");
  } catch {
    return null;
  }
}

function getBirthdayDate(profile) {
  const value = profile?.date_of_birth || profile?.birthday || profile?.birthdate || profile?.dob;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidDayMonth(day, month) {
  const test = new Date(2000, month - 1, day);
  return test.getMonth() === month - 1 && test.getDate() === day;
}

function goShoppingWithVoucher(code) {
  localStorage.setItem("checkout_voucher_code", code);
  window.location.href = "/src/pages/products/list.html";
}

async function copyVoucher(value, successMessage = "Đã sao chép mã") {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch {
    showToast("Bạn có thể sao chép thủ công nội dung đang hiển thị.");
  }
}

function saveReferralCode() {
  const input = document.querySelector(".js-referral-form input[name='referralCode']");
  const error = document.querySelector(".js-referral-error");
  const value = String(input?.value || "").trim();
  if (!/^[a-zA-Z0-9_-]{4,48}$/.test(value)) {
    showInlineError(error, "Mã giới thiệu chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.");
    return;
  }
  localStorage.setItem("velura_referral_code", value);
  showToast("Đã lưu mã giới thiệu.");
}

function buildReferralCode(profile) {
  const userId = String(profile?.user_id || localStorage.getItem("user_id") || "member").slice(0, 8);
  const nameSlug = slugify(profile?.full_name || "velura");
  return `${userId}-${nameSlug}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "velura";
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttribute(text) {
  return escapeHtml(text).replace(/`/g, "&#96;");
}
