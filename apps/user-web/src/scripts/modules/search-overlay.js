import { recentSearches, trendingSearches, popularCategories } from "../data/search-mock.js";
import { apiRequest } from "./api.js";

export function initSearchOverlay() {
  var searchTriggers = document.querySelectorAll(".js-search-input");
  var overlay = document.getElementById("search-overlay");
  if (!overlay || !searchTriggers.length) return;

  var closeButtons = overlay.querySelectorAll(".js-search-close");
  var overlayInput = overlay.querySelector(".js-search-overlay-input");

  // Helper escape HTML helper
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (s) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s];
    });
  }

  // Pre-fill search inputs if q param is present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get("q");
  if (qParam) {
    searchTriggers.forEach(function (trigger) {
      if (trigger.tagName === "INPUT") {
        trigger.value = qParam;
      }
    });
    if (overlayInput) {
      overlayInput.value = qParam;
    }
  }

  // Load recent searches from localStorage
  let currentRecentSearches = [];
  try {
    const saved = localStorage.getItem("velura_recent_searches");
    if (saved) {
      currentRecentSearches = JSON.parse(saved);
    } else {
      currentRecentSearches = [...recentSearches]; // fallback to mock
    }
  } catch (e) {
    currentRecentSearches = [...recentSearches];
  }

  function saveRecentSearches() {
    localStorage.setItem("velura_recent_searches", JSON.stringify(currentRecentSearches));
  }

  // Render mock data into the overlay (and dynamic categories)
  function renderSearchData() {
    // 1. Render Recent Searches with close buttons
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

      // Bind dynamic delete events
      var deleteBtns = recentContainer.querySelectorAll(".js-delete-recent");
      deleteBtns.forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var val = btn.getAttribute("data-val");
          var pill = btn.closest(".search-pill");
          if (pill) {
            pill.remove();
          }
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

      // Bind click keyword
      recentContainer.querySelectorAll(".js-search-pill-keyword").forEach(function (span) {
        span.addEventListener("click", function () {
          window.location.href = "/src/pages/products/list.html?q=" + encodeURIComponent(span.textContent.trim());
        });
      });
    }

    // 2. Render Trending Searches
    var trendingContainer = overlay.querySelector(".js-trending-searches");
    if (trendingContainer) {
      trendingContainer.innerHTML = trendingSearches.map(function (keyword, index) {
        return '<div class="trending-item">' +
          '<span class="trending-item__rank">#' + (index + 1) + '</span>' +
          '<a href="/src/pages/products/list.html?q=' + encodeURIComponent(keyword) + '" class="trending-item__link">' + escapeHtml(keyword) + '</a>' +
        '</div>';
      }).join("");
    }

    // 3. Render Dynamic Categories synced with database
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
        const link = `/src/pages/products/list.html?category=${cat.slug}`;
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
      // Fallback to static mock categories if API fails
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

  // Open search overlay
  searchTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      overlay.classList.add("search-overlay--active");
      document.body.classList.add("overflow-hidden"); // Scroll Lock
      
      // Auto focus input inside overlay
      if (overlayInput) {
        setTimeout(function () {
          overlayInput.focus();
        }, 100);
      }
    });
  });

  // Close search overlay
  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      overlay.classList.remove("search-overlay--active");
      document.body.classList.remove("overflow-hidden"); // Unlock scroll
    });
  });

  // Close overlay on Escape key press
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("search-overlay--active")) {
      overlay.classList.remove("search-overlay--active");
      document.body.classList.remove("overflow-hidden");
    }
  });

  // Handle Enter key on search input inside overlay
  if (overlayInput) {
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

  // Render content on initialization
  renderSearchData();
}
