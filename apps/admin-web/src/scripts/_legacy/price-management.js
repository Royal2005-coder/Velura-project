// Legacy unused script. Kept for reference only. Do not import.
(function () {
  "use strict";
  const modal = document.querySelector(".admin-modal-overlay");
  const editButton = document.querySelector("[data-price-edit]");
  const closeButtons = modal.querySelectorAll(".admin-btn");
  editButton.addEventListener("click", () => { modal.hidden = false; });
  closeButtons.forEach((button) => button.addEventListener("click", () => { modal.hidden = true; }));
}());
