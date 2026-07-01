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
  }
}
