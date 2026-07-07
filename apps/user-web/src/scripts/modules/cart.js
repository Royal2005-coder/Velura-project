import { apiRequest } from "./api.js";
import { storeAuthSession } from "./auth-session.js";

// Custom premium toast helper
export function showToast(message) {
  let toastContainer = document.querySelector(".velura-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "velura-toast-container";
    toastContainer.setAttribute("style", `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `);
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.setAttribute("style", `
    background: rgba(45, 39, 34, 0.95);
    backdrop-filter: blur(8px);
    color: #FFFFFF;
    padding: 16px 24px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
  `);
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  // Animate in
  toast.style.transform = "translateY(0)";
  toast.style.opacity = "1";

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.transform = "translateY(-10px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ----------------------------------------------------
// Cart core operations (localStorage based)
// ----------------------------------------------------
export function getCart() {
  try {
    const raw = localStorage.getItem("velura_cart");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse cart:", e);
    return [];
  }
}

export async function syncCartWithDb(cart) {
  const token = localStorage.getItem("velura_token");
  if (!token) return;
  try {
    const res = await apiRequest("/api/user/cart", {
      method: "POST",
      body: JSON.stringify({ items: cart })
    });
    return res;
  } catch (err) {
    console.error("Cart sync failed:", err);
    showToast(err.message || "Không thể đồng bộ giỏ hàng với hệ thống.");
  }
}

export async function fetchAndSyncCart() {
  const token = localStorage.getItem("velura_token");
  if (!token) return;
  try {
    const res = await apiRequest("/api/user/cart");
    if (res && res.items) {
      localStorage.setItem("velura_cart", JSON.stringify(res.items));
      updateBadge();
      const path = window.location.pathname;
      if (path.includes("/cart.html")) {
        renderCartPage();
      }
    }
  } catch (err) {
    console.error("Failed to fetch cart from DB:", err);
  }
}

export async function mergeCartOnLogin() {
  const token = localStorage.getItem("velura_token");
  if (!token) return;

  const guestCart = getCart();
  try {
    // 1. Fetch current DB cart
    const dbCartRes = await apiRequest("/api/user/cart");
    const dbCartItems = dbCartRes.items || [];

    // 2. Merge guestCart items into dbCartItems
    const mergedCart = [...dbCartItems];
    for (const guestItem of guestCart) {
      const existing = mergedCart.find(x => x.variant_id === guestItem.variant_id);
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        mergedCart.push(guestItem);
      }
    }

    // 3. Post to save
    const syncRes = await apiRequest("/api/user/cart", {
      method: "POST",
      body: JSON.stringify({ items: mergedCart })
    });

    if (syncRes && syncRes.items) {
      localStorage.setItem("velura_cart", JSON.stringify(syncRes.items));
    } else {
      localStorage.setItem("velura_cart", JSON.stringify(mergedCart));
    }
    updateBadge();
  } catch (err) {
    console.error("Failed to merge cart on login:", err);
    showToast(err.message || "Đồng bộ giỏ hàng thất bại.");
  }
}

export async function saveCart(cart) {
  localStorage.setItem("velura_cart", JSON.stringify(cart));
  updateBadge();
  await syncCartWithDb(cart);
}

export async function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(x => x.variant_id === item.variant_id);

  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push({
      variant_id: item.variant_id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      color: item.color,
      size: item.size
    });
  }

  await saveCart(cart);
  showToast(`Đã thêm ${item.product_name} vào giỏ hàng!`);
}

export function removeFromCart(variantId) {
  let cart = getCart();
  const item = cart.find(x => x.variant_id === variantId);
  cart = cart.filter(x => x.variant_id !== variantId);
  saveCart(cart);
  if (item) {
    showToast(`Đã xóa ${item.product_name} khỏi giỏ hàng.`);
  }
}

export function updateQty(variantId, newQty) {
  if (newQty <= 0) {
    removeFromCart(variantId);
    return;
  }
  const cart = getCart();
  const item = cart.find(x => x.variant_id === variantId);
  if (item) {
    item.quantity = newQty;
    saveCart(cart);
  }
}

export function clearCart() {
  localStorage.removeItem("velura_cart");
  updateBadge();
  syncCartWithDb([]);
}

export function updateBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll(".cart-badge");
  badges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";
  });
}

// Helper to track selected items in checkout
function getSelectedItems() {
  const raw = sessionStorage.getItem("selected_cart_items");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch(e) {}
  }
  const cart = getCart();
  return cart.map(x => x.variant_id);
}

function setSelectedItems(selectedIds) {
  sessionStorage.setItem("selected_cart_items", JSON.stringify(selectedIds));
}

function getCheckoutItems() {
  const raw = sessionStorage.getItem("checkout_items");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch(e) {}
  }
  return getCart();
}

export async function mergeLocalCartWithDb() {
  const token = localStorage.getItem("velura_token");
  if (!token) return;
  
  const localCart = getCart();
  if (localCart.length === 0) return;
  
  try {
    const res = await apiRequest("/api/user/cart");
    const dbItems = (res && res.items) ? res.items : [];
    
    const mergedMap = new Map();
    dbItems.forEach(item => {
      mergedMap.set(item.variant_id, item);
    });
    
    localCart.forEach(item => {
      if (mergedMap.has(item.variant_id)) {
        const existing = mergedMap.get(item.variant_id);
        existing.quantity += item.quantity;
      } else {
        mergedMap.set(item.variant_id, item);
      }
    });
    
    const mergedList = Array.from(mergedMap.values());
    
    await syncCartWithDb(mergedList);
    localStorage.setItem("velura_cart", JSON.stringify(mergedList));
    updateBadge();
    console.log("Local guest cart successfully merged with member cart.");
  } catch (err) {
    console.error("Cart merging failed:", err);
  }
}

// ----------------------------------------------------
// Page-specific initialization & controllers
// ----------------------------------------------------
export async function initCart() {
  // Always update badge count on load
  updateBadge();

  const token = localStorage.getItem("velura_token");
  if (token && !sessionStorage.getItem("cart_merged")) {
    sessionStorage.setItem("cart_merged", "true");
    await mergeLocalCartWithDb();
  }

  // Sync cart from DB on load if logged in
  fetchAndSyncCart();
  updateBadge();

  const path = window.location.pathname;

  if (path.includes("/cart.html")) {
    renderCartPage();
  } else if (path.includes("/payment-user.html")) {
    initPaymentUserPage();
  } else if (path.includes("/payment-guest.html")) {
    initPaymentGuestPage();
  } else if (path.includes("/shipping-payment.html")) {
    initShippingPaymentPage();
  } else if (path.includes("/order-confirm.html") || path.includes("/otp-verify.html")) {
    initOrderConfirmPage();
  } else if (path.includes("/payment-confirm.html")) {
    initPaymentConfirmPage();
  } else if (path.includes("/payment-failed.html")) {
    initPaymentFailedPage();
  }
}

