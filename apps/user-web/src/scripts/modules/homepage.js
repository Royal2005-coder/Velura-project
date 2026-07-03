import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { addToCart } from "./cart.js";

/**
 * ES6 Module: Homepage Controller
 * Fetches and binds category list and featured products dynamically from the Supabase backend.
 */
export function initHomepage() {
  const isHomepage = document.querySelector(".categories-section") || document.querySelector(".products-section");
  if (!isHomepage) return;

  const categoriesGrid = document.querySelector(".categories-section__grid");
  const productsGrid = document.querySelector(".products-section__grid");

  // Load Homepage Data
  async function loadData() {
    try {
      // 1. Fetch categories
      if (categoriesGrid) {
        categoriesGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--soft);">Đang tải danh mục...</div>`;
        const categories = await apiRequest("/api/user/categories");
        renderCategories(categories);
      }

      // 2. Fetch featured products
      if (productsGrid) {
        productsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--soft);">Đang tải sản phẩm nổi bật...</div>`;
        let products = await apiRequest("/api/user/products");
        // Filter out test/mock products
        products = products.filter(p => {
          const nameLower = (p.name || "").toLowerCase();
          return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
        });
        // Limit to 8 products for the homepage section
        const featuredProducts = products.filter(p => p.is_featured).slice(0, 8);
        // If not enough featured, just take the first 8 products
        const productsToRender = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);
        renderProducts(productsToRender);
      }

      // 3. Fetch personalized products based on Style Profile body shape
      const personalizedSection = document.querySelector("#personalized-recommendations");
      const personalizedGrid = document.querySelector(".js-personalized-grid");
      const personalizedSubtitle = document.querySelector(".js-personalized-subtitle");
      
      if (personalizedSection && personalizedGrid) {
        try {
          const profileRes = await apiRequest("/api/user/style-quiz");
          if (profileRes && profileRes.profile) {
            const bodyShape = profileRes.profile.body_shape;
            if (bodyShape) {
              let allProds = await apiRequest("/api/user/products");
              allProds = allProds.filter(p => {
                const nameLower = (p.name || "").toLowerCase();
                return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
              });
              
              const matchedProds = allProds.filter(p => {
                const suitable = Array.isArray(p.suitable_body_shapes)
                  ? p.suitable_body_shapes.map(s => s.toLowerCase())
                  : [];
                return suitable.includes(bodyShape.toLowerCase());
              }).slice(0, 4);

              if (matchedProds.length > 0) {
                const shapeMap = {
                  "Hourglass": "Đồng hồ cát", "Pear": "Quả lê", "Apple": "Quả táo", 
                  "Rectangle": "Chữ nhật", "Inverted Triangle": "Tam giác ngược"
                };
                if (personalizedSubtitle) {
                  personalizedSubtitle.textContent = `Các thiết kế được gợi ý riêng cho dáng người ${shapeMap[bodyShape] || bodyShape}`;
                }
                
                renderPersonalizedProducts(matchedProds, personalizedGrid);
                personalizedSection.style.display = "block";
              }
            }
          }
        } catch (quizErr) {
          // Guest or no style profile, hide section (already hidden)
        }
      }
    } catch (err) {
      console.error("Failed to load homepage data:", err);
    }
  }

  // Render categories with custom icons
  function renderCategories(categories) {
    if (!categoriesGrid) return;

    const iconMap = {
      ao: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.6 5.8l-3.2-1C14.7 6.1 13.5 7 12 7S9.3 6.1 8.6 4.8l-3.2 1c-.8.2-1.4 1-1.4 1.8v3.6c0 .8.6 1.4 1.4 1.4h1.7V20c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V12.6h1.7c.8 0 1.4-.6 1.4-1.4V7.6c-.1-.8-.7-1.6-1.5-1.8z" />
        </svg>
      `,
      quan: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2v20h4V10h4v12h4V2H6z" />
        </svg>
      `,
      "dam-vay": `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L4 22h16L12 2z M8 12h8" />
        </svg>
      `,
      "ao-khoac": `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 5.5L12 2 3.5 5.5V11c0 5.5 8.5 11 8.5 11s8.5-5.5 8.5-11V5.5z" />
        </svg>
      `,
      "set-do": `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z M2 8h20v4H2z M5 12h14v8H5z" />
        </svg>
      `,
      "phu-kien": `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="7" />
          <polyline points="12 9 12 12 14 12" />
        </svg>
      `,
      "giay-dep": `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 18l3-3h12l3 3H3z M4 11h16v4H4z" />
        </svg>
      `
    };

    categoriesGrid.innerHTML = categories.map(c => {
      const iconHtml = iconMap[c.slug] || `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      `;

      return `
        <a href="/src/pages/products/list.html?category=${c.slug}" class="category-card">
          <div class="category-card__icon">
            ${iconHtml}
          </div>
          <span class="category-card__name">${c.name}</span>
          <span class="category-card__count">${c.product_count || 0} sản phẩm</span>
        </a>
      `;
    }).join("");
  }

  // Render featured products
  function renderProducts(products) {
    if (!productsGrid) return;

    const formatVND = (value) => {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    productsGrid.innerHTML = products.map(product => {
      const priceVal = product.sale_price || product.base_price;
      const oldPriceVal = product.sale_price && product.base_price > product.sale_price ? product.base_price : null;

      const discountPercent = oldPriceVal ? Math.round((1 - priceVal / oldPriceVal) * 100) : 0;
      const badgeHtml = discountPercent > 0
        ? `<span class="product-card__badge product-card__badge--sale">-${discountPercent}%</span>`
        : (product.is_featured ? `<span class="product-card__badge product-card__badge--best">HOT</span>` : "");

      return `
        <article class="product-card">
          <div class="product-card__img-wrapper">
            ${badgeHtml}
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__img-link">
              <img src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" class="product-card__img" />
            </a>
            <button class="btn-icon product-card__btn-wishlist card__wishlist-btn js-add-wishlist-home" type="button" title="Thêm vào Wishlist" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <div class="product-card__img-hover">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-detail">Xem chi tiết</a>
            </div>
          </div>

          <div class="product-card__info">
            <div class="product-card__rating">
              <span class="product-card__rating-star">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color: #FFD700;">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span>4.8</span>
              <span>(96)</span>
            </div>
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__title-link">
              <h3 class="product-card__title">${product.name}</h3>
            </a>
            <div class="product-card__price-row">
              <span class="product-card__price">${formatVND(priceVal)}</span>
              ${oldPriceVal ? `<span class="product-card__price-old">${formatVND(oldPriceVal)}</span>` : ""}
            </div>
          </div>

          <div class="product-card__actions">
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-buy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Mua ngay
            </a>
            <button class="product-card__btn-cart js-add-cart-home" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join("");

    bindHomeEvents(products);
  }

  // Bind cart/wishlist click events
  function bindHomeEvents(products) {
    const wishlistBtns = productsGrid.querySelectorAll(".js-add-wishlist-home");
    wishlistBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const productId = btn.getAttribute("data-id");
        try {
          await apiRequest("/api/user/wishlist", {
            method: "POST",
            body: { product_id: productId }
          });
          btn.classList.add("active");
          showToast("Đã thêm vào danh sách yêu thích!");
        } catch (err) {
          if (err.status === 401) {
            showToast("Vui lòng đăng nhập để lưu sản phẩm!");
          } else {
            showToast(err.message || "Không thể lưu sản phẩm");
          }
        }
      });
    });

    const cartBtns = productsGrid.querySelectorAll(".js-add-cart-home");
    cartBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = btn.getAttribute("data-id");
        const prod = products.find(x => x.product_id === productId);
        if (prod && prod.variants && prod.variants.length > 0) {
          const matchedVariant = prod.variants[0]; // Pick first variant as default
          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: prod.product_id,
            product_name: prod.name,
            product_image: prod.images?.[0] || "",
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

  // Render personalized body shape recommendations
  function renderPersonalizedProducts(products, gridEl) {
    const formatVND = (value) => {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    gridEl.innerHTML = products.map(product => {
      const priceVal = product.sale_price || product.base_price;
      const oldPriceVal = product.sale_price && product.base_price > product.sale_price ? product.base_price : null;

      const discountPercent = oldPriceVal ? Math.round((1 - priceVal / oldPriceVal) * 100) : 0;
      const badgeHtml = discountPercent > 0
        ? `<span class="product-card__badge product-card__badge--sale">-${discountPercent}%</span>`
        : (product.is_featured ? `<span class="product-card__badge product-card__badge--best">HOT</span>` : "");

      return `
        <article class="product-card">
          <div class="product-card__img-wrapper">
            ${badgeHtml}
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__img-link">
              <img src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" class="product-card__img" />
            </a>
            <button class="btn-icon product-card__btn-wishlist card__wishlist-btn js-add-wishlist-personalized" type="button" title="Thêm vào Wishlist" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <div class="product-card__img-hover">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-detail">Xem chi tiết</a>
            </div>
          </div>

          <div class="product-card__info">
            <div class="product-card__rating">
              <span class="product-card__rating-star">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color: #FFD700;">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span>4.8</span>
              <span>(96)</span>
            </div>
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__title-link">
              <h3 class="product-card__title">${product.name}</h3>
            </a>
            <div class="product-card__price-row">
              <span class="product-card__price">${formatVND(priceVal)}</span>
              ${oldPriceVal ? `<span class="product-card__price-old">${formatVND(oldPriceVal)}</span>` : ""}
            </div>
          </div>

          <div class="product-card__actions">
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-buy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Mua ngay
            </a>
            <button class="product-card__btn-cart js-add-cart-personalized" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Bind events
    const wishlistBtns = gridEl.querySelectorAll(".js-add-wishlist-personalized");
    wishlistBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const productId = btn.getAttribute("data-id");
        try {
          await apiRequest("/api/user/wishlist", {
            method: "POST",
            body: { product_id: productId }
          });
          btn.classList.add("active");
          showToast("Đã thêm vào danh sách yêu thích!");
        } catch (err) {
          if (err.status === 401) {
            showToast("Vui lòng đăng nhập để lưu sản phẩm!");
          } else {
            showToast(err.message || "Không thể lưu sản phẩm");
          }
        }
      });
    });

    const cartBtns = gridEl.querySelectorAll(".js-add-cart-personalized");
    cartBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = btn.getAttribute("data-id");
        const prod = products.find(x => x.product_id === productId);
        if (prod && prod.variants && prod.variants.length > 0) {
          const matchedVariant = prod.variants[0];
          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: prod.product_id,
            product_name: prod.name,
            product_image: prod.images?.[0] || "",
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

  loadData();
}
