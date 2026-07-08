import { apiRequest } from "./api.js";
import { showToast, addToCart } from "./cart.js";

/**
 * ES6 Module: Product Detail Page Options Controller
 * Binds product details dynamically from API database and manages option selection
 */
export async function initOptions() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Elements
  const titleEl = document.querySelector(".product-info__title");
  const priceCurrentEl = document.querySelector(".price-current");
  const priceOldEl = document.querySelector(".price-old");
  const descEl = document.querySelector("#panel-desc");
  const mainImgEl = document.querySelector(".js-gallery-main");
  const thumbsContainer = document.querySelector(".gallery-thumbs");
  const colorListEl = document.querySelector(".option-color .product-option__list");
  const sizeListEl = document.querySelector(".option-size .product-option__list");
  const colorNameLabel = document.querySelector(".js-color-name");
  const sizeNameLabel = document.querySelector(".js-size-name");
  const stockBadgeEl = document.querySelector(".product-badge--stock");

  let styleProfile = null;
  let predictedSize = "";
  try {
    const profileRes = await apiRequest("/api/user/style-quiz");
    if (profileRes && profileRes.profile) {
      styleProfile = profileRes.profile;
      const { chest_cm, waist_cm, hip_cm, weight_kg } = styleProfile;
      if (chest_cm || waist_cm || hip_cm || weight_kg) {
        if (chest_cm <= 80 && waist_cm <= 64 && hip_cm <= 86 && (weight_kg || 0) <= 45) {
          predictedSize = "XS";
        } else if (chest_cm <= 84 && waist_cm <= 68 && hip_cm <= 90 && (weight_kg || 0) <= 50) {
          predictedSize = "S";
        } else if (chest_cm <= 88 && waist_cm <= 72 && hip_cm <= 94 && (weight_kg || 0) <= 55) {
          predictedSize = "M";
        } else if (chest_cm <= 92 && waist_cm <= 76 && hip_cm <= 98 && (weight_kg || 0) <= 60) {
          predictedSize = "L";
        } else {
          predictedSize = "XL";
        }
      }
    }
  } catch (quizErr) {
    // Guest or no style profile
  }

  if (productId && titleEl) {
    try {
      const product = await apiRequest(`/api/user/products/${productId}`);
      
      // Bind basic info
      titleEl.textContent = product.name;
      
      const formatVND = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
      priceCurrentEl.textContent = formatVND(product.sale_price || product.base_price);
      if (product.sale_price && product.base_price > product.sale_price) {
        priceOldEl.textContent = formatVND(product.base_price);
        priceOldEl.style.display = "";
      } else {
        priceOldEl.style.display = "none";
      }

      if (descEl) {
        let detailsHtml = `
          <p>${product.description || ""}</p>
          <ul style="margin-top: 16px; padding-left: 20px; list-style: disc; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px;">
            <li><strong>Mã sản phẩm (SKU):</strong> ${product.sku || ""}</li>
            <li><strong>Xuất xứ:</strong> Velura Atelier</li>
        `;
        if (product.brand) {
          detailsHtml += `<li><strong>Thương hiệu:</strong> ${product.brand}</li>`;
        }
        if (product.collection) {
          detailsHtml += `<li><strong>Bộ sưu tập:</strong> ${product.collection}</li>`;
        }
        if (product.color_tone) {
          const toneMap = { "Warm": "Ấm áp", "Cool": "Mát mẻ", "Neutral": "Trung tính" };
          detailsHtml += `<li><strong>Tông màu khuyên dùng:</strong> Tông da ${toneMap[product.color_tone] || product.color_tone}</li>`;
        }
        if (product.style_tags && product.style_tags.length > 0) {
          detailsHtml += `<li><strong>Phong cách:</strong> ${product.style_tags.join(", ")}</li>`;
        }
        if (product.occasions && product.occasions.length > 0) {
          const occasionMap = {
            "Party": "Dự tiệc", "Casual": "Thường ngày", "Office": "Công sở",
            "Travel": "Du lịch", "Wedding": "Đám cưới", "School": "Đi học"
          };
          const translatedOccasions = product.occasions.map(o => occasionMap[o] || o);
          detailsHtml += `<li><strong>Dịp phù hợp:</strong> ${translatedOccasions.join(", ")}</li>`;
        }
        if (product.suitable_body_shapes && product.suitable_body_shapes.length > 0) {
          const shapeMap = {
            "Hourglass": "Dáng đồng hồ cát",
            "Pear": "Dáng quả lê",
            "Apple": "Dáng quả táo",
            "Rectangle": "Dáng chữ nhật",
            "Inverted Triangle": "Dáng tam giác ngược"
          };
          const translatedShapes = product.suitable_body_shapes.map(s => shapeMap[s] || s);
          detailsHtml += `<li><strong>Dáng người phù hợp:</strong> ${translatedShapes.join(", ")}</li>`;
        }
        detailsHtml += `</ul>`;
        descEl.innerHTML = detailsHtml;
      }

      // Bind dynamic badges
      const badgeGroupEl = document.querySelector(".product-info__badge-group");
      let activeStockBadgeEl = stockBadgeEl;
      if (badgeGroupEl) {
        let badgesHtml = "";
        if (product.sale_price && product.base_price > product.sale_price) {
          const discountPct = Math.round(((product.base_price - product.sale_price) / product.base_price) * 100);
          if (discountPct > 0) {
            badgesHtml += `<span class="product-badge product-badge--sale" style="background: #E05A47; color: #fff; text-transform: uppercase;">-${discountPct}%</span>`;
          }
        }
        if (product.is_featured) {
          badgesHtml += `<span class="product-badge product-badge--hot">Bán chạy</span>`;
        }
        if (product.is_combo) {
          badgesHtml += `<span class="product-badge product-badge--combo" style="background: #4A90E2; color: #fff; text-transform: uppercase;">Combo Set</span>`;
        }
        badgesHtml += `<span class="product-badge product-badge--stock js-stock-badge">Đang cập nhật...</span>`;
        badgeGroupEl.innerHTML = badgesHtml;
        activeStockBadgeEl = badgeGroupEl.querySelector(".js-stock-badge");
      }

      // Bind dynamic Fit Helper Box
      const fitHelperEl = document.querySelector(".product-fit-helper");
      if (fitHelperEl) {
        let fitText = "";
        const shapeMap = {
          "Hourglass": "Đồng hồ cát", "Pear": "Quả lê", "Apple": "Quả táo", 
          "Rectangle": "Thước kẻ/Chữ nhật", "Inverted Triangle": "Tam giác ngược"
        };
        const toneMap = { "Warm": "Warm (Ấm)", "Cool": "Cool (Lạnh)", "Neutral": "Neutral (Trung tính)" };
        const shapes = (product.suitable_body_shapes || []).map(s => shapeMap[s] || s);
        const tone = toneMap[product.color_tone] || product.color_tone;
        
        let recommendationText = "";
        if (predictedSize) {
          recommendationText = `<div style="font-weight: 700; color: #8A6D3B; margin-top: 4px;">Gợi ý kích cỡ: Size ${predictedSize} vừa vặn nhất với bạn dựa trên Style Profile.</div>`;
        } else {
          recommendationText = `<div style="margin-top: 4px;"><a href="/src/pages/ai/style-quiz.html" class="btn btn--sm btn--primary" style="text-decoration:none; padding: 4px 8px; font-size:0.75rem; border-radius: 4px; display:inline-block;">Làm Style Quiz để nhận gợi ý size chính xác</a></div>`;
        }

        if (shapes.length > 0 && tone) {
          fitText = `Dành cho dáng người ${shapes.join(", ")} & tông da ${tone}`;
        } else if (shapes.length > 0) {
          fitText = `Phù hợp nhất với dáng người ${shapes.join(", ")}`;
        } else if (tone) {
          fitText = `Tối ưu cho tông da ${tone}`;
        } else {
          fitText = `Thiết kế chuẩn phom tôn dáng tôn da từ Velura`;
        }
        
        fitHelperEl.innerHTML = `
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" style="margin-top: 2px; flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v4l3 3"></path>
            </svg>
            <div>
              <span>${fitText}</span>
              ${recommendationText}
            </div>
          </div>
        `;
      }

      // Bind Gallery
      const images = product.images || [];
      let currentImgIndex = 0;

      const setActiveImage = (index) => {
        if (index < 0 || index >= images.length) return;
        currentImgIndex = index;

        // Transition main image opacity
        if (mainImgEl) {
          mainImgEl.style.opacity = "0.2";
          setTimeout(() => {
            mainImgEl.src = images[currentImgIndex];
            mainImgEl.style.opacity = "1";
          }, 150);
        }

        // Update active class on thumbnails
        if (thumbsContainer) {
          const thumbs = thumbsContainer.querySelectorAll(".js-gallery-thumb");
          thumbs.forEach((t, idx) => {
            t.classList.toggle("active", idx === currentImgIndex);
          });
        }
      };

      if (images.length > 0) {
        if (mainImgEl) {
          mainImgEl.src = images[0];
          mainImgEl.alt = product.name;
        }

        const prevBtn = document.querySelector(".js-gallery-prev");
        const nextBtn = document.querySelector(".js-gallery-next");

        if (images.length > 1) {
          if (prevBtn) prevBtn.style.display = "flex";
          if (nextBtn) nextBtn.style.display = "flex";
        } else {
          if (prevBtn) prevBtn.style.display = "none";
          if (nextBtn) nextBtn.style.display = "none";
        }

        if (thumbsContainer) {
          thumbsContainer.innerHTML = images.map((img, idx) => `
            <button type="button" class="gallery-thumbs__btn ${idx === 0 ? 'active' : ''} js-gallery-thumb" data-src="${img}" aria-label="Hình ảnh thu nhỏ ${idx + 1}">
              <img src="${img}" alt="Thu nhỏ ${idx + 1}" />
            </button>
          `).join("");

          // Re-bind thumbnail click handler
          const thumbs = thumbsContainer.querySelectorAll(".js-gallery-thumb");
          thumbs.forEach((thumb, idx) => {
            thumb.addEventListener("click", () => {
              setActiveImage(idx);
            });
          });
        }

        // Bind next/prev buttons click
        if (prevBtn) {
          prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            let newIdx = currentImgIndex - 1;
            if (newIdx < 0) newIdx = images.length - 1;
            setActiveImage(newIdx);
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            let newIdx = currentImgIndex + 1;
            if (newIdx >= images.length) newIdx = 0;
            setActiveImage(newIdx);
          });
        }
      } else {
        if (mainImgEl) {
          mainImgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect><circle cx='8.5' cy='8.5' r='1.5'></circle><polyline points='21 15 16 10 5 21'></polyline></svg>";
          mainImgEl.alt = "Chưa có hình ảnh";
        }
        const prevBtn = document.querySelector(".js-gallery-prev");
        const nextBtn = document.querySelector(".js-gallery-next");
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
      }

      // Bind Variants (Colors & Sizes)
      const variants = product.variants || [];
      const colorMap = new Map();
      variants.forEach(v => {
        if (v.color && !colorMap.has(v.color)) {
          colorMap.set(v.color, v.color_hex || "#CCCCCC");
        }
      });
      const uniqueColors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
      const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

      if (colorListEl) {
        colorListEl.innerHTML = uniqueColors.map((col, idx) => {
          return `
            <button type="button" class="color-btn js-color-btn ${idx === 0 ? 'is-selected' : ''}" data-color="${col.name}" style="background: ${col.hex}; border: 1px solid #ddd;" title="${col.name}"></button>
          `;
        }).join("");

        if (colorNameLabel && uniqueColors[0]) {
          colorNameLabel.textContent = uniqueColors[0].name;
        }
      }

      if (sizeListEl) {
        let selectIndex = 0;
        if (predictedSize) {
          const predIdx = uniqueSizes.indexOf(predictedSize);
          if (predIdx > -1) {
            selectIndex = predIdx;
          }
        }

        sizeListEl.innerHTML = uniqueSizes.map((size, idx) => `
          <button type="button" class="size-btn js-size-btn ${idx === selectIndex ? 'is-selected' : ''}" data-size="${size}">${size}</button>
        `).join("");

        if (sizeNameLabel && uniqueSizes[selectIndex]) {
          sizeNameLabel.textContent = uniqueSizes[selectIndex];
        }
      }

      // Update stock level display based on selected color and size
      const updateStockDisplay = () => {
        const selectedColorBtn = document.querySelector(".js-color-btn.is-selected");
        const selectedSizeBtn = document.querySelector(".js-size-btn.is-selected");
        
        const targetBadge = activeStockBadgeEl || document.querySelector(".product-badge--stock");
        if (!targetBadge) return;

        if (!selectedColorBtn || !selectedSizeBtn) {
          const totalStock = variants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0);
          targetBadge.textContent = `Còn ${totalStock} sản phẩm`;
          return;
        }
        
        const color = selectedColorBtn.getAttribute("data-color");
        const size = selectedSizeBtn.getAttribute("data-size");
        
        const matchedVariant = variants.find(v => v.color === color && v.size === size);
        if (matchedVariant) {
          const availableStock = Math.max(0, matchedVariant.stock_quantity - (matchedVariant.reserved_quantity || 0));
          targetBadge.textContent = `Còn ${availableStock} sản phẩm`;
        } else {
          targetBadge.textContent = "Hết hàng";
        }
      };

      // Bind select event handlers dynamically
      const colorBtns = colorListEl ? colorListEl.querySelectorAll(".js-color-btn") : [];
      const sizeBtns = sizeListEl ? sizeListEl.querySelectorAll(".js-size-btn") : [];

      colorBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          colorBtns.forEach(b => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          if (colorNameLabel) {
            colorNameLabel.textContent = btn.getAttribute("data-color");
          }
          updateStockDisplay();
        });
      });

      sizeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          sizeBtns.forEach(b => b.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          if (sizeNameLabel) {
            sizeNameLabel.textContent = btn.getAttribute("data-size");
          }
          updateStockDisplay();
        });
      });

      // Initial stock level rendering
      updateStockDisplay();

      // Check current wishlist status
      checkWishlistStatus(productId);

      // Load related products dynamically
      loadRelatedProducts(product);

      // Cart binding in product details
      const detailCartBtn = document.querySelector(".js-add-cart");
      if (detailCartBtn) {
        detailCartBtn.removeAttribute("onclick"); // Clear fallback inline redirect
        detailCartBtn.addEventListener("click", (e) => {
          e.preventDefault();
          
          const selectedColorBtn = document.querySelector(".js-color-btn.is-selected");
          const selectedSizeBtn = document.querySelector(".js-size-btn.is-selected");
          const qtyInputEl = document.querySelector(".js-qty-input");
          const qty = qtyInputEl ? parseInt(qtyInputEl.value, 10) || 1 : 1;

          if (!selectedColorBtn || !selectedSizeBtn) {
            showToast("Vui lòng chọn màu sắc và kích cỡ sản phẩm!");
            return;
          }

          const color = selectedColorBtn.getAttribute("data-color");
          const size = selectedSizeBtn.getAttribute("data-size");

          const matchedVariant = (product.variants || []).find(v => v.color === color && v.size === size);
          if (!matchedVariant) {
            showToast("Sản phẩm tùy chọn này hiện không khả dụng!");
            return;
          }

          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: product.product_id,
            product_name: product.name,
            product_image: product.images?.[0] || "",
            quantity: qty,
            unit_price: product.sale_price || product.base_price,
            color: color,
            size: size
          });
        });
      }

      // Buy Now binding in product details
      const buyNowBtn = document.querySelector(".js-buy-now");
      if (buyNowBtn) {
        buyNowBtn.addEventListener("click", (e) => {
          e.preventDefault();

          const selectedColorBtn = document.querySelector(".js-color-btn.is-selected");
          const selectedSizeBtn = document.querySelector(".js-size-btn.is-selected");
          const qtyInputEl = document.querySelector(".js-qty-input");
          const qty = qtyInputEl ? parseInt(qtyInputEl.value, 10) || 1 : 1;

          if (!selectedColorBtn || !selectedSizeBtn) {
            showToast("Vui lòng chọn màu sắc và kích cỡ sản phẩm!");
            return;
          }

          const color = selectedColorBtn.getAttribute("data-color");
          const size = selectedSizeBtn.getAttribute("data-size");

          const matchedVariant = (product.variants || []).find(v => v.color === color && v.size === size);
          if (!matchedVariant) {
            showToast("Sản phẩm tùy chọn này hiện không khả dụng!");
            return;
          }

          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: product.product_id,
            product_name: product.name,
            product_image: product.images?.[0] || "",
            quantity: qty,
            unit_price: product.sale_price || product.base_price,
            color: color,
            size: size
          });

          window.location.href = "/src/pages/checkout/shipping-payment.html";
        });
      }

    } catch (err) {
      console.error("Failed to load product details:", err);
    }
  } else {
    // Fallback static option selection
    bindOptionSelectHandlers();
  }

  // Wishlist toggle integration
  const wishlistBtn = document.querySelector(".js-wishlist");
  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", async () => {
      if (!productId) return;
      
      const isActive = wishlistBtn.classList.contains("is-wishlist-active");
      try {
        if (isActive) {
          await apiRequest(`/api/user/wishlist?product_id=${productId}`, { method: "DELETE" });
          wishlistBtn.classList.remove("is-wishlist-active");
          showToast("Đã xóa khỏi danh sách yêu thích");
        } else {
          await apiRequest("/api/user/wishlist", {
            method: "POST",
            body: { product_id: productId }
          });
          wishlistBtn.classList.add("is-wishlist-active");
          showToast("Đã thêm vào danh sách yêu thích!");
        }
      } catch (err) {
        if (err.status === 401) {
          showToast("Vui lòng đăng nhập để lưu sản phẩm!");
        } else {
          showToast(err.message || "Lỗi thao tác yêu thích");
        }
      }
    });
  }
}

