const SLIDE_INTERVAL_MS = 4500;

const HOT_BANNERS = [
  {
    id: "A1",
    title: "Tháng sinh nhật của bạn",
    description: "Velura có quà nhỏ dành riêng",
    ctaText: "Nhận quà ngay",
    ctaLink: "/src/pages/account/profile.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a1-birthday.png",
    imageAlt: "Tháng sinh nhật của bạn - Velura có quà nhỏ dành riêng",
    showCondition: { birthdayThisMonth: true }
  },
  {
    id: "A2",
    title: "Chỉ còn 2 ngày",
    description: "Ưu đãi đặc biệt dành riêng - nhanh tay nhé",
    ctaText: "Xem ngay",
    ctaLink: "/src/pages/products/list.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a2-last-days.png",
    imageAlt: "Chỉ còn 2 ngày - ưu đãi đặc biệt dành riêng",
    showCondition: null
  },
  {
    id: "A3",
    title: "Combo Phối Đồ Tiết Kiệm",
    description: "Mua trọn áo, quần và túi - tiết kiệm ngay 15%",
    ctaText: "Thêm vào giỏ trọn set",
    ctaLink: "/src/pages/ai/suggestions.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a3-combo.png",
    imageAlt: "Combo phối đồ tiết kiệm - mua trọn set tiết kiệm 15%",
    showCondition: null
  },
  {
    id: "A4",
    title: "Khách hàng thân thiết",
    description: "Một món quà nhỏ thay lời cảm ơn từ Velura",
    ctaText: "Nhận ngay ưu đãi",
    ctaLink: "/src/pages/account/profile.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a4-loyal.png",
    imageAlt: "Khách hàng thân thiết - giảm 10% không giới hạn đơn hàng",
    showCondition: null
  },
  {
    id: "A5",
    title: "Một mình vui không bằng cả hai",
    description: "Chia sẻ voucher cho bạn - cả hai cùng nhận ưu đãi",
    ctaText: "Chia sẻ ngay",
    ctaLink: "/src/pages/account/profile.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a5-friend.png",
    imageAlt: "Rủ rê bạn thân - chia sẻ voucher cho bạn",
    showCondition: null
  },
  {
    id: "A6",
    title: "FreeShip cho đơn từ 500k",
    description: "Vận chuyển nhanh, bảo quản cẩn thận, không phí ẩn",
    ctaText: "Xem ngay",
    ctaLink: "/src/pages/products/list.html",
    imageSrc: "/src/assets/images/banners/hot-banner-a6-freeship.png",
    imageAlt: "FreeShip cho đơn từ 500k - áp dụng toàn quốc",
    showCondition: null
  }
];

export function initHotBannerSlider() {
  initHotOfferTicker();
  initHotOfferWidget();
  initOfferBannerList();

  document.querySelectorAll(".js-hot-banner-slider").forEach((root) => {
    if (root.closest(".hot-banner-section--home-legacy")) return;
    initSingleHotBannerSlider(root);
  });
}

function initSingleHotBannerSlider(root) {
  const track = root.querySelector(".js-hot-banner-track");
  const prevBtn = root.querySelector(".js-hot-banner-prev");
  const nextBtn = root.querySelector(".js-hot-banner-next");
  const dots = root.querySelector(".js-hot-banner-dots");
  const progress = root.querySelector(".js-hot-banner-progress");
  if (!track || !prevBtn || !nextBtn || !dots || !progress) return;

  const banners = root.dataset.showAll === "true" ? HOT_BANNERS : getVisibleBanners(getUserState());
  let currentIndex = 0;
  let timerId = null;
  let paused = false;

  if (!banners.length) {
    root.classList.add("hot-banner-slider--empty");
    track.innerHTML = `
      <div class="hot-banner-slider__empty">
        <span>Hiện chưa có ưu đãi nào phù hợp với bạn.</span>
      </div>
    `;
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    dots.hidden = true;
    return;
  }

  track.innerHTML = banners.map(renderSlide).join("");
  dots.innerHTML = banners.map((banner, index) => `
    <button class="hot-banner-slider__dot js-hot-banner-dot" type="button"
      aria-label="Xem banner ${escapeHtml(banner.id)}" data-index="${index}"></button>
  `).join("");

  const dotButtons = Array.from(dots.querySelectorAll(".js-hot-banner-dot"));

  const update = (index, resetProgress = true) => {
    currentIndex = (index + banners.length) % banners.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dotButtons.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
      dot.setAttribute("aria-current", dotIndex === currentIndex ? "true" : "false");
    });
    if (resetProgress) restartProgress(progress);
  };

  const next = () => update(currentIndex + 1);
  const prev = () => update(currentIndex - 1);

  const start = () => {
    if (timerId || paused || banners.length <= 1) return;
    timerId = window.setInterval(next, SLIDE_INTERVAL_MS);
    restartProgress(progress);
  };

  const stop = () => {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  };

  const pause = () => {
    paused = true;
    stop();
    root.classList.add("is-paused");
  };

  const resume = () => {
    paused = false;
    root.classList.remove("is-paused");
    window.setTimeout(start, 1000);
  };

  prevBtn.addEventListener("click", () => {
    stop();
    prev();
    start();
  });

  nextBtn.addEventListener("click", () => {
    stop();
    next();
    start();
  });

  dotButtons.forEach((dot) => {
    dot.addEventListener("click", () => {
      stop();
      update(Number(dot.dataset.index || 0));
      start();
    });
  });

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  update(0, false);
  start();
}

