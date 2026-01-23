// 10分カウントダウンタイマー + プログレスバー更新
(function startTimer() {
  const timerEl = document.getElementById("timer");
  const timerProgressEl = document.getElementById("timer-progress");
  if (!timerEl) return;

  const totalTime = 10 * 60; // 600秒
  let remaining = totalTime;

  function renderTime() {
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    timerEl.textContent = m + ":" + s;

    // タイマープログレスバーを更新（経過時間の割合）
    if (timerProgressEl) {
      const progress = ((totalTime - remaining) / totalTime) * 100;
      timerProgressEl.style.width = progress + "%";
    }
  }

  renderTime();

  setInterval(function () {
    if (remaining <= 0) return;
    remaining -= 1;
    renderTime();
  }, 1000);
})();

// スライド進捗を更新
(function updateSlideProgress() {
  const slideProgressEl = document.getElementById("slide-progress");
  const slideTextEl = document.getElementById("slide-text");
  const totalSlides = window.TOTAL_SLIDES || 23;

  function updateProgress() {
    // URLからスライド番号を取得（複数のパターンに対応）
    let match = window.location.pathname.match(/\/(slide|presenter|viewer)\/(\d+)/);

    // /deck/:deckName/slide/:id パターン
    if (!match) {
      match = window.location.pathname.match(/\/deck\/[^\/]+\/(slide|presenter)\/(\d+)/);
    }

    // URLにスライド番号がない場合、Turbo FrameのsrcまたはURLから取得
    if (!match) {
      const frame = document.getElementById('slide-content');
      if (frame && frame.src) {
        match = frame.src.match(/\/(slide|presenter|viewer)\/(\d+)/) ||
                frame.src.match(/\/deck\/[^\/]+\/(slide|presenter)\/(\d+)/);
      }
    }

    // それでもない場合、クエリパラメータから取得（viewerモード用）
    if (!match) {
      const urlParams = new URLSearchParams(window.location.search);
      const slideParam = urlParams.get('slide');
      if (slideParam) {
        match = [null, 'viewer', slideParam];
      }
    }

    if (match) {
      const currentSlide = parseInt(match[2], 10);

      if (slideTextEl) {
        slideTextEl.textContent = currentSlide + "/" + totalSlides;
      }

      if (slideProgressEl) {
        const progress = (currentSlide / totalSlides) * 100;
        slideProgressEl.style.width = progress + "%";
      }
    }
  }

  // 初回実行
  updateProgress();

  // Turbo Frameの更新を監視
  document.addEventListener("turbo:frame-load", function(event) {
    // Turbo Frameがロードされた後、少し待ってから更新
    setTimeout(updateProgress, 100);
  });

  // 履歴変更を監視
  window.addEventListener("popstate", updateProgress);

  // Turbo Driveのナビゲーションを監視
  document.addEventListener("turbo:load", updateProgress);

  // リンククリックを監視して、data-turbo-frame属性を持つリンクからスライド番号を取得
  document.addEventListener("click", function(e) {
    const link = e.target.closest('a[data-turbo-frame]');
    if (link) {
      const match = link.href.match(/\/(slide|presenter|viewer)\/(\d+)/) ||
                    link.href.match(/\/deck\/[^\/]+\/(slide|presenter)\/(\d+)/);
      if (match) {
        setTimeout(function() {
          const currentSlide = parseInt(match[2], 10);

          if (slideTextEl) {
            slideTextEl.textContent = currentSlide + "/" + totalSlides;
          }
          if (slideProgressEl) {
            const progress = (currentSlide / totalSlides) * 100;
            slideProgressEl.style.width = progress + "%";
          }
        }, 50);
      }
    }
  });
})();

