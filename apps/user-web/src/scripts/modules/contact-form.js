/**
 * Contact Page Module — Velura
 * Quản lý tương tác Form liên hệ, kiểm thử dữ liệu đầu vào (Client-side validation)
 * Hiển thị Toast thông báo và hiệu ứng FAQ Accordion mượt mà.
 */

export function initContactForm() {
  const form = document.querySelector(".js-contact-form");
  if (form) {
    setupFormValidation(form);
  }
  setupFaqAccordion();
}

/**
 * Cài đặt Validation & Submit cho Form liên hệ
 */
function setupFormValidation(form) {
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");

  const inputs = [nameInput, emailInput, messageInput];

  // Xóa class lỗi khi người dùng bắt đầu nhập lại dữ liệu
  inputs.forEach(input => {
    if (!input) return;
    input.addEventListener("input", function () {
      if (input.classList.contains("is-invalid")) {
        input.classList.remove("is-invalid");
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let isValid = true;

    // 1. Kiểm tra Họ và tên (bắt buộc)
    if (nameInput) {
      const nameVal = nameInput.value.trim();
      const nameError = nameInput.parentElement.querySelector(".contact-form__error");
      if (!nameVal) {
        nameInput.classList.add("is-invalid");
        if (nameError) nameError.textContent = "Vui lòng nhập họ và tên của bạn.";
        isValid = false;
      } else {
        nameInput.classList.remove("is-invalid");
      }
    }

    // 2. Kiểm tra Email (bắt buộc & đúng định dạng)
    if (emailInput) {
      const emailVal = emailInput.value.trim();
      const emailError = emailInput.parentElement.querySelector(".contact-form__error");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal) {
        emailInput.classList.add("is-invalid");
        if (emailError) emailError.textContent = "Vui lòng nhập địa chỉ email.";
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        emailInput.classList.add("is-invalid");
        if (emailError) emailError.textContent = "Địa chỉ email không đúng định dạng.";
        isValid = false;
      } else {
        emailInput.classList.remove("is-invalid");
      }
    }

    // 3. Kiểm tra Nội dung tin nhắn (bắt buộc)
    if (messageInput) {
      const msgVal = messageInput.value.trim();
      const msgError = messageInput.parentElement.querySelector(".contact-form__error");
      if (!msgVal) {
        messageInput.classList.add("is-invalid");
        if (msgError) msgError.textContent = "Vui lòng nhập nội dung tin nhắn.";
        isValid = false;
      } else {
        messageInput.classList.remove("is-invalid");
      }
    }

    // Nếu thông tin hợp lệ
    if (isValid) {
      // Hiển thị Toast thông báo thành công
      showToast("Cảm ơn bạn đã liên hệ. Velura sẽ phản hồi trong vòng 24 giờ.");
      
      // Reset form nhập liệu
      form.reset();
    }
  });
}

/**
 * Hiển thị thông báo Toast nổi ở góc dưới bên phải
 */
function showToast(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg class="toast__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
    </svg>
    <span class="toast__message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger hiệu ứng trượt vào
  setTimeout(() => {
    toast.classList.add("is-visible");
  }, 50);

  // Tự động đóng sau 4 giây
  setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.addEventListener("transitionend", () => {
      toast.remove();
      // Nếu không còn toast nào, dọn dẹp container luôn
      if (container.children.length === 0) {
        container.remove();
      }
    });
  }, 4000);
}

/**
 * Cài đặt Accordion cho mục Câu hỏi thường gặp (FAQ)
 */
function setupFaqAccordion() {
  const headers = document.querySelectorAll(".js-accordion-header");
  if (!headers.length) return;

  headers.forEach(header => {
    header.addEventListener("click", function () {
      const item = header.closest(".accordion-item");
      const content = item.querySelector(".accordion-content");
      const isOpen = item.classList.contains("is-open");

      // Đóng tất cả câu hỏi khác
      document.querySelectorAll(".accordion-item").forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove("is-open");
          const otherContent = otherItem.querySelector(".accordion-content");
          if (otherContent) {
            otherContent.style.maxHeight = null;
          }
        }
      });

      // Bật/tắt câu hỏi hiện tại
      if (isOpen) {
        item.classList.remove("is-open");
        content.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // Mở mặc định câu hỏi đầu tiên theo Figma
  const firstItem = document.querySelector(".accordion-item");
  if (firstItem) {
    firstItem.classList.add("is-open");
    const firstContent = firstItem.querySelector(".accordion-content");
    if (firstContent) {
      firstContent.style.maxHeight = firstContent.scrollHeight + "px";
    }
  }
}
