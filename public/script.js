// 10分カウントダウンタイマー
(function startTimer() {
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;

  let remaining = 10 * 60; // 600秒

  function renderTime() {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    timerEl.textContent = m + ":" + s;
  }

  renderTime();

  setInterval(function () {
    if (remaining <= 0) return;
    remaining -= 1;
    renderTime();
  }, 1000);
})();

// ← / → キーでスライド移動
document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") {
    const nextLink = document.querySelector('a[data-nav="next"]');
    if (nextLink && !nextLink.classList.contains('disabled')) {
      nextLink.click();
    }
  } else if (e.key === "ArrowLeft") {
    const prevLink = document.querySelector('a[data-nav="prev"]');
    if (prevLink && !prevLink.classList.contains('disabled')) {
      prevLink.click();
    }
  }
});
