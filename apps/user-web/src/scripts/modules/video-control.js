/**
 * Video Control Module — Velura
 * Quản lý bật/tắt âm thanh của video nền Hero và hiển thị các icon tương ứng
 */

export function initVideoControl() {
  const audioToggle = document.getElementById("js-audio-toggle");
  const video = document.getElementById("hero-video");

  if (!audioToggle || !video) return;

  const iconOn = audioToggle.querySelector(".hero__audio-icon--on");
  const iconOff = audioToggle.querySelector(".hero__audio-icon--off");
  const textLabel = audioToggle.querySelector(".hero__audio-text");

  // Thiết lập mặc định tự phát có âm thanh
  video.muted = false;
  let autoMuted = false;

  audioToggle.addEventListener("click", function (e) {
    e.stopPropagation(); // Tránh kích hoạt listener click của document
    // Đảo ngược trạng thái tắt tiếng
    video.muted = !video.muted;
    autoMuted = false; // Người dùng đã chủ động tương tác
    updateIcons(video.muted);
  });

  // Hầu hết trình duyệt chặn tự phát có tiếng nếu chưa tương tác.
  // Thử tự động phát, nếu lỗi (bị chặn) thì tắt tiếng rồi phát tiếp để tránh đứng hình video.
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      video.muted = true;
      autoMuted = true;
      video.play().catch(err => console.log("Video auto play block bypass error: ", err));
      updateIcons(true);
    });
  }

  // Tự động bật âm thanh khi người dùng tương tác lần đầu với trang (nếu bị trình duyệt chặn phát tiếng)
  const unmuteOnInteraction = () => {
    if (autoMuted && video.muted) {
      video.muted = false;
      updateIcons(false);
      autoMuted = false;
    }
    // Gỡ bỏ listeners sau lần tương tác đầu tiên
    document.removeEventListener("click", unmuteOnInteraction);
    document.removeEventListener("keydown", unmuteOnInteraction);
  };
  document.addEventListener("click", unmuteOnInteraction);
  document.addEventListener("keydown", unmuteOnInteraction);

  // Một số trình duyệt tự động khóa tiếng khi autoplay. Lắng nghe nếu video bắt đầu phát
  // để cập nhật lại icon cho đồng bộ.
  video.addEventListener("play", function () {
    updateIcons(video.muted);
  });

  function updateIcons(isMuted) {
    if (isMuted) {
      if (iconOn) iconOn.classList.add("hidden");
      if (iconOff) iconOff.classList.remove("hidden");
      if (textLabel) textLabel.textContent = "Bật âm thanh";
      audioToggle.setAttribute("aria-label", "Bật âm thanh video");
    } else {
      if (iconOn) iconOn.classList.remove("hidden");
      if (iconOff) iconOff.classList.add("hidden");
      if (textLabel) textLabel.textContent = "Tắt âm thanh";
      audioToggle.setAttribute("aria-label", "Tắt âm thanh video");
    }
  }
}