// プレゼンターモード: APIを使ってスライド変更
if (window.PRESENTER_MODE) {
  let currentSlide = window.CURRENT_SLIDE || 1;
  const totalSlides = window.TOTAL_SLIDES || 23;
  const deckName = window.DECK_NAME || null;

  // スライド進捗更新関数
  function updateSlideProgress(slideId) {
    const slideProgressEl = document.getElementById("slide-progress");
    const slideTextEl = document.getElementById("slide-text");

    if (slideTextEl) {
      slideTextEl.textContent = slideId + "/" + totalSlides;
    }
    if (slideProgressEl) {
      const progress = (slideId / totalSlides) * 100;
      slideProgressEl.style.width = progress + "%";
    }
  }

  async function changeSlide(slideId) {
    try {
      // APIを呼び出してブロードキャスト（デフォルトデッキのみ）
      if (!deckName) {
        await fetch(`/api/slide/${slideId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Turbo Frameを使ってスライドコンテンツを更新
      const frame = document.getElementById('slide-content');
      if (frame) {
        // URLを更新してTurbo Frameをリロード
        const basePath = deckName ? `/deck/${deckName}/presenter` : '/presenter';
        window.history.pushState({}, '', `${basePath}/${slideId}`);
        currentSlide = slideId;

        // スライド進捗を更新
        updateSlideProgress(slideId);

        // Turbo Frameのsrcを設定して自動リロード
        frame.src = `${basePath}/${slideId}`;
        frame.reload();
      }
    } catch (error) {
      // エラーは無視
    }
  }

  // 初回のスライド進捗を更新
  updateSlideProgress(currentSlide);

  // キーボード操作
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      const nextLink = document.querySelector('a[data-nav="next"]');
      if (nextLink && !nextLink.classList.contains('disabled')) {
        const match = nextLink.href.match(/\/presenter\/(\d+)/) ||
                      nextLink.href.match(/\/deck\/[^\/]+\/presenter\/(\d+)/);
        if (match) {
          e.preventDefault();
          changeSlide(parseInt(match[1], 10));
        }
      }
    } else if (e.key === "ArrowLeft") {
      const prevLink = document.querySelector('a[data-nav="prev"]');
      if (prevLink && !prevLink.classList.contains('disabled')) {
        const match = prevLink.href.match(/\/presenter\/(\d+)/) ||
                      prevLink.href.match(/\/deck\/[^\/]+\/presenter\/(\d+)/);
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
      const match = link.href.match(/\/presenter\/(\d+)/) ||
                    link.href.match(/\/deck\/[^\/]+\/presenter\/(\d+)/);
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
  const totalSlides = window.TOTAL_SLIDES || 23;
  const deckName = window.DECK_NAME || null;

  // スライド進捗更新関数
  function updateSlideProgress(slideId) {
    const slideProgressEl = document.getElementById("slide-progress");
    const slideTextEl = document.getElementById("slide-text");

    if (slideTextEl) {
      slideTextEl.textContent = slideId + "/" + totalSlides;
    }
    if (slideProgressEl) {
      const progress = (slideId / totalSlides) * 100;
      slideProgressEl.style.width = progress + "%";
    }
  }

  // 初回のスライド進捗を更新
  updateSlideProgress(currentSlideId);

  // ナビゲーションボタンを非表示
  const navDiv = document.querySelector('.nav');
  if (navDiv) {
    navDiv.style.display = 'none';
  }

  // SSE接続（デフォルトデッキのみ）
  if (!deckName) {
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

          // スライド進捗を更新
          updateSlideProgress(slideId);

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
}

// 通常モード: ← / → キーでスライド移動
if (!window.PRESENTER_MODE && !window.VIEWER_MODE) {
  const totalSlides = window.TOTAL_SLIDES || 23;

  // URLからデッキ情報を抽出するヘルパー関数
  function parseSlideUrl(url) {
    // /deck/:deckName/slide/:id パターンを先にチェック
    const deckMatch = url.match(/\/deck\/([^\/]+)\/slide\/(\d+)/);
    if (deckMatch) {
      return { deckName: deckMatch[1], slideId: parseInt(deckMatch[2], 10) };
    }
    // /slide/:id パターン
    const slideMatch = url.match(/\/slide\/(\d+)/);
    if (slideMatch) {
      return { deckName: null, slideId: parseInt(slideMatch[1], 10) };
    }
    return null;
  }

  // ナビゲーションリンククリック時にURLを更新
  document.addEventListener("click", function(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        if (parsed.deckName) {
          window.history.pushState({}, '', `/deck/${parsed.deckName}/slide/${parsed.slideId}`);
        } else {
          window.history.pushState({}, '', `/slide/${parsed.slideId}`);
        }
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      const nextLink = document.querySelector('a[data-nav="next"]');
      if (nextLink && !nextLink.classList.contains('disabled')) {
        const parsed = parseSlideUrl(nextLink.href);
        if (parsed) {
          if (parsed.deckName) {
            window.history.pushState({}, '', `/deck/${parsed.deckName}/slide/${parsed.slideId}`);
          } else {
            window.history.pushState({}, '', `/slide/${parsed.slideId}`);
          }
          nextLink.click();
        }
      }
    } else if (e.key === "ArrowLeft") {
      const prevLink = document.querySelector('a[data-nav="prev"]');
      if (prevLink && !prevLink.classList.contains('disabled')) {
        const parsed = parseSlideUrl(prevLink.href);
        if (parsed) {
          if (parsed.deckName) {
            window.history.pushState({}, '', `/deck/${parsed.deckName}/slide/${parsed.slideId}`);
          } else {
            window.history.pushState({}, '', `/slide/${parsed.slideId}`);
          }
          prevLink.click();
        }
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
