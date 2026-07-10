/**
 * auth-external.js — Velura Auth Pages (Login / Register / Forgot Password)
 *
 * Bọc trong DOMContentLoaded để:
 * 1. Đảm bảo DOM đã sẵn sàng trước khi chạy
 * 2. Tất cả biến/hàm nội bộ KHÔNG rò rỉ ra global scope
 *    → Tránh lỗi "Identifier has already been declared"
 */
document.addEventListener('DOMContentLoaded', function () {

  function showToast(msg) {
    let c = document.querySelector(".toast-container");
    if (!c) { c = document.createElement("div"); c.className = "toast-container"; document.body.appendChild(c); }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<svg class="toast__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><div class="toast__content"><p class="toast__message">' + msg + '</p></div>';
    c.appendChild(t);
    void t.offsetWidth;
    t.classList.add("toast--show");
    setTimeout(() => { t.classList.remove("toast--show"); setTimeout(() => { t.remove(); if (!c.children.length) c.remove(); }, 400); }, 4000);
  }

  /* ---- Tab Switcher (Đăng nhập) ---- */
  window.switchTab = function (type) {
    const tabs = document.querySelectorAll('.velura-auth-page .tab-btn');
    const phoneGroup = document.getElementById('phoneGroup');
    const emailGroup = document.getElementById('emailGroup');

    tabs.forEach(function (tab) {
      tab.classList.remove('active');
      if (tab.textContent.toLowerCase().includes(type === 'email' ? 'email' : 'điện')) {
        tab.classList.add('active');
      }
    });

    if (phoneGroup && emailGroup) {
      if (type === 'email') {
        phoneGroup.style.display = 'none';
        emailGroup.style.display = 'block';
      } else {
        phoneGroup.style.display = 'block';
        emailGroup.style.display = 'none';
      }
    }
  };

  /* ---- Tab Switcher (Đăng ký) ---- */
  window.switchRegTab = function (type) {
    const tabs = document.querySelectorAll('.velura-auth-page .tab-btn');
    const emailGroup = document.getElementById('regEmailGroup');
    const phoneGroup = document.getElementById('regPhoneGroup');

    tabs.forEach(function (tab) {
      tab.classList.remove('active');
      if (tab.textContent.toLowerCase().includes(type === 'email' ? 'email' : 'điện')) {
        tab.classList.add('active');
      }
    });

    if (emailGroup && phoneGroup) {
      if (type === 'email') {
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'none';
      } else {
        emailGroup.style.display = 'none';
        phoneGroup.style.display = 'block';
      }
    }
  };

  /* ---- Tab Switcher (Quên mật khẩu) ---- */
  window.switchForgotTab = function (type) {
    const tabs = document.querySelectorAll('.velura-auth-page .tab-btn');
    const emailGroup = document.getElementById('forgotEmailGroup');
    const phoneGroup = document.getElementById('forgotPhoneGroup');

    tabs.forEach(function (tab) {
      tab.classList.remove('active');
      if (tab.textContent.toLowerCase().includes(type === 'email' ? 'email' : 'điện')) {
        tab.classList.add('active');
      }
    });

    if (emailGroup && phoneGroup) {
      if (type === 'email') {
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'none';
      } else {
        emailGroup.style.display = 'none';
        phoneGroup.style.display = 'block';
      }
    }
  };

  /* ---- Toggle Password Visibility ---- */
  window.togglePassword = function () {
    const input = document.getElementById('password');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  };

  window.toggleRegPassword = function () {
    const input = document.getElementById('reg-password');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  };

  window.toggleRegConfirmPassword = function () {
    const input = document.getElementById('reg-confirm-password');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  };

  /* ---- Form Submit Handlers ---- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Đăng nhập thành công! (Demo)');
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Đăng ký thành công! (Demo)');
    });
  }

  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Mã xác nhận đã được gửi! (Demo)');
    });
  }

}); // end DOMContentLoaded
