/**
 * Velura — Consolidated Account & Profile Logic
 */
import { apiRequest } from "./api.js";
import { addToCart, getVariantImage } from "./cart.js";
import { getCurrentRole, hasRealAuthSession } from "./auth-session.js";

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
  if (!document.querySelector(".profile-page")) return;

  // 1. Tab Switching System
  initAccountTabs();

  if (document.querySelector(".profile-page") && !hasRealAuthSession()) {
    renderGuestProfileState();
    showGuestLoginModal();
    return;
  }

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

function renderGuestProfileState() {
  const dash = "-";

  document.querySelectorAll(".account-sidebar__name, .profile-avatar-name").forEach((el) => {
    el.textContent = dash;
  });

  document.querySelectorAll(".profile-form input, .profile-form select, .profile-form textarea").forEach((field) => {
    if (field.type === "radio" || field.type === "checkbox") {
      field.checked = false;
    } else {
      field.value = dash;
    }
    field.disabled = true;
  });

  document.querySelectorAll(
    ".profile-form button, .js-btn-add-address, .js-btn-save-settings, .style-profile__update-btn, .js-remove-wishlist, .js-add-cart-fast"
  ).forEach((btn) => {
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
  });

  const addressList = document.querySelector(".address-list");
  if (addressList) addressList.innerHTML = `<p class="account-guest-empty">-</p>`;

  const ordersList = document.querySelector(".orders-list");
  if (ordersList) ordersList.innerHTML = `<p class="account-guest-empty">-</p>`;

  const wishlistGrid = document.getElementById("wishlist-product-grid");
  if (wishlistGrid) wishlistGrid.innerHTML = `<p class="account-guest-empty">-</p>`;

  const styleMetrics = document.querySelector(".style-profile__metrics");
  if (styleMetrics) {
    styleMetrics.querySelectorAll(".style-profile__metric-value").forEach((el) => {
      el.textContent = dash;
    });
  }
}

