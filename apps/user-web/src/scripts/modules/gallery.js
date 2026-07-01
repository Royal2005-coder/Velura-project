export function initGallery() {
  var thumbs = document.querySelectorAll(".js-gallery-thumb");
  var mainImg = document.querySelector(".js-gallery-main");

  if (thumbs.length && mainImg) {
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var newSrc = thumb.getAttribute("data-src");
        if (newSrc) {
          // Smooth opacity transition
          mainImg.style.opacity = "0.2";
          setTimeout(function () {
            mainImg.setAttribute("src", newSrc);
            mainImg.style.opacity = "1";
          }, 150);

          thumbs.forEach(function (t) {
            t.classList.remove("active");
          });
          thumb.classList.add("active");
        }
      });
    });
  }
}
