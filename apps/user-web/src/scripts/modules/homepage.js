import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { addToCart } from "./cart.js";
import { updateWishlistBadge } from "./wishlist.js";

/**
 * ES6 Module: Homepage Controller
 * Fetches and binds category list and featured products dynamically from the Supabase backend.
 */
export function initHomepage() {
  const isHomepage = document.querySelector(".categories-section") || document.querySelector(".products-section");
  if (!isHomepage) return;

  const categoriesGrid = document.querySelector(".categories-section__grid");
  const productsGrid = document.querySelector(".products-section__grid");

  // State
  let wishlistedProductIds = new Set();

  // Load Homepage Data
  async function loadData() {
    // Fetch user wishlist first to set up active classes
    const token = localStorage.getItem("velura_token");
    if (token) {
      try {
        const wishlistData = await apiRequest("/api/user/wishlist");
        const items = wishlistData.items || [];
        wishlistedProductIds = new Set(items.map(item => item.product_id));
        localStorage.setItem("velura_wishlist_count", wishlistedProductIds.size);
        updateWishlistBadge();
      } catch (wishlistErr) {
        console.error("Failed to load wishlist for homepage:", wishlistErr);
      }
    } else {
      try {
        const guestIds = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
        wishlistedProductIds = new Set(guestIds);
        updateWishlistBadge();
      } catch (guestErr) {
        wishlistedProductIds = new Set();
      }
    }

    try {
      // 1. Fetch categories
      if (categoriesGrid) {
        categoriesGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--soft);">Đang tải danh mục...</div>`;
        const categories = await apiRequest("/api/user/categories");
        renderCategories(categories);
      }

      // Fetch products once to be shared across widgets
      let products = [];
      try {
        products = await apiRequest("/api/user/products");
        products = products.filter(p => {
          const nameLower = (p.name || "").toLowerCase();
          return !nameLower.includes("test") && !nameLower.includes("validation") && !nameLower.includes("commit");
        });
      } catch (prodErr) {
        console.error("Failed to fetch products for homepage:", prodErr);
      }

        // Get featured products that have sales, sorted by sold_count DESC
        const activeFeatured = products
          .filter(p => p.is_featured && (p.sold_count || 0) > 0)
          .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
        
        // Get featured products that do not have sales yet
        const quietFeatured = products
          .filter(p => p.is_featured && (p.sold_count || 0) === 0);

        // Combine both lists and take the top 8 (best-selling will always appear first)
        const productsToRender = [...activeFeatured, ...quietFeatured].slice(0, 8);
        renderProducts(productsToRender);

      // 3. Fetch personalized products based on Style Profile body shape
      const personalizedSection = document.querySelector("#personalized-recommendations");
      const personalizedGrid = document.querySelector(".js-personalized-grid");
      const personalizedSubtitle = document.querySelector(".js-personalized-subtitle");
      
      if (personalizedSection && personalizedGrid && products.length > 0) {
        try {
          const profileRes = await apiRequest("/api/user/style-quiz");
          if (profileRes && profileRes.profile) {
            const bodyShape = profileRes.profile.body_shape;
            if (bodyShape) {
              const matchedProds = products.filter(p => {
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

      // 4. Render special collections
      const collectionsGrid = document.querySelector(".collections-section__grid");
      if (collectionsGrid && products.length > 0) {
        const uniqueColNames = [...new Set(products.map(p => p.collection).filter(Boolean))];
        renderSpecialCollections(uniqueColNames);
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
      let badgeHtml = "";
      if (discountPercent > 0) {
        badgeHtml = `<span class="product-card__badge product-card__badge--sale">-${discountPercent}%</span>`;
      } else if (product.is_combo) {
        badgeHtml = `<span class="product-card__badge product-card__badge--new" style="background:#4A90E2;color:#fff;">COMBO</span>`;
      } else if ((product.sold_count || 0) > 0) {
        badgeHtml = `<span class="product-card__badge product-card__badge--best">BÁN CHẠY</span>`;
      } else if (product.is_featured) {
        badgeHtml = `<span class="product-card__badge product-card__badge--hot">NỔI BẬT</span>`;
      }

      const isWishlisted = wishlistedProductIds.has(product.product_id);
      const wishlistClass = isWishlisted ? "active" : "";

      return `
        <article class="product-card" data-detail-url="/src/pages/products/detail.html?id=${product.product_id}">
          <div class="product-card__img-wrapper">
            ${badgeHtml}
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__img-link">
              <img src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" class="product-card__img" />
            </a>
            <div class="product-card__img-hover">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-detail">Xem chi tiết</a>
            </div>
            <button class="btn-icon product-card__btn-wishlist card__wishlist-btn js-add-wishlist-home ${wishlistClass}" type="button" title="Thêm vào Wishlist" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
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
              Mua hàng
            </a>
            <button class="product-card__btn-cart js-add-cart-home" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
              Thêm vào giỏ hàng
            </button>
          </div>
        </article>
      `;
    }).join("");

    bindHomeEvents(products);
  }

  // Bind cart/wishlist click events
  function bindHomeEvents(products) {
    bindProductCardNavigation(productsGrid);

    const wishlistBtns = productsGrid.querySelectorAll(".js-add-wishlist-home");
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
          showToast(err.message || "Không thể lưu sản phẩm");
        }
      });
    });

    const cartBtns = productsGrid.querySelectorAll(".js-add-cart-home");
    cartBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
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
      let badgeHtml = "";
      if (discountPercent > 0) {
        badgeHtml = `<span class="product-card__badge product-card__badge--sale">-${discountPercent}%</span>`;
      } else if (product.is_combo) {
        badgeHtml = `<span class="product-card__badge product-card__badge--new" style="background:#4A90E2;color:#fff;">COMBO</span>`;
      } else if ((product.sold_count || 0) > 0) {
        badgeHtml = `<span class="product-card__badge product-card__badge--best">BÁN CHẠY</span>`;
      } else if (product.is_featured) {
        badgeHtml = `<span class="product-card__badge product-card__badge--hot">NỔI BẬT</span>`;
      }

      const isWishlisted = wishlistedProductIds.has(product.product_id);
      const wishlistClass = isWishlisted ? "active" : "";

      return `
        <article class="product-card" data-detail-url="/src/pages/products/detail.html?id=${product.product_id}">
          <div class="product-card__img-wrapper">
            ${badgeHtml}
            <a href="/src/pages/products/detail.html?id=${product.product_id}" class="product-card__img-link">
              <img src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" class="product-card__img" />
            </a>
            <div class="product-card__img-hover">
              <a href="/src/pages/products/detail.html?id=${product.product_id}" class="btn-detail">Xem chi tiết</a>
            </div>
            <button class="btn-icon product-card__btn-wishlist card__wishlist-btn js-add-wishlist-personalized ${wishlistClass}" type="button" title="Thêm vào Wishlist" data-id="${product.product_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
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
              Mua hàng
            </a>
            <button class="product-card__btn-cart js-add-cart-personalized" type="button" title="Thêm vào giỏ hàng" data-id="${product.product_id}">
              Thêm vào giỏ hàng
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Bind events
    bindProductCardNavigation(gridEl);

    const wishlistBtns = gridEl.querySelectorAll(".js-add-wishlist-personalized");
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
          showToast(err.message || "Không thể lưu sản phẩm");
        }
      });
    });

    const cartBtns = gridEl.querySelectorAll(".js-add-cart-personalized");
    cartBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
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

  function bindProductCardNavigation(root) {
    if (!root) return;
    const cards = root.querySelectorAll(".product-card[data-detail-url]");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, select, textarea, label")) return;
        window.location.href = card.dataset.detailUrl;
      });
    });
  }

  // Render special collections dynamically
  function renderSpecialCollections(uniqueColNames) {
    const collectionsGrid = document.querySelector(".collections-section__grid");
    if (!collectionsGrid) return;

    const COLLECTION_META = {
      'Soft Ceremony': {
        id: 'soft-ceremony',
        vnName: 'Nghi lễ Dịu dàng',
        badge: 'ELEGANT',
        story: 'Những thiết kế mang phom dáng bất đối xứng tôn eo, gam màu thanh nhã mang đến vẻ ngoài sang trọng.',
        banner: '/src/assets/images/collection-1.png'
      },
      'The Urban Rhythm': {
        id: 'the-urban-rhythm',
        vnName: 'Nhịp điệu Đô thị',
        badge: 'CASUAL',
        story: 'Tập trung vào sự linh hoạt giữa phong cách công sở và dạo phố hiện đại. Chất liệu linen tự nhiên kết hợp lụa mềm mại.',
        banner: '/src/assets/images/collection-2.png'
      },
      'Modern Academia': {
        id: 'modern-academia',
        vnName: 'Học viện Hiện đại',
        badge: 'PREPPY',
        story: 'Cảm hứng từ phong cách Preppy học đường pha chút phá cách hiện đại, sử dụng các gam màu ấm và họa tiết kẻ thanh lịch.',
        banner: '/src/assets/images/image-4.png'
      },
      'Weekend Escape': {
        id: 'weekend-escape',
        vnName: 'Trốn chạy Cuối tuần',
        badge: 'TRAVEL',
        story: 'Bộ sưu tập của những chuyến đi ngẫu hứng đầy nắng và gió. Các chất liệu Linen mộc mạc và Silk mát mẻ.',
        banner: '/src/assets/images/about_01.jpg'
      },
      'Midnight Mirage': {
        id: 'midnight-mirage',
        vnName: 'Ảo ảnh Nửa đêm',
        badge: 'PARTY',
        story: 'Sự đan xen quyến rũ của các đường khoét vai tinh tế, chất liệu len dệt kim móc (crochet) cá tính.',
        banner: '/src/assets/images/image-5.png'
      },
      'The Afterglow': {
        id: 'the-afterglow',
        vnName: 'Rực rỡ Hoàng hôn',
        badge: 'COUTURE',
        story: 'Dòng sản phẩm dạ hội cao cấp nhất của Velura. Phom dáng đầm xòe phồng, đầm đuôi cá kết hợp kỹ thuật xếp nếp.',
        banner: '/src/assets/images/about_03.jpg'
      }
    };

    const getMeta = (name) => {
      return COLLECTION_META[name] || {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        vnName: name,
        badge: 'NEW',
        story: `Khám phá các thiết kế mới nhất nằm trong bộ sưu tập ${name} của Velura.`,
        banner: '/src/assets/images/about_02.jpg'
      };
    };

    if (uniqueColNames.length === 0) {
      collectionsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--soft);">Hiện chưa có bộ sưu tập nào hoạt động.</div>`;
      return;
    }

    collectionsGrid.innerHTML = uniqueColNames.map(colName => {
      const meta = getMeta(colName);
      return `
        <a href="/src/pages/collections.html?id=${meta.id}" class="collection-card" data-bind="collection.detail_url">
          <img src="${meta.banner}" alt="${meta.vnName}" class="collection-card__image" data-bind="collection.image_url" />
          <div class="collection-card__overlay"></div>
          <div class="collection-card__content">
            <span class="collection-card__badge" data-bind="collection.badge">${meta.badge}</span>
            <h3 class="collection-card__title" data-bind="collection.name">${meta.vnName}</h3>
            <p class="collection-card__desc" data-bind="collection.short_description">${meta.story}</p>
            <span class="collection-card__btn">Xem chi tiết &rarr;</span>
          </div>
        </a>
      `;
    }).join("");
  }

  loadData();
}
