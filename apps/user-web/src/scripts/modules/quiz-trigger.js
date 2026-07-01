/**
 * Velura — Style Quiz Pop-up Trigger Controller
 */

export function initQuizPopupTrigger() {
  const popup = document.getElementById("js-quiz-popup");
  if (!popup) return;

  // CHECK CHẶN LẶP LẠI (Tạm thời ẩn đi để phục vụ việc test giao diện khi reload trang)
  // const hasShown = sessionStorage.getItem("quiz_banner_shown");
  // if (hasShown) return;

  // Automatic timer mechanism: trigger after 5000ms (5 seconds)
  setTimeout(() => {
    // Re-check (Tạm thời ẩn đi để phục vụ việc test giao diện khi reload trang)
    // if (sessionStorage.getItem("quiz_banner_shown")) return;

    popup.classList.add("is-visible");
    
    // Đánh dấu đã hiện banner (Tạm thời ẩn đi để phục vụ việc test giao diện khi reload trang)
    // sessionStorage.setItem("quiz_banner_shown", "true");
  }, 5000);

  // Active close mechanism
  const closeElements = popup.querySelectorAll(".js-close-popup");
  closeElements.forEach(element => {
    element.addEventListener("click", () => {
      popup.classList.remove("is-visible");
      
      // Đánh dấu đã hiện banner khi đóng (Tạm thời ẩn đi để phục vụ việc test giao diện khi reload trang)
      // sessionStorage.setItem("quiz_banner_shown", "true");
    });
  });
}
