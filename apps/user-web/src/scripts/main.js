import { initGallery } from "./modules/gallery.js";
import { initTabs } from "./modules/tabs.js";
import { initQuantity } from "./modules/quantity.js";
import { initOptions } from "./modules/options.js";
import { initChatbot } from "./modules/chatbot.js";
import { initSearchOverlay } from "./modules/search-overlay.js";
import { initPolicyTabs } from "./modules/policy-tabs.js";
import { initContactForm } from "./modules/contact-form.js";
import { initVideoControl } from "./modules/video-control.js";
import { initProductCatalog } from "./modules/product-catalog.js";
import { initProfileForm } from "./modules/account-profile.js";
import { initStyleQuiz } from "./modules/style-quiz.js";
import { initQuizPopupTrigger } from "./modules/quiz-trigger.js";
import { initMyOrders } from "./modules/my-orders.js";
import { initProductReview } from "./modules/product-review.js";
import { initCollectionsFilter } from "./modules/collections.js";
import { initReturnRequest } from "./modules/return-request.js";
import { initBreadcrumb } from "./modules/breadcrumb.js";
import { initAuthClient } from "./modules/auth-client.js";
import { initWishlistPage, initWishlistBadge } from "./modules/wishlist.js";
import { initOrderDetail } from "./modules/order-detail.js";
import { initTrackOrder } from "./modules/track-order.js";
import { initHomepage } from "./modules/homepage.js";
import { initCart } from "./modules/cart.js";

(function () {
  "use strict";

  const path = window.location.pathname;
  if (path.includes("/pages/account/") && !path.includes("track-order.html")) {
    const token = localStorage.getItem("velura_token");
    if (!token) {
      window.location.href = "/src/pages/auth/signin.html";
      return;
    }
  }

  // Khởi tạo các module
  initGallery();
  initTabs();
  initQuantity();
  initOptions();
  initChatbot();
  initSearchOverlay();
  initPolicyTabs();
  initContactForm();
  initVideoControl();
  initProductCatalog();
  initProfileForm();
  initStyleQuiz();
  initQuizPopupTrigger();
  initMyOrders();
  initProductReview();
  initCollectionsFilter();
  initReturnRequest();
  initBreadcrumb();
  initAuthClient();
  initWishlistPage();
  initWishlistBadge();
  initOrderDetail();
  initTrackOrder();
  initHomepage();
  initCart();

  /* Mobile navigation */
  var menuToggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".site-header__nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      var expanded = nav.classList.contains("is-open");
      menuToggle.setAttribute("aria-expanded", expanded);
    });
  }

  /* Sign-in tabs */
  var tabList = document.querySelector(".tabs");
  if (tabList) {
    var tabs = tabList.querySelectorAll(".tab");
    var panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("tab--active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("tab--active");
        tab.setAttribute("aria-selected", "true");

        panels.forEach(function (panel, i) {
          panel.classList.toggle("is-active", i === index);
        });
      });
    });
  }

  /* Password visibility toggle */
  document.querySelectorAll(".field__toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = btn.closest(".field__control").querySelector(".field__input");
      if (!input) return;
      var isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu");
    });
  });

  /* Address card selection */
  document.querySelectorAll(".address-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var list = card.closest(".address-list");
      if (!list) return;
      list.querySelectorAll(".address-card").forEach(function (c) {
        c.classList.remove("is-selected");
      });
      card.classList.add("is-selected");
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  /* Option card (shipping / payment) selection */
  document.querySelectorAll(".option-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var name = card.querySelector('input[type="radio"]');
      if (!name) return;
      var group = document.querySelectorAll('input[name="' + name.name + '"]');
      group.forEach(function (input) {
        input.closest(".option-card").classList.remove("is-selected");
      });
      name.checked = true;
      card.classList.add("is-selected");
    });
  });

  /* AI style chips */
  document.querySelectorAll(".ai-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      chip.classList.toggle("is-selected");
    });
  });

  /* OTP inputs — auto focus next */
  var otpInputs = document.querySelectorAll(".otp-input");
  if (otpInputs.length) {
    otpInputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        if (input.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });
  }

  /* OTP countdown timer */
  var timerEl = document.querySelector(".otp-timer");
  if (timerEl) {
    var seconds = 10;
    timerEl.textContent = "(" + seconds + "S)";
    var interval = setInterval(function () {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(interval);
        timerEl.textContent = "(0S)";
        return;
      }
      timerEl.textContent = "(" + seconds + "S)";
    }, 1000);
  }

  /* Prevent default on demo forms */
  document.querySelectorAll("form[data-prevent-submit]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  });

  /* Style Quiz Modal */
  var quizModal = document.getElementById("quiz-modal");
  if (quizModal) {
    var openBtn = document.querySelector(".js-open-quiz");
    var closeBtns = quizModal.querySelectorAll(".js-close-quiz");
    var overlay = quizModal.querySelector(".quiz-modal__overlay");

    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        quizModal.classList.add("quiz-modal--active");
      });
    }

    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        quizModal.classList.remove("quiz-modal--active");
      });
    });

    if (overlay) {
      overlay.addEventListener("click", function () {
        quizModal.classList.remove("quiz-modal--active");
      });
    }
  }

  /* Filter Sidebar Toggle (Mobile) */
  var filterSidebar = document.getElementById("filter-sidebar");
  if (filterSidebar) {
    var filterToggles = document.querySelectorAll(".js-filter-toggle");
    filterToggles.forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        filterSidebar.classList.toggle("filter-sidebar--open");
      });
    });
  }

  /* Color Option Toggle */
  if (!document.querySelector(".product-list-page")) {
    var colorOptions = document.querySelectorAll(".color-option");
    colorOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        option.classList.toggle("is-selected");
      });
    });

    /* Size Option Toggle */
    var sizeOptions = document.querySelectorAll(".size-option");
    sizeOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        option.classList.toggle("is-active");
      });
    });
  }

  /* Add to Cart Micro-Interaction (Handled dynamically in modules)
  var addBtns = document.querySelectorAll(".card__add-btn, .card__btn-cart");
  var cartBadge = document.querySelector(".cart-badge");
  addBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (cartBadge) {
        var count = parseInt(cartBadge.textContent, 10) || 0;
        cartBadge.textContent = count + 1;

        // Micro-animation for cart badge
        cartBadge.style.transform = "scale(1.3)";
        cartBadge.style.transition = "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        setTimeout(function () {
          cartBadge.style.transform = "scale(1)";
        }, 150);
      }
    });
  });
  */

  /* Wishlist Heart Toggle (Handled dynamically in modules)
  var heartBtns = document.querySelectorAll(".card__wishlist-btn");
  heartBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn click lan tới card sản phẩm
      btn.classList.toggle("is-active");

      // Micro-animation khi click
      btn.style.transform = "scale(1.25)";
      btn.style.transition = "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      setTimeout(function () {
        btn.style.transform = "scale(1)";
      }, 150);
    });
  });
  */

  /* Product Card Color Dot Selection */
  var cardColorDots = document.querySelectorAll(".card__color-dot");
  cardColorDots.forEach(function (dot) {
    dot.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn click lan tới card sản phẩm
      var parent = dot.closest(".card__colors");
      if (parent) {
        parent.querySelectorAll(".card__color-dot").forEach(function (d) {
          d.classList.remove("is-active");
        });
      }
      dot.classList.add("is-active");
    });
  });

})();