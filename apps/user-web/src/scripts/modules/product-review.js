/**
 * Velura — Product Review Screen Module
 */

export function initProductReview() {
  const container = document.querySelector(".product-review-page");
  if (!container) return; // Exit if not on the product review page

  // Parse order ID from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");

  // DOM Elements
  const productImg = document.getElementById("js-product-img");
  const productName = document.getElementById("js-product-name");
  const productVariant = document.getElementById("js-product-variant");
  const productPrice = document.getElementById("js-product-price");
  const productColorDot = document.getElementById("js-product-color-dot");

  const stars = document.querySelectorAll(".review-rating__star");
  const tagBtns = document.querySelectorAll(".review-tag-btn");
  const textarea = document.getElementById("js-review-textarea");
  
  const mediaInput = document.getElementById("js-media-input");
  const mediaPreview = document.getElementById("js-media-preview");
  const dropzone = document.getElementById("js-dropzone");
  
  const submitBtn = document.getElementById("js-btn-submit-review-main");

  let ratingValue = 0;
  let selectedFiles = [];

  // Product Database for dynamic loading based on order ID
  const orderProducts = {
    "VL-20260524-1234": {
      name: "Áo sơ mi linen trắng",
      variant: "Màu trắng &nbsp;&middot;&nbsp; Size: S",
      price: "1.290.000đ",
      img: "../../assets/images/image-1.png",
      color: "#FFFFFF"
    },
    "VL-20260520-0987": {
      name: "Váy midi hoa nhí vintage",
      variant: "Màu đỏ hoa nhí &nbsp;&middot;&nbsp; Size: M",
      price: "1.590.000đ",
      img: "../../assets/images/products/product-vay-midi-do.png",
      color: "#D2183D"
    },
    "VL-20260518-0654": {
      name: "Blazer linen cao cấp",
      variant: "Màu beige &nbsp;&middot;&nbsp; Size: L",
      price: "2.190.000đ",
      img: "../../assets/images/image-3.png",
      color: "#EFE7DD"
    },
    "VL-20260515-0432": {
      name: "Quần culottes thanh lịch",
      variant: "Màu đen &nbsp;&middot;&nbsp; Size: S",
      price: "990.000đ",
      img: "../../assets/images/image-6.png",
      color: "#000000"
    },
    "VL-20260510-0218": {
      name: "Áo khoác dạ camel",
      variant: "Màu camel &nbsp;&middot;&nbsp; Size: M",
      price: "3.490.000đ",
      img: "../../assets/images/image-4.png",
      color: "#C19A6B"
    },
    "VL-20260508-0107": {
      name: "Đầm dạ hội đen",
      variant: "Màu đen &nbsp;&middot;&nbsp; Size: S",
      price: "2.890.000đ",
      img: "../../assets/images/image-8.png",
      color: "#1C1B1B"
    }
  };

  // 1. Load product summary data
  function loadProductSummary() {
    if (orderId && orderProducts[orderId]) {
      const prod = orderProducts[orderId];
      if (productImg) productImg.src = prod.img;
      if (productName) productName.textContent = prod.name;
      if (productVariant) productVariant.innerHTML = prod.variant;
      if (productPrice) productPrice.textContent = prod.price;
      if (productColorDot) productColorDot.style.backgroundColor = prod.color;
    } else {
      // Default fallback matching figma look exactly
      if (productImg) productImg.src = "../../assets/images/product-silk-blazer.png";
      if (productName) productName.textContent = "Áo Blazer Lụa Satin";
      if (productVariant) productVariant.innerHTML = "Champagne &nbsp;&middot;&nbsp; Size: M";
      if (productPrice) productPrice.textContent = "1.200.000 VND";
      if (productColorDot) productColorDot.style.backgroundColor = "#E6D9CD";
    }
  }

  // 2. Interactivity Star Rating
  function setupStars() {
    stars.forEach(star => {
      // Hover element enter
      star.addEventListener("mouseenter", () => {
        const val = parseInt(star.getAttribute("data-value"), 10);
        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute("data-value"), 10);
          s.classList.toggle("is-hovered", sVal <= val);
        });
      });

      // Hover element leave
      star.addEventListener("mouseleave", () => {
        stars.forEach(s => s.classList.remove("is-hovered"));
      });

      // Click select
      star.addEventListener("click", () => {
        ratingValue = parseInt(star.getAttribute("data-value"), 10);
        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute("data-value"), 10);
          s.classList.toggle("is-selected", sVal <= ratingValue);
        });
      });
    });
  }

  // 3. Quick comments suggestion tags
  function setupTags() {
    tagBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        const isActive = btn.classList.toggle("is-active");

        let currentComment = textarea.value.trim();

        if (isActive) {
          // Append comment tag
          if (currentComment === "") {
            textarea.value = text;
          } else {
            // Avoid adding same tag twice
            if (!currentComment.includes(text)) {
              textarea.value = currentComment + ", " + text.toLowerCase();
            }
          }
        } else {
          // Remove comment tag
          const escapedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          const regex = new RegExp(`(,\\s*)?${escapedText}|(,\\s*)?${escapedText.toLowerCase()}`, "g");
          let cleanComment = currentComment.replace(regex, "").trim();
          
          // Fix formatting issues
          cleanComment = cleanComment.replace(/^,\s*/, "").replace(/,\s*$/, "");
          textarea.value = cleanComment;
        }
      });
    });
  }

  // 4. File upload & previews
  function setupMediaUpload() {
    if (!mediaInput || !mediaPreview || !dropzone) return;

    // Trigger input file on dropzone click
    dropzone.addEventListener("click", () => {
      mediaInput.click();
    });

    mediaInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);

      files.forEach(file => {
        if (selectedFiles.length >= 6) {
          alert("Bạn chỉ có thể tải lên tối đa 5 hình ảnh và 1 video!");
          return;
        }

        selectedFiles.push(file);
        
        const wrapper = document.createElement("div");
        wrapper.className = "media-upload__thumb-wrapper";

        const img = document.createElement("img");
        img.className = "media-upload__thumb";
        img.src = URL.createObjectURL(file);
        wrapper.appendChild(img);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "media-upload__remove-btn";
        removeBtn.innerHTML = "×";
        removeBtn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          selectedFiles = selectedFiles.filter(f => f !== file);
          wrapper.remove();
        });
        wrapper.appendChild(removeBtn);

        mediaPreview.appendChild(wrapper);
      });

      // Clear input so same file can be selected again
      mediaInput.value = "";
    });
  }

  // 5. Submit Form
  function setupSubmit() {
    if (!submitBtn) return;

    submitBtn.addEventListener("click", () => {
      if (ratingValue === 0) {
        alert("Vui lòng chọn số sao đánh giá sản phẩm!");
        return;
      }

      // Show spinner / disable state if needed
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi...";

      setTimeout(() => {
        // Save reviewed state in sessionStorage
        if (orderId) {
          sessionStorage.setItem(`order_status_${orderId}`, "reviewed");
        }

        createToast("Cảm ơn bạn đã gửi đánh giá sản phẩm!");

        // Route back after 1.5 seconds
        setTimeout(() => {
          window.location.href = "/src/pages/account/my-orders.html";
        }, 1500);
      }, 800);
    });
  }

  // Toast alert system
  function createToast(message) {
    const existing = document.querySelector(".velura-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "velura-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: #7D562D;
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
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Fade-in
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 50);

    // Fade-out and clean
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Run initial loading
  loadProductSummary();
  setupStars();
  setupTags();
  setupMediaUpload();
  setupSubmit();
}
