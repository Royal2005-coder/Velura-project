/**
 * Velura — Consolidated Account & Profile Logic
 */

// Mock data for location dropdowns
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

export function initProfileForm() {
  // 1. Tab Switching System
  initAccountTabs();

  // 2. Profile Details Form
  initProfileFormValidation();

  // 3. Address Manager
  initAddressManager();

  // 4. Order Filters
  initOrderFilter();

  // 5. Wishlist Management
  initWishlistActions();

  // 6. Settings & Style Profile Actions
  initSettingsAndStyleActions();
}

/**
 * Tab Switching with Deep-linking support
 */
function initAccountTabs() {
  const sidebarLinks = document.querySelectorAll(".account-sidebar__link[data-tab]");
  const tabContents = document.querySelectorAll(".account-tab-content");

  if (sidebarLinks.length === 0) return;

  function switchTab(tabId) {
    // 1. Remove active state from all sidebar links and tab contents
    sidebarLinks.forEach(link => {
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("is-active");
      } else {
        link.classList.remove("is-active");
      }
    });

    tabContents.forEach(content => {
      if (content.id === `tab-${tabId}`) {
        content.classList.add("is-active");
      } else {
        content.classList.remove("is-active");
      }
    });
  }

  // Bind click listeners
  sidebarLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);

      // Update URL query parameter without reloading page
      const url = new URL(window.location);
      url.searchParams.set("tab", tabId);
      window.history.pushState({}, "", url);
    });
  });

  // Check URL search params for direct tab landing
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab");
  if (initialTab && document.getElementById(`tab-${initialTab}`)) {
    switchTab(initialTab);
  }
}

/**
 * Profile form verification and submission
 */
function initProfileFormValidation() {
  const form = document.querySelector(".profile-form");
  if (!form) return;

  const cancelBtn = form.querySelector(".js-btn-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function(e) {
      e.preventDefault();
      // Reset form to default values
      form.reset();
      
      // Clear validation errors
      clearErrors(form);
      
      // Toast notification for cancellation
      showToast("Đã hủy bỏ các thay đổi.");
    });
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors(form);

    let isValid = true;

    // 1. Validate Fullname
    const nameInput = form.querySelector('input[name="fullname"]');
    if (nameInput) {
      const nameVal = nameInput.value.trim();
      if (!nameVal) {
        showError(nameInput, "Họ và tên không được để trống.");
        isValid = false;
      }
    }

    // 2. Validate Phone Number (10 digits starting with 0, ignoring spaces)
    const phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput) {
      const phoneVal = phoneInput.value.replace(/\s+/g, ""); // Strip spaces for validation
      const phoneRegex = /^0\d{9}$/;
      if (!phoneVal) {
        showError(phoneInput, "Số điện thoại không được để trống.");
        isValid = false;
      } else if (!phoneRegex.test(phoneVal)) {
        showError(phoneInput, "Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng số 0).");
        isValid = false;
      }
    }

    // 3. Validate Date of Birth (dd/mm/yyyy format)
    const dobInput = form.querySelector('input[name="dob"]');
    if (dobInput) {
      const dobVal = dobInput.value.trim();
      const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (dobVal && !dobRegex.test(dobVal)) {
        showError(dobInput, "Ngày sinh phải đúng định dạng dd/mm/yyyy.");
        isValid = false;
      }
    }

    if (isValid) {
      // Mock submit success and show Toast
      showToast("Cập nhật thông tin tài khoản thành công!");
      
      // Sync names dynamically
      const updatedName = nameInput.value.trim();
      
      // Sidebar name (Hân Nguyễn or first name / last name)
      const sidebarName = document.querySelector(".account-sidebar__name");
      if (sidebarName) {
        const nameParts = updatedName.split(" ");
        if (nameParts.length >= 2) {
          sidebarName.textContent = nameParts[nameParts.length - 1] + " " + nameParts[0];
        } else {
          sidebarName.textContent = updatedName;
        }
      }
      
      // Large profile header name
      const largeName = document.querySelector(".profile-avatar-name");
      if (largeName) {
        largeName.textContent = updatedName;
      }
    }
  });
}

function showError(inputEl, message) {
  inputEl.classList.add("is-invalid");
  
  const errorSpan = document.createElement("span");
  errorSpan.className = "invalid-feedback";
  errorSpan.innerText = message;
  
  // Insert inside the parent wrapper after the input field
  const parent = inputEl.parentNode;
  parent.appendChild(errorSpan);
}

function clearErrors(form) {
  const invalidInputs = form.querySelectorAll(".is-invalid");
  invalidInputs.forEach(input => {
    input.classList.remove("is-invalid");
  });

  const errorMessages = form.querySelectorAll(".invalid-feedback");
  errorMessages.forEach(msg => {
    msg.remove();
  });
}