// 1. RENDER CART PAGE (cart.html)
function renderCartPage() {
  const cartContainer = document.querySelector(".cart-items");
  const cartCountEl = document.querySelector(".cart-count");
  const subtotalEl = document.querySelector(".summary-line:first-child .summary-line__value");
  const grandTotalEl = document.querySelector(".summary-total .summary-total__value");
  const couponInput = document.getElementById("couponCode");
  const couponBtn = document.querySelector(".coupon-btn");
  const checkoutBtn = document.querySelector(".js-btn-checkout");

  if (!cartContainer) return;

  const cart = getCart();
  
  if (cartCountEl) {
    const totalQty = cart.reduce((sum, x) => sum + x.quantity, 0);
    cartCountEl.textContent = `Bạn đang có ${totalQty} sản phẩm trong giỏ`;
  }

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 24px; font-family: 'DM Sans', sans-serif;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#A18265" stroke-width="1.5" style="margin-bottom: 16px;">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p style="color: #6B635D; font-size: 1.125rem; margin-bottom: 24px;">Giỏ hàng của bạn đang trống.</p>
        <a href="/index.html" class="btn btn--primary" style="display: inline-block; padding: 12px 24px; text-decoration: none;">Tiếp tục mua sắm</a>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "0₫";
    if (grandTotalEl) grandTotalEl.textContent = "0₫";
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = "0.5";
      checkoutBtn.style.cursor = "not-allowed";
    }
    return;
  }

  const selectedIds = getSelectedItems();

  // Render items
  cartContainer.innerHTML = cart.map(item => {
    const isChecked = selectedIds.includes(item.variant_id);
    return `
      <div class="cart-item" data-id="${item.variant_id}" style="display: flex; align-items: center;">
        <div class="cart-item__select" style="display: flex; align-items: center; justify-content: center; padding: 0 8px 0 16px;">
          <input type="checkbox" class="js-cart-item-checkbox" data-id="${item.variant_id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--terracotta);" ${isChecked ? "checked" : ""} />
        </div>
        <div class="cart-item__image">
          <img src="${item.product_image || '../../assets/images/placeholder.png'}" alt="${item.product_name}" />
        </div>
        <div class="cart-item__details" style="flex: 1;">
          <div class="cart-item__header-row">
            <h3 class="cart-item__name">${item.product_name}</h3>
            <button class="cart-item__delete js-cart-delete" type="button" aria-label="Xóa sản phẩm" data-id="${item.variant_id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
          <div class="cart-item__tags">
            <span class="cart-item__tag">Size: ${item.size || "M"}</span>
            <span class="cart-item__tag">Màu: ${item.color || "Mặc định"}</span>
          </div>
          <div class="cart-item__footer-row">
            <div class="qty-selector">
              <button class="qty-selector__btn js-cart-qty-minus" type="button" data-id="${item.variant_id}">-</button>
              <span class="qty-selector__value">${item.quantity}</span>
              <button class="qty-selector__btn js-cart-qty-plus" type="button" data-id="${item.variant_id}">+</button>
            </div>
            <div class="cart-item__price-block">
              <span class="cart-item__price">${(item.unit_price * item.quantity).toLocaleString("vi-VN")}₫</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Calculate Subtotal (selected only)
  const selectedCart = cart.filter(x => selectedIds.includes(x.variant_id));
  const subtotal = selectedCart.reduce((sum, x) => sum + x.unit_price * x.quantity, 0);
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString("vi-VN")}₫`;

  // Read discount
  const discountAmount = parseInt(localStorage.getItem("checkout_discount") || 0, 10);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  if (grandTotalEl) grandTotalEl.textContent = `${grandTotal.toLocaleString("vi-VN")}₫`;

  // Bind Event Listeners
  cartContainer.querySelectorAll(".js-cart-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      removeFromCart(id);
      renderCartPage();
    });
  });

  cartContainer.querySelectorAll(".js-cart-qty-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = cart.find(x => x.variant_id === id);
      if (item) {
        updateQty(id, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  cartContainer.querySelectorAll(".js-cart-qty-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = cart.find(x => x.variant_id === id);
      if (item) {
        updateQty(id, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  cartContainer.querySelectorAll(".js-cart-item-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-id");
      let currentSelected = getSelectedItems();
      if (cb.checked) {
        if (!currentSelected.includes(id)) {
          currentSelected.push(id);
        }
      } else {
        currentSelected = currentSelected.filter(x => x !== id);
      }
      setSelectedItems(currentSelected);
      renderCartPage();
    });
  });

  const selectAllCheckbox = document.getElementById("selectAllItems");
  if (selectAllCheckbox) {
    const allSelected = cart.every(x => selectedIds.includes(x.variant_id));
    selectAllCheckbox.checked = allSelected;

    selectAllCheckbox.addEventListener("change", () => {
      if (selectAllCheckbox.checked) {
        setSelectedItems(cart.map(x => x.variant_id));
      } else {
        setSelectedItems([]);
      }
      renderCartPage();
    });
  }

  // Apply Coupon via backend
  if (couponBtn && couponInput) {
    // replace default event listener
    const newCouponBtn = couponBtn.cloneNode(true);
    couponBtn.parentNode.replaceChild(newCouponBtn, couponBtn);

    newCouponBtn.addEventListener("click", () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        showToast("Vui lòng nhập mã giảm giá");
        return;
      }
      
      apiRequest("/api/user/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code, order_value: subtotal })
      }).then(res => {
        if (res && res.success) {
          localStorage.setItem("checkout_discount", res.discount_amount.toString());
          localStorage.setItem("checkout_voucher_id", res.voucher_id);
          localStorage.setItem("checkout_voucher_code", res.code);
          showToast(`Áp dụng mã giảm giá ${res.code} thành công: -${res.discount_amount.toLocaleString("vi-VN")}₫`);
          renderCartPage();
        } else {
          showToast("Không áp dụng được mã giảm giá");
        }
      }).catch(err => {
        showToast(err.message || "Mã giảm giá không hợp lệ hoặc không đủ điều kiện");
      });
    });
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";
    checkoutBtn.style.cursor = "pointer";

    // replace checkout event handler
    const newCheckoutBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);

    newCheckoutBtn.addEventListener("click", () => {
      const currentSelected = getSelectedItems();
      const finalSelectedItems = cart.filter(x => currentSelected.includes(x.variant_id));
      if (finalSelectedItems.length === 0) {
        showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
        return;
      }

      sessionStorage.setItem("checkout_items", JSON.stringify(finalSelectedItems));

      const token = localStorage.getItem("velura_token");
      if (token) {
        window.location.href = "/src/pages/checkout/payment-user.html";
      } else {
        window.location.href = "/src/pages/checkout/payment-guest.html";
      }
    });
  }
}