function showGuestLoginModal() {
  if (hasRealAuthSession() || document.querySelector(".account-login-required-modal")) return;

  const modal = document.createElement("div");
  modal.className = "account-login-required-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="account-login-required-modal__card">
      <h2>BẠN CHƯA ĐĂNG NHẬP TRANG WEB</h2>
      <p>Đăng nhập để tiếp tục?</p>
      <div class="account-login-required-modal__actions">
        <a class="account-login-required-modal__btn account-login-required-modal__btn--primary" href="/src/pages/auth/signin.html">Đăng nhập</a>
        <button class="account-login-required-modal__btn account-login-required-modal__btn--secondary" type="button">Thoát</button>
      </div>
    </div>
  `;

  modal.querySelector("button").addEventListener("click", () => {
    window.location.href = "/index.html";
  });

  document.body.appendChild(modal);
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
function loadProfileData(form) {
  apiRequest("/api/user/profile")
    .then(profile => {
      const nameInput = form.querySelector('input[name="fullname"]');
      const phoneInput = form.querySelector('input[name="phone"]');
      const emailInput = form.querySelector('input[name="email"]');
      const dobInput = form.querySelector('input[name="dob"]');
      const avatarInput = form.querySelector('input[name="avatar"]');
      
      if (nameInput) nameInput.value = profile.full_name || "";
      if (phoneInput) {
        phoneInput.value = profile.phone || "";
        phoneInput.readOnly = true;
      }
      if (emailInput) {
        emailInput.value = profile.email || "";
        emailInput.readOnly = true;
      }
      if (dobInput && profile.date_of_birth) {
        const parts = profile.date_of_birth.split("-");
        if (parts.length === 3) {
          dobInput.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      if (avatarInput) {
        avatarInput.value = profile.avatar || "";
      }

      if (profile.gender) {
        const genderRadio = form.querySelector(`input[name="gender"][value="${profile.gender}"]`);
        if (genderRadio) genderRadio.checked = true;
      }

      // Update names on UI
      const sidebarName = document.querySelector(".account-sidebar__name");
      if (sidebarName && profile.full_name) {
        const nameParts = profile.full_name.split(" ");
        sidebarName.textContent = nameParts.length >= 2 ? (nameParts[nameParts.length - 1] + " " + nameParts[0]) : profile.full_name;
      }
      const largeName = document.querySelector(".profile-avatar-name");
      if (largeName && profile.full_name) {
        largeName.textContent = profile.full_name;
      }
      
      const avatarMeta = document.querySelector(".profile-avatar-meta");
      if (avatarMeta) {
        if (profile.created_at) {
          const date = new Date(profile.created_at);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          avatarMeta.textContent = `Thành viên từ tháng ${month}/${year} · 0 điểm tích lũy`;
        } else {
          avatarMeta.textContent = `Thành viên mới · 0 điểm tích lũy`;
        }
      }

      // Render user avatar (initials fallback or custom URL)
      renderUserAvatar(profile.avatar, profile.full_name);
    })
    .catch(err => {
      console.error("Failed to load profile:", err);
      if (err.status === 401 && !hasRealAuthSession()) {
        renderGuestProfileState();
        showGuestLoginModal();
      } else {
        // Fallback: load details from local storage user
        const rawUser = localStorage.getItem("velura_user");
        if (rawUser) {
          try {
            const profile = JSON.parse(rawUser);
            const nameInput = form.querySelector('input[name="fullname"]');
            const phoneInput = form.querySelector('input[name="phone"]');
            const emailInput = form.querySelector('input[name="email"]');
            const avatarInput = form.querySelector('input[name="avatar"]');
            
            if (nameInput) nameInput.value = profile.full_name || "";
            if (phoneInput) {
              phoneInput.value = profile.phone || "";
              phoneInput.readOnly = true;
            }
            if (emailInput) {
              emailInput.value = profile.email || "";
              emailInput.readOnly = true;
            }
            if (avatarInput) {
              avatarInput.value = profile.avatar || "";
            }

            // Update names on UI
            const sidebarName = document.querySelector(".account-sidebar__name");
            if (sidebarName && profile.full_name) {
              const nameParts = profile.full_name.split(" ");
              sidebarName.textContent = nameParts.length >= 2 ? (nameParts[nameParts.length - 1] + " " + nameParts[0]) : profile.full_name;
            }
            const largeName = document.querySelector(".profile-avatar-name");
            if (largeName && profile.full_name) {
              largeName.textContent = profile.full_name;
            }
            
            const avatarMeta = document.querySelector(".profile-avatar-meta");
            if (avatarMeta) {
              if (profile.created_at) {
                const date = new Date(profile.created_at);
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                avatarMeta.textContent = `Thành viên từ tháng ${month}/${year} · 0 điểm tích lũy`;
              } else {
                avatarMeta.textContent = `Thành viên mới · 0 điểm tích lũy`;
              }
            }

            // Render user avatar (initials fallback or custom URL)
            renderUserAvatar(profile.avatar, profile.full_name);
          } catch (e) {
            console.error("Failed to parse fallback user profile:", e);
          }
        } else {
          showToast("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
        }
      }
    });
}

/**
 * Avatar Initials Fallback and Image Rendering Helpers
 */
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function renderUserAvatar(avatarUrl, fullName) {
  const sidebarAvatar = document.querySelector(".account-sidebar__avatar");
  const profileAvatar = document.querySelector(".profile-avatar-img");
  const avatarWrapper = document.querySelector(".profile-avatar-wrapper");
  const sidebarWrapper = document.querySelector(".account-sidebar__avatar-wrapper");

  const initials = getInitials(fullName);

  if (avatarUrl && avatarUrl.trim() !== "") {
    if (sidebarAvatar) {
      sidebarAvatar.src = avatarUrl;
      sidebarAvatar.style.display = "block";
    }
    if (profileAvatar) {
      profileAvatar.src = avatarUrl;
      profileAvatar.style.display = "block";
    }
    
    // Clean up initials placeholders if they exist
    const existingSidebarPlaceholder = sidebarWrapper?.querySelector(".avatar-placeholder");
    if (existingSidebarPlaceholder) existingSidebarPlaceholder.remove();
    
    const existingProfilePlaceholder = avatarWrapper?.querySelector(".avatar-placeholder");
    if (existingProfilePlaceholder) existingProfilePlaceholder.remove();
  } else {
    if (sidebarAvatar) sidebarAvatar.style.display = "none";
    if (profileAvatar) profileAvatar.style.display = "none";

    // Draw initials placeholder in sidebar
    if (sidebarWrapper) {
      let sidebarPlaceholder = sidebarWrapper.querySelector(".avatar-placeholder");
      if (!sidebarPlaceholder) {
        sidebarPlaceholder = document.createElement("div");
        sidebarPlaceholder.className = "avatar-placeholder sidebar-avatar-placeholder";
        sidebarWrapper.insertBefore(sidebarPlaceholder, sidebarAvatar);
      }
      sidebarPlaceholder.textContent = initials;
    }

    // Draw initials placeholder in profile top
    if (avatarWrapper) {
      let profilePlaceholder = avatarWrapper.querySelector(".avatar-placeholder");
      if (!profilePlaceholder) {
        profilePlaceholder = document.createElement("div");
        profilePlaceholder.className = "avatar-placeholder profile-avatar-placeholder";
        avatarWrapper.insertBefore(profilePlaceholder, profileAvatar);
      }
      profilePlaceholder.textContent = initials;
    }
  }
}

function setupAvatarUploadBtn(form) {
  const uploadBtn = document.querySelector(".profile-avatar-upload-btn");
  if (!uploadBtn) return;

  // Prevent multiple bindings
  if (uploadBtn.dataset.bound === "true") return;
  uploadBtn.dataset.bound = "true";

  uploadBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const avatarInput = form.querySelector('input[name="avatar"]');
    const nameInput = form.querySelector('input[name="fullname"]');
    const currentVal = avatarInput ? avatarInput.value.trim() : "";
    const fullName = nameInput ? nameInput.value.trim() : "User";

    const newUrl = prompt("Nhập đường dẫn ảnh đại diện mới (URL):", currentVal);
    if (newUrl !== null) {
      const trimmed = newUrl.trim();
      if (avatarInput) {
        avatarInput.value = trimmed;
      }
      // Update preview immediately
      renderUserAvatar(trimmed, fullName);
      showToast("Đã cập nhật ảnh xem trước. Nhấn 'Cập nhật' ở dưới để lưu thay đổi.");
    }
  });
}

function initProfileFormValidation() {
  const form = document.querySelector(".profile-form");
  if (!form) return;

  // Load live data from backend
  loadProfileData(form);

  // Hook up camera upload button to prompt for URL
  setupAvatarUploadBtn(form);

  const cancelBtn = form.querySelector(".js-btn-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function(e) {
      e.preventDefault();
      // Reset form to default values
      form.reset();
      loadProfileData(form);
      
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
      const fullname = nameInput.value.trim();
      const dobVal = dobInput.value.trim();
      
      let date_of_birth = null;
      if (dobVal) {
        const parts = dobVal.split("/");
        if (parts.length === 3) {
          date_of_birth = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      const genderInput = form.querySelector('input[name="gender"]:checked');
      const gender = genderInput ? genderInput.value : null;

      const avatarInput = form.querySelector('input[name="avatar"]');
      const avatar = avatarInput ? avatarInput.value.trim() : "";

      apiRequest("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullname,
          date_of_birth,
          gender,
          avatar
        })
      })
      .then(updated => {
        showToast("Cập nhật thông tin tài khoản thành công!");
        
        // Sync header local storage if present
        const localUser = localStorage.getItem("velura_user");
        if (localUser) {
          const parsed = JSON.parse(localUser);
          parsed.full_name = updated.full_name;
          parsed.avatar = updated.avatar; // Sync avatar to local storage
          localStorage.setItem("velura_user", JSON.stringify(parsed));
        }

        // Sync names dynamically
        const updatedName = updated.full_name;
        
        // Sidebar name
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

        // Update avatar on UI dynamically
        renderUserAvatar(updated.avatar, updated.full_name);
      })
      .catch(err => {
        showToast(`Cập nhật thất bại: ${err.message}`);
      });
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
function syncAddressesToServer() {
  const cards = document.querySelectorAll(".address-list .address-card");
  const addresses = [];
  cards.forEach(card => {
    const id = card.getAttribute("data-id");
    const name = card.querySelector(".address-card__name").textContent.trim();
    const phone = card.querySelector(".address-card__phone").textContent.trim();
    const detail = card.querySelector(".address-card__detail").textContent.trim();
    const isDefault = card.classList.contains("address-card--default");
    addresses.push({ id, name, phone, detail, is_default: isDefault });
  });

  apiRequest("/api/user/addresses", {
    method: "PATCH",
    body: JSON.stringify({ addresses })
  })
  .then(() => {
    console.log("Addresses synced to server successfully");
  })
  .catch(err => {
    console.error("Failed to sync addresses:", err);
  });
}

function loadAddresses(addressList) {
  apiRequest("/api/user/profile")
    .then(profile => {
      const addresses = profile.saved_addresses || [];
      if (!addresses.length) {
        addressList.innerHTML = `<p style="color:var(--soft);font-size:0.875rem;padding:16px 0;">Bạn chưa lưu địa chỉ nào.</p>`;
        return;
      }

      addressList.innerHTML = "";
      addresses.forEach(addr => {
        const isDefault = addr.is_default;
        const card = document.createElement("div");
        card.className = `address-card ${isDefault ? "address-card--default" : ""}`;
        card.setAttribute("data-id", addr.id || Date.now().toString());
        card.innerHTML = `
          <div class="address-card__icon-wrapper">
            <svg class="address-card__location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div class="address-card__content">
            <div class="address-card__header">
              <span class="address-card__name">${addr.name}</span>
              <span class="address-card__separator">·</span>
              <span class="address-card__phone">${addr.phone}</span>
              <span class="badge badge--default ${isDefault ? "" : "d-none"}">Mặc định</span>
            </div>
            <p class="address-card__detail">${addr.detail}</p>
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
        addressList.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Failed to load addresses:", err);
    });
}

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

  if (addressList) {
    loadAddresses(addressList);
  }

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
        syncAddressesToServer();
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

    syncAddressesToServer();
    closeModal();
  }
}

