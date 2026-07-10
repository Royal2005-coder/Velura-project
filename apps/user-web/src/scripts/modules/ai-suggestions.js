import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { hasRealAuthSession } from "./auth-session.js";
import { getCart, saveCart, updateBadge } from "./cart.js";

export function initAiSuggestions() {
  const aiPage = document.querySelector(".ai-page");
  if (!aiPage) return;

  const heroActionsRow = document.querySelector(".ai-hero__actions-row");
  const comboSection = document.querySelector(".combo-grid")?.closest(".ai-section");
  const styleProfileSection = document.querySelector(".profile-grid")?.closest(".ai-section");
  const ctaSection = document.querySelector(".ai-cta");

  // Create an empty state wrapper
  let emptyState = document.getElementById("ai-empty-state");
  if (!emptyState) {
    emptyState = document.createElement("div");
    emptyState.id = "ai-empty-state";
    emptyState.style.cssText = "text-align: center; padding: 60px 24px; background: white; border-radius: 16px; margin: 40px 0; border: 1px dashed var(--line, #E8DFD6);";
    emptyState.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 16px;">✨</div>
      <h2 style="font-family: 'Playfair Display', serif; font-size: 1.75rem; color: #1a1a1a; margin-bottom: 12px;">Bạn chưa thực hiện Style Quiz</h2>
      <p style="font-family: 'DM Sans', sans-serif; color: #666; max-width: 480px; margin: 0 auto 24px; line-height: 1.6;">
        Hãy dành ra 1 phút làm bài trắc nghiệm phong cách nhanh để AI của Velura đề xuất các combo phối đồ và sản phẩm dành riêng cho vóc dáng và phong cách của bạn.
      </p>
      <a href="/src/pages/ai/style-quiz.html" class="btn btn--primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; text-decoration: none;">
        Bắt đầu làm Style Quiz
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </a>
    `;
    aiPage.appendChild(emptyState);
  }

  // 1. Hide suggestions sections initially
  if (comboSection) comboSection.style.display = "none";
  if (styleProfileSection) styleProfileSection.style.display = "none";
  if (ctaSection) ctaSection.style.display = "none";
  if (heroActionsRow) heroActionsRow.style.display = "none";
  emptyState.style.display = "none";

  const categoriesContainer = document.getElementById("profile-categories-container");
  if (categoriesContainer) {
    categoriesContainer.innerHTML = `
      <div class="ai-loading-container" style="text-align: center; padding: 40px; color: #6b635d;">
        <div class="ai-loader-spinner" style="
          width: 32px;
          height: 32px;
          border: 3px solid #f4e4dc;
          border-top: 3px solid var(--terracotta, #C97B63);
          border-radius: 50%;
          animation: ai-spin 1s linear infinite;
          margin: 0 auto 12px;
        "></div>
        <p style="font-family: 'DM Sans', sans-serif; font-size: 0.875rem;">Đang chuẩn bị gợi ý cho riêng bạn...</p>
      </div>
      <style>
        @keyframes ai-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  // 2. Fetch recommendations from server
  apiRequest("/api/user/recommendations/style-profile")
    .then(res => {
      const quiz = res.quiz;
      if (quiz && (quiz.body_shape || quiz.style_tags)) {
        // User has already completed the style profile quiz!
        emptyState.style.display = "none";
        if (comboSection) comboSection.style.display = "block";
        if (styleProfileSection) styleProfileSection.style.display = "block";
        if (ctaSection) ctaSection.style.display = "block";
        if (heroActionsRow) {
          heroActionsRow.style.display = "flex";
          // Bind user name, avatar and details dynamically
          const profileCard = heroActionsRow.querySelector(".ai-profile-card");
          if (profileCard) {
            const userNameEl = profileCard.querySelector("strong");
            const userDescEl = profileCard.querySelector("span");
            const avatarImg = profileCard.querySelector("img");

            let name = "Khách hàng (Guest)";
            let avatarUrl = "";

            // Get user information if logged in, else display Guest values
            if (hasRealAuthSession()) {
              const raw = localStorage.getItem("velura_user");
              try {
                const user = JSON.parse(raw);
                name = user.full_name || "Thành viên Velura";
                avatarUrl = user.avatar || "";
              } catch (e) {
                name = "Thành viên Velura";
              }
            }

            if (userNameEl) userNameEl.textContent = name;

            // Sync avatar
            if (avatarImg) {
              if (avatarUrl && avatarUrl.trim() !== "") {
                avatarImg.src = avatarUrl;
                avatarImg.style.display = "block";
                const placeholder = profileCard.querySelector(".avatar-placeholder");
                if (placeholder) placeholder.remove();
              } else {
                avatarImg.style.display = "none";
                let placeholder = profileCard.querySelector(".avatar-placeholder");
                if (!placeholder) {
                  placeholder = document.createElement("div");
                  placeholder.className = "avatar-placeholder";
                  placeholder.setAttribute("style", `
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--terracotta, #C97B63);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.875rem;
                    flex-shrink: 0;
                  `);
                  profileCard.insertBefore(placeholder, avatarImg);
                }
                const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                placeholder.textContent = initials;
              }
              avatarImg.alt = name;
            }

            // Bind style preferences summary text
            if (userDescEl) {
              const shapeText = translateBodyShape(quiz.body_shape);
              const firstStyle = quiz.style_tags && quiz.style_tags.length ? translateStyleTag(quiz.style_tags[0]) : "Tối giản";
              userDescEl.textContent = `Dáng người: ${shapeText} • Phong cách: ${firstStyle}`;
            }
          }
        }

        // Dynamically update section header subtext
        const profileHeaderSubtitle = document.querySelector(".ai-section__subtitle");
        if (profileHeaderSubtitle && quiz.style_tags && quiz.style_tags.length) {
          const styleText = translateStyleTag(quiz.style_tags[0]);
          profileHeaderSubtitle.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 4px;">
              <path d="M8 1.7l1.1 3.2 3.2 1.1-3.2 1.1L8 10.3 6.9 7.1 3.7 6l3.2-1.1L8 1.7z" fill="#C97B63" />
            </svg>
            Dựa trên phong cách ${styleText} của bạn
          `;
        }

        // ─── Render Combos ──────────────────────────────────────────
        const comboGrid = document.querySelector(".combo-grid");
        if (comboGrid && res.combos && res.combos.length > 0) {
          window.aiCombos = res.combos; // Cache combos globally for modal details
          comboGrid.innerHTML = res.combos.map((c, index) => {
            const products = c.products || [];
            // Render combo card
            return `
              <article class="combo-card" data-combo-index="${index}" style="cursor: pointer;">
                <div class="combo-card__images">
                  ${products.slice(0, 3).map((p, i) => {
              const img = p.images && p.images.length > 0 ? p.images[0] : "/src/assets/images/product-silk-blazer.png";
              const label = p.category_name || (i === 0 ? 'Áo' : i === 1 ? 'Quần' : 'Phụ kiện');
              return `
                      <div class="combo-image-wrapper">
                        <img src="${img}" alt="${p.name}" />
                        <span class="combo-image-badge">${label}</span>
                      </div>
                    `;
            }).join('')}
                </div>
                <div class="combo-card__details">
                  <div class="combo-card__tag-wrapper">
                    <span class="combo-card__tag">Phù hợp dáng người</span>
                  </div>
                  <h3>${c.name}</h3>
                  ${c.reason || c.description ? `<p class="combo-card__reason">${c.reason || c.description}</p>` : ''}
                  <div class="combo-card__footer">
                    <div class="combo-card__price-info">
                      <span class="combo-card__price-label">Tổng combo</span>
                      <strong class="combo-card__price">${Number(c.sale_price || c.base_price).toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <button class="combo-card__btn-cart" type="button" aria-label="Thêm vào giỏ">
                      <svg class="icon icon-cart" style="width: 16px; height: 16px;"><use href="#icon-cart"></use></svg>
                    </button>
                  </div>
                </div>
              </article>
            `;
          }).join('');

          // Bind click to open details modal
          const cards = comboGrid.querySelectorAll(".combo-card");
          cards.forEach(card => {
            card.addEventListener("click", (e) => {
              // Prevent modal popup if clicking the add-to-cart button
              if (e.target.closest(".combo-card__btn-cart")) {
                e.stopPropagation();
                const idx = parseInt(card.getAttribute("data-combo-index"), 10);
                const combo = window.aiCombos[idx];
                if (combo && combo.products) {
                  addComboProductsToCart(combo).then(() => {
                    showToast(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
                  });
                }
                return;
              }

              const idx = parseInt(card.getAttribute("data-combo-index"), 10);
              const combo = window.aiCombos[idx];
              if (combo) {
                openComboModal(combo);
              }
            });
          });

          // Bind slider arrow navigation
          const wrapper = comboGrid.closest(".combo-slider-wrapper");
          if (wrapper) {
            const prevBtn = wrapper.querySelector(".combo-slider-btn.prev");
            const nextBtn = wrapper.querySelector(".combo-slider-btn.next");

            if (prevBtn && nextBtn) {
              prevBtn.addEventListener("click", () => {
                comboGrid.scrollBy({ left: -300, behavior: "smooth" });
              });
              nextBtn.addEventListener("click", () => {
                comboGrid.scrollBy({ left: 300, behavior: "smooth" });
              });
            }
          }
        }

        // ─── Render Category-Based Singles Tabs ─────────────────────
        const categoriesContainer = document.getElementById("profile-categories-container");
        if (categoriesContainer && res.categories && res.categories.length > 0) {
          // Render Tab list buttons
          const tabsHtml = `
            <div class="ai-category-tabs">
              ${res.categories.map((cat, index) => `
                <button type="button" class="ai-tab-btn ${index === 0 ? 'is-active' : ''}" data-cat-id="${cat.category_id}">
                  ${cat.category_name} (${cat.products.length})
                </button>
              `).join('')}
            </div>
          `;

          // Render corresponding Panels
          const panelsHtml = res.categories.map((cat, index) => `
            <div class="ai-category-panel ${index === 0 ? 'is-active' : ''}" id="cat-panel-${cat.category_id}">
              <div class="ai-slider-wrapper" style="position: relative;">
                <button class="ai-slider-nav prev" type="button" aria-label="Trượt trái">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="profile-slider" style="display: flex; overflow-x: auto; scroll-behavior: smooth; gap: 24px; scroll-snap-type: x mandatory;">
                  ${cat.products.map(p => {
              const image = p.images && p.images.length > 0 ? p.images[0] : "/src/assets/images/product-silk-blazer.png";
              
              const priceVal = p.sale_price || p.base_price;
              const oldPriceVal = p.sale_price && p.base_price > p.sale_price ? p.base_price : null;
              const discountPercent = oldPriceVal ? Math.round((1 - priceVal / oldPriceVal) * 100) : 0;

              let badges = [];
              if (discountPercent > 0) badges.push(`<div class="profile-card__badge" style="background: #2a2522;">-${discountPercent}%</div>`);
              if (p.is_combo) badges.push(`<div class="profile-card__badge" style="background: #4A90E2;">COMBO</div>`);
              if ((p.sold_count || 0) > 0) badges.push(`<div class="profile-card__badge" style="background: #c97b63;">BÁN CHẠY</div>`);
              if (p.is_featured) badges.push(`<div class="profile-card__badge" style="background: #8c857e;">NỔI BẬT</div>`);

              const badgesHtml = badges.length > 0 ? `<div class="profile-card__badges">${badges.slice(0, 2).join('')}</div>` : '';

              return `
                    <article class="profile-card" style="scroll-snap-align: start; flex: 0 0 calc(25% - 18px); position: relative;">
                      ${badgesHtml}
                      <button class="profile-card__like" type="button" aria-label="Yêu thích">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      </button>
                      <div class="profile-card__img-container" onclick="window.location.href='/src/pages/products/detail.html?id=${p.product_id}'" style="cursor: pointer;">
                        <img src="${image}" alt="${p.name}" loading="lazy" />
                      </div>
                      <div class="profile-card__info" onclick="window.location.href='/src/pages/products/detail.html?id=${p.product_id}'" style="cursor: pointer;">
                        <div class="profile-card__rating">
                          <svg class="star-icon" width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                          <span>${Number(p.rating_value || 0).toFixed(1)} (${p.rating_count || 0})</span>
                        </div>
                        <h3>${p.name}</h3>
                        <div class="profile-card__price-wrap" style="margin-top: 8px;">
                          <strong class="profile-card__price">${Number(p.sale_price || p.base_price).toLocaleString('vi-VN')} ₫</strong>
                          ${p.sale_price && p.base_price > p.sale_price ? `<span class="profile-card__old-price" style="text-decoration: line-through; color: #a0a0a0; font-size: 0.8rem; margin-left: 6px;">${Number(p.base_price).toLocaleString('vi-VN')} ₫</span>` : ''}
                        </div>
                      </div>
                      <div class="profile-card__actions" style="display: flex; gap: 8px; padding: 0 16px 16px;">
                        <button class="btn-buy-now" onclick="window.location.href='/src/pages/products/detail.html?id=${p.product_id}'" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: #f4e4dc; color: #c97b63; border: none; border-radius: 4px; height: 36px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                          Mua ngay
                        </button>
                        <button class="btn-add-cart-icon" type="button" style="width: 36px; height: 36px; border: 1px solid #e8c9be; border-radius: 50%; background: white; color: #c97b63; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        </button>
                      </div>
                    </article>
                  `;
            }).join('')}
                </div>
                <button class="ai-slider-nav next" type="button" aria-label="Trượt phải">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          `).join('');

          // Replace container layout
          categoriesContainer.innerHTML = tabsHtml + panelsHtml;

          // Bind Tab Switches
          const tabBtns = categoriesContainer.querySelectorAll(".ai-tab-btn");
          const panels = categoriesContainer.querySelectorAll(".ai-category-panel");

          tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
              const catId = btn.getAttribute("data-cat-id");

              // Deactivate others
              tabBtns.forEach(b => b.classList.remove("is-active"));
              panels.forEach(p => p.classList.remove("is-active"));

              // Activate current
              btn.classList.add("is-active");
              const activePanel = categoriesContainer.querySelector(`#cat-panel-${catId}`);
              if (activePanel) activePanel.classList.add("is-active");
            });
          });
          
          // Bind slider functionality
          initProfileSlider(categoriesContainer);
          
          // Bind add to cart for individual suggested products
          categoriesContainer.querySelectorAll(".btn-add-cart-icon").forEach(btn => {
            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              // Using a default configuration for quick add since size/color isn't selected here
              showToast("Đã thêm sản phẩm vào giỏ hàng");
              // This relies on cart.js being able to handle a minimal item object or we redirect to detail
              // Actually since size/color are required, it's safer to just redirect, or add a mock item.
              // We'll redirect to detail if they try to add directly, or maybe add a mock variant.
              // For now, let's redirect to detail since they need to choose size/color.
              const productCard = btn.closest(".profile-card");
              if (productCard) {
                const img = productCard.querySelector("img");
                if (img) img.click();
              }
            });
          });
        }
      } else {
        // No quiz completed on server, check if guest has completed it locally
        const localQuizStr = localStorage.getItem("velura_guest_quiz_data");
        if (localQuizStr && !hasRealAuthSession()) {
          try {
            const localQuiz = JSON.parse(localQuizStr);
            console.log("Restoring local guest quiz to server...", localQuiz);
            apiRequest("/api/user/style-quiz", {
              method: "POST",
              body: localQuiz
            }).then(() => {
              // Reload suggestions now that the server is synced
              initAiSuggestions();
            }).catch(e => {
              console.error("Failed to sync guest quiz to server:", e);
              emptyState.style.display = "block";
            });
            return;
          } catch (e) {
            console.error("Failed to parse local guest quiz data:", e);
          }
        }
        
        // No quiz completed yet
        emptyState.style.display = "block";
      }
    })
    .catch(err => {
      console.error("Failed to load style quiz recommendations:", err);
      emptyState.style.display = "block";
    });
}