// 2. RENDER ORDER SUMMARY ON SIDEBAR
function renderOrderSummarySidebar(shippingFee = 0) {
  const subtotalEl = document.querySelector(".order-summary .summary-lines .summary-line:first-child .summary-line__value");
  const shippingLine = document.querySelector(".order-summary .summary-lines .summary-line--shipping .summary-line__value");
  const grandTotalEl = document.querySelector(".order-summary .summary-total .summary-total__value");
  
  const cart = getCheckoutItems();
  const subtotal = cart.reduce((sum, x) => sum + x.unit_price * x.quantity, 0);

  if (subtotalEl) {
    subtotalEl.textContent = `${subtotal.toLocaleString("vi-VN")}₫`;
  }

  const discountAmount = parseInt(localStorage.getItem("checkout_discount") || 0, 10);
  
  // Dynamically add discount line if present
  const summaryLinesContainer = document.querySelector(".order-summary .summary-lines");
  if (summaryLinesContainer) {
    const existingPromo = document.querySelector(".summary-line--discount");
    if (existingPromo) existingPromo.remove();
    
    if (discountAmount > 0) {
      const discountDiv = document.createElement("div");
      discountDiv.className = "summary-line summary-line--discount";
      discountDiv.innerHTML = `<span>Khuyến mãi</span><span class="summary-line__value" style="color: #C97B63;">-${discountAmount.toLocaleString("vi-VN")}₫</span>`;
      summaryLinesContainer.appendChild(discountDiv);
    }
  }

  if (shippingLine) {
    shippingLine.textContent = shippingFee > 0 ? `${shippingFee.toLocaleString("vi-VN")}đ` : "Miễn phí";
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  if (grandTotalEl) {
    grandTotalEl.textContent = `${grandTotal.toLocaleString("vi-VN")}₫`;
  }
}

// 3. INITIALIZE MEMBER CHECKOUT PAGE (payment-user.html)
async function initPaymentUserPage() {
  const token = localStorage.getItem("velura_token");
  if (!token) {
    window.location.href = "/src/pages/checkout/payment-guest.html";
    return;
  }

  renderOrderSummarySidebar(0);

  const addressListContainer = document.querySelector(".address-list");
  if (!addressListContainer) return;

  // Show loading indicator
  addressListContainer.innerHTML = `<div style="text-align: center; padding: 16px; color: #6B635D; font-size: 0.875rem;">Đang tải danh sách địa chỉ...</div>`;

  let user = {};
  let addresses = [];

  try {
    const freshUser = await apiRequest("/api/user/profile");
    if (freshUser) {
      localStorage.setItem("velura_user", JSON.stringify(freshUser));
      user = freshUser;
      addresses = freshUser.saved_addresses || [];
    }
  } catch (err) {
    console.error("Không thể lấy thông tin địa chỉ mới nhất:", err);
    user = JSON.parse(localStorage.getItem("velura_user") || "{}");
    addresses = user.saved_addresses || [];
  }

  if (addresses.length > 0) {
    addressListContainer.innerHTML = addresses.map((addr, idx) => `
      <label class="address-card ${idx === 0 ? "address-card--default is-selected" : "address-card--secondary"}" style="cursor: pointer;">
        <input type="radio" name="address" value="${idx}" ${idx === 0 ? "checked" : ""} style="display: none;" />
        <div class="address-card__head">
          <span class="address-card__name">${addr.name || addr.recipient_name || user.full_name || ""}</span>
          ${idx === 0 ? '<span class="address-card__badge">Mặc định</span>' : ""}
        </div>
        <p class="address-card__phone">${addr.phone || addr.recipient_phone || user.phone || "Chưa có SĐT"}</p>
        <p class="address-card__addr">${addr.detail || addr.address || addr.address_line || ""}</p>
      </label>
    `).join("");

    const cards = addressListContainer.querySelectorAll(".address-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        const radio = card.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
      });
    });
  } else {
    addressListContainer.innerHTML = `
      <div style="padding: 24px; border: 1.5px dashed #E8DFD6; border-radius: 8px; color: #6B635D; text-align: center; font-size: 0.875rem; line-height: 1.5;">
        Bạn chưa lưu địa chỉ nhận hàng nào.<br/>
        Vui lòng bấm <strong>+ Thêm địa chỉ mới</strong> ở bên dưới để tiếp tục.
      </div>
    `;
  }

  // Address Modal HTML popup handling
  const modal = document.getElementById("address-modal");
  const form = document.getElementById("address-form");
  const provinceSelect = document.getElementById("address-province");
  const districtSelect = document.getElementById("address-district");
  const wardSelect = document.getElementById("address-ward");

  const locationData = {
    HCM: {
      name: "TP. Hồ Chí Minh",
      districts: {
        Q1: {
          name: "Quận 1",
          wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Phạm Ngũ Lão"]
        },
        Q7: {
          name: "Quận 7",
          wards: ["Phường Tân Phong", "Phường Tân Kiểng", "Phường Tân Quy"]
        },
        QBT: {
          name: "Quận Bình Thạnh",
          wards: ["Phường 25", "Phường 26", "Phường 27"]
        }
      }
    },
    HN: {
      name: "TP. Hà Nội",
      districts: {
        QHK: {
          name: "Quận Hoàn Kiếm",
          wards: ["Phường Hàng Bài", "Phường Tràng Tiền", "Phường Lý Thái Tổ"]
        },
        QBD: {
          name: "Quận Ba Đình",
          wards: ["Phường Điện Biên", "Phường Quán Thánh", "Phường Ngọc Hà"]
        }
      }
    },
    DN: {
      name: "TP. Đà Nẵng",
      districts: {
        QHC: {
          name: "Quận Hải Châu",
          wards: ["Phường Hòa Cường Bắc", "Phường Hòa Cường Nam", "Phường Thạch Thang"]
        }
      }
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove("is-visible");
      document.body.style.overflow = "";
    }
  };

  if (modal) {
    const btnCloseList = modal.querySelectorAll(".js-btn-close-modal");
    btnCloseList.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", closeModal);
    });

    const backdrop = modal.querySelector(".modal__backdrop");
    if (backdrop) {
      const newBackdrop = backdrop.cloneNode(true);
      backdrop.parentNode.replaceChild(newBackdrop, backdrop);
      newBackdrop.addEventListener("click", closeModal);
    }
  }

  if (provinceSelect) {
    const newProvinceSelect = provinceSelect.cloneNode(true);
    provinceSelect.parentNode.replaceChild(newProvinceSelect, provinceSelect);
    newProvinceSelect.addEventListener("change", (e) => {
      const provinceKey = e.target.value;
      const updatedDistrictSelect = document.getElementById("address-district");
      const updatedWardSelect = document.getElementById("address-ward");
      
      if (updatedDistrictSelect && locationData[provinceKey]) {
        updatedDistrictSelect.innerHTML = '<option value="" disabled selected>Chọn Quận/Huyện</option>';
        updatedDistrictSelect.disabled = false;
        if (updatedWardSelect) {
          updatedWardSelect.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
          updatedWardSelect.disabled = true;
        }
        const districts = locationData[provinceKey].districts;
        for (const key in districts) {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = districts[key].name;
          updatedDistrictSelect.appendChild(option);
        }
      }
    });
  }

  const activeDistrictSelect = document.getElementById("address-district");
  if (activeDistrictSelect) {
    const newDistrictSelect = activeDistrictSelect.cloneNode(true);
    activeDistrictSelect.parentNode.replaceChild(newDistrictSelect, activeDistrictSelect);
    newDistrictSelect.addEventListener("change", (e) => {
      const activeProvSelect = document.getElementById("address-province");
      const updatedWardSelect = document.getElementById("address-ward");
      const provinceKey = activeProvSelect.value;
      const districtKey = e.target.value;
      
      if (updatedWardSelect && locationData[provinceKey] && locationData[provinceKey].districts[districtKey]) {
        updatedWardSelect.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
        updatedWardSelect.disabled = false;
        const wards = locationData[provinceKey].districts[districtKey].wards;
        wards.forEach(ward => {
          const option = document.createElement("option");
          option.value = ward;
          option.textContent = ward;
          updatedWardSelect.appendChild(option);
        });
      }
    });
  }

  // Add Address Handler
  const btnAdd = document.querySelector(".btn-add-address");
  if (btnAdd && modal) {
    const newBtnAdd = btnAdd.cloneNode(true);
    btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
    newBtnAdd.style.cursor = "pointer";
    
    newBtnAdd.addEventListener("click", () => {
      if (form) {
        form.reset();
        
        // Auto-fill logged in user info (Họ tên & Số điện thoại)
        const addressFullnameInput = document.getElementById("address-fullname");
        const addressPhoneInput = document.getElementById("address-phone");
        if (addressFullnameInput) addressFullnameInput.value = user.full_name || "";
        if (addressPhoneInput) addressPhoneInput.value = user.phone || "";
        
        const currentDistrict = document.getElementById("address-district");
        const currentWard = document.getElementById("address-ward");
        if (currentDistrict) {
          currentDistrict.innerHTML = '<option value="" disabled selected>Chọn Quận/Huyện</option>';
          currentDistrict.disabled = true;
        }
        if (currentWard) {
          currentWard.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
          currentWard.disabled = true;
        }
      }
      
      modal.classList.add("is-visible");
      document.body.style.overflow = "hidden";
    });
  }

  // Submit address modal handler
  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const fullname = document.getElementById("address-fullname");
      const phone = document.getElementById("address-phone");
      const province = document.getElementById("address-province");
      const district = document.getElementById("address-district");
      const ward = document.getElementById("address-ward");
      const detail = document.getElementById("address-detail");
      const isDefault = document.getElementById("address-is-default").checked;

      let hasError = false;
      const validateField = (el, condition, msg) => {
        el.classList.remove("is-invalid");
        const parent = el.closest(".profile-form__input-wrapper") || el.parentNode;
        const feed = parent.querySelector(".invalid-feedback");
        if (feed) feed.remove();

        if (!condition) {
          el.classList.add("is-invalid");
          const feedback = document.createElement("div");
          feedback.className = "invalid-feedback";
          feedback.textContent = msg;
          parent.appendChild(feedback);
          hasError = true;
        }
      };

      validateField(fullname, fullname.value.trim() !== "", "Họ và tên không được để trống");
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      validateField(phone, phoneRegex.test(phone.value.trim().replace(/\s+/g, "")), "Số điện thoại không hợp lệ");
      validateField(province, province.value !== "", "Vui lòng chọn Tỉnh/Thành phố");
      validateField(district, !district.disabled && district.value !== "", "Vui lòng chọn Quận/Huyện");
      validateField(ward, !ward.disabled && ward.value !== "", "Vui lòng chọn Phường/Xã");
      validateField(detail, detail.value.trim() !== "", "Địa chỉ chi tiết không được để trống");

      if (hasError) return;

      const provName = province.options[province.selectedIndex].text;
      const distName = district.options[district.selectedIndex].text;
      const wardName = ward.value;
      const fullDetailString = `${detail.value.trim()}, ${wardName}, ${distName}, ${provName}`;

      const newAddress = {
        name: fullname.value.trim(),
        phone: phone.value.trim(),
        detail: fullDetailString,
        is_default: isDefault || addresses.length === 0
      };

      let updatedAddresses = [...addresses];
      if (newAddress.is_default) {
        updatedAddresses = updatedAddresses.map(addr => ({ ...addr, is_default: false }));
      }
      updatedAddresses.push(newAddress);

      try {
        const res = await apiRequest("/api/user/addresses", {
          method: "PATCH",
          body: JSON.stringify({ addresses: updatedAddresses })
        });
        if (res && res.success) {
          user.saved_addresses = updatedAddresses;
          localStorage.setItem("velura_user", JSON.stringify(user));
          showToast("Đã thêm địa chỉ mới thành công!");
          closeModal();
          await initPaymentUserPage(); // Re-render address list
        } else {
          throw new Error("Lỗi lưu địa chỉ");
        }
      } catch (err) {
        console.error(err);
        showToast("Không thể thêm địa chỉ mới. Vui lòng thử lại.");
      }
    });
  }

  const continueBtn = document.querySelector(".checkout-actions .btn--primary");
  if (continueBtn) {
    const newContinueBtn = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);

    newContinueBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      const selectedRadio = document.querySelector("input[name='address']:checked");
      if (!selectedRadio) {
        showToast("Vui lòng thêm và chọn địa chỉ giao hàng!");
        return;
      }

      const idx = parseInt(selectedRadio.value, 10);
      const addrObj = addresses[idx];

      if (!addrObj) {
        showToast("Địa chỉ đã chọn không hợp lệ!");
        return;
      }

      const shippingInfo = {
        name: addrObj.name || addrObj.recipient_name || user.full_name || "",
        phone: addrObj.phone || addrObj.recipient_phone || user.phone || "",
        email: user.email || "",
        address: addrObj.detail || addrObj.address || addrObj.address_line || "",
        note: document.getElementById("note")?.value || ""
      };

      if (!shippingInfo.phone || !shippingInfo.address) {
        showToast("Thông tin địa chỉ giao hàng không đầy đủ!");
        return;
      }

      localStorage.setItem("checkout_shipping", JSON.stringify(shippingInfo));
      window.location.href = "./shipping-payment.html";
    });
  }
}