async function checkWishlistStatus(productId) {
  const wishlistBtn = document.querySelector(".js-wishlist");
  if (!wishlistBtn) return;
  try {
    const data = await apiRequest("/api/user/wishlist");
    const items = data.items || [];
    const isSaved = items.some(item => item.product_id === productId);
    if (isSaved) {
      wishlistBtn.classList.add("is-wishlist-active");
    }
  } catch {
    // Ignore guest or fetch errors
  }
}

function bindOptionSelectHandlers() {
  // Color selection
  const colorBtns = document.querySelectorAll(".js-color-btn");
  const colorNameLabel = document.querySelector(".js-color-name");

  colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      colorBtns.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      if (colorNameLabel) {
        colorNameLabel.textContent = btn.getAttribute("data-color");
      }
    });
  });

  // Size selection
  const sizeBtns = document.querySelectorAll(".js-size-btn");
  const sizeNameLabel = document.querySelector(".js-size-name");

  sizeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      if (sizeNameLabel) {
        sizeNameLabel.textContent = btn.getAttribute("data-size");
      }
    });
  });
}

async function loadRelatedProducts(product) {
  try {
    const allProducts = await apiRequest("/api/user/products");
    const categoryId = product.category_id;
    
    // Filter products in the same category, excluding the current product itself
    let relatedProducts = allProducts.filter(p => p.category_id === categoryId && p.product_id !== product.product_id);
    
    // Fallback if no products in same category
    if (relatedProducts.length === 0) {
      relatedProducts = allProducts.filter(p => p.product_id !== product.product_id);
    }
    
    // Limit to 4
    relatedProducts = relatedProducts.slice(0, 4);
    
    const relatedGridEl = document.querySelector(".related-products .product-grid");
    if (relatedGridEl) {
      if (relatedProducts.length > 0) {
        const formatVND = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
        
        relatedGridEl.innerHTML = relatedProducts.map(rp => {
          const rpPrice = rp.sale_price || rp.base_price;
          const rpOldPrice = rp.sale_price && rp.base_price > rp.sale_price ? rp.base_price : null;
          const rpDiscount = rpOldPrice ? Math.round((1 - rpPrice / rpOldPrice) * 100) : 0;
          
          const badgeHtml = rpDiscount > 0 
            ? `<span class="card__badge card__badge--sale">-${rpDiscount}%</span>` 
            : (rp.is_featured ? `<span class="card__badge" style="background:#A18265;color:#fff;">HOT</span>` : "");
            
          const colorMap = new Map();
          rp.variants?.forEach(v => {
            if (v.color && !colorMap.has(v.color)) {
              colorMap.set(v.color, v.color_hex || "#CCCCCC");
            }
          });
          const colorDotsHtml = Array.from(colorMap.entries()).map(([name, hex]) => {
            return `<span class="card__color-dot" style="background-color: ${hex}; border: 1px solid #ddd;" title="${name}"></span>`;
          }).join("");
          
          return `
            <article class="card card--product">
              <div class="card__image-container">
                ${badgeHtml}
                <a href="/src/pages/products/detail.html?id=${rp.product_id}">
                  <img class="card__img" src="${rp.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${rp.name}" loading="lazy" />
                </a>
                <button class="card__wishlist-btn js-add-wishlist-related" type="button" aria-label="Yêu thích" data-id="${rp.product_id}">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.67">
                    <path d="M10 17.5l-5.83-5.83a4.17 4.17 0 115.83-5.83 4.17 4.17 0 115.83 5.83L10 17.5z" />
                  </svg>
                </button>
              </div>
              <div class="card__info">
                <a href="/src/pages/products/detail.html?id=${rp.product_id}" class="card__title">${rp.name}</a>
                <div class="card__colors">
                  ${colorDotsHtml}
                </div>
                <div class="card__price-group">
                  <span class="card__price">${formatVND(rpPrice)}</span>
                  ${rpOldPrice ? `<span class="card__price-old" style="text-decoration: line-through; color: var(--soft); margin-left: 8px;">${formatVND(rpOldPrice)}</span>` : ""}
                </div>
              </div>
              <button class="btn btn--primary card__add-btn js-add-cart-related" type="button" data-id="${rp.product_id}">Thêm giỏ</button>
            </article>
          `;
        }).join("");
        
        // Wishlist click handler
        relatedGridEl.querySelectorAll(".js-add-wishlist-related").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const rpId = btn.getAttribute("data-id");
            const isActive = btn.classList.contains("active");
            try {
              if (isActive) {
                await apiRequest(`/api/user/wishlist?product_id=${rpId}`, { method: "DELETE" });
                btn.classList.remove("active");
                showToast("Đã xóa khỏi danh sách yêu thích");
              } else {
                await apiRequest("/api/user/wishlist", {
                  method: "POST",
                  body: { product_id: rpId }
                });
                btn.classList.add("active");
                showToast("Đã thêm vào danh sách yêu thích!");
              }
            } catch (err) {
              if (err.status === 401) {
                showToast("Vui lòng đăng nhập để lưu sản phẩm!");
              } else {
                showToast(err.message || "Lỗi thao tác yêu thích");
              }
            }
          });
        });

        // Cart click handler
        relatedGridEl.querySelectorAll(".js-add-cart-related").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            const rpId = btn.getAttribute("data-id");
            const rp = relatedProducts.find(x => x.product_id === rpId);
            if (rp && rp.variants && rp.variants.length > 0) {
              const matchedVariant = rp.variants[0]; // Pick first variant
              addToCart({
                variant_id: matchedVariant.variant_id,
                product_id: rp.product_id,
                product_name: rp.name,
                product_image: rp.images?.[0] || "",
                quantity: 1,
                unit_price: rp.sale_price || rp.base_price,
                color: matchedVariant.color || "Mặc định",
                size: matchedVariant.size || "M"
              });
            } else {
              showToast("Sản phẩm không có biến thể sẵn có.");
            }
          });
        });
        
        // Check wishlist status for related products to set active class
        try {
          const wishlistData = await apiRequest("/api/user/wishlist");
          const items = wishlistData.items || [];
          const wishlistedIds = new Set(items.map(item => item.product_id));
          relatedGridEl.querySelectorAll(".js-add-wishlist-related").forEach(btn => {
            const rpId = btn.getAttribute("data-id");
            if (wishlistedIds.has(rpId)) {
              btn.classList.add("active");
            }
          });
        } catch {
          // Ignore if guest
        }
      } else {
        relatedGridEl.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--soft); padding: 32px 0;">Không có sản phẩm liên quan nào.</div>`;
      }
    }
  } catch (err) {
    console.error("Failed to load related products:", err);
  }
}
