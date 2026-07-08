/**
 * Velura — Style Quiz Pop-up Trigger Controller
 */

import { isSessionValid, apiRequest } from "./api.js";

export function initQuizPopupTrigger() {
  const popup = document.getElementById("js-quiz-popup");
  if (!popup) return;

  // Don't show if already shown in this session
  if (sessionStorage.getItem("quiz_banner_shown") === "true") {
    return;
  }

  // Active close mechanism
  const closeElements = popup.querySelectorAll(".js-close-popup");
  closeElements.forEach(element => {
    element.addEventListener("click", () => {
      popup.classList.remove("is-visible");
      sessionStorage.setItem("quiz_banner_shown", "true");
    });
  });

  const checkAndTrigger = async () => {
    try {
      const isMember = isSessionValid();
      
      if (isMember) {
        // Member: Check database style profile
        const res = await apiRequest("/api/user/style-quiz");
        if (res && res.success && res.quiz && (res.quiz.body_shape || res.quiz.style_tags)) {
          // Member has already completed the quiz, do not show banner
          return;
        }
      } else {
        // Guest: Check local completion flag or session storage
        const hasCompleted = localStorage.getItem("velura_guest_quiz_completed") === "true" ||
                             !!sessionStorage.getItem("quiz-height");
        if (hasCompleted) {
          // Guest has already completed the quiz, do not show banner
          return;
        }
      }

      // If we reach here, user has not completed the quiz and hasn't seen the banner in this session.
      // Trigger after 5 seconds
      setTimeout(() => {
        if (sessionStorage.getItem("quiz_banner_shown") === "true") return;
        popup.classList.add("is-visible");
        sessionStorage.setItem("quiz_banner_shown", "true");
      }, 5000);

    } catch (err) {
      console.warn("Error running style quiz banner trigger check:", err);
    }
  };

  checkAndTrigger();
}

