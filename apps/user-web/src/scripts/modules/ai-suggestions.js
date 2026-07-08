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
  loadAiSuggestionPayload()
    .then(res => {
      const quiz = res.quiz;
      if (hasCompletedQuiz(quiz)) {
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
              const firstStyle = quiz.style_tags && quiz.style_tags.length ? quiz.style_tags[0] : "Tối giản";
              userDescEl.textContent = `Dáng người: ${shapeText} • Phong cách: ${firstStyle}`;
            }
          }
        }

        // Dynamically update section header subtext
        const profileHeaderSubtitle = document.querySelector(".ai-section__subtitle");
        if (profileHeaderSubtitle && quiz.style_tags && quiz.style_tags.length) {
          profileHeaderSubtitle.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 4px;">
              <path d="M8 1.7l1.1 3.2 3.2 1.1-3.2 1.1L8 10.3 6.9 7.1 3.7 6l3.2-1.1L8 1.7z" fill="#C97B63" />
            </svg>
            Dựa trên phong cách ${quiz.style_tags[0]} của bạn
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
                    if (typeof showToast === "function") {
                      showToast(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
                    } else {
                      alert(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
                    }
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
              <div class="profile-grid">
                ${cat.products.map(p => {
            const image = p.images && p.images.length > 0 ? p.images[0] : "/src/assets/images/product-silk-blazer.png";
            return `
                    <article class="profile-card" style="cursor: pointer;" onclick="window.location.href='/src/pages/products/list.html'">
                      <div class="profile-card__img-container">
                        <img src="${image}" alt="${p.name}" />
                      </div>
                      <div class="profile-card__info">
                        <h3>${p.name}</h3>
                        <div class="profile-card__rating">
                          <svg class="star-icon" width="12" height="12" viewBox="0 0 24 24" fill="#C97B63">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span>4.8</span>
                        </div>
                        <strong class="profile-card__price">${Number(p.sale_price || p.base_price).toLocaleString('vi-VN')}₫</strong>
                      </div>
                    </article>
                  `;
          }).join('')}
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
        }
      } else {
        // Check if there is local quiz data in sessionStorage we can auto-submit/sync to the backend
        const localShape = sessionStorage.getItem("quiz-body-shape");
        const localStyle = sessionStorage.getItem("quiz-main-style");
        
        if (localShape || localStyle) {
          console.log("[AI Suggestions] Server quiz state was empty but local quiz data exists. Syncing...");
          
          let style_tags = [];
          try {
            const parsed = JSON.parse(localStyle || "[]");
            style_tags = Array.isArray(parsed) ? parsed : [parsed];
          } catch(e) {}
          
          const occasions = sessionStorage.getItem("quiz-context") ? [sessionStorage.getItem("quiz-context")] : [];
          
          let budget_range = sessionStorage.getItem("quiz-budget") || "300k_700k";
          if (!['under_300k', '300k_700k', '700k_1.5m', 'above_1.5m'].includes(budget_range)) {
            if (budget_range.includes("300") && budget_range.includes("700")) budget_range = "300k_700k";
            else if (budget_range.includes("300")) budget_range = "under_300k";
            else if (budget_range.includes("1.5")) budget_range = "above_1.5m";
            else budget_range = "700k_1.5m";
          }
          
          apiRequest("/api/user/style-quiz", {
            method: "POST",
            body: {
              height_cm: parseInt(sessionStorage.getItem("quiz-height"), 10) || null,
              weight_kg: parseInt(sessionStorage.getItem("quiz-weight"), 10) || null,
              chest_cm: parseInt(sessionStorage.getItem("quiz-vong1"), 10) || null,
              waist_cm: parseInt(sessionStorage.getItem("quiz-vong2"), 10) || null,
              hip_cm: parseInt(sessionStorage.getItem("quiz-vong3"), 10) || null,
              body_shape: localShape || null,
              skin_tone: sessionStorage.getItem("quiz-skin-tone") || "Neutral",
              style_tags,
              preferred_occasions: occasions,
              favorite_brands: ["Velura"],
              budget_range
            }
          })
          .then(() => {
            console.log("[AI Suggestions] Successfully synced local quiz to server. Re-fetching recommendations...");
            initAiSuggestions();
          })
          .catch(err => {
            console.error("[AI Suggestions] Failed to auto-sync local quiz:", err);
            emptyState.style.display = "block";
          });
        } else {
          emptyState.style.display = "block";
        }
      }
    })
    .catch(err => {
      console.error("Failed to load style quiz recommendations:", err);
      emptyState.style.display = "block";
    });
}

async function loadAiSuggestionPayload() {
  const recommendations = await apiRequest("/api/user/recommendations/style-profile");
  if (recommendations?.quiz && hasCompletedQuiz(recommendations.quiz)) {
    return recommendations;
  }

  try {
    const profileResponse = await apiRequest("/api/user/style-quiz");
    if (profileResponse?.quiz && hasCompletedQuiz(profileResponse.quiz)) {
      return {
        ...recommendations,
        success: true,
        quiz: profileResponse.quiz,
        source: recommendations?.source || "style_quiz_recovery"
      };
    }
  } catch (error) {
    console.warn("[AI Suggestions] Could not recover style quiz directly:", error);
  }

  return recommendations;
}

function hasCompletedQuiz(quiz) {
  return Boolean(
    quiz &&
    (
      quiz.body_shape ||
      (Array.isArray(quiz.style_tags) && quiz.style_tags.length > 0) ||
      quiz.skin_tone ||
      quiz.height_cm ||
      quiz.weight_kg
    )
  );
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
          if (typeof showToast === "function") {
            showToast(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
          } else {
            alert(`Đã thêm set đồ ${combo.name} vào giỏ hàng!`);
          }
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
        combo_image: comboImage
      });
    }
  }

  await saveCart(cart);
  updateBadge();
}