/**
 * Address Manager modal and data handling
 */
function initAddressManager() {
  const modal = document.getElementById("address-modal");
  if (!modal) return;

  const btnAdd = document.querySelector(".js-btn-add-address");
  const btnCloseList = document.querySelectorAll(".js-btn-close-modal");
  const form = document.getElementById("address-form");
  const addressList = document.querySelector(".address-list");

  const provinceSelect = document.getElementById("address-province");
  const districtSelect = document.getElementById("address-district");
  const wardSelect = document.getElementById("address-ward");

  // Show modal for adding
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      resetForm();
      document.getElementById("modal-title").textContent = "Thêm địa chỉ mới";
      openModal();
    });
  }

  // Close modal events
  btnCloseList.forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  const backdrop = modal.querySelector(".modal__backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  // Location select chaining
  if (provinceSelect) {
    provinceSelect.addEventListener("change", (e) => {
      const provinceKey = e.target.value;
      populateDistricts(provinceKey);
    });
  }

  if (districtSelect) {
    districtSelect.addEventListener("change", (e) => {
      const provinceKey = provinceSelect.value;
      const districtKey = e.target.value;
      populateWards(provinceKey, districtKey);
    });
  }

  // Delegation for Edit & Delete buttons
  if (addressList) {
    addressList.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".js-btn-edit-address");
      const deleteBtn = e.target.closest(".js-btn-delete-address");

      if (editBtn) {
        const card = editBtn.closest(".address-card");
        if (card) handleEdit(card);
      }

      if (deleteBtn) {
        const card = deleteBtn.closest(".address-card");
        if (card) handleDelete(card);
      }
    });
  }

  // Form submit
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  function openModal() {
    modal.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  function resetForm() {
    form.reset();
    document.getElementById("address-id").value = "";
    
    // Clear validation states
    form.querySelectorAll(".is-invalid").forEach(input => input.classList.remove("is-invalid"));
    form.querySelectorAll(".invalid-feedback").forEach(div => div.remove());

    // Reset select inputs
    if (districtSelect) {
      districtSelect.innerHTML = '<option value="" disabled selected>Chọn Quận/Huyện</option>';
      districtSelect.disabled = true;
    }
    if (wardSelect) {
      wardSelect.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
      wardSelect.disabled = true;
    }
  }

  function populateDistricts(provinceKey) {
    if (!districtSelect || !locationData[provinceKey]) return;
    
    districtSelect.innerHTML = '<option value="" disabled selected>Chọn Quận/Huyện</option>';
    districtSelect.disabled = false;

    if (wardSelect) {
      wardSelect.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
      wardSelect.disabled = true;
    }

    const districts = locationData[provinceKey].districts;
    for (const key in districts) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = districts[key].name;
      districtSelect.appendChild(option);
    }
  }

  function populateWards(provinceKey, districtKey) {
    if (!wardSelect || !locationData[provinceKey] || !locationData[provinceKey].districts[districtKey]) return;

    wardSelect.innerHTML = '<option value="" disabled selected>Chọn Phường/Xã</option>';
    wardSelect.disabled = false;

    const wards = locationData[provinceKey].districts[districtKey].wards;
    wards.forEach(ward => {
      const option = document.createElement("option");
      option.value = ward;
      option.textContent = ward;
      wardSelect.appendChild(option);
    });
  }

  function handleEdit(card) {
    resetForm();
    document.getElementById("modal-title").textContent = "Chỉnh sửa địa chỉ";

    const id = card.getAttribute("data-id");
    const name = card.querySelector(".address-card__name").textContent;
    const phone = card.querySelector(".address-card__phone").textContent;
    const detailText = card.querySelector(".address-card__detail").textContent;
    const isDefault = card.classList.contains("address-card--default");

    document.getElementById("address-id").value = id;
    document.getElementById("address-fullname").value = name;
    document.getElementById("address-phone").value = phone;
    document.getElementById("address-is-default").checked = isDefault;

    // Parse location details
    let addressDetail = detailText;
    let selectedProv = "";
    let selectedDist = "";
    let selectedWard = "";

    // Determine Province
    if (detailText.includes("TP. Hồ Chí Minh")) {
      selectedProv = "HCM";
      addressDetail = addressDetail.replace(", TP. Hồ Chí Minh", "");
    } else if (detailText.includes("Hà Nội")) {
      selectedProv = "HN";
      addressDetail = addressDetail.replace(", Hà Nội", "");
    } else if (detailText.includes("Đà Nẵng")) {
      selectedProv = "DN";
      addressDetail = addressDetail.replace(", TP. Đà Nẵng", "");
    }

    if (selectedProv) {
      provinceSelect.value = selectedProv;
      populateDistricts(selectedProv);

      // Determine District
      const districts = locationData[selectedProv].districts;
      for (const distKey in districts) {
        if (detailText.includes(districts[distKey].name)) {
          selectedDist = distKey;
          districtSelect.value = distKey;
          populateWards(selectedProv, distKey);
          addressDetail = addressDetail.replace(`, ${districts[distKey].name}`, "");
          break;
        }
      }

      if (selectedDist) {
        // Determine Ward
        const wards = districts[selectedDist].wards;
        for (const ward of wards) {
          if (detailText.includes(ward)) {
            selectedWard = ward;
            wardSelect.value = ward;
            addressDetail = addressDetail.replace(`, ${ward}`, "");
            break;
          }
        }
      }
    }

    document.getElementById("address-detail").value = addressDetail.trim();
    openModal();
  }

  function handleDelete(card) {
    if (card.classList.contains("address-card--default")) {
      alert("Không thể xóa địa chỉ mặc định! Hãy đặt địa chỉ khác làm mặc định trước.");
      return;
    }

    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      card.style.opacity = "0";
      card.style.transform = "scale(0.9)";
      setTimeout(() => {
        card.remove();
        showToast("Đã xóa địa chỉ thành công!");
      }, 300);
    }
  }

  function handleFormSubmit() {
    const fullname = document.getElementById("address-fullname");
    const phone = document.getElementById("address-phone");
    const province = document.getElementById("address-province");
    const district = document.getElementById("address-district");
    const ward = document.getElementById("address-ward");
    const detail = document.getElementById("address-detail");
    const isDefault = document.getElementById("address-is-default").checked;
    const addressId = document.getElementById("address-id").value;

    let hasError = false;

    // Helper to validate and set status
    const validateField = (el, condition, msg) => {
      el.classList.remove("is-invalid");
      const next = el.nextElementSibling;
      if (next && next.classList.contains("invalid-feedback")) next.remove();
      const parent = el.closest(".profile-form__input-wrapper");
      if (parent) {
        const feed = parent.querySelector(".invalid-feedback");
        if (feed) feed.remove();
      }

      if (!condition) {
        el.classList.add("is-invalid");
        const feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        feedback.textContent = msg;
        if (parent) {
          parent.appendChild(feedback);
        } else {
          el.parentNode.appendChild(feedback);
        }
        hasError = true;
      }
    };

    validateField(fullname, fullname.value.trim() !== "", "Họ và tên không được để trống");
    
    const phoneVal = phone.value.trim();
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    validateField(phone, phoneRegex.test(phoneVal.replace(/\s+/g, "")), "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
    
    validateField(province, province.value !== "", "Vui lòng chọn Tỉnh/Thành phố");
    validateField(district, district.disabled === false && district.value !== "", "Vui lòng chọn Quận/Huyện");
    validateField(ward, ward.disabled === false && ward.value !== "", "Vui lòng chọn Phường/Xã");
    validateField(detail, detail.value.trim() !== "", "Địa chỉ chi tiết không được để trống");

    if (hasError) return;

    // Form text strings
    const provName = province.options[province.selectedIndex].text;
    const distName = district.options[district.selectedIndex].text;
    const wardName = ward.value;
    const fullDetailString = `${detail.value.trim()}, ${wardName}, ${distName}, ${provName}`;

    if (isDefault) {
      // Uncheck all other default address cards
      document.querySelectorAll(".address-card").forEach(c => {
        c.classList.remove("address-card--default");
        const badge = c.querySelector(".badge--default");
        if (badge) badge.classList.add("d-none");
      });
    }

    if (addressId) {
      // Edit mode: update card
      const card = document.querySelector(`.address-card[data-id="${addressId}"]`);
      if (card) {
        card.querySelector(".address-card__name").textContent = fullname.value.trim();
        card.querySelector(".address-card__phone").textContent = phone.value.trim();
        card.querySelector(".address-card__detail").textContent = fullDetailString;

        if (isDefault) {
          card.classList.add("address-card--default");
          const badge = card.querySelector(".badge--default");
          if (badge) badge.classList.remove("d-none");
        } else {
          card.classList.remove("address-card--default");
          const badge = card.querySelector(".badge--default");
          if (badge) badge.classList.add("d-none");
        }
      }
      showToast("Cập nhật địa chỉ thành công!");
    } else {
      // Add mode: create card
      const newId = Date.now().toString();
      const newCard = document.createElement("div");
      newCard.className = `address-card ${isDefault ? "address-card--default" : ""}`;
      newCard.setAttribute("data-id", newId);
      newCard.innerHTML = `
        <div class="address-card__icon-wrapper">
          <svg class="address-card__location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div class="address-card__content">
          <div class="address-card__header">
            <span class="address-card__name">${fullname.value.trim()}</span>
            <span class="address-card__separator">·</span>
            <span class="address-card__phone">${phone.value.trim()}</span>
            <span class="badge badge--default ${isDefault ? "" : "d-none"}">Mặc định</span>
          </div>
          <p class="address-card__detail">${fullDetailString}</p>
        </div>
        <div class="address-card__actions">
          <button class="address-card__btn js-btn-edit-address" aria-label="Chỉnh sửa" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button class="address-card__btn js-btn-delete-address" aria-label="Xóa" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      `;
      addressList.appendChild(newCard);
      showToast("Thêm địa chỉ mới thành công!");
    }

    closeModal();
  }
}

