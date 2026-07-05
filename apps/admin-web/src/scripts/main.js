(function () {
  "use strict";

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
})();
