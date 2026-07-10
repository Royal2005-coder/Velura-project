import { apiRequest } from "./api.js";
import { showToast, addToCart, getVariantImage } from "./cart.js";
import { updateWishlistBadge } from "./wishlist.js";

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
  let recommendedColors = [];
  try {
    const profileRes = await apiRequest("/api/user/style-quiz");
    if (profileRes && (profileRes.quiz || profileRes.profile)) {
      styleProfile = profileRes.quiz || profileRes.profile;

      // Parse PostgreSQL array strings to JS arrays
      ["style_tags", "preferred_occasions", "favorite_brands", "favorite_colors"].forEach(key => {
        if (styleProfile[key] && typeof styleProfile[key] === "string" && styleProfile[key].startsWith("{")) {
          try {
            styleProfile[key] = styleProfile[key].replace(/^{|}$/g, "").split(",").map(s => s.trim().replace(/^"|"$/g, ""));
          } catch (e) { /* keep as-is */ }
        }
      });

      const { chest_cm, waist_cm, hip_cm, weight_kg, skin_tone, favorite_colors } = styleProfile;
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

      const skinToneColorMap = {
        "warm": ["Beige", "Camel", "Terracotta", "Coral", "Đỏ", "Nâu", "Kem", "Vàng", "Cam", "Caramel"],
        "cool": ["Đen", "Trắng", "Xanh dương", "Navy", "Bạc", "Hồng nhạt", "Tím nhạt", "Xám", "Xanh lam"],
        "neutral": ["Kem", "Xám", "Xanh rêu", "Be", "Nâu nhạt", "Trắng kem", "Đỏ sẫm", "Xanh olive"]
      };

      if (skin_tone) {
        const toneLower = skin_tone.toLowerCase();
        recommendedColors = skinToneColorMap[toneLower] || [];
      }

      if (favorite_colors && Array.isArray(favorite_colors) && favorite_colors.length > 0) {
        const quizColors = favorite_colors.map(c => {
          if (typeof c === "string" && c.includes("|")) return c.split("|")[0].trim();
          return c;
        }).filter(Boolean);
        recommendedColors = [...quizColors, ...recommendedColors];
      }
    }
  } catch (quizErr) {
    // Guest or no style profile
  }

  if (productId && titleEl) {
    try {
      const product = await apiRequest(`/api/user/products/${productId}`);

      // Determine product type (clothing, footwear, accessory)
      const categoryName = (product.category?.name || "").toLowerCase();
      const categorySlug = (product.category?.slug || "").toLowerCase();
      const productName = (product.name || "").toLowerCase();

      let productType = "clothing"; // default fallback

      if (
        categoryName.includes("giày") || 
        categoryName.includes("dép") || 
        categoryName.includes("guốc") || 
        categoryName.includes("sandal") ||
        categorySlug.includes("giay") ||
        categorySlug.includes("dep") ||
        categorySlug.includes("sandal") ||
        productName.includes("giày") ||
        productName.includes("dép") ||
        productName.includes("sandal")
      ) {
        productType = "footwear";
      } else if (
        categoryName.includes("phụ kiện") ||
        categoryName.includes("túi") ||
        categoryName.includes("ví") ||
        categoryName.includes("kính") ||
        categoryName.includes("mũ") ||
        categoryName.includes("nón") ||
        categoryName.includes("trang sức") ||
        categorySlug.includes("phu-kien") ||
        categorySlug.includes("accessories") ||
        categorySlug.includes("tui") ||
        categorySlug.includes("vi") ||
        categorySlug.includes("kinh") ||
        categorySlug.includes("mu") ||
        categorySlug.includes("non") ||
        categorySlug.includes("trang-suc")
      ) {
        productType = "accessory";
      }

      if (productType !== "clothing") {
        predictedSize = "";
      }
      
      // Bind basic info
      titleEl.textContent = product.name;
      document.title = `${product.name} — Velura`;
      const breadcrumbTitleEl = document.querySelector(".js-breadcrumb-title");
      if (breadcrumbTitleEl) {
        breadcrumbTitleEl.textContent = product.name;
      }
      
      const formatVND = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
      priceCurrentEl.textContent = formatVND(product.sale_price || product.base_price);
      if (product.sale_price && product.base_price > product.sale_price) {
        priceOldEl.textContent = formatVND(product.base_price);
        priceOldEl.style.display = "";
      } else {
        priceOldEl.style.display = "none";
      }

      // Combo Components Section
      if (product.is_combo && product.combo_components && product.combo_components.length > 0) {
        const comboSection = document.querySelector(".combo-components");
        const comboListEl = document.querySelector(".js-combo-components");
        const comboSummaryEl = document.querySelector(".js-combo-summary");

        if (comboSection && comboListEl) {
          comboSection.style.display = "";

          // State to track selected variants for each component
          const comboState = {
            components: product.combo_components.map(comp => ({
              product_id: comp.product_id,
              name: comp.name,
              selectedVariant: comp.variants && comp.variants.length > 0 ? comp.variants[0] : null,
              quantity: comp.quantity || 1
            }))
          };

          // Helper to get available colors for a component
          const getComponentColors = (comp) => {
            if (!comp.variants) return [];
            const colorMap = new Map();
            comp.variants.forEach(v => {
              if (v.color && !colorMap.has(v.color)) {
                colorMap.set(v.color, v.color_hex || "#CCCCCC");
              }
            });
            return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
          };

          // Helper to get available sizes for a component given a color
          const getComponentSizes = (comp, color) => {
            if (!comp.variants) return [];
            return [...new Set(
              comp.variants
                .filter(v => !color || v.color === color)
                .map(v => v.size)
                .filter(Boolean)
            )];
          };

          // Helper to get stock for a specific variant
          const getVariantStock = (comp, color, size) => {
            if (!comp.variants) return 0;
            const variant = comp.variants.find(v => v.color === color && v.size === size);
            if (!variant) return 0;
            return Math.max(0, (variant.stock_quantity || 0) - (variant.reserved_quantity || 0));
          };

          // Render a single component item
          const renderComponentItem = (comp, idx) => {
            const img = comp.images && comp.images.length > 0 ? comp.images[0] : "/src/assets/images/placeholder.jpg";
            const colors = getComponentColors(comp);
            const stateItem = comboState.components[idx];
            const selectedColor = stateItem.selectedVariant?.color || (colors[0]?.name || "");
            const sizes = getComponentSizes(comp, selectedColor);
            const selectedSize = stateItem.selectedVariant?.size || (sizes[0] || "");
            // Always show base_price (retail price) for "Tổng nếu mua lẻ" comparison
            const currentPrice = comp.base_price;

            return `
              <div class="combo-component-item" data-index="${idx}">
                <div class="combo-component-item__header">
                  <img src="${img}" alt="${comp.name}" class="combo-component-item__img" loading="lazy" />
                  <div class="combo-component-item__info">
                    <span class="combo-component-item__category">${comp.category_name}</span>
                    <span class="combo-component-item__name">${comp.name}</span>
                    <span class="combo-component-item__price" data-price-idx="${idx}">${formatVND(currentPrice)}</span>
                    ${comp.quantity > 1 ? `<span class="combo-component-item__qty">x${comp.quantity}</span>` : ''}
                  </div>
                  <button type="button" class="combo-component-item__toggle js-combo-toggle" data-index="${idx}" aria-expanded="false" aria-label="Chọn tùy chọn cho ${comp.name}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
                <div class="combo-component-item__options js-combo-options" data-options-idx="${idx}" style="display: none;">
                  <div class="combo-options__colors">
                    <span class="combo-options__label">Màu:</span>
                    <div class="combo-options__list">
                      ${colors.map((col, cIdx) => `
                        <button type="button" class="combo-color-btn js-combo-color ${selectedColor === col.name ? 'is-selected' : ''}" 
                          data-comp-idx="${idx}" data-color="${col.name}" 
                          style="background: ${col.hex}; border: 1px solid #ddd;" 
                          title="${col.name}"></button>
                      `).join("")}
                    </div>
                  </div>
                  ${sizes.length > 0 ? `
                    <div class="combo-options__sizes">
                      <span class="combo-options__label">Size:</span>
                      <div class="combo-options__list">
                        ${sizes.map((size, sIdx) => `
                          <button type="button" class="combo-size-btn js-combo-size ${selectedSize === size ? 'is-selected' : ''}" 
                            data-comp-idx="${idx}" data-size="${size}">${size}</button>
                        `).join("")}
                      </div>
                    </div>
                  ` : ''}
                  <div class="combo-options__stock" data-stock-idx="${idx}">
                    ${getVariantStock(comp, selectedColor, selectedSize) > 0 
                      ? `<span class="combo-stock--available">Còn ${getVariantStock(comp, selectedColor, selectedSize)} sản phẩm</span>`
                      : '<span class="combo-stock--unavailable">Hết hàng</span>'}
                  </div>
                </div>
              </div>
            `;
          };

          // Render all components
          comboListEl.innerHTML = product.combo_components.map((comp, idx) => renderComponentItem(comp, idx)).join("");

          // Update summary based on selected variants
          const updateComboSummary = () => {
            if (!comboSummaryEl) return;
            
            let totalOriginal = 0;
            let allSelected = true;
            
            comboState.components.forEach((stateItem, idx) => {
              const comp = product.combo_components[idx];
              // "Tổng nếu mua lẻ" always uses base_price (retail price) for comparison
              const retailPrice = comp.base_price;
              totalOriginal += retailPrice * stateItem.quantity;
              
              // Update individual component price display to show retail price
              const priceEl = comboListEl.querySelector(`[data-price-idx="${idx}"]`);
              if (priceEl) priceEl.textContent = formatVND(retailPrice);
              
              if (!stateItem.selectedVariant) allSelected = false;
            });

            const comboPrice = product.sale_price || product.base_price;
            const savings = Math.max(0, totalOriginal - comboPrice);
            const savingsPct = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;

            comboSummaryEl.innerHTML = `
              <div class="combo-summary-row">
                <span class="combo-summary__label">Tổng nếu mua lẻ:</span>
                <span class="combo-summary__old-price">${formatVND(totalOriginal)}</span>
              </div>
              <div class="combo-summary-row combo-summary-row--savings">
                <span class="combo-summary__label">Tiết kiệm khi mua set:</span>
                <span class="combo-summary__savings">-${formatVND(savings)} (${savingsPct}%)</span>
              </div>
              <div class="combo-summary-row combo-summary-row--total">
                <span class="combo-summary__label">Giá set:</span>
                <span class="combo-summary__total">${formatVND(comboPrice)}</span>
              </div>
            `;
          };

          // Initial summary render
          updateComboSummary();

          // Event delegation for combo component interactions
          comboListEl.addEventListener("click", (e) => {
            // Toggle expand/collapse
            const toggleBtn = e.target.closest(".js-combo-toggle");
            if (toggleBtn) {
              const idx = parseInt(toggleBtn.dataset.index);
              const optionsPanel = comboListEl.querySelector(`[data-options-idx="${idx}"]`);
              if (optionsPanel) {
                const isExpanded = optionsPanel.style.display !== "none";
                optionsPanel.style.display = isExpanded ? "none" : "flex";
                toggleBtn.setAttribute("aria-expanded", !isExpanded);
                toggleBtn.classList.toggle("is-expanded", !isExpanded);
              }
              return;
            }

            // Color selection
            const colorBtn = e.target.closest(".js-combo-color");
            if (colorBtn) {
              const compIdx = parseInt(colorBtn.dataset.compIdx);
              const color = colorBtn.dataset.color;
              const comp = product.combo_components[compIdx];
              
              // Update selected state
              colorBtn.closest(".combo-options__list").querySelectorAll(".js-combo-color").forEach(b => b.classList.remove("is-selected"));
              colorBtn.classList.add("is-selected");
              
              // Update state
              const sizes = getComponentSizes(comp, color);
              const firstSize = sizes[0] || "";
              const variant = comp.variants.find(v => v.color === color && v.size === firstSize);
              comboState.components[compIdx].selectedVariant = variant || null;
              
              // Re-render sizes
              const sizeContainer = colorBtn.closest(".combo-component-item__options").querySelector(".combo-options__sizes .combo-options__list");
              if (sizeContainer) {
                sizeContainer.innerHTML = sizes.map((size, sIdx) => `
                  <button type="button" class="combo-size-btn js-combo-size ${sIdx === 0 ? 'is-selected' : ''}" 
                    data-comp-idx="${compIdx}" data-size="${size}">${size}</button>
                `).join("");
              }
              
              // Update stock display
              const stockEl = comboListEl.querySelector(`[data-stock-idx="${compIdx}"]`);
              if (stockEl) {
                const stock = getVariantStock(comp, color, firstSize);
                stockEl.innerHTML = stock > 0 
                  ? `<span class="combo-stock--available">Còn ${stock} sản phẩm</span>`
                  : '<span class="combo-stock--unavailable">Hết hàng</span>';
              }
              
              updateComboSummary();
              return;
            }

            // Size selection
            const sizeBtn = e.target.closest(".js-combo-size");
            if (sizeBtn) {
              const compIdx = parseInt(sizeBtn.dataset.compIdx);
              const size = sizeBtn.dataset.size;
              const comp = product.combo_components[compIdx];
              
              // Update selected state
              sizeBtn.closest(".combo-options__list").querySelectorAll(".js-combo-size").forEach(b => b.classList.remove("is-selected"));
              sizeBtn.classList.add("is-selected");
              
              // Find selected color
              const colorBtns = comboListEl.querySelectorAll(`.js-combo-color[data-comp-idx="${compIdx}"]`);
              let selectedColor = "";
              colorBtns.forEach(b => { if (b.classList.contains("is-selected")) selectedColor = b.dataset.color; });
              
              // Update state
              const variant = comp.variants.find(v => v.color === selectedColor && v.size === size);
              comboState.components[compIdx].selectedVariant = variant || null;
              
              // Update stock display
              const stockEl = comboListEl.querySelector(`[data-stock-idx="${compIdx}"]`);
              if (stockEl) {
                const stock = getVariantStock(comp, selectedColor, size);
                stockEl.innerHTML = stock > 0 
                  ? `<span class="combo-stock--available">Còn ${stock} sản phẩm</span>`
                  : '<span class="combo-stock--unavailable">Hết hàng</span>';
              }
              
              updateComboSummary();
              return;
            }
          });

          // Add combo action buttons after summary
          const comboActionsHtml = `
            <div class="combo-actions">
              <button type="button" class="btn btn--outline combo-add-cart js-combo-add-cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Thêm set vào giỏ
              </button>
              <button type="button" class="btn btn--primary combo-buy-now js-combo-buy-now">Mua ngay set này</button>
            </div>
          `;
          comboSummaryEl.insertAdjacentHTML("afterend", comboActionsHtml);

          // Combo Add to Cart handler
          const comboCartBtn = comboSection.querySelector(".js-combo-add-cart");
          if (comboCartBtn) {
            comboCartBtn.addEventListener("click", async () => {
              // Check all components have selected variants
              const missingSelections = comboState.components.filter(c => !c.selectedVariant);
              if (missingSelections.length > 0) {
                showToast(`Vui lòng chọn màu sắc và kích cỡ cho: ${missingSelections.map(c => c.name).join(", ")}`);
                return;
              }

              // Add each component to cart as part of the combo
              const comboId = `combo-${product.product_id}-${Date.now()}`;
              for (const stateItem of comboState.components) {
                const comp = product.combo_components.find(c => c.product_id === stateItem.product_id);
                if (comp && stateItem.selectedVariant) {
                  await addToCart({
                    variant_id: stateItem.selectedVariant.variant_id,
                    product_id: stateItem.product_id,
                    product_name: comp.name,
                    product_image: comp.images?.[0] || "/src/assets/images/placeholder.jpg",
                    quantity: stateItem.quantity,
                    unit_price: comp.sale_price || comp.base_price,
                    color: stateItem.selectedVariant.color,
                    size: stateItem.selectedVariant.size,
                    combo_id: comboId,
                    combo_name: product.name,
                    combo_price: product.sale_price || product.base_price
                  });
                }
              }
              showToast("Đã thêm set sản phẩm vào giỏ hàng!");
            });
          }

          // Combo Buy Now handler
          const comboBuyBtn = comboSection.querySelector(".js-combo-buy-now");
          if (comboBuyBtn) {
            comboBuyBtn.addEventListener("click", async () => {
              // Check all components have selected variants
              const missingSelections = comboState.components.filter(c => !c.selectedVariant);
              if (missingSelections.length > 0) {
                showToast(`Vui lòng chọn màu sắc và kích cỡ cho: ${missingSelections.map(c => c.name).join(", ")}`);
                return;
              }

              // Add each component to cart as part of the combo
              const comboId = `combo-${product.product_id}-${Date.now()}`;
              const checkoutItems = [];
              for (const stateItem of comboState.components) {
                const comp = product.combo_components.find(c => c.product_id === stateItem.product_id);
                if (comp && stateItem.selectedVariant) {
                  const item = {
                    variant_id: stateItem.selectedVariant.variant_id,
                    product_id: stateItem.product_id,
                    product_name: comp.name,
                    product_image: comp.images?.[0] || "/src/assets/images/placeholder.jpg",
                    quantity: stateItem.quantity,
                    unit_price: comp.sale_price || comp.base_price,
                    color: stateItem.selectedVariant.color,
                    size: stateItem.selectedVariant.size,
                    combo_id: comboId,
                    combo_name: product.name,
                    combo_price: product.sale_price || product.base_price
                  };
                  await addToCart(item);
                  checkoutItems.push(item);
                }
              }

              sessionStorage.setItem("checkout_items", JSON.stringify(checkoutItems));
              localStorage.removeItem("checkout_discount");
              localStorage.removeItem("checkout_voucher_id");
              localStorage.removeItem("checkout_voucher_code");

              if (localStorage.getItem("velura_token")) {
                window.location.href = "/src/pages/checkout/payment-user.html";
              } else {
                window.location.href = "/src/pages/checkout/payment-guest.html";
              }
            });
          }
        }
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
        if ((product.sold_count || 0) > 0) {
          badgesHtml += `<span class="product-badge product-badge--hot">Bán chạy</span>`;
        } else if (product.is_featured) {
          badgesHtml += `<span class="product-badge product-badge--new" style="background:#89A894;color:#fff;">Nổi bật</span>`;
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
        if (productType === "clothing") {
          if (predictedSize) {
            recommendationText += `<div style="font-weight: 700; color: #8A6D3B; margin-top: 4px;">Gợi ý kích cỡ: Size ${predictedSize} vừa vặn nhất với bạn dựa trên Style Profile.</div>`;
          } else {
            recommendationText += `<div style="margin-top: 4px;"><a href="/src/pages/ai/style-quiz.html" class="btn btn--sm btn--primary" style="text-decoration:none; padding: 4px 8px; font-size:0.75rem; border-radius: 4px; display:inline-block;">Làm Style Quiz để nhận gợi ý size chính xác</a></div>`;
          }
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

      // Show color recommendations from style profile in fit helper
      if (styleProfile && recommendedColors.length > 0 && uniqueColors.length > 0) {
        const matchedRecColors = uniqueColors.filter(c =>
          recommendedColors.some(rc => c.name.toLowerCase().includes(rc.toLowerCase()) || rc.toLowerCase().includes(c.name.toLowerCase()))
        );
        if (matchedRecColors.length > 0) {
          const fitHelperEl2 = document.querySelector(".product-fit-helper");
          if (fitHelperEl2) {
            const colorNames = matchedRecColors.map(c => c.name).join(", ");
            const recDiv = document.createElement("div");
            recDiv.style.cssText = "font-weight: 600; color: #8A6D3B; margin-top: 4px;";
            recDiv.textContent = `Màu phù hợp với bạn: ${colorNames}`;
            const innerDiv = fitHelperEl2.querySelector("div > div");
            if (innerDiv) innerDiv.appendChild(recDiv);
          }
        }
      }

      // Hide size selection if there are no size variants or it is an accessory
      const optionSizeEl = document.querySelector(".option-size");
      if (optionSizeEl) {
        if (uniqueSizes.length === 0 || productType === "accessory") {
          optionSizeEl.style.display = "none";
        } else {
          optionSizeEl.style.display = "";
        }
      }

      // Hide size guide link and size tab button if it's an accessory
      const sizeGuideLinkEl = document.querySelector(".size-guide-link");
      if (sizeGuideLinkEl) {
        if (productType === "accessory") {
          sizeGuideLinkEl.style.display = "none";
        } else {
          sizeGuideLinkEl.style.display = "";
        }
      }

      const sizeTabBtnEl = document.querySelector("#tab-size");
      if (sizeTabBtnEl) {
        if (productType === "accessory") {
          sizeTabBtnEl.style.display = "none";
        } else {
          sizeTabBtnEl.style.display = "";
        }
      }

      // Dynamic size table guide
      const sizePanelEl = document.querySelector("#panel-size");
      if (sizePanelEl) {
        if (productType === "clothing") {
          sizePanelEl.innerHTML = `
            <table class="specs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Ngực (cm)</th>
                  <th>Eo (cm)</th>
                  <th>Mông (cm)</th>
                  <th>Cân nặng đề xuất</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>XS</th>
                  <td>78</td>
                  <td>62</td>
                  <td>84</td>
                  <td>40-45kg</td>
                </tr>
                <tr>
                  <th>S</th>
                  <td>82</td>
                  <td>66</td>
                  <td>88</td>
                  <td>45-50kg</td>
                </tr>
                <tr>
                  <th>M</th>
                  <td>86</td>
                  <td>70</td>
                  <td>92</td>
                  <td>50-55kg</td>
                </tr>
                <tr>
                  <th>L</th>
                  <td>90</td>
                  <td>74</td>
                  <td>96</td>
                  <td>55-60kg</td>
                </tr>
                <tr>
                  <th>XL</th>
                  <td>94</td>
                  <td>78</td>
                  <td>100</td>
                  <td>60-65kg</td>
                </tr>
              </tbody>
            </table>
          `;
        } else if (productType === "footwear") {
          sizePanelEl.innerHTML = `
            <table class="specs-table">
              <thead>
                <tr>
                  <th>Size (EU)</th>
                  <th>Chiều dài chân (cm)</th>
                  <th>Size (US)</th>
                  <th>Size (UK)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>35</th>
                  <td>22.0 - 22.5</td>
                  <td>5</td>
                  <td>3</td>
                </tr>
                <tr>
                  <th>36</th>
                  <td>22.5 - 23.0</td>
                  <td>6</td>
                  <td>4</td>
                </tr>
                <tr>
                  <th>37</th>
                  <td>23.0 - 23.5</td>
                  <td>6.5</td>
                  <td>4.5</td>
                </tr>
                <tr>
                  <th>38</th>
                  <td>23.5 - 24.0</td>
                  <td>7.5</td>
                  <td>5.5</td>
                </tr>
                <tr>
                  <th>39</th>
                  <td>24.0 - 24.5</td>
                  <td>8.5</td>
                  <td>6.5</td>
                </tr>
                <tr>
                  <th>40</th>
                  <td>24.5 - 25.0</td>
                  <td>9</td>
                  <td>7</td>
                </tr>
              </tbody>
            </table>
          `;
        } else {
          sizePanelEl.innerHTML = `<p style="color: var(--soft); text-align: center; padding: 24px 0;">Sản phẩm này không có bảng size.</p>`;
        }
      }

      if (colorListEl) {
        let recColorIndex = 0;
        if (recommendedColors.length > 0 && uniqueColors.length > 0) {
          const matchedIdx = uniqueColors.findIndex(c => 
            recommendedColors.some(rc => c.name.toLowerCase().includes(rc.toLowerCase()) || rc.toLowerCase().includes(c.name.toLowerCase()))
          );
          if (matchedIdx > -1) recColorIndex = matchedIdx;
        }

        colorListEl.innerHTML = uniqueColors.map((col, idx) => {
          return `
            <button type="button" class="color-btn js-color-btn ${idx === recColorIndex ? 'is-selected' : ''}" data-color="${col.name}" style="background: ${col.hex}; border: 1px solid #ddd;" title="${col.name}"></button>
          `;
        }).join("");

        if (colorNameLabel && uniqueColors[recColorIndex]) {
          colorNameLabel.textContent = uniqueColors[recColorIndex].name;
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
        } else if (sizeNameLabel) {
          sizeNameLabel.textContent = "";
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
          const selectedColor = btn.getAttribute("data-color");
          if (colorNameLabel) {
            colorNameLabel.textContent = selectedColor;
          }
          
          // Switch main image to match selected color if found in image URLs
          if (selectedColor && images.length > 0) {
            const colorSlug = selectedColor.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const tokens = colorSlug.split("-").filter(t => t.length >= 3);
            
            let bestIdx = -1;
            let maxScore = 0;
            
            images.forEach((img, idx) => {
              const urlLower = img.toLowerCase();
              let score = 0;
              
              // Exact slug match (highest priority)
              if (urlLower.includes(colorSlug) || urlLower.includes(colorSlug.replace("-", ""))) {
                score += 10;
              }
              
              // Partial token match (e.g. "beige" in "Champagne Beige", or "terracotta" in "Terracotta Rose")
              tokens.forEach(tok => {
                if (urlLower.includes(tok)) {
                  score += 5;
                }
              });
              
              if (score > maxScore) {
                maxScore = score;
                bestIdx = idx;
              }
            });
            
            if (bestIdx > -1 && maxScore > 0) {
              setActiveImage(bestIdx);
            }
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

      // Render product reviews
      renderReviews(product.reviews || []);

      // Cart binding in product details
      const detailCartBtn = document.querySelector(".js-add-cart");
      const buyNowBtn = document.querySelector(".js-buy-now");
      
      const isOutOfStock = product.status === "out_of_stock";

      if (isOutOfStock) {
        if (detailCartBtn) {
          detailCartBtn.textContent = "SẢN PHẨM HẾT HÀNG";
          detailCartBtn.style.backgroundColor = "#555";
          detailCartBtn.style.cursor = "not-allowed";
          detailCartBtn.disabled = true;
          detailCartBtn.removeAttribute("onclick");
        }
        if (buyNowBtn) {
          buyNowBtn.style.display = "none";
        }
      } else {
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
              product_image: getVariantImage(product, color),
              quantity: qty,
              unit_price: product.sale_price || product.base_price,
              color: color,
              size: size
            });
          });
        }

        // Buy Now binding in product details
        if (buyNowBtn) {
        buyNowBtn.addEventListener("click", async (e) => {
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

          const checkoutItem = {
            variant_id: matchedVariant.variant_id,
            product_id: product.product_id,
            product_name: product.name,
            product_image: getVariantImage(product, color),
            quantity: qty,
            unit_price: product.sale_price || product.base_price,
            color: color,
            size: size
          };

          await addToCart(checkoutItem);
          
          sessionStorage.setItem("checkout_items", JSON.stringify([checkoutItem]));
          
          // Clear any old checkout session data
          localStorage.removeItem("checkout_discount");
          localStorage.removeItem("checkout_voucher_id");
          localStorage.removeItem("checkout_voucher_code");

          if (localStorage.getItem("velura_token")) {
            window.location.href = "/src/pages/checkout/payment-user.html";
          } else {
            window.location.href = "/src/pages/checkout/payment-guest.html";
          }
        });
      }
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
          const currentCount = parseInt(localStorage.getItem("velura_wishlist_count") || "0", 10);
          localStorage.setItem("velura_wishlist_count", Math.max(0, currentCount - 1));
          updateWishlistBadge();
        } else {
          await apiRequest("/api/user/wishlist", {
            method: "POST",
            body: { product_id: productId }
          });
          wishlistBtn.classList.add("is-wishlist-active");
          showToast("Đã thêm vào danh sách yêu thích!");
          const currentCount = parseInt(localStorage.getItem("velura_wishlist_count") || "0", 10);
          localStorage.setItem("velura_wishlist_count", currentCount + 1);
          updateWishlistBadge();
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
    localStorage.setItem("velura_wishlist_count", items.length);
    updateWishlistBadge();
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
          
          const isOutOfStock = rp.status === "out_of_stock";

          const badgeHtml = isOutOfStock
            ? `<span class="card__badge card__badge--out-of-stock" style="background:#555;color:#fff;">HẾT HÀNG</span>`
            : (rpDiscount > 0 
              ? `<span class="card__badge card__badge--sale">-${rpDiscount}%</span>` 
              : (rp.is_featured ? `<span class="card__badge" style="background:#A18265;color:#fff;">HOT</span>` : ""));
            
          const colorMap = new Map();
          rp.variants?.forEach(v => {
            if (v.color && !colorMap.has(v.color)) {
              colorMap.set(v.color, v.color_hex || "#CCCCCC");
            }
          });
          const colorDotsHtml = Array.from(colorMap.entries()).map(([name, hex]) => {
            return `<span class="card__color-dot" style="background-color: ${hex}; border: 1px solid #ddd;" title="${name}"></span>`;
          }).join("");
          
          const cardStyle = isOutOfStock ? "opacity: 0.6; filter: grayscale(100%); cursor: not-allowed;" : "";
          const linkTag = isOutOfStock ? "div" : "a";
          const linkHref = isOutOfStock ? "" : `href="/src/pages/products/detail.html?id=${rp.product_id}"`;

          const actionsHtml = isOutOfStock 
            ? `<div style="text-align:center; padding:12px; color:#555; font-weight:bold; border-top:1px solid #eee;">HẾT HÀNG</div>`
            : `<button class="btn btn--primary card__add-btn js-add-cart-related" type="button" data-id="${rp.product_id}">Thêm giỏ</button>`;

          return `
            <article class="card card--product" style="${cardStyle}">
              <div class="card__image-container">
                ${badgeHtml}
                <${linkTag} ${linkHref}>
                  <img class="card__img" src="${rp.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${rp.name}" loading="lazy" />
                </${linkTag}>
                <button class="card__wishlist-btn js-add-wishlist-related" type="button" aria-label="Yêu thích" data-id="${rp.product_id}">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.67">
                    <path d="M10 17.5l-5.83-5.83a4.17 4.17 0 115.83-5.83 4.17 4.17 0 115.83 5.83L10 17.5z" />
                  </svg>
                </button>
              </div>
              <div class="card__info">
                <${linkTag} ${linkHref} class="card__title">${rp.name}</${linkTag}>
                <div class="card__colors">
                  ${colorDotsHtml}
                </div>
                <div class="card__price-group">
                  <span class="card__price">${formatVND(rpPrice)}</span>
                  ${rpOldPrice ? `<span class="card__price-old" style="text-decoration: line-through; color: var(--soft); margin-left: 8px;">${formatVND(rpOldPrice)}</span>` : ""}
                </div>
              </div>
              ${actionsHtml}
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
                product_image: getVariantImage(rp, matchedVariant.color || "Mặc định"),
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

function renderReviews(reviews) {
  const reviewsListEl = document.querySelector(".reviews-list");
  if (!reviewsListEl) return;

  const count = reviews.length;
  let avgRating = 5.0;
  
  // Calculate average rating
  if (count > 0) {
    const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    avgRating = (totalRating / count).toFixed(1);
  }

  // Helper to generate stars
  const getStarsHtml = (rating, size = 14) => {
    let html = "";
    const rounded = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        html += `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#C97B63" style="margin-right: 2px;">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        `;
      } else {
        html += `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#C97B63" stroke-width="2" style="margin-right: 2px;">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        `;
      }
    }
    return html;
  };

  // 1. Update top product-info__rating
  const topRatingStars = document.querySelector(".product-info__rating .rating-stars");
  const topRatingCount = document.querySelector(".product-info__rating .rating-count");
  if (topRatingStars) {
    topRatingStars.innerHTML = getStarsHtml(avgRating, 14);
  }
  if (topRatingCount) {
    topRatingCount.innerHTML = `${avgRating} &nbsp;·&nbsp; ${count} Đánh giá từ khách hàng`;
  }

  // 2. Update reviews-summary__left
  const summaryLeftTitle = document.querySelector(".reviews-summary__left .reviews-summary__title");
  const summaryLeftStars = document.querySelector(".reviews-summary__left .rating-stars");
  const summaryLeftSubtitle = document.querySelector(".reviews-summary__left .reviews-summary__subtitle");
  
  if (summaryLeftTitle) {
    summaryLeftTitle.textContent = avgRating;
  }
  if (summaryLeftStars) {
    summaryLeftStars.innerHTML = getStarsHtml(avgRating, 18);
  }
  if (summaryLeftSubtitle) {
    summaryLeftSubtitle.textContent = `Tổng số ${count} đánh giá`;
  }

  // 3. Update reviews-summary__right (Rating Bars)
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const summaryRight = document.querySelector(".reviews-summary__right");
  if (summaryRight) {
    summaryRight.innerHTML = [5, 4, 3, 2, 1].map(star => {
      const starCount = starCounts[star] || 0;
      const percent = count > 0 ? Math.round((starCount / count) * 100) : 0;
      return `
        <div class="rating-bar-item">
          <span class="rating-bar__label">${star} ★</span>
          <div class="rating-bar__track">
            <div class="rating-bar__fill" style="width: ${percent}%;"></div>
          </div>
          <span class="rating-bar__value">${starCount}</span>
        </div>
      `;
    }).join("");
  }

  // 4. Render Reviews List
  if (count === 0) {
    reviewsListEl.innerHTML = `
      <div style="text-align: center; padding: 48px 0; color: var(--soft);">
        <p style="margin: 0; font-size: 1rem; color: var(--text-dark); font-weight: 500;">Sản phẩm chưa có đánh giá nào.</p>
        <p style="margin: 4px 0 0 0; font-size: 0.85rem;">Hãy mua hàng và trở thành người đầu tiên chia sẻ cảm nhận!</p>
      </div>
    `;
    return;
  }

  reviewsListEl.innerHTML = reviews.map(r => {
    const formattedDate = r.submitted_at || r.created_at
      ? new Date(r.submitted_at || r.created_at).toLocaleDateString("vi-VN")
      : "Đang cập nhật";

    const tagsHtml = r.review_tags && r.review_tags.length > 0
      ? `<div class="review-item__tags" style="display: flex; gap: 8px; margin: 8px 0; flex-wrap: wrap;">
          ${r.review_tags.map(tag => `<span class="review-tag" style="background: #f7f5f2; border: 1px solid #e5dfd8; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; color: #8A6D3B; font-weight: 500;">${tag}</span>`).join("")}
         </div>`
      : "";

    const validImages = Array.isArray(r.images)
      ? r.images.filter(img => typeof img === "string" && img.startsWith("http"))
      : [];
    const imagesHtml = validImages.length > 0
      ? `<div class="review-item__gallery" style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          ${validImages.map(img => {
            const safeUrl = encodeURI(img);
            return `<img src="${safeUrl}" alt="Ảnh đánh giá" loading="lazy" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #e5dfd8; cursor: pointer;" onclick="window.open('${safeUrl}', '_blank')" onerror="this.style.display='none'" />`;
          }).join("")}
         </div>`
      : "";

    // Parse existing replies from admin_reply
    let replies = [];
    if (r.admin_reply) {
      try {
        replies = JSON.parse(r.admin_reply);
        if (!Array.isArray(replies)) {
          replies = [{
            user_name: "Admin",
            role: "admin",
            reply_text: r.admin_reply,
            created_at: r.moderated_at || r.updated_at
          }];
        }
      } catch (e) {
        replies = [{
          user_name: "Admin",
          role: "admin",
          reply_text: r.admin_reply,
          created_at: r.moderated_at || r.updated_at
        }];
      }
    }

    const repliesHtml = replies.map(rep => {
      const isAdmin = rep.role === "admin";
      const badgeHtml = isAdmin ? `<span style="background: #C97B63; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 6px;">QTV</span>` : "";
      const repDate = rep.created_at ? new Date(rep.created_at).toLocaleDateString("vi-VN") : "Đang cập nhật";
      const repAuthor = rep.user_name || (isAdmin ? "Quản trị viên" : "Khách hàng");
      return `
        <div class="review-reply-item" style="background: #fcfbfa; border-left: 3px solid #C97B63; padding: 12px 16px; margin-top: 12px; border-radius: 0 4px 4px 0; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="display: flex; align-items: center;">
              <span style="font-weight: 600; color: var(--text-dark);">${repAuthor}</span>
              ${badgeHtml}
            </div>
            <span style="font-size: 0.75rem; color: var(--soft);">${repDate}</span>
          </div>
          <p style="margin: 0; color: #555; line-height: 1.5;">${rep.reply_text}</p>
        </div>
      `;
    }).join("");

    // Reply button and input form
    const isUserLoggedIn = localStorage.getItem("velura_token") || localStorage.getItem("velura_user");
    const replyFormHtml = isUserLoggedIn 
      ? `
        <div class="review-reply-form-container" style="margin-top: 16px;">
          <button type="button" class="js-toggle-reply-form" style="background: none; border: none; color: #C97B63; font-weight: 600; font-size: 0.85rem; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Phản hồi
          </button>
          <div class="reply-form-box js-reply-form-box" style="display: none; margin-top: 12px; gap: 8px; flex-direction: column;">
            <textarea class="reply-textarea js-reply-textarea" placeholder="Viết câu trả lời hoặc phản hồi..." style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #e5dfd8; border-radius: 4px; font-family: inherit; font-size: 0.85rem; outline: none; resize: vertical; background: #fff;"></textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn-cancel-reply js-cancel-reply" style="background: #f7f5f2; border: 1px solid #e5dfd8; padding: 6px 14px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">Hủy</button>
              <button type="button" class="btn-submit-reply js-submit-reply" data-review-id="${r.review_id}" style="background: #C97B63; border: 1px solid #C97B63; color: white; padding: 6px 14px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">Gửi phản hồi</button>
            </div>
          </div>
        </div>
      `
      : `
        <div style="margin-top: 12px; font-size: 0.8rem; color: var(--soft);">
          <a href="/src/pages/auth/signin.html" style="color: #C97B63; text-decoration: underline; font-weight: 500;">Đăng nhập</a> để gửi phản hồi đánh giá.
        </div>
      `;

    return `
      <article class="review-item" style="border-bottom: 1px solid #f0edf0; padding: 24px 0;">
        <div class="review-item__head" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span class="review-item__author" style="font-weight: 600; color: var(--text-dark);">${r.user_full_name}</span>
          <span class="review-item__date" style="font-size: 0.85rem; color: var(--soft);">${formattedDate}</span>
        </div>
        <div class="rating-stars" style="margin-bottom: 8px;">
          ${getStarsHtml(r.rating, 12)}
        </div>
        ${tagsHtml}
        <p class="review-item__text" style="color: var(--text-dark); margin: 0; line-height: 1.6;">${r.comment || "Không có nhận xét chi tiết."}</p>
        ${imagesHtml}

        <!-- Replies Container -->
        <div class="review-replies-list" style="margin-left: 16px;">
          ${repliesHtml}
        </div>

        <!-- Reply Action / Form -->
        <div style="margin-left: 16px;">
          ${replyFormHtml}
        </div>
      </article>
    `;
  }).join("");

  // Attach event handlers for replies
  const reviewItems = reviewsListEl.querySelectorAll(".review-item");
  reviewItems.forEach(item => {
    const toggleBtn = item.querySelector(".js-toggle-reply-form");
    const formBox = item.querySelector(".js-reply-form-box");
    const cancelBtn = item.querySelector(".js-cancel-reply");
    const submitBtn = item.querySelector(".js-submit-reply");
    const textarea = item.querySelector(".js-reply-textarea");

    if (toggleBtn && formBox) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = formBox.style.display === "none";
        formBox.style.display = isHidden ? "flex" : "none";
        if (isHidden && textarea) textarea.focus();
      });
    }

    if (cancelBtn && formBox) {
      cancelBtn.addEventListener("click", () => {
        formBox.style.display = "none";
        if (textarea) textarea.value = "";
      });
    }

    if (submitBtn && textarea && formBox) {
      submitBtn.addEventListener("click", async () => {
        const reviewId = submitBtn.getAttribute("data-review-id");
        const replyText = textarea.value.trim();

        if (!replyText) {
          showToast("Vui lòng nhập nội dung phản hồi.");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Đang gửi...";

        try {
          const res = await apiRequest(`/api/user/reviews/${reviewId}/reply`, {
            method: "POST",
            body: { reply_text: replyText }
          });
          
          if (res.success) {
            window.location.reload();
          } else {
            showToast("Không thể gửi phản hồi. Vui lòng thử lại.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi phản hồi";
          }
        } catch (err) {
          console.error("Failed to submit reply:", err);
          showToast(err.message || "Đã xảy ra lỗi khi gửi phản hồi.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Gửi phản hồi";
        }
      });
    }
  });
}
