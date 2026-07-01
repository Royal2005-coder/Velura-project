export function initQuantity() {
  var btnMinus = document.querySelector(".js-qty-minus");
  var btnPlus = document.querySelector(".js-qty-plus");
  var inputQty = document.querySelector(".js-qty-input");

  if (btnMinus && btnPlus && inputQty) {
    btnMinus.addEventListener("click", function () {
      var val = parseInt(inputQty.value, 10) || 1;
      if (val > 1) {
        inputQty.value = val - 1;
      }
    });

    btnPlus.addEventListener("click", function () {
      var val = parseInt(inputQty.value, 10) || 1;
      if (val < 99) {
        inputQty.value = val + 1;
      }
    });

    inputQty.addEventListener("change", function () {
      var val = parseInt(inputQty.value, 10);
      if (isNaN(val) || val < 1) {
        inputQty.value = 1;
      } else if (val > 99) {
        inputQty.value = 99;
      }
    });
  }
}
