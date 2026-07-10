import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { addToCart, getVariantImage } from "./cart.js";
import { getCurrentRole } from "./auth-session.js";
import { updateWishlistBadge } from "./wishlist.js";

/**
 * ES6 Module: Product Catalog Controller
 * Quản lý danh mục động kết nối Supabase, bộ lọc đa năng và sắp xếp thông minh
 */
export function initProductCatalog() {
  const pageContainer = document.querySelector(".product-list-page");
  if (!pageContainer) return;

  const productGrid = document.querySelector(".product-grid");
  const activeCategoryEl = document.querySelector(".js-active-category");
  const countEl = document.querySelector(".grid-controls__count");
  const sortSelect = document.getElementById("sort-select");

  // Filters inputs
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
  const priceInputs = document.querySelectorAll(".price-range__input");
  const priceRangeText = document.querySelector(".price-range__text");
  const colorOptions = document.querySelectorAll(".color-option");
  const sizeOptions = document.querySelectorAll(".size-option");

  // State
  let allProducts = [];
  const initialActiveColorEl = document.querySelector(".color-option.is-selected");
  let selectedColor = initialActiveColorEl ? (initialActiveColorEl.getAttribute("title") || "") : "";
  const initialActiveSizeEl = document.querySelector(".size-option.is-active");
  let selectedSize = initialActiveSizeEl ? initialActiveSizeEl.textContent.trim() : "";
  let wishlistedProductIds = new Set();
  let maxProductPrice = 5000000;
  let currentPage = 1;
  const itemsPerPage = 12;
  let hasStyleProfile = false;
  let userBodyShape = "";
  let isSuggestionsEnabled = localStorage.getItem("velura_suggestions_enabled") === "true";
  let quizData = null;
  const isMember = () => getCurrentRole() === "member";

  const CATEGORY_MAP = {
    top: "ao",
    pants: "quan",
    dress: "dam-vay",
    jacket: "ao-khoac",
    set: "set-do",
    accessories: "phu-kien",
    shoes: "giay-dep"
  };

  const COLOR_MAP = {
    "đen": ["black", "onyx", "charcoal", "slate", "midnight", "đầm đen", "đen", "grey", "gray"],
    "trắng": ["white", "ivory", "cream", "champagne", "sakura white", "off-white", "trắng"],
    "terracotta": ["terracotta", "cinnamon", "red", "burgundy", "đỏ", "hồng đỏ", "pink", "rose", "glitter silver", "silver", "gold"],
    "kem": ["cream", "beige", "buttercream", "sand", "oat", "kem", "brown", "caramel", "camel", "cocoa", "sand shell", "camel", "grey", "gray"],
    "xanh rêu": ["green", "sage", "mint", "emerald", "rêu", "xanh lá", "olive", "teal", "khaki"],
    "xanh lam": ["blue", "sapphire", "xanh dương", "xanh lam", "slate blue", "navy", "ice blue", "baby blue", "dusty blue", "tweed blue"]
  };

  const clothingSizes = ["XS", "S", "M", "L", "XL"];
  const shoeSizes = ["35", "36", "37", "38", "39", "40", "41"];

  function bindSizeOptionListeners() {
    const btns = document.querySelectorAll(".size-selector .size-option");
    btns.forEach(opt => {
      opt.addEventListener("click", () => {
        const isActive = opt.classList.contains("is-active");
        btns.forEach(o => o.classList.remove("is-active"));

        if (isActive) {
          selectedSize = "";
        } else {
          opt.classList.add("is-active");
          selectedSize = opt.textContent.trim();
        }
        applyFiltersAndSort();
      });
    });
  }

  function updateSizeSelectorUI() {
    const sizeSelector = document.querySelector(".size-selector");
    if (!sizeSelector) return;

    const checkedCategories = Array.from(categoryCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => CATEGORY_MAP[cb.value] || cb.value);

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    const isOnlyShoes = (checkedCategories.length === 1 && checkedCategories[0] === "giay-dep") || 
                        (checkedCategories.length === 0 && (categoryParam === "shoes" || categoryParam === "giay-dep"));

    const targetSizes = isOnlyShoes ? shoeSizes : clothingSizes;

    const currentBtns = sizeSelector.querySelectorAll(".size-option");
    const currentSizeValues = Array.from(currentBtns).map(btn => btn.textContent.trim());
    
    const isSame = currentSizeValues.length === targetSizes.length && 
                   currentSizeValues.every((val, idx) => val === targetSizes[idx]);

    if (!isSame) {
      sizeSelector.innerHTML = targetSizes.map(sz => {
        const activeClass = selectedSize.toLowerCase() === sz.toLowerCase() ? "is-active" : "";
        return `<button type="button" class="size-option ${activeClass}">${sz}</button>`;
      }).join("");

      bindSizeOptionListeners();
    }
  }

  function getCategoryFromQuery(query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    if (q.includes("giày") || q.includes("dép") || q.includes("shoes") || q.includes("sandals") || q.includes("guốc") || q.includes("boots")) {
      return "shoes";
    }
    if (q.includes("đầm") || q.includes("váy") || q.includes("dress") || q.includes("maxi")) {
      return "dress";
    }
    if (q.includes("áo khoác") || q.includes("jacket") || q.includes("cardigan") || q.includes("blazer") || q.includes("hoodie")) {
      return "jacket";
    }
    if (q.includes("quần") || q.includes("pants") || q.includes("jean")) {
      return "pants";
    }
    if (q.includes("áo") || q.includes("top") || q.includes("shirt") || q.includes("tee")) {
      return "top";
    }
    if (q.includes("set") || q.includes("bộ")) {
      return "set";
    }
    if (q.includes("túi") || q.includes("xách") || q.includes("phụ kiện") || q.includes("accessories") || q.includes("kính") || q.includes("mũ") || q.includes("nón") || q.includes("thắt lưng")) {
      return "accessories";
    }
    return null;
  }

  // Helper to format currency
  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  function applyProfileFilters(enable) {
    if (!hasStyleProfile || !quizData) return;

    if (enable) {
      // 1. Budget → Price range
      if (quizData.budget_range && priceInputs.length === 2) {
        const br = quizData.budget_range;
        let minPrice = 0;
        let maxPrice = maxProductPrice;
        if (br === "under_300k") { minPrice = 0; maxPrice = 300000; }
        else if (br === "300k_700k") { minPrice = 300000; maxPrice = 700000; }
        else if (br === "700k_1.5m") { minPrice = 700000; maxPrice = 1500000; }
        else if (br === "above_1.5m") { minPrice = 1500000; maxPrice = maxProductPrice; }

        priceInputs[0].value = minPrice;
        priceInputs[1].value = maxPrice;
        if (priceRangeText) {
          priceRangeText.textContent = `${minPrice.toLocaleString('vi-VN')}₫ – ${maxPrice.toLocaleString('vi-VN')}₫`;
        }
      }

      // 2. favorite_colors → Catalog color filter
      // Quiz colors format: "Beige|#E8DFD6" or just "Beige"
      // Catalog colors: Đen, Trắng, Terracotta, Kem, Xanh rêu, Xanh lam
      const quizColorNameMap = {
        "đen": "Đen", "black": "Đen", "charcoal": "Đen", "slate": "Đen", "midnight": "Đen", "onyx": "Đen",
        "trắng": "Trắng", "white": "Trắng", "ivory": "Trắng", "cream": "Kem", "champagne": "Trắng", "off-white": "Trắng",
        "terracotta": "Terracotta", "cinnamon": "Terracotta", "red": "Terracotta", "burgundy": "Terracotta",
        "đỏ": "Terracotta", "hồng đỏ": "Terracotta", "coral": "Terracotta",
        "kem": "Kem", "beige": "Kem", "buttercream": "Kem", "sand": "Kem", "oat": "Kem", "brown": "Kem",
        "caramel": "Kem", "camel": "Kem", "cocoa": "Kem",
        "xanh rêu": "Xanh rêu", "green": "Xanh rêu", "sage": "Xanh rêu", "mint": "Xanh rêu",
        "emerald": "Xanh rêu", "olive": "Xanh rêu", "teal": "Xanh rêu", "khaki": "Xanh rêu",
        "xanh lam": "Xanh lam", "blue": "Xanh lam", "navy": "Xanh lam", "sapphire": "Xanh lam",
        "xanh dương": "Xanh lam", "ice blue": "Xanh lam", "baby blue": "Xanh lam"
      };

      let targetColor = "";
      if (quizData.favorite_colors && Array.isArray(quizData.favorite_colors) && quizData.favorite_colors.length > 0) {
        for (const raw of quizData.favorite_colors) {
          const colorName = typeof raw === "string" ? raw.split("|")[0].trim().toLowerCase() : "";
          if (colorName && quizColorNameMap[colorName]) {
            targetColor = quizColorNameMap[colorName];
            break;
          }
        }
      }

      // Fallback: skin tone → color
      if (!targetColor && quizData.skin_tone) {
        const tone = quizData.skin_tone.toLowerCase();
        const toneColorMap = { "warm": "Terracotta", "cool": "Trắng", "neutral": "Kem" };
        targetColor = toneColorMap[tone] || "";
      }

      if (targetColor) {
        colorOptions.forEach(btn => {
          const btnTitle = (btn.getAttribute("title") || "").toLowerCase();
          if (btnTitle === targetColor.toLowerCase()) {
            btn.classList.add("is-selected");
            selectedColor = btn.getAttribute("title") || targetColor;
          } else {
            btn.classList.remove("is-selected");
          }
        });
      }

      // 3. Body measurements → Size
      if (quizData.chest_cm || quizData.waist_cm) {
        const chest = quizData.chest_cm || 0;
        const waist = quizData.waist_cm || 0;
        const hip = quizData.hip_cm || 0;
        let recommendedSize = "";
        if (chest <= 80 && waist <= 64 && hip <= 86) recommendedSize = "XS";
        else if (chest <= 84 && waist <= 68 && hip <= 90) recommendedSize = "S";
        else if (chest <= 88 && waist <= 72 && hip <= 94) recommendedSize = "M";
        else if (chest <= 92 && waist <= 76 && hip <= 98) recommendedSize = "L";
        else recommendedSize = "XL";

        if (recommendedSize) {
          const sizeOptionsList = document.querySelectorAll(".size-option");
          sizeOptionsList.forEach(opt => {
            if (opt.textContent.trim() === recommendedSize) {
              opt.classList.add("is-active");
              selectedSize = recommendedSize;
            } else {
              opt.classList.remove("is-active");
            }
          });
        }
      }

      // 4. Body shape → checkbox
      const shapeCheckboxes = document.querySelectorAll('input[name="body_shape"]');
      if (userBodyShape) {
        shapeCheckboxes.forEach(cb => {
          if (cb.value.toLowerCase() === userBodyShape.toLowerCase()) {
            cb.checked = true;
          }
        });
      }

      // 5. Preferred occasions → Category checkboxes
      if (quizData.preferred_occasions && Array.isArray(quizData.preferred_occasions)) {
        const occasionCategoryMap = {
          "office": "top", "casual": "top", "party": "dress",
          "school": "top", "sport": "top", "travel": "jacket", "home": "top"
        };
        const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
        const matchedCategories = new Set();
        quizData.preferred_occasions.forEach(occ => {
          const cat = occasionCategoryMap[occ.toLowerCase()];
          if (cat) matchedCategories.add(cat);
        });
        // Don't tick categories — just don't filter them out (let all show)
        // Instead, keep no category checked so all products are visible
      }
    } else {
      // Clear profile-based filters
      if (priceInputs.length === 2) {
        priceInputs[0].value = 0;
        priceInputs[1].value = maxProductPrice;
        if (priceRangeText) {
          priceRangeText.textContent = `0₫ – ${maxProductPrice.toLocaleString('vi-VN')}₫`;
        }
      }

      colorOptions.forEach(btn => btn.classList.remove("is-selected"));
      selectedColor = "";

      const sizeSelectorBtns = document.querySelectorAll(".size-selector .size-option");
      sizeSelectorBtns.forEach(btn => btn.classList.remove("is-active"));
      selectedSize = "";

      const shapeCheckboxes = document.querySelectorAll('input[name="body_shape"]');
      shapeCheckboxes.forEach(cb => cb.checked = false);
    }

    applyFiltersAndSort();
  }

  function updateFitHelperUI() {
    const fitHelperEl = document.querySelector(".fit-helper");
    const lockOverlay = document.querySelector(".js-body-shape-lock");
    const shapeListContainer = document.querySelector(".js-body-shape-list");
    const isLoggedIn = isMember();

    if (hasStyleProfile && quizData) {
      if (lockOverlay) lockOverlay.style.display = "none";
      if (shapeListContainer) {
        shapeListContainer.style.filter = "none";
        shapeListContainer.style.pointerEvents = "auto";
      }

      if (fitHelperEl) {
        const bodyShapeTranslations = {
          "hourglass": "Đồng hồ cát",
          "pear": "Dáng quả lê",
          "apple": "Dáng quả táo",
          "rectangle": "Dáng chữ nhật",
          "inverted triangle": "Dáng tam giác ngược"
        };
        const translatedShape = userBodyShape ? (bodyShapeTranslations[userBodyShape.toLowerCase()] || userBodyShape) : "";

        if (isSuggestionsEnabled) {
          fitHelperEl.innerHTML = `
            <div class="fit-helper__header" style="color: #C97B63; display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Gợi ý đã kích hoạt</span>
              </div>
              <button class="js-toggle-fit-suggestions" type="button" style="font-size: 0.7rem; background: #C97B63; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 600;">Tắt</button>
            </div>
            <p class="fit-helper__desc">Hệ thống đã tự động lọc các trang phục phù hợp nhất với dáng người <strong>${translatedShape}</strong> của bạn.</p>
          `;
        } else {
          fitHelperEl.innerHTML = `
            <div class="fit-helper__header" style="color: #666; display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Gợi ý đã tạm tắt</span>
              </div>
              <button class="js-toggle-fit-suggestions" type="button" style="font-size: 0.7rem; background: #888; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 600;">Bật</button>
            </div>
            <p class="fit-helper__desc">Nhấp vào nút Bật để tự động điền lại các bộ lọc dựa trên hồ sơ Style Profile của bạn.</p>
          `;
        }

        // Bind dynamic event listener to toggle button
        const toggleBtn = fitHelperEl.querySelector(".js-toggle-fit-suggestions");
        if (toggleBtn) {
          toggleBtn.addEventListener("click", () => {
            isSuggestionsEnabled = !isSuggestionsEnabled;
            localStorage.setItem("velura_suggestions_enabled", String(isSuggestionsEnabled));
            applyProfileFilters(isSuggestionsEnabled);
            updateFitHelperUI();
          });
        }
      }
    } else {
      if (fitHelperEl && isLoggedIn) {
        fitHelperEl.innerHTML = `
          <div class="fit-helper__header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Style Profile trống</span>
          </div>
          <p class="fit-helper__desc">Hãy hoàn thành <a href="/src/pages/ai/style-quiz.html" style="color: #C97B63; font-weight: 600; text-decoration: underline;">Style Quiz</a> để mở khóa bộ lọc tự động gợi ý kích cỡ theo dáng người của bạn.</p>
        `;
      }
    }

    applyMemberFeatureGate();
  }

  function applyMemberFeatureGate() {
    const group = document.getElementById("body-shape-filter-group");
    const lockOverlay = document.querySelector(".js-body-shape-lock");
    const shapeListContainer = document.querySelector(".js-body-shape-list");
    if (!group || !lockOverlay || !shapeListContainer || isMember()) return;

    shapeListContainer.style.opacity = "0.5";
    shapeListContainer.style.filter = "blur(2px)";
    shapeListContainer.style.pointerEvents = "none";

    lockOverlay.style.display = "flex";
    lockOverlay.style.cursor = "pointer";
    lockOverlay.innerHTML = `
      <div class="member-lock-badge">
        <span aria-hidden="true">🔒</span>
        Chỉ thành viên. Lọc theo dáng người - đăng ký để mở khóa.
      </div>
    `;
    lockOverlay.addEventListener("click", () => {
      window.location.href = "/src/pages/auth/signup.html";
    }, { once: true });
  }

  // Initialize
  async function loadProducts() {
    if (productGrid) {
      productGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 64px 0; color: var(--soft);">Đang tải sản phẩm từ cửa hàng...</div>`;
    }

    try {
      allProducts = await apiRequest("/api/user/products");
      // Filter out test/mock products
      allProducts = allProducts.filter(p => {
        const nameLower = (p.name || "").toLowerCase();
        return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
      });

      // Dynamically calculate max price filter based on database product prices early
      if (allProducts.length > 0) {
        maxProductPrice = Math.max(...allProducts.map(p => p.sale_price || p.base_price), 5000000);
      }

      // Fetch style profile
      try {
        const profileRes = await apiRequest("/api/user/style-quiz");
        if (profileRes && profileRes.quiz) {
          hasStyleProfile = true;
          userBodyShape = profileRes.quiz.body_shape || "";
          quizData = profileRes.quiz;

          // Parse PostgreSQL array strings to JS arrays
          ["style_tags", "preferred_occasions", "favorite_brands", "favorite_colors"].forEach(key => {
            if (quizData[key] && typeof quizData[key] === "string" && quizData[key].startsWith("{")) {
              try {
                quizData[key] = quizData[key].replace(/^{|}$/g, "").split(",").map(s => s.trim().replace(/^"|"$/g, ""));
              } catch (e) { /* keep as-is */ }
            }
          });

          // Default suggestions to enabled on first visit when quiz exists
          if (localStorage.getItem("velura_suggestions_enabled") === null) {
            isSuggestionsEnabled = true;
            localStorage.setItem("velura_suggestions_enabled", "true");
          }
        }
      } catch (quizErr) {
        hasStyleProfile = false;
      }

      // Apply initial suggestion filters and update layout
      applyProfileFilters(isSuggestionsEnabled);
      updateFitHelperUI();

      const shapeCheckboxes = document.querySelectorAll('input[name="body_shape"]');
      shapeCheckboxes.forEach(cb => {
        cb.addEventListener("change", applyFiltersAndSort);
      });

      const brandCheckboxes = document.querySelectorAll('input[name="brand"]');
      brandCheckboxes.forEach(cb => {
        cb.addEventListener("change", applyFiltersAndSort);
      });

      const specialCheckboxes = document.querySelectorAll('input[name="special"]');
      specialCheckboxes.forEach(cb => {
        cb.addEventListener("change", applyFiltersAndSort);
      });

      const clearBtn = document.querySelector(".js-clear-filters");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          categoryCheckboxes.forEach(cb => cb.checked = false);
          if (priceInputs[0]) priceInputs[0].value = 0;
          if (priceInputs[1]) priceInputs[1].value = maxProductPrice;
          if (priceRangeText) {
            priceRangeText.textContent = `0₫ – ${maxProductPrice.toLocaleString('vi-VN')}₫`;
          }
          colorOptions.forEach(btn => btn.classList.remove("is-selected"));
          selectedColor = "";
          const sizeSelectorBtns = document.querySelectorAll(".size-selector .size-option");
          sizeSelectorBtns.forEach(btn => btn.classList.remove("is-active"));
          selectedSize = "";
          brandCheckboxes.forEach(cb => cb.checked = false);
          specialCheckboxes.forEach(cb => cb.checked = false);
          shapeCheckboxes.forEach(cb => cb.checked = false);

          // Disable AI suggestions when user manually clears filters
          isSuggestionsEnabled = false;
          localStorage.setItem("velura_suggestions_enabled", "false");
          updateFitHelperUI();

          applyFiltersAndSort();
          showToast("Đã xóa toàn bộ bộ lọc");
        });
      }

      // Fetch user wishlist to initialize state
      try {
        const token = localStorage.getItem("velura_token");
        if (token) {
          const wishlistData = await apiRequest("/api/user/wishlist");
          const items = wishlistData.items || [];
          wishlistedProductIds = new Set(items.map(item => item.product_id));
          localStorage.setItem("velura_wishlist_count", wishlistedProductIds.size);
        } else {
          const guestIds = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
          wishlistedProductIds = new Set(guestIds);
        }
        updateWishlistBadge();
      } catch (wishlistErr) {
        wishlistedProductIds = new Set();
      }
      
      // Sync URL parameters for categories
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get("category");
      const qParam = urlParams.get("q");
      const specialParam = urlParams.get("special");
      const sortParam = urlParams.get("sort");

      if (categoryParam) {
        categoryCheckboxes.forEach(cb => {
          const slug = CATEGORY_MAP[cb.value] || cb.value;
          cb.checked = (cb.value === categoryParam || slug === categoryParam);
        });
      } else if (qParam) {
        const inferredCategory = getCategoryFromQuery(qParam);
        if (inferredCategory) {
          categoryCheckboxes.forEach(cb => {
            cb.checked = (cb.value === inferredCategory);
          });
        }
      }

      if (specialParam) {
        const specialVals = specialParam.split(",");
        const specialCheckboxes = document.querySelectorAll('input[name="special"]');
        specialCheckboxes.forEach(cb => {
          if (specialVals.includes(cb.value)) {
            cb.checked = true;
          }
        });
      }

      if (sortParam && sortSelect) {
        sortSelect.value = sortParam;
      }

      // Set max price limit input value if suggestions are not active
      if (priceInputs[1] && !isSuggestionsEnabled) {
        priceInputs[1].value = maxProductPrice;
        if (priceRangeText) {
          priceRangeText.textContent = `0₫ – ${maxProductPrice.toLocaleString('vi-VN')}₫`;
        }
      }

      applyFiltersAndSort();
    } catch (err) {
      if (productGrid) {
        productGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 64px 0; color: #d9534f;">Không thể tải sản phẩm: ${err.message}</div>`;
      }
    }
  }

  // Filter and Sort Handler
  function applyFiltersAndSort(resetPage = true) {
    if (resetPage) {
      currentPage = 1;
    }
    updateSizeSelectorUI();
    // 1. Get filter criteria
    const checkedCategories = Array.from(categoryCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => CATEGORY_MAP[cb.value] || cb.value);

    const minPrice = parseFloat(priceInputs[0]?.value) || 0;
    const maxPrice = parseFloat(priceInputs[1]?.value) || Infinity;

    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q");
    
    const checkedBodyShapes = Array.from(document.querySelectorAll('input[name="body_shape"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const checkedBrands = Array.from(document.querySelectorAll('input[name="brand"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase());

    const checkedSpecials = Array.from(document.querySelectorAll('input[name="special"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    let filtered = allProducts.map(p => {
      let score = 0;
      if (qParam) {
        const query = qParam.toLowerCase().trim();
        const tokens = query.split(/\s+/).filter(t => t.length > 0);
        
        if ((p.name || "").toLowerCase().includes(query)) {
          score += 100;
        }
        
        tokens.forEach(token => {
          if ((p.name || "").toLowerCase().includes(token)) score += 15;
          if ((p.description || "").toLowerCase().includes(token)) score += 2;
          if ((p.brand || "").toLowerCase().includes(token)) score += 5;
          
          if ((p.category_name || "").toLowerCase().includes(token)) score += 8;
          if ((p.category_slug || "").toLowerCase().includes(token)) score += 8;
          if (token === "áo" && p.category_slug === "ao") score += 8;
          if (token === "quần" && p.category_slug === "quan") score += 8;
          if (token === "đầm" && p.category_slug === "dam-vay") score += 8;
          if (token === "váy" && p.category_slug === "dam-vay") score += 8;
          if (token === "giày" && p.category_slug === "giay-dep") score += 8;
          if (token === "dép" && p.category_slug === "giay-dep") score += 8;
          if (token === "phụ" && p.category_slug === "phu-kien") score += 8;
          if (token === "kiện" && p.category_slug === "phu-kien") score += 8;
          if (token === "túi" && p.category_slug === "phu-kien") score += 8;
          if (token === "xách" && p.category_slug === "phu-kien") score += 8;

          p.variants?.forEach(v => {
            if ((v.size || "").toLowerCase() === token) score += 5;
            
            const cn = (v.color || "").toLowerCase();
            let colorMatched = false;
            if (token === "trắng" || token === "white") {
              colorMatched = cn.includes("white") || cn.includes("ivory") || cn.includes("cream") || cn.includes("champagne") || cn.includes("sakura white") || cn.includes("off-white");
            } else if (token === "đen" || token === "black") {
              colorMatched = cn.includes("black") || cn.includes("onyx") || cn.includes("charcoal") || cn.includes("slate") || cn.includes("midnight");
            } else if (token === "hồng" || token === "pink") {
              colorMatched = cn.includes("pink") || cn.includes("rose") || cn.includes("blush") || cn.includes("sakura");
            } else if (token === "xanh" || token === "blue" || token === "green") {
              colorMatched = cn.includes("blue") || cn.includes("green") || cn.includes("sage") || cn.includes("mint") || cn.includes("emerald") || cn.includes("slate");
            } else if (token === "vàng" || token === "yellow" || token === "gold") {
              colorMatched = cn.includes("yellow") || cn.includes("gold") || cn.includes("butter");
            } else if (token === "nâu" || token === "brown") {
              colorMatched = cn.includes("brown") || cn.includes("cocoa") || cn.includes("mocha") || cn.includes("coffee") || cn.includes("espresso") || cn.includes("cinnamon");
            } else if (token === "xám" || token === "gray" || token === "grey") {
              colorMatched = cn.includes("gray") || cn.includes("grey") || cn.includes("pewter") || cn.includes("slate") || cn.includes("charcoal");
            } else if (token === "kem" || token === "beige") {
              colorMatched = cn.includes("cream") || cn.includes("beige") || cn.includes("buttercream") || cn.includes("sand") || cn.includes("oat");
            } else if (token === "đỏ" || token === "red") {
              colorMatched = cn.includes("red") || cn.includes("burgundy") || cn.includes("terracotta") || cn.includes("cinnamon");
            } else if (cn.includes(token)) {
              colorMatched = true;
            }
            if (colorMatched) score += 10;
          });
        });
      }
      p.relevanceScore = score;
      return p;
    }).filter(p => {
      // Search query filter based on computed relevanceScore
      if (qParam && p.relevanceScore <= 0) {
        return false;
      }

      // Category Filter
      if (checkedCategories.length > 0) {
        let isCategoryMatch = checkedCategories.includes(p.category_slug);
        
        // Bổ sung fallback cho Set đồ: nếu sản phẩm là combo hoặc tên có chữ "set" (đứng độc lập) thì cũng được tính là Set đồ
        if (!isCategoryMatch && checkedCategories.includes("set-do")) {
          if (p.is_combo || (p.name && /\\bset\\b/i.test(p.name))) {
            isCategoryMatch = true;
          }
        }
        
        if (!isCategoryMatch) return false;
      }

      // Brand Filter
      if (checkedBrands.length > 0) {
        const brandName = (p.brand || "Velura").toLowerCase();
        const matchesBrand = checkedBrands.some(b => brandName.includes(b) || b.includes(brandName));
        if (!matchesBrand) return false;
      }

      // Special Filter
      if (checkedSpecials.length > 0) {
        const matchesSpecial = checkedSpecials.some(spec => {
          if (spec === "featured") return p.is_featured === true;
          if (spec === "combo") return p.is_combo === true;
          if (spec === "on_sale") return p.sale_price && p.base_price > p.sale_price;
          return false;
        });
        if (!matchesSpecial) return false;
      }

      // Price Filter
      const price = p.sale_price || p.base_price;
      if (price < minPrice || price > maxPrice) return false;

      // Color Filter
      if (selectedColor) {
        const selColorKey = selectedColor.toLowerCase();
        const allowedSubstrings = COLOR_MAP[selColorKey] || [selColorKey];
        const hasColor = p.variants?.some(v => {
          const vColor = (v.color || "").toLowerCase();
          return allowedSubstrings.some(sub => vColor.includes(sub));
        });
        if (!hasColor) return false;
      }

      // Size Filter
      if (selectedSize) {
        const hasSize = p.variants?.some(v => v.size?.toLowerCase() === selectedSize.toLowerCase());
        if (!hasSize) return false;
      }

      // Body Shape Filter
      if (checkedBodyShapes.length > 0) {
        const suitable = Array.isArray(p.suitable_body_shapes)
          ? p.suitable_body_shapes.map(s => s.toLowerCase())
          : [];
        const matchesShape = checkedBodyShapes.some(shape => suitable.includes(shape));
        if (!matchesShape) return false;
      }

      return true;
    });

    // Update active category text
    if (activeCategoryEl) {
      if (qParam) {
        activeCategoryEl.textContent = `Kết quả tìm kiếm cho: "${qParam}"`;
      } else {
        const activeLabels = Array.from(categoryCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.closest(".filter-checkbox").querySelector("span")?.textContent.trim() || "");
        activeCategoryEl.textContent = activeLabels.length > 0 ? activeLabels.join(", ") : "Tất cả sản phẩm";
      }
    }

    // Update Price Text
    if (priceRangeText && priceInputs[0] && priceInputs[1]) {
      priceRangeText.textContent = `${formatVND(minPrice)} – ${formatVND(maxPrice)}`;
    }

    // 3. Sort products
    const sortVal = sortSelect?.value || "newest";
    if (qParam && sortVal === "newest") {
      filtered.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      });
    } else if (sortVal === "price-asc") {
      filtered.sort((a, b) => (a.sale_price || a.base_price) - (b.sale_price || b.base_price));
    } else if (sortVal === "price-desc") {
      filtered.sort((a, b) => (b.sale_price || b.base_price) - (a.sale_price || a.base_price));
    } else if (sortVal === "popular") {
      filtered.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
    } else {
      // newest default
      filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    }

    // 4. Paginate and Render
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    renderGrid(paginatedProducts, filtered.length);
    renderPagination(totalPages);
  }

  // Render to DOM
  function renderGrid(products, totalFilteredCount) {
    if (!productGrid) return;

    if (countEl) {
      countEl.innerHTML = `Hiển thị <strong>${totalFilteredCount}</strong> sản phẩm <span class="js-active-category" style="margin-left:4px; font-weight:600;"></span>`;
    }

    if (products.length === 0) {
      const featured = allProducts.filter(p => p.is_featured).slice(0, 4);
      const featuredHtml = featured.map(product => {
        const priceVal = product.sale_price || product.base_price;
        return `
          <div class="card card--product" style="opacity: 0.9;">
            <div class="card__image-container">
              <a href="/src/pages/products/detail.html?id=${product.product_id}">
                <img class="card__img" src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" />
              </a>
            </div>
            <div class="card__info">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="card__title">${product.name}</a>
              <div class="card__price-group">
                <span class="card__price">${formatVND(priceVal)}</span>
              </div>
            </div>
          </div>
        `;
      }).join("");

      productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">
          <p style="margin: 0; font-size: 1.1rem; font-weight: 500; color: var(--text-dark);">Rất tiếc, Velura không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn.</p>
          <button class="btn btn--sm btn--primary js-reset-filters" style="margin-top: 16px;">Đặt lại bộ lọc</button>
          
          ${featured.length > 0 ? `
            <div style="margin-top: 48px; text-align: left;">
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 24px; text-align: center; color: var(--text-dark);">Gợi ý sản phẩm nổi bật dành cho bạn</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
                ${featuredHtml}
              </div>
            </div>
          ` : ""}
        </div>
      `;
      const resetBtn = productGrid.querySelector(".js-reset-filters");
      if (resetBtn) {
        resetBtn.addEventListener("click", resetAllFilters);
      }
      return;
    }

    productGrid.innerHTML = products.map(product => {
      const priceVal = product.sale_price || product.base_price;
      const oldPriceVal = product.sale_price && product.base_price > product.sale_price ? product.base_price : null;

      const discountPercent = oldPriceVal ? Math.round((1 - priceVal / oldPriceVal) * 100) : 0;
      const isOutOfStock = product.status === "out_of_stock";
      
      let badgeHtml = "";
      if (isOutOfStock) {
        badgeHtml = `<span class="card__badge card__badge--out-of-stock" style="background:#555;color:#fff;">HẾT HÀNG</span>`;
      } else if (discountPercent > 0) {
        badgeHtml = `<span class="card__badge card__badge--sale">-${discountPercent}%</span>`;
      } else if (product.is_combo) {
        badgeHtml = `<span class="card__badge card__badge--new" style="background:#4A90E2;color:#fff;">COMBO</span>`;
      } else if ((product.sold_count || 0) > 0) {
        badgeHtml = `<span class="card__badge card__badge--hot">BÁN CHẠY</span>`;
      } else if (product.is_featured) {
        badgeHtml = `<span class="card__badge card__badge--new">NỔI BẬT</span>`;
      }

      // Get unique colors with their hex codes from the variants
      const colorMap = new Map();
      product.variants?.forEach(v => {
        if (v.color && !colorMap.has(v.color)) {
          colorMap.set(v.color, v.color_hex || "#CCCCCC");
        }
      });
      const colorDotsHtml = Array.from(colorMap.entries()).map(([name, hex]) => {
        return `<span class="card__color-dot" style="background-color: ${hex}; border: 1px solid #ddd;" title="${name}"></span>`;
      }).join("");

      const isWishlisted = wishlistedProductIds.has(product.product_id);
      const wishlistClass = isWishlisted ? "active" : "";

      const cardStyle = isOutOfStock ? "opacity: 0.6; filter: grayscale(100%); cursor: not-allowed;" : "";
      const linkTag = isOutOfStock ? "div" : "a";
      const linkHref = isOutOfStock ? "" : `href="/src/pages/products/detail.html?id=${product.product_id}"`;
      const hoverHtml = isOutOfStock ? 
        `<div class="product-card__img-hover" style="cursor: not-allowed;"><span class="btn-detail" style="background:#555; pointer-events:none;">Đã hết hàng</span></div>` :
        `<div class="product-card__img-hover">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-detail">Xem chi tiết</a>
            </div>`;

      return `
        <article class="card card--product" style="${cardStyle}" ${isOutOfStock ? "" : `data-detail-url="/src/pages/products/detail.html?id=${product.product_id}"`}>
          <div class="card__image-container product-card__image-wrapper">
            ${badgeHtml}
            <${linkTag} ${linkHref} class="product-card__img-link">
              <img class="card__img" src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" />
            </${linkTag}>
            ${hoverHtml}
            <button class="card__wishlist-btn js-add-wishlist-catalog ${wishlistClass}" type="button" aria-label="Yêu thích" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="card__info">
            <div class="card__rating">
              <span class="card__rating-star">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="color: #FFD700;">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span>${Number(product.rating_value || 0).toFixed(1)}</span>
              <span>(${product.rating_count || 0})</span>
            </div>
            <${linkTag} ${linkHref} class="card__title">${product.name}</${linkTag}>
            <p class="card__excerpt">${product.description || ""}</p>
            <div class="card__colors">
              ${colorDotsHtml}
            </div>
            <div class="card__price-group">
              <span class="card__price">${formatVND(priceVal)}</span>
              ${oldPriceVal ? `<span class="card__price-old">${formatVND(oldPriceVal)}</span>` : ""}
            </div>
          </div>
          <div class="card__actions">
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-buy">
              <svg class="icon" width="16" height="16" style="fill: none; stroke: currentColor; stroke-width: 2;"><use href="#icon-bag"></use></svg>
              <span>Mua ngay</span>
            </a>
            <button class="card__btn-cart js-add-cart-catalog" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
              <svg class="icon" width="18" height="18" style="fill: none; stroke: currentColor; stroke-width: 2;"><use href="#icon-cart"></use></svg>
            </button>
          </div>
        </article>
      `;
    }).join("");

    bindCardEvents(products);
  }

  // Reset Filters helper
  function resetAllFilters() {
    categoryCheckboxes.forEach(cb => cb.checked = false);
    if (priceInputs[0]) priceInputs[0].value = 0;
    if (priceInputs[1]) priceInputs[1].value = maxProductPrice;
    
    colorOptions.forEach(opt => opt.classList.remove("is-selected"));
    selectedColor = "";
    
    sizeOptions.forEach(opt => opt.classList.remove("is-active"));
    selectedSize = "";

    document.querySelectorAll('input[name="body_shape"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="brand"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="special"]').forEach(cb => cb.checked = false);

    // Clear search param and reset URL
    const url = new URL(window.location.href);
    url.search = "";
    window.history.pushState({}, "", url.toString());

    // Clear search inputs
    const searchInputs = document.querySelectorAll(".js-search-input, .js-search-overlay-input");
    searchInputs.forEach(input => {
      input.value = "";
    });

    // Disable AI suggestions when resetting
    isSuggestionsEnabled = false;
    localStorage.setItem("velura_suggestions_enabled", "false");
    updateFitHelperUI();

    applyFiltersAndSort();
  }

  // Wishlist and Cart Event Listeners
  function bindCardEvents(productsList) {
    const cards = productGrid.querySelectorAll(".card--product[data-detail-url]");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, select, textarea, label")) return;
        window.location.href = card.dataset.detailUrl;
      });
    });

    const wishlistBtns = productGrid.querySelectorAll(".js-add-wishlist-catalog");
    wishlistBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute("data-id");
        const isActive = btn.classList.contains("active");
        const token = localStorage.getItem("velura_token");

        try {
          if (token) {
            if (isActive) {
              await apiRequest(`/api/user/wishlist?product_id=${productId}`, { method: "DELETE" });
              btn.classList.remove("active");
              wishlistedProductIds.delete(productId);
              showToast("Đã xóa khỏi danh sách yêu thích");
            } else {
              await apiRequest("/api/user/wishlist", {
                method: "POST",
                body: { product_id: productId }
              });
              btn.classList.add("active");
              wishlistedProductIds.add(productId);
              showToast("Đã thêm vào danh sách yêu thích!");
            }
            localStorage.setItem("velura_wishlist_count", wishlistedProductIds.size);
          } else {
            let guestIds = [];
            try {
              guestIds = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
            } catch {
              guestIds = [];
            }

            if (isActive) {
              guestIds = guestIds.filter(id => id !== productId);
              btn.classList.remove("active");
              wishlistedProductIds.delete(productId);
              showToast("Đã xóa khỏi danh sách yêu thích");
            } else {
              if (!guestIds.includes(productId)) {
                guestIds.push(productId);
              }
              btn.classList.add("active");
              wishlistedProductIds.add(productId);
              showToast("Đã thêm vào danh sách yêu thích!");
            }
            localStorage.setItem("velura_guest_wishlist", JSON.stringify(guestIds));
          }
          updateWishlistBadge();
        } catch (err) {
          showToast(err.message || "Không thể thực hiện thao tác");
        }
      });
    });

    const cartBtns = productGrid.querySelectorAll(".js-add-cart-catalog");
    cartBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute("data-id");
        const prod = productsList.find(x => x.product_id === productId);
        if (prod && prod.variants && prod.variants.length > 0) {
          const matchedVariant = prod.variants[0];
          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: prod.product_id,
            product_name: prod.name,
            product_image: getVariantImage(prod, matchedVariant.color || "Mặc định"),
            quantity: 1,
            unit_price: prod.sale_price || prod.base_price,
            color: matchedVariant.color || "Mặc định",
            size: matchedVariant.size || "M"
          });
        } else {
          showToast("Sản phẩm không có biến thể sẵn có.");
        }
      });
    });
  }

  // Render Pagination controls dynamically
  function renderPagination(totalPages) {
    const paginationEl = document.querySelector(".pagination");
    if (!paginationEl) return;

    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      paginationEl.style.display = "none";
      return;
    }

    paginationEl.style.display = "flex";
    let html = "";

    // Prev button
    html += `
      <button class="pagination__btn ${currentPage === 1 ? 'pagination__btn--disabled' : ''}" type="button" aria-label="Trang trước" data-page="prev">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        html += `<button class="pagination__btn ${currentPage === i ? 'pagination__btn--active' : ''}" type="button" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += `<span class="pagination__dots" style="padding: 8px 12px; color: var(--soft);">...</span>`;
      }
    }

    // Next button
    html += `
      <button class="pagination__btn ${currentPage === totalPages ? 'pagination__btn--disabled' : ''}" type="button" aria-label="Trang sau" data-page="next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    `;

    paginationEl.innerHTML = html;

    // Bind events
    const buttons = paginationEl.querySelectorAll(".pagination__btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("pagination__btn--disabled") || btn.classList.contains("pagination__btn--active")) {
          return;
        }

        const target = btn.getAttribute("data-page");
        if (target === "prev") {
          currentPage = Math.max(1, currentPage - 1);
        } else if (target === "next") {
          currentPage = Math.min(totalPages, currentPage + 1);
        } else {
          currentPage = parseInt(target, 10);
        }

        // Scroll to top of catalog smoothly
        const targetScroll = document.querySelector(".product-list-layout") || window;
        targetScroll.scrollIntoView({ behavior: "smooth" });

        applyFiltersAndSort(false);
      });
    });
  }

  // Set up listeners for filters
  categoryCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      // Clear search query param 'q' from URL on category change
      const url = new URL(window.location.href);
      if (url.searchParams.has("q")) {
        url.searchParams.delete("q");
        window.history.pushState({}, "", url.toString());
        
        // Clear search inputs
        const searchInputs = document.querySelectorAll(".js-search-input, .js-search-overlay-input");
        searchInputs.forEach(input => {
          input.value = "";
        });
      }
      applyFiltersAndSort();
    });
  });

  priceInputs.forEach(input => {
    input.addEventListener("input", applyFiltersAndSort);
  });

  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      const isSelected = opt.classList.contains("is-selected");
      colorOptions.forEach(o => o.classList.remove("is-selected"));
      
      if (isSelected) {
        selectedColor = "";
      } else {
        opt.classList.add("is-selected");
        selectedColor = opt.getAttribute("title") || "";
      }
      applyFiltersAndSort();
    });
  });

  bindSizeOptionListeners();

  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndSort);
  }

  // Start Loading
  loadProducts();

  /* 2. Grid Layout view switches (kept from static template logic) */
  const btnViewGrid = document.querySelector(".js-view-grid");
  const btnViewLarge = document.querySelector(".js-view-large");
  const btnViewList = document.querySelector(".js-view-list");

  if (productGrid) {
    const changeView = (gridClass, cardClass) => {
      productGrid.classList.remove("product-grid--list", "product-grid--large-view");
      if (gridClass) productGrid.classList.add(gridClass);
      
      const cards = productGrid.querySelectorAll(".card--product");
      cards.forEach(card => {
        card.classList.remove("card--list-view", "product-card--large");
        if (cardClass) card.classList.add(cardClass);
      });
    };

    if (btnViewGrid) {
      btnViewGrid.addEventListener("click", () => {
        changeView(null, null);
        btnViewLarge?.classList.remove("active");
        btnViewList?.classList.remove("active");
        btnViewGrid.classList.add("active");
      });
    }

    if (btnViewLarge) {
      btnViewLarge.addEventListener("click", () => {
        changeView("product-grid--large-view", "product-card--large");
        btnViewGrid?.classList.remove("active");
        btnViewList?.classList.remove("active");
        btnViewLarge.classList.add("active");
      });
    }

    if (btnViewList) {
      btnViewList.addEventListener("click", () => {
        changeView("product-grid--list", "card--list-view");
        btnViewGrid?.classList.remove("active");
        btnViewLarge?.classList.remove("active");
        btnViewList.classList.add("active");
      });
    }
  }
}