// 4. INITIALIZE GUEST CHECKOUT PAGE (payment-guest.html)
function initPaymentGuestPage() {
  renderOrderSummarySidebar(0);

  const phoneInput = document.getElementById("guest-phone");
  const passwordGroup = document.getElementById("guest-password-group");
  
  if (phoneInput) {
    phoneInput.addEventListener("blur", async () => {
      const phone = phoneInput.value.trim();
      if (!phone) return;
      try {
        const res = await apiRequest(`/api/user/auth/check-exists?phone=${phone}`);
        if (res && res.exists) {
          if (passwordGroup) {
            passwordGroup.style.display = "block";
            showToast("Số điện thoại đã được đăng ký thành viên. Vui lòng nhập mật khẩu để thanh toán nhanh hơn!");
          }
        } else {
          if (passwordGroup) passwordGroup.style.display = "none";
        }
      } catch(e) {}
    });
  }

  const continueBtn = document.querySelector(".checkout-actions .btn--primary");
  if (continueBtn) {
    continueBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const name = document.getElementById("fullname")?.value.trim();
      const phone = phoneInput?.value.trim();
      const email = document.getElementById("guest-email")?.value.trim();
      const address = document.getElementById("guest-address")?.value.trim();
      const note = document.getElementById("guest-note")?.value.trim();

      if (!name || !phone || !address) {
        showToast("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ!");
        return;
      }

      const passwordInput = document.getElementById("guest-password");
      if (passwordGroup && passwordGroup.style.display === "block") {
        const password = passwordInput?.value;
        if (!password) {
          showToast("Vui lòng nhập mật khẩu của bạn để đăng nhập!");
          return;
        }
        
        try {
          const authRes = await apiRequest("/api/user/auth/signin", {
            method: "POST",
            body: JSON.stringify({ phone, password })
          });
          if (authRes && authRes.token) {
            storeAuthSession(authRes);
            showToast("Đăng nhập thành công!");
            await mergeLocalCartWithDb();
            setTimeout(() => {
              window.location.href = "./payment-user.html";
            }, 1000);
            return;
          }
        } catch(err) {
          showToast(err.message || "Mật khẩu không đúng");
          return;
        }
      }

      const shippingInfo = {
        name,
        phone,
        email,
        address,
        note
      };

      localStorage.setItem("checkout_shipping", JSON.stringify(shippingInfo));
      window.location.href = "./shipping-payment.html";
    });
  }
}

