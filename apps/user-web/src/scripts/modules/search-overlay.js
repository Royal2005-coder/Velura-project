import { recentSearches, trendingSearches, popularCategories } from "../data/search-mock.js";
import { apiRequest } from "./api.js";

export function initSearchOverlay() {
  var searchTriggers = document.querySelectorAll(".js-search-input");
  var overlay = document.getElementById("search-overlay");
  if (!overlay || !searchTriggers.length) return;

  var closeButtons = overlay.querySelectorAll(".js-search-close");
  var overlayInput = overlay.querySelector(".js-search-overlay-input");
  var suggestionsContainer = overlay.querySelector(".js-search-suggestions");
  var suggestionsList = overlay.querySelector(".js-search-suggestions-list");
  var overlayContent = overlay.querySelector(".js-search-overlay-content");

  // ── Product cache for suggestions ──
  let cachedProducts = null;
  let cacheLoading = false;
  let cachePromise = null;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (s) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
    });
  }

  function formatPrice(price) {
    if (!price && price !== 0) return "";
    return Number(price).toLocaleString("vi-VN") + "₫";
  }

  // Pre-fill search inputs if q param is present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get("q");
  if (qParam) {
    searchTriggers.forEach(function (trigger) {
      if (trigger.tagName === "INPUT") trigger.value = qParam;
    });
    if (overlayInput) overlayInput.value = qParam;
  }

  // ── Load recent searches from localStorage ──
  let currentRecentSearches = [];
  try {
    const saved = localStorage.getItem("velura_recent_searches");
    currentRecentSearches = saved ? JSON.parse(saved) : [...recentSearches];
  } catch (e) {
    currentRecentSearches = [...recentSearches];
  }

  function saveRecentSearches() {
    localStorage.setItem("velura_recent_searches", JSON.stringify(currentRecentSearches));
  }

  // ── Fetch & cache products (once) ──
  async function ensureProductsLoaded() {
    if (cachedProducts) return cachedProducts;
    if (cachePromise) return cachePromise;

    cacheLoading = true;
    cachePromise = apiRequest("/api/user/products")
      .then(function (products) {
        cachedProducts = Array.isArray(products) ? products : [];
        cacheLoading = false;
        return cachedProducts;
      })
      .catch(function () {
        cachedProducts = [];
        cacheLoading = false;
        return cachedProducts;
      });

    return cachePromise;
  }

  // ── Vietnamese text normalization for search ──
  function normalizeText(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // ── Score a product against a query ──
  function scoreProduct(product, queryTokens, normalQuery) {
    const name = normalizeText(product.name || "");
    let score = 0;

    // Exact full match
    if (name === normalQuery) return 200;

    // Name starts with query
    if (name.startsWith(normalQuery)) score += 100;

    // All query tokens found in name
    const allTokensInName = queryTokens.every(function (t) { return name.includes(t); });
    if (allTokensInName) score += 60;

    // Per-token bonus
    queryTokens.forEach(function (t) {
      if (name.includes(t)) score += 15;
    });

    // Category match
    const catName = normalizeText(product.category_name || "");
    queryTokens.forEach(function (t) {
      if (catName.includes(t)) score += 8;
    });

    return score;
  }

  // ── Search products from cache ──
  function searchProducts(query) {
    if (!query || !cachedProducts) return [];
    const normalQuery = normalizeText(query.trim());
    if (!normalQuery) return [];

    const queryTokens = normalQuery.split(/\s+/).filter(Boolean);

    const scored = [];
    for (let i = 0; i < cachedProducts.length; i++) {
      const p = cachedProducts[i];
      const s = scoreProduct(p, queryTokens, normalQuery);
      if (s > 0) scored.push({ product: p, score: s });
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 8).map(function (s) { return s.product; });
  }

  // ── Render suggestion list ──
  function renderSuggestions(products, query) {
    if (!suggestionsContainer || !suggestionsList) return;

    // Show suggestions, hide default content
    suggestionsContainer.style.display = "";
    if (overlayContent) overlayContent.style.display = "none";

    if (products.length === 0) {
      suggestionsList.innerHTML =
        '<div class="search-suggestions__empty">' +
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px;color:var(--text-secondary,#8c857e);">' +
            '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
          '</svg>' +
          '<p>Không tìm thấy sản phẩm phù hợp</p>' +
          '<span class="search-suggestions__empty-hint">Thử từ khóa khác hoặc nhấn Enter để xem toàn bộ kết quả</span>' +
        '</div>';
      return;
    }

    suggestionsList.innerHTML = products.map(function (p) {
      const img = (p.images && p.images[0]) ? p.images[0] : "/src/assets/images/placeholder.jpg";
      const slug = p.slug || p.product_id;
      const link = "/src/pages/products/detail.html?id=" + encodeURIComponent(slug);
      const price = p.sale_price || p.base_price;
      const oldPrice = (p.sale_price && p.base_price && p.base_price > p.sale_price) ? p.base_price : null;

      return '<a href="' + link + '" class="search-suggestion-item" data-product-id="' + escapeHtml(p.product_id) + '">' +
        '<div class="search-suggestion-item__img-wrap">' +
          '<img src="' + img + '" alt="' + escapeHtml(p.name) + '" class="search-suggestion-item__img" loading="lazy" />' +
        '</div>' +
        '<div class="search-suggestion-item__info">' +
          '<span class="search-suggestion-item__name">' + escapeHtml(p.name) + '</span>' +
          '<div class="search-suggestion-item__prices">' +
            '<span class="search-suggestion-item__price">' + formatPrice(price) + '</span>' +
            (oldPrice ? '<span class="search-suggestion-item__price-old">' + formatPrice(oldPrice) + '</span>' : '') +
          '</div>' +
          (p.category_name ? '<span class="search-suggestion-item__cat">' + escapeHtml(p.category_name) + '</span>' : '') +
        '</div>' +
      '</a>';
    }).join("");
  }

  // ── Hide suggestions & show default content ──
  function hideSuggestions() {
    if (suggestionsContainer) suggestionsContainer.style.display = "none";
    if (overlayContent) overlayContent.style.display = "";
  }

  // ── Debounce utility ──
  function debounce(fn, delay) {
    let timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  // ── Handle input for suggestions ──
  var currentQuery = "";

  var handleInput = debounce(async function () {
    if (!overlayInput) return;
    var val = overlayInput.value.trim();
    currentQuery = val;

    if (!val) {
      hideSuggestions();
      return;
    }

    // Ensure products are loaded
    await ensureProductsLoaded();

    // If user cleared input while loading, bail
    if (currentQuery !== val) return;

    var results = searchProducts(val);
    renderSuggestions(results, val);
  }, 250);

  // ── Render default overlay content (recent, trending, popular) ──
  function renderSearchData() {
    var recentContainer = overlay.querySelector(".js-recent-searches");
    if (recentContainer) {
      if (currentRecentSearches.length === 0) {
        recentContainer.innerHTML = '<p style="color: #9e9e9e; font-size: 0.9rem;">Chưa có tìm kiếm gần đây</p>';
      } else {
        recentContainer.innerHTML = currentRecentSearches.map(function (keyword) {
          return '<span class="search-pill">' +
            '<span class="js-search-pill-keyword" style="cursor:pointer;">' + escapeHtml(keyword) + '</span>' +
            '<button type="button" class="js-delete-recent" data-val="' + escapeHtml(keyword) + '" aria-label="Xóa">✕</button>' +
          '</span>';
        }).join("");
      }

      var deleteBtns = recentContainer.querySelectorAll(".js-delete-recent");
      deleteBtns.forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var val = btn.getAttribute("data-val");
          var pill = btn.closest(".search-pill");
          if (pill) pill.remove();
          var index = currentRecentSearches.indexOf(val);
          if (index > -1) {
            currentRecentSearches.splice(index, 1);
            saveRecentSearches();
          }
          if (currentRecentSearches.length === 0) {
            recentContainer.innerHTML = '<p style="color: #9e9e9e; font-size: 0.9rem;">Chưa có tìm kiếm gần đây</p>';
          }
        });
      });

      recentContainer.querySelectorAll(".js-search-pill-keyword").forEach(function (span) {
        span.addEventListener("click", function () {
          window.location.href = "/src/pages/products/list.html?q=" + encodeURIComponent(span.textContent.trim());
        });
      });
    }

    var trendingContainer = overlay.querySelector(".js-trending-searches");
    if (trendingContainer) {
      trendingContainer.innerHTML = trendingSearches.map(function (keyword, index) {
        return '<div class="trending-item">' +
          '<span class="trending-item__rank">#' + (index + 1) + '</span>' +
          '<a href="/src/pages/products/list.html?q=' + encodeURIComponent(keyword) + '" class="trending-item__link">' + escapeHtml(keyword) + '</a>' +
        '</div>';
      }).join("");
    }

    loadPopularCategories();
  }

  async function loadPopularCategories() {
    var popularContainer = overlay.querySelector(".js-popular-categories");
    if (!popularContainer) return;

    try {
      const categories = await apiRequest("/api/user/categories");
      const categoryImageMap = {
        "ao": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/ao/ao_ao-blouse-lua-co-do-anh-champagne_white_01.jpg",
        "quan": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/quan/quan_quan-short-linen-cap-cao-day-trang_ivory-white_1.jpg",
        "dam-vay": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/dam-vay/dam-vay_dam-tweed-hai-day-that-no_emerald_01.png",
        "ao-khoac": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/ao-khoac/ao-khoac_trench-coat-dang-dai_warm-beige_01.png",
        "set-do": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/set-do/set-do_set-nau-cocoa-thanh-lich-du-tiec_01.png",
        "phu-kien": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/phu-kien/phu-kien_ly-giu-nhiet-matte-black_onyx_01.png",
        "giay-dep": "https://cdn.jsdelivr.net/gh/khai0335814880-create/Velura-Images@main/categories/giay-dep/giay-dep_giay-sandals-quai-ngang-de-thap_matte-black_01.png"
      };

      const displayedCats = categories.slice(0, 4);
      popularContainer.innerHTML = displayedCats.map(function (cat) {
        const img = categoryImageMap[cat.slug] || "/src/assets/images/placeholder.jpg";
        const link = "/src/pages/products/list.html?category=" + cat.slug;
        return '<a href="' + link + '" class="popular-card">' +
          '<div class="popular-card__image-container">' +
            '<img src="' + img + '" alt="' + escapeHtml(cat.name) + '" class="popular-card__img" />' +
          '</div>' +
          '<div class="popular-card__info">' +
            '<h4 class="popular-card__name">' + escapeHtml(cat.name) + '</h4>' +
            '<span class="popular-card__count">' + (cat.product_count || 0) + ' sản phẩm</span>' +
          '</div>' +
        '</a>';
      }).join("");
    } catch (err) {
      console.error("Failed to load search categories from DB:", err);
      popularContainer.innerHTML = popularCategories.map(function (cat) {
        return '<a href="' + cat.link + '" class="popular-card">' +
          '<div class="popular-card__image-container">' +
            '<img src="' + cat.image + '" alt="' + escapeHtml(cat.name) + '" class="popular-card__img" />' +
          '</div>' +
          '<div class="popular-card__info">' +
            '<h4 class="popular-card__name">' + escapeHtml(cat.name) + '</h4>' +
            '<span class="popular-card__count">' + cat.count + ' sản phẩm</span>' +
          '</div>' +
        '</a>';
      }).join("");
    }
  }

  // ── Open search overlay ──
  searchTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      overlay.classList.add("search-overlay--active");
      document.body.classList.add("overflow-hidden");
      hideSuggestions();
      if (overlayInput) {
        setTimeout(function () { overlayInput.focus(); }, 100);
      }
    });
  });

  // ── Close search overlay ──
  function closeOverlay() {
    overlay.classList.remove("search-overlay--active");
    document.body.classList.remove("overflow-hidden");
    hideSuggestions();
    if (overlayInput) overlayInput.value = "";
  }

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", closeOverlay);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("search-overlay--active")) {
      closeOverlay();
    }
  });

  // ── Input events: suggestions + Enter to search ──
  if (overlayInput) {
    overlayInput.addEventListener("input", handleInput);

    overlayInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var val = overlayInput.value.trim();
        if (val) {
          if (!currentRecentSearches.includes(val)) {
            currentRecentSearches.unshift(val);
            if (currentRecentSearches.length > 5) currentRecentSearches.pop();
            saveRecentSearches();
          }
          window.location.href = "/src/pages/products/list.html?q=" + encodeURIComponent(val);
        }
      }
    });
  }

  // ── Click outside suggestions to close ──
  document.addEventListener("click", function (e) {
    if (!overlay.classList.contains("search-overlay--active")) return;
    var target = e.target;
    if (suggestionsContainer && !suggestionsContainer.contains(target) && target !== overlayInput) {
      hideSuggestions();
    }
  });

  // ── Pre-warm product cache when overlay opens ──
  searchTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      ensureProductsLoaded();
    });
  });

  renderSearchData();
}