function initOfferBannerList() {
  const list = document.querySelector(".js-offer-banner-list");
  if (!list) return;

  list.innerHTML = HOT_BANNERS.map((banner, index) => `
    <article class="offer-banner-row ${index % 2 === 1 ? "offer-banner-row--reverse" : ""}">
      <div class="offer-banner-row__copy">
        <span class="offer-banner-row__index">${escapeHtml(banner.id)}</span>
        <h3 class="offer-banner-row__title">${escapeHtml(banner.title)}</h3>
        <p class="offer-banner-row__desc">${escapeHtml(banner.description)}</p>
        <a class="offer-banner-row__cta" href="${escapeHtml(banner.ctaLink)}">${escapeHtml(banner.ctaText)} →</a>
      </div>
      <a class="offer-banner-row__image-link" href="${escapeHtml(banner.ctaLink)}" aria-label="${escapeHtml(banner.title)}">
        <img class="offer-banner-row__image" src="${escapeHtml(banner.imageSrc)}" alt="${escapeHtml(banner.imageAlt)}"
          loading="${index < 2 ? "eager" : "lazy"}" decoding="async" />
      </a>
    </article>
  `).join("");
}

function initHotOfferTicker() {
  const track = document.querySelector(".js-hot-offer-ticker-track");
  if (!track) return;

  const items = HOT_BANNERS.map((banner) => banner.title);
  const duplicated = [...items, ...items];
  track.innerHTML = duplicated.map((title) => `
    <a class="hot-offer-ticker__item" href="/src/pages/offers.html">
      <span>${escapeHtml(title)}</span>
    </a>
  `).join("");
}

function initHotOfferWidget() {
  const widget = document.querySelector(".js-hot-offer-widget");
  if (!widget) return;

  const list = widget.querySelector(".js-hot-offer-widget-list");
  const count = widget.querySelector(".js-hot-offer-widget-count");
  if (!list) return;

  const banners = getVisibleBanners(getUserState());
  const preview = banners.length ? banners.slice(0, 4) : HOT_BANNERS.slice(0, 4);

  if (count) count.textContent = `${banners.length || HOT_BANNERS.length} tin`;
  list.innerHTML = preview.map((banner) => `
    <a class="hot-offer-widget__item" href="/src/pages/offers.html">
      <img src="${escapeHtml(banner.imageSrc)}" alt="" loading="lazy" decoding="async" />
      <span>
        <strong>${escapeHtml(banner.title)}</strong>
        <small>${escapeHtml(banner.description)}</small>
      </span>
    </a>
  `).join("");
}

function getVisibleBanners(userState) {
  return HOT_BANNERS.filter((banner) => {
    const condition = banner.showCondition;
    if (!condition) return true;
    if (condition.birthdayThisMonth !== undefined && condition.birthdayThisMonth !== userState.birthdayThisMonth) {
      return false;
    }
    if (condition.hasItemsInCart !== undefined && condition.hasItemsInCart !== userState.hasItemsInCart) {
      return false;
    }
    if (condition.isFirstTimeVisitor !== undefined && condition.isFirstTimeVisitor !== userState.isFirstTimeVisitor) {
      return false;
    }
    return true;
  });
}

function getUserState() {
  return {
    birthdayThisMonth: isBirthdayThisMonth(),
    hasItemsInCart: getCartCount() > 0,
    isFirstTimeVisitor: !localStorage.getItem("velura_has_visited")
  };
}

function isBirthdayThisMonth() {
  const candidates = [
    readJson("velura_user"),
    readJson("velura_profile"),
    readJson("velura_style_profile")
  ].filter(Boolean);
  const birthValue = candidates
    .map((item) => item.birthdate || item.birthday || item.date_of_birth || item.dob || item.birth_date)
    .find(Boolean);
  if (!birthValue) return false;

  const parsed = new Date(birthValue);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getMonth() === new Date().getMonth();
}

function getCartCount() {
  const directCount = Number(localStorage.getItem("velura_cart_count") || 0);
  if (directCount > 0) return directCount;

  const cart = readJson("velura_cart") || readJson("cart") || [];
  if (Array.isArray(cart)) {
    return cart.reduce((total, item) => total + Number(item.quantity || 1), 0);
  }
  if (cart && Array.isArray(cart.items)) {
    return cart.items.reduce((total, item) => total + Number(item.quantity || 1), 0);
  }

  const badge = document.querySelector(".cart-badge");
  const badgeCount = Number(badge?.textContent?.trim() || 0);
  return Number.isFinite(badgeCount) ? badgeCount : 0;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function renderSlide(banner, index) {
  return `
    <article class="hot-banner-slide" aria-label="${escapeHtml(banner.title)}">
      <a class="hot-banner-slide__link" href="${escapeHtml(banner.ctaLink)}" data-banner-id="${escapeHtml(banner.id)}">
        <img class="hot-banner-slide__image" src="${escapeHtml(banner.imageSrc)}" alt="${escapeHtml(banner.imageAlt)}"
          loading="${index === 0 ? "eager" : "lazy"}" decoding="async" />
        <span class="hot-banner-slide__sr">
          ${escapeHtml(banner.title)}. ${escapeHtml(banner.description)}. ${escapeHtml(banner.ctaText)}.
        </span>
      </a>
    </article>
  `;
}

function restartProgress(progress) {
  progress.style.animation = "none";
  progress.offsetHeight;
  progress.style.animation = `hotBannerProgress ${SLIDE_INTERVAL_MS}ms linear forwards`;
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