// 5. INITIALIZE SHIPPING & PAYMENT SELECTION PAGE (shipping-payment.html)
function initShippingPaymentPage() {
  renderOrderSummarySidebar(50000);

  const shippingRadios = document.querySelectorAll("input[name='shipping']");
  const paymentRadios = document.querySelectorAll("input[name='payment']");
  const continueBtn = document.getElementById("btn-submit-order");

  shippingRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      shippingRadios.forEach(r => {
        r.closest(".option-card")?.classList.remove("is-selected");
      });
      radio.closest(".option-card")?.classList.add("is-selected");

      const fee = radio.value === "express" ? 50000 : 30000;
      renderOrderSummarySidebar(fee);
    });
  });

  paymentRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      paymentRadios.forEach(r => {
        r.closest(".option-card")?.classList.remove("is-selected");
      });
      radio.closest(".option-card")?.classList.add("is-selected");
    });
  });

  if (continueBtn) {
    continueBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const activeShipping = document.querySelector("input[name='shipping']:checked")?.value || "express";
      const activePayment = document.querySelector("input[name='payment']:checked")?.value || "cod";
      
      const shippingFee = activeShipping === "express" ? 50000 : 30000;

      const methods = {
        shippingMethod: activeShipping,
        shippingFee: shippingFee,
        paymentMethod: activePayment.toUpperCase()
      };

      localStorage.setItem("checkout_methods", JSON.stringify(methods));
      window.location.href = "/src/pages/checkout/order-confirm.html";
    });
  }
}

