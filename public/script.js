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

// フルスクリーン切り替え
(function setupFullscreen() {
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  if (!fullscreenBtn) return;

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("フルスクリーン化に失敗:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // ボタンクリック時
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  // フルスクリーン状態変化時にボタンの表示を更新
  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement) {
      fullscreenBtn.textContent = "⛶";
      fullscreenBtn.title = "フルスクリーン解除";
    } else {
      fullscreenBtn.textContent = "⛶";
      fullscreenBtn.title = "フルスクリーン";
    }
  });
})();