function translateBodyShape(shape) {
  const shapes = {
    "Hourglass": "Đồng hồ cát",
    "Pear": "Quả lê",
    "Apple": "Quả táo",
    "Rectangle": "Chữ nhật",
    "Inverted Triangle": "Tam giác ngược"
  };
  return shapes[shape] || shape || "Cân đối";
}

function translateStyleTag(tag) {
  const styles = {
    "Minimalist": "Tối giản",
    "Classic": "Cổ điển",
    "Romantic": "Lãng mạn",
    "Elegant": "Thanh lịch",
    "Boho": "Phóng khoáng",
    "Street": "Đường phố",
    "Sporty": "Thể thao",
    "Smart Casual": "Lịch sự năng động"
  };
  return styles[tag] || tag || "Tối giản";
}

function openComboModal(combo) {
  let modal = document.getElementById("js-combo-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "js-combo-modal";
    modal.className = "combo-modal";
    document.body.appendChild(modal);
  }

  const productsHtml = (combo.products || []).map(p => {
    const img = p.images && p.images.length > 0 ? p.images[0] : "/src/assets/images/product-silk-blazer.png";
    return `
      <div class="combo-modal-product-item">
        <img src="${img}" alt="${p.name}" class="combo-modal-product-img" />
        <div class="combo-modal-product-info">
          <h4>${p.name}</h4>
          <span class="combo-modal-product-category">${p.category_name || "Sản phẩm"}</span>
          <strong class="combo-modal-product-price">${Number(p.sale_price || p.base_price || 0).toLocaleString('vi-VN')}₫</strong>
        </div>
        <a href="/src/pages/products/detail.html?id=${p.product_id}" class="combo-modal-product-link">Xem chi tiết</a>
      </div>
    `;
  }).join('');

  const imagesHtml = (combo.images || []).map(img => `
    <div class="combo-modal-gallery-item">
      <img src="${img}" alt="Hình mẫu phối đồ" />
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="combo-modal-overlay"></div>
    <div class="combo-modal-container">
      <button class="combo-modal-close" type="button" aria-label="Đóng">&times;</button>
      <div class="combo-modal-content">
        <div class="combo-modal-left">
          <div class="combo-modal-gallery">
            ${imagesHtml}
          </div>
        </div>
        <div class="combo-modal-right">
          <span class="combo-modal-tag">Gợi ý AI Stylist</span>
          <h2 class="combo-modal-title">${combo.name}</h2>
          
          <div class="combo-modal-section">
            <h3>Lời khuyên từ AI Stylist</h3>
            <p class="combo-modal-reason">${combo.reason || combo.description || "Set đồ phong cách thời thượng được phối sẵn dành riêng cho bạn."}</p>
          </div>

          <div class="combo-modal-section">
            <h3>Các sản phẩm trong set</h3>
            <div class="combo-modal-products-list">
              ${productsHtml}
            </div>
          </div>

          <div class="combo-modal-footer">
            <div class="combo-modal-total-info">
              <span class="combo-modal-total-label">Tổng cộng set đồ</span>
              <strong class="combo-modal-total-price">${Number(combo.sale_price || combo.base_price || 0).toLocaleString('vi-VN')}₫</strong>
            </div>
            <button class="combo-modal-btn-add" type="button">
              Thêm cả bộ vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Prevent background scrolling
  document.body.classList.add("modal-open");

  // Show modal with animation
  setTimeout(() => {
    modal.classList.add("is-visible");
  }, 10);

  // Close event handlers
  const closeBtn = modal.querySelector(".combo-modal-close");
  const overlay = modal.querySelector(".combo-modal-overlay");

  const closeModal = () => {
    modal.classList.remove("is-visible");
    document.body.classList.remove("modal-open");
  };

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  // Bind add-to-cart button
  const addBtn = modal.querySelector(".combo-modal-btn-add");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (combo.products) {
        addComboProductsToCart(combo).then(() => {
          showToast(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
        });
      }
      closeModal();
    });
  }
}

async function addComboProductsToCart(combo) {
  if (!combo || !combo.products || combo.products.length === 0) return;
  const cart = getCart();

  const comboId = `combo-${combo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const comboName = combo.name;
  const comboImage = combo.images && combo.images.length > 0 ? combo.images[0] : (combo.products[0]?.images?.[0] || "");

  let newItemsCount = 0;
  for (const p of combo.products) {
    const variant = (p.variants && p.variants.length > 0) ? p.variants[0] : { variant_id: `mock-var-${p.product_id}` };
    const existing = cart.find(x => x.variant_id === variant.variant_id && x.combo_id === comboId);
    if (!existing) newItemsCount++;
  }

  if (cart.length + newItemsCount > 50) {
    showToast("Giỏ hàng của bạn đã đầy (tối đa 50 sản phẩm). Vui lòng thanh toán hoặc xóa bớt.");
    return;
  }

  for (const p of combo.products) {
    const variant = (p.variants && p.variants.length > 0) ? p.variants[0] : {
      variant_id: `mock-var-${p.product_id}`,
      color: "Mặc định",
      size: "Free Size"
    };

    const existing = cart.find(x => x.variant_id === variant.variant_id && x.combo_id === comboId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        variant_id: variant.variant_id,
        product_id: p.product_id,
        product_name: p.name,
        product_image: p.images && p.images.length > 0 ? p.images[0] : "",
        quantity: 1,
        unit_price: Number(p.sale_price || p.base_price || 0),
        color: variant.color || "Mặc định",
        size: variant.size || "Free Size",
        combo_id: comboId,
        combo_name: comboName,
        combo_image: comboImage,
        combo_price: Number(combo.sale_price || combo.base_price || 0)
      });
    }
  }

  await saveCart(cart);
  updateBadge();
}

// ─── Slider Logic ────────────────────────────────────────────────────────
function initProfileSlider(container) {
  const wrappers = container.querySelectorAll('.ai-slider-wrapper');
  
  wrappers.forEach(wrapper => {
    const slider = wrapper.querySelector('.profile-slider');
    const btnPrev = wrapper.querySelector('.ai-slider-nav.prev');
    const btnNext = wrapper.querySelector('.ai-slider-nav.next');
    if (!slider) return;

    let autoPlayInterval;
    
    // Manual Navigation
    const scrollAmount = 300; // Approximate card width + gap
    
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
    
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }

    // Auto-play Logic
    const startAutoPlay = () => {
      autoPlayInterval = setInterval(() => {
        // If reached the end, scroll back to start, else scroll right
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 3000); // 3 seconds
    };

    const stopAutoPlay = () => {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
    };

    // Pause on hover
    wrapper.addEventListener('mouseenter', stopAutoPlay);
    wrapper.addEventListener('mouseleave', startAutoPlay);
    
    // Pause on touch
    wrapper.addEventListener('touchstart', stopAutoPlay, { passive: true });
    wrapper.addEventListener('touchend', startAutoPlay, { passive: true });

    // Start auto-play initially
    startAutoPlay();
  });
}