/**
 * Order History Tab status filtering
 */
function initOrderFilter() {
  const filterTabs = document.querySelectorAll(".order-filter__tab");
  const orderCards = document.querySelectorAll(".order-card");

  if (filterTabs.length === 0 || orderCards.length === 0) return;

  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // 1. Remove active state from all tabs
      filterTabs.forEach(t => t.classList.remove("is-active"));

      // 2. Set current tab to active
      tab.classList.add("is-active");

      // 3. Get target status
      const targetStatus = tab.getAttribute("data-status");

      // 4. Filter cards
      orderCards.forEach(card => {
        const cardStatus = card.getAttribute("data-status");

        if (targetStatus === "all" || cardStatus === targetStatus) {
          // Show card with fade-in effect
          card.style.display = "flex";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
          }, 10);
        } else {
          // Hide card
          card.style.opacity = "0";
          card.style.transform = "translateY(8px)";
          setTimeout(() => {
            card.style.display = "none";
          }, 200); // match transition duration
        }
      });
    });
  });

  // Apply basic styles for smooth transition
  orderCards.forEach(card => {
    card.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  });
}

/**
 * Wishlist Tab product cards interactions
 */
function initWishlistActions() {
  const grid = document.getElementById("wishlist-product-grid");
  if (!grid) return;

  const countSubtitle = document.querySelector(".wishlist-account-header__info p");

  // Delegate clicks on grid
  grid.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".js-remove-wishlist");
    const addCartBtn = e.target.closest(".js-add-cart-fast");

    if (removeBtn) {
      const card = removeBtn.closest(".product-card");
      if (card) handleRemove(card);
    }

    if (addCartBtn) {
      const card = addCartBtn.closest(".product-card");
      if (card) handleAddCart(card);
    }
  });

  function handleRemove(card) {
    // Fade out transition
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";

    setTimeout(() => {
      card.remove();
      updateCounter();
      showToast("Đã xóa sản phẩm khỏi Wishlist!");
    }, 300);
  }

  function handleAddCart(card) {
    const productName = card.querySelector(".product-card__name").textContent;
    showToast(`Đã thêm "${productName}" vào giỏ hàng thành công!`);
  }

  function updateCounter() {
    if (!countSubtitle) return;
    const remainingCards = grid.querySelectorAll(".product-card");
    const count = remainingCards.length;

    if (count === 0) {
      countSubtitle.textContent = "Bạn chưa có sản phẩm yêu thích nào";
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p style="margin: 0; font-size: 0.9375rem;">Không tìm thấy sản phẩm nào trong danh sách yêu thích.</p>
        </div>
      `;
    } else {
      countSubtitle.textContent = `Những món bạn đã lưu (${count} sản phẩm)`;
    }
  }
}

/**
 * Settings & Style Profile saving buttons
 */
function initSettingsAndStyleActions() {
  const saveSettingsBtn = document.querySelector(".js-btn-save-settings");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
      showToast("Đã lưu các cài đặt thành công!");
    });
  }

  const updateStyleBtn = document.querySelector(".style-profile__update-btn");
  if (updateStyleBtn) {
    updateStyleBtn.addEventListener("click", () => {
      window.location.href = "/src/pages/ai/style-quiz.html?mode=edit";
    });
  }
}

/**
 * Global Toast Notification Helper
 */
export function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg class="toast__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <div class="toast__content">
      <p class="toast__message">${message}</p>
    </div>
  `;

  container.appendChild(toast);

  // Force reflow
  void toast.offsetWidth;

  // Show toast
  toast.classList.add("toast--show");

  // Remove toast after 4s
  setTimeout(() => {
    toast.classList.remove("toast--show");
    // Wait for fadeout animation transition
    setTimeout(() => {
      toast.remove();
      // Remove container if no toasts left
      if (container.children.length === 0) {
        container.remove();
      }
    }, 400);
  }, 4000);
}
