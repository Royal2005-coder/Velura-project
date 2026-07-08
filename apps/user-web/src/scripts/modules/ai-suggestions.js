import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { hasRealAuthSession } from "./auth-session.js";

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
          // Bind user name and details dynamically
          const profileCard = heroActionsRow.querySelector(".ai-profile-card");
          if (profileCard) {
            const userNameEl = profileCard.querySelector("strong");
            const userDescEl = profileCard.querySelector("span");
            
            // Get user information if logged in, else display Guest values
            if (hasRealAuthSession()) {
              const raw = localStorage.getItem("velura_user");
              try {
                const user = JSON.parse(raw);
                if (userNameEl) userNameEl.textContent = user.full_name || "Thành viên Velura";
              } catch (e) {
                if (userNameEl) userNameEl.textContent = "Thành viên Velura";
              }
            } else {
              if (userNameEl) userNameEl.textContent = "Khách hàng (Guest)";
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
          comboGrid.innerHTML = res.combos.map(c => {
            const images = c.images && c.images.length > 0 ? c.images : ["/src/assets/images/product-silk-blazer.png"];
            // Render combo card
            return `
              <article class="combo-card">
                <div class="combo-card__images">
                  ${images.slice(0, 3).map((img, i) => `
                    <div class="combo-image-wrapper">
                      <img src="${img}" alt="Món ${i + 1}" />
                      <span class="combo-image-badge">${i === 0 ? 'Áo' : i === 1 ? 'Quần' : 'Phụ kiện'}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="combo-card__details">
                  <div class="combo-card__tag-wrapper">
                    <span class="combo-card__tag">Phù hợp dáng người</span>
                  </div>
                  <h3>${c.name}</h3>
                  <div class="combo-card__footer">
                    <div class="combo-card__price-info">
                      <span class="combo-card__price-label">Tổng combo</span>
                      <strong class="combo-card__price">${Number(c.sale_price || c.base_price).toLocaleString('vi-VN')}đ</strong>
                    </div>
                    <button class="combo-card__btn-cart" type="button" aria-label="Thêm vào giỏ" onclick="window.location.href='/src/pages/products/list.html'">
                      <svg class="icon icon-cart" style="width: 16px; height: 16px;"><use href="#icon-cart"></use></svg>
                    </button>
                  </div>
                </div>
              </article>
            `;
          }).join('');
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
