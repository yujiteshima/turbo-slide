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

// プレゼンターモード: APIを使ってスライド変更
if (window.PRESENTER_MODE) {
  let currentSlide = window.CURRENT_SLIDE || 1;

  async function changeSlide(slideId) {
    try {
      // APIを呼び出してブロードキャスト
      const response = await fetch(`/api/slide/${slideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Turbo Frameを使ってスライドコンテンツを更新
        const frame = document.getElementById('slide-content');
        if (frame) {
          // URLを更新してTurbo Frameをリロード
          window.history.pushState({}, '', `/presenter/${slideId}`);
          currentSlide = slideId;

          // Turbo Frameのsrcを設定して自動リロード
          frame.src = `/presenter/${slideId}`;
          frame.reload();
        }
      }
    } catch (error) {
      // エラーは無視
    }
  }

  // キーボード操作
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      const nextLink = document.querySelector('a[data-nav="next"]');
      if (nextLink && !nextLink.classList.contains('disabled')) {
        const match = nextLink.href.match(/\/presenter\/(\d+)/);
        if (match) {
          e.preventDefault();
          changeSlide(parseInt(match[1], 10));
        }
      }
    } else if (e.key === "ArrowLeft") {
      const prevLink = document.querySelector('a[data-nav="prev"]');
      if (prevLink && !prevLink.classList.contains('disabled')) {
        const match = prevLink.href.match(/\/presenter\/(\d+)/);
        if (match) {
          e.preventDefault();
          changeSlide(parseInt(match[1], 10));
        }
      }
    }
  });

  // ナビゲーションボタンのクリックもAPIを使う
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const match = link.href.match(/\/presenter\/(\d+)/);
      if (match) {
        e.preventDefault();
        changeSlide(parseInt(match[1], 10));
      }
    }
  });
}

// ビューアーモード: SSEでスライド変更を受信
if (window.VIEWER_MODE) {
  let currentSlideId = window.CURRENT_SLIDE || 1;

  // ナビゲーションボタンを非表示
  const navDiv = document.querySelector('.nav');
  if (navDiv) {
    navDiv.style.display = 'none';
  }

  // SSE接続
  const eventSource = new EventSource('/events');

  eventSource.onmessage = function(event) {
    const slideId = parseInt(event.data, 10);

    // 現在のスライドと異なる場合のみ更新
    if (slideId !== currentSlideId) {
      // Turbo Frameを使ってスライドコンテンツを更新
      const frame = document.getElementById('slide-content');
      if (frame) {
        // URLを更新
        window.history.pushState({}, '', `/viewer?slide=${slideId}`);
        currentSlideId = slideId;

        // Turbo Frameのsrcを設定して自動リロード
        frame.src = `/viewer?slide=${slideId}`;
        frame.reload();
      }
    }
  };

  eventSource.onerror = function() {
    // エラーは無視
  };
}

// 通常モード: ← / → キーでスライド移動
if (!window.PRESENTER_MODE && !window.VIEWER_MODE) {
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
}

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
