import { apiRequest } from "./api.js";
import { showToast } from "./account-profile.js";
import { addToCart } from "./cart.js";

export function initWishlistPage() {
  const pageContainer = document.querySelector(".page-wishlist");
  if (!pageContainer) return;

  const grid = document.querySelector(".wishlist-grid");
  const subtitle = document.querySelector(".wishlist-subtitle");
  if (!grid) return;

  // Clear mock static content on init
  grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">Đang tải danh sách yêu thích...</div>`;

  // Fetch live wishlist
  apiRequest("/api/user/wishlist")
    .then(data => {
      const items = data.items || [];
      if (subtitle) {
        subtitle.textContent = `Bạn đã lưu ${items.length} sản phẩm`;
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 64px 0; color: #6B635D;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; color: #A18265;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p style="margin: 0; font-size: 0.9375rem; font-weight: 500;">Danh sách yêu thích của bạn đang trống.</p>
            <a href="/src/pages/collections.html" class="btn btn--primary btn--sm" style="display: inline-block; margin-top: 20px; text-decoration: none;">Khám phá ngay</a>
          </div>
        `;
        return;
      }

      grid.innerHTML = "";
      items.forEach(product => {
        const card = document.createElement("div");
        card.className = "wishlist-card";
        card.setAttribute("data-id", product.product_id);
        
        // Format price
        const priceFormatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.sale_price);

        card.innerHTML = `
          <div class="wishlist-card__image-wrapper">
            <img class="wishlist-card__image" src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" />
            <button class="wishlist-card__heart-btn js-remove-wishlist" type="button" aria-label="Bỏ yêu thích">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17.5l-5.83-5.83a4.17 4.17 0 115.83-5.83 4.17 4.17 0 115.83 5.83L10 17.5z" />
              </svg>
            </button>
          </div>
          <div class="wishlist-card__info">
            <h3 class="wishlist-card__name"><a href="/src/pages/products/detail.html?id=${product.product_id}" style="text-decoration:none; color:inherit;">${product.name}</a></h3>
            <div class="wishlist-card__price-block">
              <span class="wishlist-card__price">${priceFormatted}</span>
            </div>
            <button class="wishlist-card__action-btn js-add-cart-fast" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Thêm vào giỏ
            </button>
          </div>
        `;
        grid.appendChild(card);
      });

      // Hook click handlers for deleting and adding to cart
      bindWishlistEvents(grid, subtitle);
    })
    .catch(err => {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: #d9534f;">Không thể tải danh sách yêu thích: ${err.message}</div>`;
    });
}

function bindWishlistEvents(grid, subtitle) {
  grid.addEventListener("click", async (e) => {
    // 1. Handle Remove from Wishlist
    const removeBtn = e.target.closest(".js-remove-wishlist");
    if (removeBtn) {
      const card = removeBtn.closest(".wishlist-card");
      if (!card) return;
      const productId = card.getAttribute("data-id");

      try {
        await apiRequest(`/api/user/wishlist?product_id=${productId}`, {
          method: "DELETE"
        });

        // Animate removal
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        card.style.transition = "all 0.3s ease";
        
        setTimeout(() => {
          card.remove();
          showToast("Đã xóa sản phẩm khỏi danh sách yêu thích");
          
          // Update count
          const remainingCards = grid.querySelectorAll(".wishlist-card");
          if (subtitle) {
            subtitle.textContent = `Bạn đã lưu ${remainingCards.length} sản phẩm`;
          }

          if (remainingCards.length === 0) {
            grid.innerHTML = `
              <div style="grid-column: 1 / -1; text-align: center; padding: 64px 0; color: #6B635D;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; color: #A18265;">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p style="margin: 0; font-size: 0.9375rem; font-weight: 500;">Danh sách yêu thích của bạn đang trống.</p>
                <a href="/src/pages/collections.html" class="btn btn--primary btn--sm" style="display: inline-block; margin-top: 20px; text-decoration: none;">Khám phá ngay</a>
              </div>
            `;
          }
        }, 300);

      } catch (err) {
        alert(err.message || "Xóa sản phẩm thất bại");
      }
      return;
    }

    // 2. Handle Add to Cart
    const addCartBtn = e.target.closest(".js-add-cart-fast");
    if (addCartBtn) {
      const card = addCartBtn.closest(".wishlist-card");
      if (!card) return;
      const productId = card.getAttribute("data-id");
      try {
        // Fetch detailed product info to get variants
        const product = await apiRequest(`/api/user/products/${productId}`);
        if (product && product.variants && product.variants.length > 0) {
          const matchedVariant = product.variants[0]; // Pick first variant
          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: product.product_id,
            product_name: product.name,
            product_image: product.images?.[0] || "",
            quantity: 1,
            unit_price: product.sale_price || product.base_price,
            color: matchedVariant.color || "Mặc định",
            size: matchedVariant.size || "M"
          });
        } else {
          showToast("Sản phẩm không có biến thể sẵn có.");
        }
      } catch (err) {
        showToast("Không thể thêm vào giỏ hàng: " + err.message);
      }
    }
  });
}
