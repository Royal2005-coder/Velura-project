/**
 * Velura — Style Quiz Interactive Controller
 */

import { showToast } from "./account-profile.js";

export function initStyleQuiz() {
  const container = document.querySelector(".quiz-container");
  if (!container) return;

  let currentStep = 1;
  const maxSteps = 7;
  let isSummaryScreen = false;

  const steps = container.querySelectorAll(".quiz-step-content");
  const btnNext = document.getElementById("js-btn-next");
  const btnPrev = document.getElementById("js-btn-prev");
  const stepNumDisplay = document.getElementById("current-step-num");
  const progressBar = container.querySelector(".quiz-progress__bar");

  // Slider controls
  const heightInput = document.getElementById("input-height");
  const weightInput = document.getElementById("input-weight");
  const heightValDisplay = document.getElementById("height-val");
  const weightValDisplay = document.getElementById("weight-val");

  // Step 3 inputs
  const vong1Input = document.getElementById("input-vong1");
  const vong2Input = document.getElementById("input-vong2");
  const vong3Input = document.getElementById("input-vong3");

  // Synchronize height slider values
  if (heightInput && heightValDisplay) {
    heightInput.addEventListener("input", (e) => {
      heightValDisplay.textContent = e.target.value;
      saveStepToSessionStorage();
    });
  }

  // Synchronize weight slider values
  if (weightInput && weightValDisplay) {
    weightInput.addEventListener("input", (e) => {
      weightValDisplay.textContent = e.target.value;
      saveStepToSessionStorage();
    });
  }

  // Listen to numeric input changes
  [vong1Input, vong2Input, vong3Input].forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        saveStepToSessionStorage();
      });
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.get('mode') === 'edit';

  // Load any previously cached data from sessionStorage
  prefillQuizData();

  // Selection logic for choices
  container.addEventListener("click", (e) => {
    // 1. Single or Multi select options (Steps 1, 4, 5)
    const optionBtn = e.target.closest(".js-quiz-option");
    if (optionBtn) {
      const groupContainer = optionBtn.closest("[data-group]");
      if (groupContainer) {
        const isMulti = groupContainer.getAttribute("data-multi") === "true";
        if (isMulti) {
          optionBtn.classList.toggle("is-selected");
        } else {
          const siblings = groupContainer.querySelectorAll(".js-quiz-option");
          siblings.forEach(sibling => sibling.classList.remove("is-selected"));
          optionBtn.classList.add("is-selected");
        }
        saveStepToSessionStorage();
      }
      return;
    }

    // 2. Single select budget cards (Step 7)
    const budgetCard = e.target.closest(".quiz-budget-card");
    if (budgetCard) {
      const listContainer = budgetCard.closest(".quiz-budget-list");
      if (listContainer) {
        const cards = listContainer.querySelectorAll(".quiz-budget-card");
        cards.forEach(card => card.classList.remove("is-selected"));
        budgetCard.classList.add("is-selected");
        saveStepToSessionStorage();
      }
      return;
    }

    // 3. Multi-select colors (Step 6)
    const colorBtn = e.target.closest(".js-quiz-color-option");
    if (colorBtn) {
      colorBtn.classList.toggle("is-selected");
      saveStepToSessionStorage();
      return;
    }
  });

  // Navigation: Previous Button Click
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (isSummaryScreen) {
        isSummaryScreen = false;
        updateQuizUI();
      } else if (currentStep > 1) {
        currentStep--;
        updateQuizUI();
      }
    });
  }

  // Navigation: Next Button Click
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (isSummaryScreen) {
        runAILoadingSimulation();
      } else {
        if (validateStep(currentStep)) {
          if (currentStep === maxSteps) {
            gatherQuizResults();
            isSummaryScreen = true;
            updateQuizUI();
          } else {
            currentStep++;
            updateQuizUI();
          }
        }
      }
    });
  }

  // Initial UI sync
  updateQuizUI();

  /**
   * Update the visible step content, progress indicators, and button texts
   */
  function updateQuizUI() {
    const progressContainer = container.querySelector(".quiz-progress");

    if (isSummaryScreen) {
      // Hide all steps
      steps.forEach(step => step.classList.remove("is-active"));
      
      // Show summary step
      const summaryStep = document.getElementById("js-step-summary");
      if (summaryStep) {
        summaryStep.classList.add("is-active");
      }

      // Prev button visible
      if (btnPrev) {
        btnPrev.style.visibility = "visible";
      }

      // Next button text changes to "Hoàn tất"
      if (btnNext) {
        btnNext.innerHTML = `
          Hoàn tất
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 4px;">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        `;
      }

      // Hide progress header, but keep it hidden or progress bar at 100%
      if (progressContainer) {
        progressContainer.style.display = "none";
      }
    } else {
      // Show survey progress
      if (progressContainer) {
        progressContainer.style.display = "block";
      }

      // Show current step content
      steps.forEach(step => {
        const stepVal = parseInt(step.getAttribute("data-quiz-step"), 10);
        if (stepVal === currentStep) {
          step.classList.add("is-active");
        } else {
          step.classList.remove("is-active");
        }
      });

      // Hide summary step
      const summaryStep = document.getElementById("js-step-summary");
      if (summaryStep) {
        summaryStep.classList.remove("is-active");
      }

      // Prev button visibility: hidden at step 1, otherwise visible
      if (btnPrev) {
        if (currentStep === 1) {
          btnPrev.style.visibility = "hidden";
        } else {
          btnPrev.style.visibility = "visible";
        }
      }

      // Next button text standard
      if (btnNext) {
        btnNext.innerHTML = `
          Tiếp tục
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 4px;">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        `;
      }

      // Update progress bar
      if (stepNumDisplay) {
        stepNumDisplay.textContent = currentStep;
      }
      if (progressBar) {
        const percentage = (currentStep / maxSteps) * 100;
        progressBar.style.width = `${percentage}%`;
      }
    }
  }

  /**
   * Validate step before moving forward
   */
  function validateStep(step) {
    switch (step) {
      case 1:
        const contextSelected = container.querySelector('[data-group="context"] .is-selected');
        const ageSelected = container.querySelector('[data-group="age"] .is-selected');
        if (!contextSelected || !ageSelected) {
          showToast("Vui lòng chọn bối cảnh mặc và độ tuổi.");
          return false;
        }
        return true;

      case 2:
        return true; // Range sliders are always populated

      case 3:
        if (!vong1Input || !vong2Input || !vong3Input) return false;
        const v1 = parseInt(vong1Input.value, 10);
        const v2 = parseInt(vong2Input.value, 10);
        const v3 = parseInt(vong3Input.value, 10);

        if (isNaN(v1) || v1 < 50 || v1 > 150) {
          showToast("Vui lòng nhập Vòng 1 hợp lệ (50 - 150 cm).");
          return false;
        }
        if (isNaN(v2) || v2 < 40 || v2 > 130) {
          showToast("Vui lòng nhập Vòng 2 hợp lệ (40 - 130 cm).");
          return false;
        }
        if (isNaN(v3) || v3 < 60 || v3 > 160) {
          showToast("Vui lòng nhập Vòng 3 hợp lệ (60 - 160 cm).");
          return false;
        }
        return true;

      case 4:
        const shapeSelected = container.querySelector('[data-group="body-shape"] .is-selected');
        if (!shapeSelected) {
          showToast("Vui lòng chọn dáng người của bạn.");
          return false;
        }
        return true;

      case 5:
        const styleSelected = container.querySelector('[data-group="main-style"] .is-selected');
        if (!styleSelected) {
          showToast("Vui lòng chọn phong cách chủ đạo.");
          return false;
        }
        return true;

      case 6:
        const colorsSelected = container.querySelectorAll('.js-quiz-color-option.is-selected');
        if (colorsSelected.length === 0) {
          showToast("Vui lòng chọn ít nhất 1 màu sắc yêu thích.");
          return false;
        }
        return true;

      case 7:
        const budgetSelected = container.querySelector('.quiz-budget-card.is-selected');
        if (!budgetSelected) {
          showToast("Vui lòng chọn mức ngân sách mong muốn.");
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Save current step values to SessionStorage
   */
  function saveStepToSessionStorage() {
    try {
      const context = container.querySelector('[data-group="context"] .is-selected')?.getAttribute("data-value");
      if (context) sessionStorage.setItem("quiz-context", context);

      const age = container.querySelector('[data-group="age"] .is-selected')?.getAttribute("data-value");
      if (age) sessionStorage.setItem("quiz-age", age);

      if (heightInput) sessionStorage.setItem("quiz-height", heightInput.value);
      if (weightInput) sessionStorage.setItem("quiz-weight", weightInput.value);

      if (vong1Input) sessionStorage.setItem("quiz-vong1", vong1Input.value);
      if (vong2Input) sessionStorage.setItem("quiz-vong2", vong2Input.value);
      if (vong3Input) sessionStorage.setItem("quiz-vong3", vong3Input.value);

      const shape = container.querySelector('[data-group="body-shape"] .is-selected')?.getAttribute("data-value");
      if (shape) sessionStorage.setItem("quiz-body-shape", shape);

      const selectedStyles = container.querySelectorAll('[data-group="main-style"] .is-selected');
      const styles = Array.from(selectedStyles).map(btn => btn.getAttribute("data-value"));
      sessionStorage.setItem("quiz-main-style", JSON.stringify(styles));

      const selectedColors = container.querySelectorAll('.js-quiz-color-option.is-selected');
      const colors = Array.from(selectedColors).map(btn => btn.getAttribute("data-value"));
      sessionStorage.setItem("quiz-colors", JSON.stringify(colors));

      const budget = container.querySelector('.quiz-budget-card.is-selected')?.getAttribute("data-value");
      if (budget) sessionStorage.setItem("quiz-budget", budget);
    } catch (err) {
      console.warn("Could not save style quiz state to sessionStorage:", err);
    }
  }

  /**
   * Prefill data from SessionStorage if it exists (Pre-fill Form Mechanism)
   */
  function prefillQuizData() {
    try {
      // 1. Context
      const context = sessionStorage.getItem("quiz-context");
      if (context) {
        const btns = container.querySelectorAll('[data-group="context"] .js-quiz-option');
        btns.forEach(btn => btn.classList.remove("is-selected"));
        btns.forEach(btn => {
          const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
          btn.classList.toggle("is-selected", val === context);
        });
      }

      // 2. Age
      const age = sessionStorage.getItem("quiz-age");
      if (age) {
        const btns = container.querySelectorAll('[data-group="age"] .js-quiz-option');
        btns.forEach(btn => btn.classList.remove("is-selected"));
        btns.forEach(btn => {
          const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
          btn.classList.toggle("is-selected", val === age);
        });
      }

      // 3. Height & Weight
      const height = sessionStorage.getItem("quiz-height");
      if (height && heightInput && heightValDisplay) {
        heightInput.value = height;
        heightValDisplay.textContent = height;
      }
      const weight = sessionStorage.getItem("quiz-weight");
      if (weight && weightInput && weightValDisplay) {
        weightInput.value = weight;
        weightValDisplay.textContent = weight;
      }

      // 4. Bust/Waist/Hip measurements
      const v1 = sessionStorage.getItem("quiz-vong1");
      if (v1 && vong1Input) vong1Input.value = v1;
      const v2 = sessionStorage.getItem("quiz-vong2");
      if (v2 && vong2Input) vong2Input.value = v2;
      const v3 = sessionStorage.getItem("quiz-vong3");
      if (v3 && vong3Input) vong3Input.value = v3;

      // 5. Body Shape
      const shape = sessionStorage.getItem("quiz-body-shape");
      if (shape) {
        const btns = container.querySelectorAll('[data-group="body-shape"] .js-quiz-option');
        btns.forEach(btn => btn.classList.remove("is-selected"));
        btns.forEach(btn => {
          const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
          btn.classList.toggle("is-selected", val === shape);
        });
      }

      // 6. Style
      const styleStr = sessionStorage.getItem("quiz-main-style");
      if (styleStr) {
        try {
          const styles = styleStr.startsWith("[") ? JSON.parse(styleStr) : [styleStr];
          const btns = container.querySelectorAll('[data-group="main-style"] .js-quiz-option');
          btns.forEach(btn => btn.classList.remove("is-selected"));
          btns.forEach(btn => {
            const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
            btn.classList.toggle("is-selected", styles.includes(val));
          });
        } catch (e) {
          const btns = container.querySelectorAll('[data-group="main-style"] .js-quiz-option');
          btns.forEach(btn => {
            const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
            btn.classList.toggle("is-selected", val === styleStr);
          });
        }
      }

      // 7. Colors
      const colorsStr = sessionStorage.getItem("quiz-colors");
      if (colorsStr) {
        try {
          const colors = JSON.parse(colorsStr);
          const btns = container.querySelectorAll('.js-quiz-color-option');
          btns.forEach(btn => btn.classList.remove("is-selected"));
          btns.forEach(btn => {
            const hex = btn.getAttribute("data-color-hex");
            const val = btn.getAttribute("data-quiz-value") || btn.getAttribute("data-value");
            btn.classList.toggle("is-selected", colors.includes(hex) || colors.includes(val));
          });
        } catch (e) {
          console.error(e);
        }
      }

      // 8. Budget
      const budget = sessionStorage.getItem("quiz-budget");
      if (budget) {
        const cards = container.querySelectorAll('.quiz-budget-card');
        cards.forEach(card => card.classList.remove("is-selected"));
        cards.forEach(card => {
          const val = card.getAttribute("data-quiz-value") || card.getAttribute("data-value");
          card.classList.toggle("is-selected", val === budget);
        });
      }
    } catch (err) {
      console.warn("Could not prefill style quiz state from sessionStorage:", err);
    }
  }

  /**
   * Collect all inputs and selection texts to display in the Style Summary table
   */
  function gatherQuizResults() {
    // 1. Context & Age
    const context = container.querySelector('[data-group="context"] .is-selected')?.textContent.trim() || "-";
    const age = container.querySelector('[data-group="age"] .is-selected')?.textContent.trim() || "-";
    const genderAgeDisplay = document.getElementById("summary-gender-age");
    if (genderAgeDisplay) {
      genderAgeDisplay.textContent = `${context}, Nhóm tuổi ${age}`;
    }

    // 2. Height & Weight
    const height = heightInput ? heightInput.value : "-";
    const weight = weightInput ? weightInput.value : "-";
    const heightWeightDisplay = document.getElementById("summary-height-weight");
    if (heightWeightDisplay) {
      heightWeightDisplay.textContent = `${height} cm, ${weight} kg`;
    }

    // 3. Bust/Waist/Hip measurements
    const v1 = vong1Input ? vong1Input.value : "-";
    const v2 = vong2Input ? vong2Input.value : "-";
    const v3 = vong3Input ? vong3Input.value : "-";
    const measurementsDisplay = document.getElementById("summary-measurements");
    if (measurementsDisplay) {
      measurementsDisplay.textContent = `Vòng 1: ${v1} cm | Vòng 2: ${v2} cm | Vòng 3: ${v3} cm`;
    }

    // 4. Body shape
    const bodyShapeCard = container.querySelector('[data-group="body-shape"] .is-selected');
    const bodyShapeName = bodyShapeCard ? bodyShapeCard.querySelector(".quiz-shape-card__name")?.textContent.trim() : "-";
    const bodyShapeDisplay = document.getElementById("summary-body-shape");
    if (bodyShapeDisplay) {
      bodyShapeDisplay.textContent = bodyShapeName;
    }

    // 5. Main style
    const selectedStyleItems = container.querySelectorAll('[data-group="main-style"] .is-selected');
    const mainStyleNames = Array.from(selectedStyleItems).map(item => {
      return item.querySelector(".quiz-style-item__name")?.textContent.trim() || item.getAttribute("data-value");
    });
    const mainStyleDisplay = document.getElementById("summary-main-style");
    if (mainStyleDisplay) {
      mainStyleDisplay.textContent = mainStyleNames.length > 0 ? mainStyleNames.join(", ") : "-";
    }

    // 6. Favorite colors (circular dots list)
    const selectedColors = container.querySelectorAll('.js-quiz-color-option.is-selected');
    const colorsContainer = document.querySelector("#summary-colors .quiz-summary-colors-list");
    if (colorsContainer) {
      colorsContainer.innerHTML = "";
      if (selectedColors.length > 0) {
        selectedColors.forEach(btn => {
          const hex = btn.getAttribute("data-color-hex");
          const name = btn.getAttribute("title") || btn.getAttribute("data-value");
          const dot = document.createElement("span");
          dot.className = "quiz-summary-color-dot";
          dot.style.backgroundColor = hex;
          dot.setAttribute("title", name);
          colorsContainer.appendChild(dot);
        });
      } else {
        colorsContainer.textContent = "Chưa chọn";
      }
    }

    // 7. Budget
    const budgetCard = container.querySelector('.quiz-budget-card.is-selected');
    const budgetTitle = budgetCard ? budgetCard.querySelector(".quiz-budget-card__title")?.textContent.trim() : "-";
    const budgetDisplay = document.getElementById("summary-budget");
    if (budgetDisplay) {
      budgetDisplay.textContent = budgetTitle;
    }
  }

  /**
   * Run the AI Loading simulation and redirect to Style Profile
   */
  function runAILoadingSimulation() {
    const loadingOverlay = document.getElementById("js-quiz-loading");
    const loadingMsg = document.getElementById("ai-loading-msg");
    if (!loadingOverlay || !loadingMsg) return;

    // Show loading overlay
    loadingOverlay.classList.add("is-visible");
    loadingOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Text messages simulation steps
    const simulationSteps = [
      { delay: 0, text: "AI đang phân tích chỉ số vóc dáng và tỉ lệ 3 vòng..." },
      { delay: 600, text: "AI đang so khớp sắc tố da và bảng màu phù hợp..." },
      { delay: 1200, text: "AI đang liên kết chất liệu yêu thích & ngân sách mua sắm..." },
      { delay: 1800, text: "Hợp nhất dữ liệu và tạo hồ sơ Style Profile tối ưu..." }
    ];

    // Gather and save Style Profile to Database
    const height_cm = parseInt(sessionStorage.getItem("quiz-height"), 10) || null;
    const weight_kg = parseInt(sessionStorage.getItem("quiz-weight"), 10) || null;
    const chest_cm = parseInt(sessionStorage.getItem("quiz-vong1"), 10) || null;
    const waist_cm = parseInt(sessionStorage.getItem("quiz-vong2"), 10) || null;
    const hip_cm = parseInt(sessionStorage.getItem("quiz-vong3"), 10) || null;
    
    // Map body shape text to database enum (Hourglass, Pear, Apple, Rectangle, Inverted Triangle)
    const rawShape = sessionStorage.getItem("quiz-body-shape") || "";
    let body_shape = null;
    if (rawShape.toLowerCase().includes("hourglass") || rawShape.toLowerCase().includes("dong-cat")) body_shape = "Hourglass";
    else if (rawShape.toLowerCase().includes("pear") || rawShape.toLowerCase().includes("le")) body_shape = "Pear";
    else if (rawShape.toLowerCase().includes("apple") || rawShape.toLowerCase().includes("tao")) body_shape = "Apple";
    else if (rawShape.toLowerCase().includes("rectangle") || rawShape.toLowerCase().includes("chu-nhat")) body_shape = "Rectangle";
    else if (rawShape.toLowerCase().includes("triangle") || rawShape.toLowerCase().includes("tam-giac")) body_shape = "Inverted Triangle";

    // Styles & Colors
    let style_tags = [];
    try {
      const parsedStyles = JSON.parse(sessionStorage.getItem("quiz-main-style") || "[]");
      style_tags = Array.isArray(parsedStyles) ? parsedStyles : [parsedStyles];
    } catch(e) {}

    const occasions = sessionStorage.getItem("quiz-context") ? [sessionStorage.getItem("quiz-context")] : [];
    
    let budget_range = sessionStorage.getItem("quiz-budget") || "300k_700k";
    if (!['under_300k', '300k_700k', '700k_1.5m', 'above_1.5m'].includes(budget_range)) {
      if (budget_range.includes("300") && budget_range.includes("700")) budget_range = "300k_700k";
      else if (budget_range.includes("300")) budget_range = "under_300k";
      else if (budget_range.includes("1.5")) budget_range = "above_1.5m";
      else budget_range = "700k_1.5m";
    }

    import("./api.js").then(({ apiRequest }) => {
      apiRequest("/api/user/style-quiz", {
        method: "POST",
        body: JSON.stringify({
          height_cm,
          weight_kg,
          chest_cm,
          waist_cm,
          hip_cm,
          body_shape,
          skin_tone: "Neutral",
          style_tags,
          preferred_occasions: occasions,
          favorite_brands: ["Velura"],
          budget_range
        })
      })
      .then(() => {
        console.log("Style Profile saved successfully to database!");
      })
      .catch(err => {
        console.error("Failed to save style profile:", err);
      });
    });

    simulationSteps.forEach(step => {
      setTimeout(() => {
        loadingMsg.textContent = step.text;
      }, step.delay);
    });

    // Final redirection after 2.4s
    setTimeout(() => {
      document.body.style.overflow = "";
      window.location.href = "/src/pages/ai/suggestions.html?isNewQuiz=true";
    }, 2400);
  }
}