/**
 * Order History Tab status filtering
 */
function initOrderFilter() {
  const ordersListContainer = document.querySelector(".orders-list");
  if (!ordersListContainer) return;

  const subtitle = document.querySelector(".orders-header__info p");

  ordersListContainer.innerHTML = `<div style="text-align: center; padding: 24px 0; color: var(--soft);">Đang tải danh sách đơn hàng...</div>`;

  apiRequest("/api/user/orders")
    .then(data => {
      const orders = data.orders || [];
      
      if (subtitle) {
        subtitle.textContent = `${orders.length} đơn hàng của bạn`;
      }

      if (orders.length === 0) {
        ordersListContainer.innerHTML = `<div style="text-align: center; padding: 48px 0; color: var(--soft);">Bạn chưa có đơn hàng nào gần đây.</div>`;
        return;
      }

      // Display the most recent 3 orders
      const recentOrders = orders.slice(0, 3);

      const statusLabels = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        preparing: "Đang chuẩn bị",
        shipping: "Đang giao",
        delivered: "Đã giao",
        completed: "Hoàn thành",
        cancelled: "Đã hủy"
      };

      ordersListContainer.innerHTML = recentOrders.map(order => {
        const trackingCode = order.tracking_code || order.order_id.slice(0, 8).toUpperCase();
        const dateObj = new Date(order.created_at);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        const itemCount = (order.items || []).reduce((acc, cur) => acc + cur.quantity, 0);
        const totalFormatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total_amount);
        const statusLabel = statusLabels[order.status] || order.status;
        const statusClass = order.status;

        // Find first item's image for preview
        const firstItemImg = order.items?.[0]?.product_image || "../../assets/images/image-1.png";

        return `
          <a href="/src/pages/account/order-detail.html?id=${order.order_id}" class="order-card" data-status="${order.status}">
            <img class="order-card__image" src="${firstItemImg}" alt="Đơn hàng" />
            <div class="order-card__info">
              <h3 class="order-card__sku">Mã đơn #${trackingCode}</h3>
              <p class="order-card__date">${formattedDate} · ${itemCount} sản phẩm</p>
            </div>
            <div class="order-card__meta">
              <span class="order-card__price">${totalFormatted}</span>
              <span class="order-card__status order-card__status--${statusClass}">${statusLabel}</span>
            </div>
            <div class="order-card__arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </a>
        `;
      }).join("");
    })
    .catch(err => {
      ordersListContainer.innerHTML = `<div style="text-align: center; padding: 24px 0; color: #d9534f;">Không thể tải danh sách đơn hàng: ${err.message}</div>`;
    });
}