// 6. INITIALIZE ORDER REVIEW / CONFIRMATION PAGE (order-confirm.html / otp-verify.html)
function initOrderConfirmPage() {
  const isOtpPage = window.location.pathname.includes("/otp-verify.html");
  const cart = getCheckoutItems();
  const shipping = JSON.parse(localStorage.getItem("checkout_shipping") || "{}");
  const methods = JSON.parse(localStorage.getItem("checkout_methods") || "{}");

  if (!cart.length || !shipping.name || !methods.shippingMethod) {
    if (!isOtpPage) window.location.href = "/src/pages/cart/cart.html";
    return;
  }

  // Render Address Info
  const recipientNameEl = document.querySelector(".review-section__name");
  if (recipientNameEl) recipientNameEl.textContent = shipping.name;
  
  const addressBlock = document.querySelector(".review-section:nth-of-type(1) .review-section__text");
  if (addressBlock) {
    addressBlock.innerHTML = `${shipping.phone}<br/>${shipping.address}`;
  }

  // Render Shipping info
  const shippingBlock = document.querySelector(".review-section:nth-of-type(2) .review-section__text");
  if (shippingBlock) {
    const feeText = methods.shippingFee > 0 ? `${methods.shippingFee.toLocaleString("vi-VN")}đ` : "Miễn phí";
    shippingBlock.textContent = methods.shippingMethod === "express" 
      ? `Giao hàng nhanh (1-2 ngày) — ${feeText}`
      : `Giao hàng tiêu chuẩn (3-5 ngày) — ${feeText}`;
  }

  // Render Payment Method info
  const paymentBlock = document.querySelector(".review-section:nth-of-type(3) .review-section__text");
  if (paymentBlock) {
    if (methods.paymentMethod === "COD") {
      paymentBlock.textContent = "Thanh toán khi nhận hàng (COD)";
    } else if (methods.paymentMethod === "VNPAY") {
      paymentBlock.textContent = "Ví điện tử VNPay";
    } else if (methods.paymentMethod === "MOMO") {
      paymentBlock.textContent = "Ví điện tử MoMo";
    }
  }

  // Render products
  const productContainer = document.querySelector(".product-item");
  if (productContainer) {
    const parentContainer = productContainer.parentNode;
    const existingArticles = parentContainer.querySelectorAll("article.product-item");
    existingArticles.forEach(a => a.remove());

    cart.forEach(item => {
      const article = document.createElement("article");
      article.className = "product-item";
      article.style.marginBottom = "16px";
      article.innerHTML = `
        <div class="product-item__img">
          <img src="${item.product_image || '../../assets/images/placeholder.png'}" alt="${item.product_name}" width="96" height="128" />
        </div>
        <div style="display:flex;flex-direction:column;flex:1">
          <h4 class="product-item__name">${item.product_name}</h4>
          <p class="product-item__variant">${item.color || "Mặc định"} / Size ${item.size || "M"}</p>
          <p class="product-item__qty">Số lượng: ${item.quantity}</p>
          <p class="product-item__price">${(item.unit_price * item.quantity).toLocaleString("vi-VN")} VND</p>
        </div>
      `;
      parentContainer.insertBefore(article, parentContainer.querySelector(".checkout-actions"));
    });
  }

  // Render summary totals
  const subtotal = cart.reduce((sum, x) => sum + x.unit_price * x.quantity, 0);
  const discountAmount = parseInt(localStorage.getItem("checkout_discount") || 0, 10);
  const subtotalEl = document.querySelector(".order-summary .summary-lines .summary-line:nth-of-type(1) .summary-line__value");
  const shippingEl = document.querySelector(".order-summary .summary-lines .summary-line:nth-of-type(2) .summary-line__value");
  const grandTotalEl = document.querySelector(".order-summary .summary-total .summary-total__value");

  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString("vi-VN")}₫`;
  if (shippingEl) shippingEl.textContent = `${methods.shippingFee.toLocaleString("vi-VN")}đ`;
  
  const sidebarLines = document.querySelector(".order-summary .summary-lines");
  if (sidebarLines) {
    const existingPromo = document.querySelector(".summary-line--discount");
    if (existingPromo) existingPromo.remove();

    if (discountAmount > 0) {
      const promoLine = document.createElement("div");
      promoLine.className = "summary-line summary-line--discount";
      promoLine.innerHTML = `<span>Khuyến mãi</span><span class="summary-line__value" style="color: #C97B63;">-${discountAmount.toLocaleString("vi-VN")}₫</span>`;
      sidebarLines.appendChild(promoLine);
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + methods.shippingFee);
  if (grandTotalEl) grandTotalEl.textContent = `${grandTotal.toLocaleString("vi-VN")}₫`;

  // Handle specific OTP Verify Page Actions
  if (isOtpPage) {
    const otpInputs = document.querySelectorAll(".otp-input");
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        const val = e.target.value;
        if (val.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    const timerEl = document.querySelector(".otp-timer");
    const resendBtn = document.querySelector(".otp-resend button");
    let countdown = 60;
    let timerInterval;

    function startTimer() {
      countdown = 60;
      if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.style.opacity = "0.5";
      }
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        countdown--;
        if (timerEl) timerEl.textContent = `(${countdown}s)`;
        if (countdown <= 0) {
          clearInterval(timerInterval);
          if (timerEl) timerEl.textContent = "";
          if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.style.opacity = "1";
          }
        }
      }, 1000);
    }
    startTimer();

    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        try {
          const guestPayload = JSON.parse(sessionStorage.getItem("guest_checkout_payload") || "{}");
          const res = await apiRequest("/api/user/orders/otp-send", {
            method: "POST",
            body: JSON.stringify({
              phone: guestPayload.phone,
              email: guestPayload.email || "",
              full_name: guestPayload.shipping_name
            })
          });
          if (res.success) {
            showToast("Mã OTP mới đã được gửi thành công!");
            startTimer();
          } else {
            showToast("Không thể gửi lại mã OTP. Vui lòng thử lại!");
          }
        } catch (e) {
          showToast("Lỗi gửi lại mã OTP");
        }
      });
    }

    const otpConfirmBtn = document.querySelector(".js-otp-btn-confirm");
    if (otpConfirmBtn) {
      otpConfirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const enteredOtp = Array.from(otpInputs).map(x => x.value.trim()).join("");
        if (enteredOtp.length < 4) {
          showToast("Vui lòng nhập đầy đủ mã OTP 4 chữ số!");
          return;
        }

        try {
          otpConfirmBtn.textContent = "Đang xác thực...";
          otpConfirmBtn.style.pointerEvents = "none";
          otpConfirmBtn.style.opacity = "0.7";

          const guestPayload = JSON.parse(sessionStorage.getItem("guest_checkout_payload") || "{}");
          if (!guestPayload.phone) {
            showToast("Thông tin đặt hàng không hợp lệ. Vui lòng thử lại từ đầu.");
            return;
          }

          const payload = {
            phone: guestPayload.phone,
            otp: enteredOtp,
            order: {
              shipping_name: guestPayload.shipping_name,
              shipping_phone: guestPayload.phone,
              shipping_address: guestPayload.shipping_address,
              shipping_fee: guestPayload.shipping_fee,
              voucher_id: guestPayload.voucher_id,
              discount_amount: guestPayload.discount_amount,
              subtotal: guestPayload.subtotal,
              total_amount: guestPayload.total_amount,
              payment_method: guestPayload.payment_method,
              shipping_email: guestPayload.email || "",
              items: guestPayload.items.map(item => ({
                variant_id: item.variant_id,
                product_name: item.product_name,
                product_image: item.product_image,
                quantity: item.quantity,
                unit_price: item.unit_price
              }))
            }
          };

          const verifyRes = await apiRequest("/api/user/orders/otp-verify", {
            method: "POST",
            body: JSON.stringify(payload)
          });

          if (verifyRes.success) {
            storeAuthSession(verifyRes);
            sessionStorage.setItem("cart_merged", "true");

            if (verifyRes.temp_password) {
              localStorage.setItem("guest_temp_password", verifyRes.temp_password);
            }

            localStorage.setItem("created_order", JSON.stringify({
              order_id: verifyRes.order.order_id,
              tracking_code: verifyRes.order.tracking_code,
              payment_method: verifyRes.order.payment_method,
              shipping_address: verifyRes.order.shipping_address,
              shipping_method: methods.shippingMethod
            }));

            const mainCart = getCart();
            const checkedOutIds = guestPayload.items.map(x => x.variant_id);
            const remainingCart = mainCart.filter(x => !checkedOutIds.includes(x.variant_id));
            localStorage.setItem("velura_cart", JSON.stringify(remainingCart));
            await syncCartWithDb(remainingCart);

            sessionStorage.removeItem("checkout_items");
            sessionStorage.removeItem("guest_checkout_payload");
            localStorage.removeItem("checkout_shipping");
            localStorage.removeItem("checkout_methods");
            localStorage.removeItem("checkout_discount");
            localStorage.removeItem("checkout_voucher_id");
            localStorage.removeItem("checkout_voucher_code");

            if (guestPayload.payment_method === "VNPAY" || guestPayload.payment_method === "MOMO") {
              window.location.href = `/src/pages/checkout/mock-payment.html?order_id=${verifyRes.order.order_id}&amount=${guestPayload.total_amount}&method=${guestPayload.payment_method}`;
            } else {
              showToast("Thanh toán & Đăng ký thành công!");
              setTimeout(() => {
                window.location.href = "/src/pages/checkout/payment-confirm.html";
              }, 1500);
            }
          } else {
            throw new Error(verifyRes.message || "Xác thực OTP không thành công");
          }
        } catch (err) {
          showToast(err.message || "Lỗi xác thực OTP");
          otpConfirmBtn.textContent = "Xác nhận";
          otpConfirmBtn.style.pointerEvents = "auto";
          otpConfirmBtn.style.opacity = "1";
        }
      });
    }
  }

  // Submit Order Button
  const submitOrderBtn = document.querySelector(".checkout-actions .btn");
  if (submitOrderBtn && !isOtpPage) {
    const token = localStorage.getItem("velura_token");
    if (!token) {
      submitOrderBtn.textContent = "Nhận mã OTP & Đặt hàng";
    }

    submitOrderBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        submitOrderBtn.textContent = "Đang xử lý...";
        submitOrderBtn.style.pointerEvents = "none";
        submitOrderBtn.style.opacity = "0.7";

        if (token) {
          // Member Checkout
          const orderItems = cart.map(item => ({
            variant_id: item.variant_id,
            product_name: item.product_name,
            product_image: item.product_image,
            quantity: item.quantity,
            unit_price: item.unit_price
          }));

          const payload = {
            shipping_name: shipping.name,
            shipping_phone: shipping.phone,
            shipping_address: shipping.address,
            shipping_fee: methods.shippingFee,
            voucher_id: localStorage.getItem("checkout_voucher_id") || null,
            discount_amount: discountAmount,
            subtotal: subtotal,
            total_amount: grandTotal,
            payment_method: methods.paymentMethod,
            shipping_email: shipping.email || "",
            items: orderItems
          };

          const res = await apiRequest("/api/user/orders", {
            method: "POST",
            body: JSON.stringify(payload)
          });

          if (res.success) {
            localStorage.setItem("created_order", JSON.stringify({
              order_id: res.order.order_id,
              tracking_code: res.order.tracking_code,
              payment_method: res.order.payment_method,
              shipping_address: res.order.shipping_address,
              shipping_method: methods.shippingMethod
            }));

            // Remove only checked out items
            const mainCart = getCart();
            const checkedOutIds = cart.map(x => x.variant_id);
            const remainingCart = mainCart.filter(x => !checkedOutIds.includes(x.variant_id));
            localStorage.setItem("velura_cart", JSON.stringify(remainingCart));
            syncCartWithDb(remainingCart);

            sessionStorage.removeItem("checkout_items");
            localStorage.removeItem("checkout_shipping");
            localStorage.removeItem("checkout_methods");
            localStorage.removeItem("checkout_discount");
            localStorage.removeItem("checkout_voucher_id");
            localStorage.removeItem("checkout_voucher_code");

            if (methods.paymentMethod === "VNPAY" || methods.paymentMethod === "MOMO") {
              window.location.href = `/src/pages/checkout/mock-payment.html?order_id=${res.order.order_id}&amount=${grandTotal}&method=${methods.paymentMethod}`;
            } else {
              showToast("Đặt hàng thành công!");
              setTimeout(() => {
                window.location.href = "/src/pages/checkout/payment-confirm.html";
              }, 1500);
            }
          } else {
            throw new Error(res.message || "Đặt hàng thất bại");
          }
        } else {
          // Guest Checkout - Send OTP
          const sendRes = await apiRequest("/api/user/orders/otp-send", {
            method: "POST",
            body: JSON.stringify({
              phone: shipping.phone,
              email: shipping.email || "",
              full_name: shipping.name
            })
          });

          if (sendRes.success) {
            showToast("Mã xác thực OTP đã được gửi!");
            // Stash payload for verification page
            sessionStorage.setItem("guest_checkout_payload", JSON.stringify({
              phone: shipping.phone,
              shipping_name: shipping.name,
              shipping_address: shipping.address,
              shipping_fee: methods.shippingFee,
              voucher_id: localStorage.getItem("checkout_voucher_id") || null,
              discount_amount: discountAmount,
              subtotal: subtotal,
              total_amount: grandTotal,
              payment_method: methods.paymentMethod,
              email: shipping.email || "",
              items: cart
            }));

            setTimeout(() => {
              window.location.href = "/src/pages/checkout/otp-verify.html";
            }, 1500);
          } else {
            throw new Error(sendRes.message || "Không thể gửi mã xác thực");
          }
        }
      } catch (err) {
        showToast(err.message || "Lỗi xử lý đặt hàng");
        submitOrderBtn.textContent = token ? "Xác nhận đặt hàng" : "Nhận mã OTP & Đặt hàng";
        submitOrderBtn.style.pointerEvents = "auto";
        submitOrderBtn.style.opacity = "1";
      }
    });
  }
}

// 7. INITIALIZE PAYMENT CONFIRMATION SUCCESS PAGE (payment-confirm.html)
function initPaymentConfirmPage() {
  const createdOrder = JSON.parse(localStorage.getItem("created_order") || "{}");

  const orderCodeEl = document.querySelector(".details-grid__row:nth-child(1) .details-grid__value");
  const paymentMethodEl = document.querySelector(".details-grid__row:nth-child(2) .details-grid__value");
  const estDeliveryEl = document.querySelector(".details-grid__row:nth-child(3) .details-grid__value");
  const addressEl = document.querySelector(".details-grid__row:nth-child(4) .details-grid__value");

  if (createdOrder.tracking_code) {
    if (orderCodeEl) orderCodeEl.textContent = `#${createdOrder.tracking_code}`;
    
    if (paymentMethodEl) {
      if (createdOrder.payment_method === "COD") {
        paymentMethodEl.textContent = "Thanh toán khi nhận hàng (COD)";
      } else {
        const checkoutMethods = JSON.parse(localStorage.getItem("checkout_methods") || "{}");
        const method = checkoutMethods.paymentMethod || createdOrder.payment_method || "ONLINE_PAYMENT";
        if (method === "MOMO") {
          paymentMethodEl.textContent = "Ví điện tử MoMo";
        } else if (method === "VNPAY") {
          paymentMethodEl.textContent = "Cổng thanh toán VNPay";
        } else {
          paymentMethodEl.textContent = "Thanh toán trực tuyến";
        }
      }
    }

    if (estDeliveryEl) {
      const now = new Date();
      const days = createdOrder.shipping_method === "express" ? 2 : 5;
      now.setDate(now.getDate() + days);
      
      const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const formattedDate = `${dayNames[now.getDay()]}, ${now.getDate()} Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
      estDeliveryEl.textContent = formattedDate;
    }

    if (addressEl) {
      addressEl.textContent = createdOrder.shipping_address;
    }

    // Render temporary password block if guest registered during this flow
    const tempPass = localStorage.getItem("guest_temp_password");
    if (tempPass) {
      const container = document.querySelector(".checkout-page .container");
      if (container) {
        const passNotice = document.createElement("div");
        passNotice.className = "password-notice-container";
        passNotice.setAttribute("style", "margin: 24px 0; width: 100%;");
        passNotice.innerHTML = `
          <div style="background: rgba(201, 123, 99, 0.08); border: 1px solid var(--terracotta); border-radius: 8px; padding: 20px; font-family: 'DM Sans', sans-serif; text-align: left;">
            <h4 style="color: var(--terracotta); margin-top: 0; margin-bottom: 8px; font-size: 1.05rem; font-weight: 700;">Chào mừng bạn đến với Velura!</h4>
            <p style="color: #6B635D; font-size: 0.9rem; margin: 0 0 12px 0; line-height: 1.5;">Hệ thống đã tự động tạo tài khoản Thành viên cho số điện thoại của bạn để tích lũy điểm và theo dõi đơn hàng dễ dàng hơn.</p>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF; padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.06);">
              <span style="font-size: 0.85rem; color: #8C847E;">Mật khẩu tạm thời:</span>
              <strong style="color: var(--dark); font-family: monospace; font-size: 1.1rem; letter-spacing: 1px;">${tempPass}</strong>
            </div>
            <p style="color: #8C847E; font-size: 0.8rem; margin: 10px 0 0 0; line-height: 1.4;">Bạn đã được tự động đăng nhập. Vui lòng đổi mật khẩu trong mục Quản lý tài khoản sau khi hoàn tất thanh toán.</p>
          </div>
        `;
        // Insert notice before action buttons
        const actionGroup = container.querySelector(".action-buttons");
        if (actionGroup) {
          container.insertBefore(passNotice, actionGroup);
        } else {
          container.appendChild(passNotice);
        }
      }
      localStorage.removeItem("guest_temp_password");
    }
  }

  const viewOrderBtn = document.querySelector(".action-buttons .btn:first-child");
  if (viewOrderBtn && createdOrder.tracking_code) {
    viewOrderBtn.href = `/src/pages/account/track-order.html?code=${createdOrder.tracking_code}`;
  }
}

// 8. INITIALIZE PAYMENT FAILED PAGE (payment-failed.html)
function initPaymentFailedPage() {
  const orderId = localStorage.getItem("failed_order_id");

  const btnCod = document.getElementById("btn-change-to-cod");
  if (btnCod) {
    if (!orderId) {
      btnCod.style.display = "none";
      return;
    }

    btnCod.addEventListener("click", async () => {
      try {
        btnCod.textContent = "Đang xử lý...";
        btnCod.style.pointerEvents = "none";
        btnCod.style.opacity = "0.7";

        const res = await apiRequest("/api/user/orders/change-payment-method", {
          method: "POST",
          body: JSON.stringify({ order_id: orderId, new_method: "COD" })
        });

        if (res.success) {
          showToast("Đã chuyển đổi sang phương thức COD thành công!");
          
          localStorage.setItem("created_order", JSON.stringify({
            tracking_code: res.order.tracking_code,
            payment_method: "COD",
            shipping_address: res.order.shipping_address,
            shipping_method: res.order.shipping_method || "express"
          }));

          localStorage.removeItem("failed_order_id");
          localStorage.removeItem("failed_order_amount");

          setTimeout(() => {
            window.location.href = "/src/pages/checkout/payment-confirm.html";
          }, 1500);
        } else {
          throw new Error(res.message || "Không thể chuyển đổi phương thức thanh toán.");
        }
      } catch (err) {
        showToast(err.message || "Lỗi chuyển đổi phương thức thanh toán");
        btnCod.textContent = "Chuyển sang nhận hàng thanh toán (COD)";
        btnCod.style.pointerEvents = "auto";
        btnCod.style.opacity = "1";
      }
    });
  }
}
