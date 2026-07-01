export function initOptions() {
  // Color selection
  var colorBtns = document.querySelectorAll(".js-color-btn");
  var colorNameLabel = document.querySelector(".js-color-name");

  if (colorBtns.length) {
    colorBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        colorBtns.forEach(function (b) {
          b.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        if (colorNameLabel) {
          var colorName = btn.getAttribute("data-color");
          colorNameLabel.textContent = colorName;
        }
      });
    });
  }

  // Size selection
  var sizeBtns = document.querySelectorAll(".js-size-btn");
  var sizeNameLabel = document.querySelector(".js-size-name");

  if (sizeBtns.length) {
    sizeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        sizeBtns.forEach(function (b) {
          b.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        if (sizeNameLabel) {
          var sizeName = btn.getAttribute("data-size");
          sizeNameLabel.textContent = sizeName;
        }
      });
    });
  }

  // Wishlist toggle
  var wishlistBtn = document.querySelector(".js-wishlist");
  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", function () {
      wishlistBtn.classList.toggle("is-wishlist-active");
    });
  }
}
