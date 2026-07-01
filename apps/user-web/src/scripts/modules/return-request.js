/**
 * Velura — Return Request Module
 * Handles order context detection from URL params,
 * dynamic order selection, product selection,
 * return method & reason form, and image upload preview.
 */

// Mock data for orders (simulates data from API/localStorage)
const MOCK_ORDERS = [
  {
    id: "VL-20260524-1234",
    date: "24/05/2026",
    status: "shipping",
    statusLabel: "Đang giao",
    totalProducts: 3,
    total: "2,480,000đ",
    products: [
      {
        id: "pro-01",
        name: "Áo sơ mi linen trắng",
        variant: "Trắng • Size M",
        price: "680,000đ",
        image: "../../assets/images/image-1.png"
      },
      {
        id: "pro-02",
        name: "Quần suông ống rộng be",
        variant: "Be • Size L",
        price: "850,000đ",
        image: "../../assets/images/image-6.png"
      },
      {
        id: "pro-03",
        name: "Túi tote da nâu",
        variant: "Nâu • Freesize",
        price: "950,000đ",
        image: "../../assets/images/phu-kien_tui-deo-vai-hobo-patent_01.jpg"
      }
    ]
  },
  {
    id: "VL-20260520-0987",
    date: "20/05/2026",
    status: "delivered",
    statusLabel: "Đã giao",
    totalProducts: 2,
    total: "1,790,000đ",
    products: [
      {
        id: "pro-04",
        name: "Váy midi hoa nhí vintage",
        variant: "Đỏ • Size S",
        price: "1,290,000đ",
        image: "../../assets/images/products/product-vay-midi-do.png"
      },
      {
        id: "pro-05",
        name: "Khăn lụa pastel",
        variant: "Hồng • Freesize",
        price: "500,000đ",
        image: "../../assets/images/phu-kien_khan-lua-twilly-cham-bi_01.jpg"
      }
    ]
  },
  {
    id: "VL-20260515-0432",
    date: "15/05/2026",
    status: "delivered",
    statusLabel: "Đã giao",
    totalProducts: 4,
    total: "3,120,000đ",
    products: [
      {
        id: "pro-06",
        name: "Quần culottes thanh lịch",
        variant: "Đen • Size M",
        price: "750,000đ",
        image: "../../assets/images/image-6.png"
      },
      {
        id: "pro-07",
        name: "Áo thun cotton organic",
        variant: "Xám • Size S",
        price: "450,000đ",
        image: "../../assets/images/image-8.png"
      },
      {
        id: "pro-08",
        name: "Giày loafer nâu",
        variant: "Nâu • Size 37",
        price: "1,200,000đ",
        image: "../../assets/images/phu-kien_khan-choang-da-tron-tua-rua_03.jpg"
      },
      {
        id: "pro-09",
        name: "Áo khoác nhẹ",
        variant: "Kem • Size M",
        price: "720,000đ",
        image: "../../assets/images/image-3.png"
      }
    ]
  },
  {
    id: "VL-20260508-0107",
    date: "08/05/2026",
    status: "shipping",
    statusLabel: "Đang giao",
    totalProducts: 2,
    total: "2,890,000đ",
    products: [
      {
        id: "pro-10",
        name: "Đầm dạ hội đen",
        variant: "Đen • Size S",
        price: "2,390,000đ",
        image: "../../assets/images/image-4.png"
      },
      {
        id: "pro-11",
        name: "Hoa tai ngọc trai",
        variant: "Trắng • Freesize",
        price: "500,000đ",
        image: "../../assets/images/phu-kien_bom-toc-ban-to-theu-hoa-vintage_01.jpg"
      }
    ]
  }
];

