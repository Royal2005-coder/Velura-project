export function initExitIntentPopup() {
  // Listen for mouse leave (Exit Intent)
  const onMouseLeave = (e) => {
    // Relax the threshold to 20px so it triggers more reliably when mouse moves up
    if (e.clientY <= 20) {
      const token = localStorage.getItem("velura_token");
      if (token) return;

      const cart = JSON.parse(localStorage.getItem("velura_cart") || "[]");
      const wishlist = JSON.parse(localStorage.getItem("velura_guest_wishlist") || "[]");
      const hasQuiz = localStorage.getItem("velura_guest_quiz_completed") === "true";
      const hasChat = !!localStorage.getItem("velura_chat_session_id");

      if (cart.length === 0 && wishlist.length === 0 && !hasQuiz && !hasChat) return;

      // Smart Throttling: Only show if the data state has changed since the last popup
      const currentState = `${cart.length}_${wishlist.length}_${hasQuiz}_${hasChat}`;
      const lastShownState = sessionStorage.getItem("velura_exit_intent_last_state");
      
      if (currentState === lastShownState) return;
      if (document.getElementById("exit-intent-modal")) return;

      showPopup(cart, wishlist, hasQuiz, hasChat, currentState);
    }
  };

  const showPopup = (cart, wishlist, hasQuiz, hasChat, currentState) => {
    // Record this state so we don't spam the user until they add more items
    sessionStorage.setItem("velura_exit_intent_last_state", currentState);
    
    let itemsToLose = [];
    if (cart.length > 0) itemsToLose.push(`giỏ hàng <strong>(${cart.length} món)</strong>`);
    if (wishlist.length > 0) itemsToLose.push(`yêu thích <strong>(${wishlist.length} món)</strong>`);
    if (hasQuiz) itemsToLose.push(`<strong>kết quả Style Quiz</strong>`);
    if (hasChat) itemsToLose.push(`<strong>lịch sử chat tư vấn AI</strong>`);
    const loseText = itemsToLose.join(', ');

    const modalHtml = `
      <style>
        .exit-modal-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .exit-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        .exit-modal-content {
          position: relative;
          background: #ffffff;
          max-width: 420px;
          width: 90%;
          text-align: center;
          padding: 40px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          animation: exitModalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .exit-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          color: #999;
          transition: color 0.2s;
        }
        .exit-modal-close:hover {
          color: #333;
        }
        @keyframes exitModalPop {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div class="exit-modal-wrapper" id="exit-intent-modal">
        <div class="exit-modal-overlay"></div>
        <div class="exit-modal-content">
          <button class="exit-modal-close" type="button" aria-label="Đóng">&times;</button>
          <div style="margin-bottom: 24px;">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c97b63" stroke-width="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #2a2522; margin-bottom: 12px;">Chờ đã! Bạn chưa lưu dữ liệu</h3>
          <p style="color: #6b635d; margin-bottom: 24px; line-height: 1.6; font-size: 0.9375rem;">
            Bạn đang truy cập dưới danh nghĩa Khách. Nếu thoát ngay, ${loseText} của bạn sẽ bị mất hoàn toàn theo quy trình bảo mật.
          </p>
          <a href="/src/pages/auth/signin.html" class="btn btn--primary" style="display: block; width: 100%; margin-bottom: 12px;">Đăng nhập để lưu thông tin</a>
          <button class="btn btn--outline js-exit-cancel" type="button" style="width: 100%;">Thoát cảnh báo, tôi muốn rời đi</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById("exit-intent-modal");
    const overlay = modal.querySelector(".exit-modal-overlay");
    const closeBtn = modal.querySelector(".exit-modal-close");
    const cancelBtn = modal.querySelector(".js-exit-cancel");

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
  };

  // Delay listener slightly to avoid triggering immediately on load
  setTimeout(() => {
    document.addEventListener("mouseleave", onMouseLeave);
  }, 500);
}
