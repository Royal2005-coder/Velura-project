export function initTabs() {
  var tabButtons = document.querySelectorAll(".js-tab-btn");
  var tabPanels = document.querySelectorAll(".js-tab-panel");

  if (tabButtons.length && tabPanels.length) {
    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetPanelId = btn.getAttribute("data-tab");
        
        tabButtons.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        
        tabPanels.forEach(function (panel) {
          panel.classList.remove("active");
        });
        
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        
        var targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
          targetPanel.classList.add("active");
        }
      });
    });

    var sizeGuideLink = document.querySelector(".size-guide-link");
    if (sizeGuideLink) {
      sizeGuideLink.addEventListener("click", function (e) {
        e.preventDefault();
        var tabSizeBtn = document.getElementById("tab-size");
        if (tabSizeBtn) {
          tabSizeBtn.click();
          tabSizeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }
}