/**
 * Wishlist Tab product cards interactions
 */
function initWishlistActions() {
  const grid = document.getElementById("wishlist-product-grid");
  if (!grid) return;

  const countSubtitle = document.querySelector(".wishlist-account-header__info p");

  // Load wishlist items
  function loadWishlist() {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">Đang tải danh sách yêu thích...</div>`;
    
    apiRequest("/api/user/wishlist")
      .then(data => {
        const items = data.items || [];
        updateCounter(items.length);

        if (items.length === 0) {
          grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; color: #A18265;">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p style="margin: 0; font-size: 0.9375rem;">Không tìm thấy sản phẩm nào trong danh sách yêu thích.</p>
            </div>
          `;
          return;
        }

        grid.innerHTML = items.map(product => {
          const priceFormatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.sale_price || product.base_price);
          return `
            <div class="product-card" data-product-id="${product.product_id}">
              <div class="product-card__image-container">
                <img class="product-card__image" src="${product.images?.[0] || '/src/assets/images/placeholder.jpg'}" alt="${product.name}" />
                <button class="product-card__wishlist-btn js-remove-wishlist" type="button" aria-label="Xóa khỏi yêu thích">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <div class="product-card__details">
                <h3 class="product-card__name"><a href="/src/pages/products/detail.html?id=${product.product_id}" style="text-decoration:none; color:inherit;">${product.name}</a></h3>
                <div class="product-card__price-row">
                  <span class="product-card__price">${priceFormatted}</span>
                </div>
                <button class="btn btn--primary product-card__cart-btn js-add-cart-fast" type="button">
                  Thêm vào giỏ nhanh
                </button>
              </div>
            </div>
          `;
        }).join("");
      })
      .catch(err => {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 24px 0; color: #d9534f;">Không thể tải danh sách yêu thích: ${err.message}</div>`;
      });
  }

  // Delegate clicks on grid
  grid.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".js-remove-wishlist");
    const addCartBtn = e.target.closest(".js-add-cart-fast");

    if (removeBtn) {
      const card = removeBtn.closest(".product-card");
      if (!card) return;
      const productId = card.getAttribute("data-product-id");

      try {
        await apiRequest(`/api/user/wishlist?product_id=${productId}`, { method: "DELETE" });
        
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";

        setTimeout(() => {
          card.remove();
          const remainingCards = grid.querySelectorAll(".product-card");
          updateCounter(remainingCards.length);
          showToast("Đã xóa sản phẩm khỏi Wishlist!");
          if (remainingCards.length === 0) {
            grid.innerHTML = `
              <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--soft);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px;">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p style="margin: 0; font-size: 0.9375rem;">Không tìm thấy sản phẩm nào trong danh sách yêu thích.</p>
              </div>
            `;
          }
        }, 300);
      } catch (err) {
        showToast("Lỗi khi xóa khỏi Wishlist: " + err.message);
      }
    }

    if (addCartBtn) {
      const card = addCartBtn.closest(".product-card");
      if (!card) return;
      const productId = card.getAttribute("data-product-id");
      try {
        const product = await apiRequest(`/api/user/products/${productId}`);
        if (product && product.variants && product.variants.length > 0) {
          const matchedVariant = product.variants[0];
          addToCart({
            variant_id: matchedVariant.variant_id,
            product_id: product.product_id,
            product_name: product.name,
            product_image: getVariantImage(product, matchedVariant.color || "Mặc định"),
            quantity: 1,
            unit_price: product.sale_price || product.base_price,
            color: matchedVariant.color || "Mặc định",
            size: matchedVariant.size || "M"
          });
          showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
        } else {
          showToast("Sản phẩm không có biến thể sẵn có.");
        }
      } catch (err) {
        showToast("Không thể thêm vào giỏ hàng: " + err.message);
      }
    }
  });

  function updateCounter(count) {
    if (!countSubtitle) return;
    if (count === 0) {
      countSubtitle.textContent = "Bạn chưa có sản phẩm yêu thích nào";
    } else {
      countSubtitle.textContent = `Những món bạn đã lưu (${count} sản phẩm)`;
    }
  }

  loadWishlist();
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

  // Load Style Profile details
  const emptyContainer = document.getElementById("js-style-profile-empty");
  const filledContainer = document.getElementById("js-style-profile-filled");

  if (emptyContainer && filledContainer) {
    apiRequest("/api/user/style-quiz")
      .then(res => {
        if (res.success && res.quiz && Object.keys(res.quiz).length > 0) {
          const q = res.quiz;
          
          // Show filled state, hide empty state
          emptyContainer.style.display = "none";
          filledContainer.style.display = "flex"; // style-profile-container is a flex container (based on CSS usually, or block)
          
          // Fallback if flex is broken
          if (getComputedStyle(filledContainer).display === 'none') {
             filledContainer.style.display = "block";
          }

          const heading = document.getElementById("js-style-heading");
          if (heading && q.style_tags) {
            heading.textContent = Array.isArray(q.style_tags) ? q.style_tags.join(", ") : q.style_tags;
          }
          
          const ageEl = document.getElementById("js-style-age");
          if (ageEl) ageEl.textContent = q.age_group ? `Nhóm tuổi ${q.age_group}` : 'Chưa cập nhật';
          
          const colorsEl = document.getElementById("js-style-colors");
          if (colorsEl) {
            if (q.favorite_colors && Array.isArray(q.favorite_colors) && q.favorite_colors.length > 0) {
              const fallbackColorMap = {
                "Kem": "#E6D9CD", "Phấn": "#F5E1D3", "Hồng đào": "#E8C3B9", 
                "Hồng đất": "#C97B63", "Xanh ô liu": "#A0AF9C", "Onyx": "#2C2A29", 
                "Xám ấm": "#8F8A85", "Xanh khói": "#5B6C7A", "Camel": "#D3A273", "Đỏ rượu": "#732C2B"
              };
              colorsEl.innerHTML = q.favorite_colors.map(c => {
                const parts = c.split("|");
                let colorHex = parts.length > 1 ? parts[1] : parts[0];
                const colorName = parts[0];
                if (parts.length === 1 && fallbackColorMap[colorName]) {
                  colorHex = fallbackColorMap[colorName];
                }
                return `<span style="display:inline-block; width:20px; height:20px; border-radius:50%; background-color:${colorHex}; border: 1px solid #e0e0e0;" title="${colorName}"></span>`;
              }).join("");
            } else {
              colorsEl.textContent = 'Chưa cập nhật';
            }
          }
          
          const heightEl = document.getElementById("js-style-height");
          if (heightEl) heightEl.textContent = q.height_cm ? q.height_cm + 'cm' : 'Chưa cập nhật';

          const weightEl = document.getElementById("js-style-weight");
          if (weightEl) weightEl.textContent = q.weight_kg ? q.weight_kg + 'kg' : 'Chưa cập nhật';

          const shapeEl = document.getElementById("js-style-shape");
          if (shapeEl) shapeEl.textContent = q.body_shape || 'Chưa cập nhật';

          const toneEl = document.getElementById("js-style-tone");
          if (toneEl) toneEl.textContent = q.skin_tone || 'Chưa cập nhật';
          
          const chestEl = document.getElementById("js-style-chest");
          if (chestEl) chestEl.textContent = q.chest_cm ? q.chest_cm + 'cm' : 'Chưa cập nhật';
          
          const waistEl = document.getElementById("js-style-waist");
          if (waistEl) waistEl.textContent = q.waist_cm ? q.waist_cm + 'cm' : 'Chưa cập nhật';
          
          const hipEl = document.getElementById("js-style-hip");
          if (hipEl) hipEl.textContent = q.hip_cm ? q.hip_cm + 'cm' : 'Chưa cập nhật';

          const occasionsEl = document.getElementById("js-style-occasions");
          if (occasionsEl) {
             const occ = Array.isArray(q.preferred_occasions) ? q.preferred_occasions.join(", ") : q.preferred_occasions;
             occasionsEl.textContent = occ || 'Chưa cập nhật';
          }
          
          const brandsEl = document.getElementById("js-style-brands");
          if (brandsEl) {
             const b = Array.isArray(q.favorite_brands) ? q.favorite_brands.join(", ") : q.favorite_brands;
             brandsEl.textContent = b || 'Chưa cập nhật';
          }
          
          const budgetEl = document.getElementById("js-style-budget");
          if (budgetEl) budgetEl.textContent = q.budget_range || 'Chưa cập nhật';

        } else {
          // Show empty state, hide filled state
          emptyContainer.style.display = "block";
          filledContainer.style.display = "none";
        }
      })
      .catch(err => {
        console.error("Failed to load style profile:", err);
        // On error, we'll assume no profile and show empty state so user isn't stuck
        if (emptyContainer && filledContainer) {
          emptyContainer.style.display = "block";
          filledContainer.style.display = "none";
        }
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
