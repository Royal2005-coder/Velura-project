import { apiRequest } from "./api.js";

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
  let currentProduct = null;

  // Load product summary data from API
  function loadProductSummary() {
    if (!orderId) {
      // Fallback matching template
      setDefaultFallback();
      return;
    }

    apiRequest(`/api/user/orders/${orderId}`)
      .then(order => {
        if (order && order.items && order.items.length > 0) {
          const firstItem = order.items[0];
          currentProduct = firstItem;

          if (productImg) productImg.src = firstItem.product_image || "../../assets/images/product-silk-blazer.png";
          if (productName) productName.textContent = firstItem.product_name;
          if (productVariant) productVariant.innerHTML = "Sản phẩm trong đơn hàng";
          if (productPrice) {
            productPrice.textContent = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(firstItem.unit_price);
          }
          if (productColorDot) productColorDot.style.backgroundColor = "var(--terracotta)";
        } else {
          setDefaultFallback();
        }
      })
      .catch(err => {
        console.error("Failed to load order items:", err);
        setDefaultFallback();
      });
  }

  function setDefaultFallback() {
    if (productImg) productImg.src = "../../assets/images/product-silk-blazer.png";
    if (productName) productName.textContent = "Áo Blazer Lụa Satin";
    if (productVariant) productVariant.innerHTML = "Champagne &nbsp;&middot;&nbsp; Size: M";
    if (productPrice) productPrice.textContent = "1.200.000đ";
    if (productColorDot) productColorDot.style.backgroundColor = "#E6D9CD";
  }

  // Interactivity Star Rating
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

  // Quick comments suggestion tags
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

  // File upload & previews
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

  // Submit Form
  function setupSubmit() {
    if (!submitBtn) return;

    submitBtn.addEventListener("click", async () => {
      if (ratingValue === 0) {
        alert("Vui lòng chọn số sao đánh giá sản phẩm!");
        return;
      }

      if (!orderId || !currentProduct || !currentProduct.product_id) {
        // Fallback or demo completion if order details didn't load completely
        sessionStorage.setItem(`order_status_${orderId}`, "reviewed");
        sessionStorage.setItem(`order_reviewed_${orderId}`, "true");
        createToast("Cảm ơn bạn đã gửi đánh giá sản phẩm!");
        setTimeout(() => {
          window.location.href = "/src/pages/account/my-orders.html";
        }, 1500);
        return;
      }

      submitBtn.disabled = true;

      // Upload images first (if any)
      let fileUrls = [];
      if (selectedFiles.length > 0) {
        submitBtn.textContent = "Đang tải ảnh...";
        try {
          fileUrls = await uploadReviewImages(selectedFiles);
        } catch (uploadErr) {
          createToast(`Lỗi tải ảnh: ${uploadErr.message}`);
          submitBtn.disabled = false;
          submitBtn.textContent = "Gửi đánh giá";
          return;
        }
      }

      submitBtn.textContent = "Đang gửi...";

      const activeTags = Array.from(tagBtns)
        .filter(btn => btn.classList.contains("is-active"))
        .map(btn => btn.getAttribute("data-text"));

      const payload = {
        product_id: currentProduct.product_id,
        order_id: orderId,
        rating: ratingValue,
        comment: textarea.value.trim(),
        images: fileUrls,
        review_tags: activeTags
      };

      apiRequest("/api/user/reviews", { method: "POST", body: payload })
        .then((res) => {
          if (res && res.review && res.review.status === "rejected") {
            createToast(`⚠️ Kiểm duyệt: Đánh giá bị từ chối do ${res.review.rejection_reason.toLowerCase()}. Vui lòng sửa lại nội dung!`, 5000);
            submitBtn.disabled = false;
            submitBtn.textContent = "GỬI LẠI ĐÁNH GIÁ";
          } else {
            sessionStorage.setItem(`order_status_${orderId}`, "reviewed");
            sessionStorage.setItem(`order_reviewed_${orderId}`, "true");
            createToast("Cảm ơn bạn đã gửi đánh giá sản phẩm! Đánh giá đã được phê duyệt tự động.");
            setTimeout(() => {
              window.location.href = "/src/pages/account/my-orders.html";
            }, 2000);
          }
        })
        .catch(err => {
          createToast(`Lỗi: ${err.message}`);
          submitBtn.disabled = false;
          submitBtn.textContent = "Gửi đánh giá";
        });
    });
  }

  /**
   * Upload review image files to Supabase Storage via the backend proxy.
   * Uses the same endpoint as return evidence images.
   * Returns an array of public URLs.
   */
  async function uploadReviewImages(files) {
    const token = localStorage.getItem("velura_token");
    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file, file.name);

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("http://localhost:8787/api/user/upload/evidence", {
        method: "POST",
        headers,
        body: formData
      });

      if (!response.ok) {
        let errMsg = `Lỗi tải ảnh ${i + 1}/${files.length}`;
        try {
          const errData = await response.json();
          errMsg = errData?.error?.message || errData?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json().catch(() => ({}));
      if (!data.url) throw new Error(`Ảnh ${i + 1}: Server không trả về URL`);
      urls.push(data.url);
    }

    return urls;
  }



  // Toast alert system
  function createToast(message, duration = 3000) {
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
      max-width: 400px;
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
    }, duration);
  }

  // Run initial loading
  loadProductSummary();
  setupStars();
  setupTags();
  setupMediaUpload();
  setupSubmit();
}