export function initReturnRequest() {
  // Only run on the return-request page
  const returnPage = document.querySelector(".return-request-page");
  if (!returnPage) return;

  const urlParams = new URLSearchParams(window.location.search);
  const orderIdFromUrl = urlParams.get("orderId");

  const orderSelectorArea = document.getElementById("js-order-selector-area");
  const productSelectionList = document.getElementById("js-product-selection-list");
  const hiddenOrderInput = document.getElementById("js-hidden-order-id");
  const orderDropdownArea = document.getElementById("js-order-dropdown-area");
  const orderLockedArea = document.getElementById("js-order-locked-area");
  const returnForm = document.getElementById("returnForm");
  const fileInput = document.getElementById("fileInput");
  const filePreviewList = document.getElementById("filePreviewList");
  const maxFiles = 5;
  let uploadedFiles = [];

  // ──────────────────────────────────────────────────
  // 1. ORDER CONTEXT DETECTION
  // ──────────────────────────────────────────────────

  if (orderIdFromUrl) {
    // Case 1: orderId from URL → lock the order, show details
    handleLockedOrder(orderIdFromUrl);
  } else {
    // Case 2: No orderId → show order selection dropdown/cards
    handleOrderSelection();
  }

  function handleLockedOrder(orderId) {
    const order = MOCK_ORDERS.find(o => o.id === orderId);

    if (orderDropdownArea) orderDropdownArea.style.display = "none";
    if (orderLockedArea) orderLockedArea.style.display = "block";

    if (order && orderLockedArea) {
      if (hiddenOrderInput) hiddenOrderInput.value = order.id;
      renderLockedOrder(order);
      renderProductsForOrder(order);
    } else if (orderLockedArea) {
      orderLockedArea.innerHTML = `
        <div class="return-notice return-notice--warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Không tìm thấy đơn hàng <strong>${orderId}</strong>. Vui lòng kiểm tra lại mã đơn hàng.</span>
        </div>
      `;
    }
  }

  function renderLockedOrder(order) {
    orderLockedArea.innerHTML = `
      <div class="return-order-locked">
        <div class="return-order-locked__info">
          <div class="return-order-locked__detail">
            <strong>Đơn hàng #${order.id}</strong>
            <span>Ngày đặt: ${order.date} • ${order.totalProducts} sản phẩm</span>
          </div>
          <span class="return-order-locked__badge return-order-locked__badge--${order.status}">${order.statusLabel}</span>
        </div>
        <div class="return-order-locked__lock-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      </div>
    `;
  }

  function handleOrderSelection() {
    if (orderDropdownArea) orderDropdownArea.style.display = "block";
    if (orderLockedArea) orderLockedArea.style.display = "none";

    // Render order selection cards
    const orderList = document.getElementById("js-order-selection-list");
    if (!orderList) return;

    orderList.innerHTML = "";
    MOCK_ORDERS.forEach((order, index) => {
      const card = document.createElement("div");
      card.className = "selection-card" + (index === 0 ? " is-selected" : "");
      card.setAttribute("data-type", "order");
      card.innerHTML = `
        <div class="selection-card__content">
          <strong>Đơn hàng ${order.id}</strong>
          <span>Ngày đặt: ${order.date} • ${order.totalProducts} sản phẩm</span>
        </div>
        <div class="radio-indicator">
          <div class="radio-indicator__inner"></div>
        </div>
        <input type="radio" name="order_select" value="${order.id}" ${index === 0 ? "checked" : ""} style="display:none;" />
      `;
      orderList.appendChild(card);
    });

    // Select first order's products by default
    if (MOCK_ORDERS.length > 0) {
      if (hiddenOrderInput) hiddenOrderInput.value = MOCK_ORDERS[0].id;
      renderProductsForOrder(MOCK_ORDERS[0]);
    }

    // Bind order selection card clicks
    bindSelectionCards(orderList, "order");
  }

  // ──────────────────────────────────────────────────
  // 2. PRODUCT SELECTION RENDERING
  // ──────────────────────────────────────────────────

  function renderProductsForOrder(order) {
    if (!productSelectionList) return;
    productSelectionList.innerHTML = "";

    order.products.forEach((product, index) => {
      const card = document.createElement("div");
      card.className = "selection-card" + (index === 0 ? " is-selected" : "");
      card.setAttribute("data-type", "product");
      card.innerHTML = `
        <div class="selection-card__product-info">
          <div class="product-img-wrapper">
            <img src="${product.image}" alt="${product.name}" />
          </div>
          <div class="product-details">
            <strong>${product.name}</strong>
            <span>${product.variant}</span>
            <span class="product-price">${product.price}</span>
          </div>
        </div>
        <div class="checkbox-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <input type="checkbox" name="product_select" value="${product.id}" ${index === 0 ? "checked" : ""} style="display:none;" />
      `;
      productSelectionList.appendChild(card);
    });

    // Bind product selection card clicks
    bindSelectionCards(productSelectionList, "product");
  }

  // ──────────────────────────────────────────────────
  // 3. SELECTION CARD INTERACTION (Radio / Checkbox)
  // ──────────────────────────────────────────────────

  function bindSelectionCards(container, type) {
    const cards = container.querySelectorAll(".selection-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const input = card.querySelector("input");

        if (type === "order" || type === "method") {
          // Radio behavior
          const siblings = container.querySelectorAll(`[data-type="${type}"]`);
          siblings.forEach(c => {
            c.classList.remove("is-selected");
            const si = c.querySelector("input");
            if (si) si.checked = false;
          });
          card.classList.add("is-selected");
          if (input) input.checked = true;

          // If order changed, update products
          if (type === "order" && input) {
            const selectedOrder = MOCK_ORDERS.find(o => o.id === input.value);
            if (selectedOrder) {
              if (hiddenOrderInput) hiddenOrderInput.value = selectedOrder.id;
              renderProductsForOrder(selectedOrder);
            }
          }
        } else if (type === "product") {
          // Checkbox behavior
          const isSelected = card.classList.toggle("is-selected");
          if (input) input.checked = isSelected;
        }
      });
    });
  }

  // Bind method selection cards (already in HTML)
  const methodList = document.querySelector(".method-selection-list");
  if (methodList) {
    bindSelectionCards(methodList, "method");
  }

  // ──────────────────────────────────────────────────
  // 4. IMAGE UPLOAD HANDLING
  // ──────────────────────────────────────────────────

  const uploadBtn = document.querySelector(".btn-upload");
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", handleFileSelect);
  }

  function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (uploadedFiles.length >= maxFiles) {
        createToast(`Tối đa ${maxFiles} ảnh. Vui lòng xóa bớt ảnh trước khi thêm.`, "warning");
        break;
      }

      if (!file.type.startsWith("image/")) {
        createToast("Chỉ chấp nhận file ảnh (JPG, PNG, GIF...).", "warning");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        createToast("Kích thước ảnh tối đa 5MB.", "warning");
        continue;
      }

      uploadedFiles.push(file);

      const reader = new FileReader();
      reader.onload = function (e) {
        renderFilePreview(e.target.result, file.name, uploadedFiles.length - 1);
      };
      reader.readAsDataURL(file);
    }

    // Update counter text
    updateUploadCounter();

    // Reset input so the same file can be re-selected
    fileInput.value = "";
  }

  function renderFilePreview(src, name, index) {
    if (!filePreviewList) return;

    const wrapper = document.createElement("div");
    wrapper.className = "file-preview-item";
    wrapper.setAttribute("data-index", index);

    const img = document.createElement("img");
    img.src = src;
    img.alt = name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-file-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", function () {
      uploadedFiles.splice(index, 1);
      wrapper.remove();
      reindexPreviews();
      updateUploadCounter();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    filePreviewList.appendChild(wrapper);
  }

  function reindexPreviews() {
    if (!filePreviewList) return;
    const items = filePreviewList.querySelectorAll(".file-preview-item");
    items.forEach((item, i) => {
      item.setAttribute("data-index", i);
    });
  }

  function updateUploadCounter() {
    const counter = document.getElementById("js-upload-counter");
    if (counter) {
      counter.textContent = `${uploadedFiles.length}/${maxFiles} ảnh đã tải lên`;
    }
  }

  // ──────────────────────────────────────────────────
  // 5. FORM SUBMISSION
  // ──────────────────────────────────────────────────

  if (returnForm) {
    returnForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate selections
      const selectedOrder = hiddenOrderInput ? hiddenOrderInput.value : "";
      const selectedProducts = returnForm.querySelectorAll('input[name="product_select"]:checked');
      const selectedMethod = returnForm.querySelector('input[name="method_select"]:checked');
      const selectedReason = document.getElementById("returnReason");

      if (!selectedOrder) {
        createToast("Vui lòng chọn đơn hàng cần đổi/trả.", "warning");
        return;
      }

      if (selectedProducts.length === 0) {
        createToast("Vui lòng chọn ít nhất một sản phẩm cần đổi/trả.", "warning");
        return;
      }

      if (!selectedMethod) {
        createToast("Vui lòng chọn phương thức đổi/trả.", "warning");
        return;
      }

      if (selectedReason && !selectedReason.value) {
        createToast("Vui lòng chọn lý do đổi/trả.", "warning");
        selectedReason.focus();
        return;
      }

      if (uploadedFiles.length === 0) {
        createToast("Vui lòng tải lên ít nhất 1 ảnh minh chứng.", "warning");
        return;
      }

      // Success
      createToast("Yêu cầu đổi/trả hàng đã được gửi thành công! Chúng tôi sẽ liên hệ bạn trong 24h.", "success");

      // Optionally disable submit button
      const submitBtn = returnForm.querySelector(".btn-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đã gửi yêu cầu";
      }
    });
  }

  // Cancel button
  const cancelBtn = document.querySelector(".btn-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      window.history.back();
    });
  }

  // ──────────────────────────────────────────────────
  // 6. TOAST NOTIFICATIONS
  // ──────────────────────────────────────────────────

  function createToast(message, type) {
    const existing = document.querySelector(".velura-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "velura-toast";

    const bgColor = type === "success" ? "#2d6a4f" : type === "warning" ? "#b56727" : "#734724";

    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: ${bgColor};
      color: #fff;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      max-width: 420px;
      line-height: 1.5;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}
