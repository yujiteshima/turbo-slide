// URLからスライド情報を抽出するヘルパー関数
function parseSlideUrl(url) {
  // デッキURLパターン: /deck/:deckName/slide/:id または /deck/:deckName/presenter/:id
  const deckMatch = url.match(/\/deck\/([^\/]+)\/(slide|presenter|viewer)\/(\d+)/);
  if (deckMatch) {
    return { deckName: deckMatch[1], mode: deckMatch[2], slideId: parseInt(deckMatch[3], 10) };
  }

  // 通常のスライドURLパターン: /slide/:id または /presenter/:id
  const slideMatch = url.match(/\/(slide|presenter|viewer)\/(\d+)/);
  if (slideMatch) {
    return { deckName: null, mode: slideMatch[1], slideId: parseInt(slideMatch[2], 10) };
  }

  return null;
}

// 現在のデッキ名を取得
function getCurrentDeckName() {
  if (window.DECK_NAME) return window.DECK_NAME;
  const parsed = parseSlideUrl(window.location.pathname);
  return parsed ? parsed.deckName : null;
}

// Transform Scale: スライドを画面サイズに合わせてスケール
(function setupSlideScale() {
  const DESIGN_WIDTH = 960;
  const DESIGN_HEIGHT = 540;

  function scaleSlide() {
    const slide = document.querySelector('.slide');
    if (!slide) return;

    const container = document.getElementById('slide-content');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      setTimeout(scaleSlide, 50);
      return;
    }

    const scaleX = containerWidth / DESIGN_WIDTH;
    const scaleY = containerHeight / DESIGN_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    slide.style.transform = `translate(-50%, -50%) scale(${scale})`;
    // スケール適用後に表示
    slide.classList.add('scaled');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scaleSlide, 50));
  } else {
    setTimeout(scaleSlide, 50);
  }

  window.addEventListener('resize', scaleSlide);
  document.addEventListener('turbo:frame-load', () => setTimeout(scaleSlide, 50));
  document.addEventListener('fullscreenchange', () => setTimeout(scaleSlide, 100));
})();

// 5分カウントダウンタイマー + プログレスバー更新
(function startTimer() {
  const timerEl = document.getElementById("timer");
  const timerProgressEl = document.getElementById("timer-progress");
  if (!timerEl) return;

  const totalTime = 5 * 60; // 300秒
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
  const totalSlides = window.TOTAL_SLIDES || 12;

  function updateProgress() {
    const parsed = parseSlideUrl(window.location.pathname);
    let currentSlide = parsed ? parsed.slideId : null;

    // URLにスライド番号がない場合、Turbo FrameのsrcまたはURLから取得
    if (!currentSlide) {
      const frame = document.getElementById('slide-content');
      if (frame && frame.src) {
        const frameParsed = parseSlideUrl(frame.src);
        if (frameParsed) {
          currentSlide = frameParsed.slideId;
        }
      }
    }

    // それでもない場合、クエリパラメータから取得（viewerモード用）
    if (!currentSlide) {
      const urlParams = new URLSearchParams(window.location.search);
      const slideParam = urlParams.get('slide');
      if (slideParam) {
        currentSlide = parseInt(slideParam, 10);
      }
    }

    if (currentSlide) {
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
  document.addEventListener("turbo:frame-load", function() {
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
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        setTimeout(function() {
          const currentSlide = parsed.slideId;

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
  const totalSlides = window.TOTAL_SLIDES || 12;
  const deckName = getCurrentDeckName();

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
      // デッキモードの場合
      if (deckName) {
        // APIを呼び出してSSEでブロードキャスト
        const response = await fetch(`/api/deck/${deckName}/slide/${slideId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const frame = document.getElementById('slide-content');
          if (frame) {
            window.history.pushState({}, '', `/deck/${deckName}/presenter/${slideId}`);
            currentSlide = slideId;
            updateSlideProgress(slideId);
            frame.src = `/deck/${deckName}/presenter/${slideId}`;
            frame.reload();
          }
        }
        return;
      }

      // 通常モードの場合はAPIを呼び出してブロードキャスト
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

          // スライド進捗を更新
          updateSlideProgress(slideId);

          // Turbo Frameのsrcを設定して自動リロード
          frame.src = `/presenter/${slideId}`;
          frame.reload();
        }
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
        const parsed = parseSlideUrl(nextLink.href);
        if (parsed) {
          e.preventDefault();
          changeSlide(parsed.slideId);
        }
      }
    } else if (e.key === "ArrowLeft") {
      const prevLink = document.querySelector('a[data-nav="prev"]');
      if (prevLink && !prevLink.classList.contains('disabled')) {
        const parsed = parseSlideUrl(prevLink.href);
        if (parsed) {
          e.preventDefault();
          changeSlide(parsed.slideId);
        }
      }
    }
  });

  // ナビゲーションボタンのクリックもAPIを使う
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        e.preventDefault();
        changeSlide(parsed.slideId);
      }
    }
  });
}

// ビューアーモード: SSEでスライド変更を受信
if (window.VIEWER_MODE) {
  let currentSlideId = window.CURRENT_SLIDE || 1;
  const totalSlides = window.TOTAL_SLIDES || 12;
  const deckName = getCurrentDeckName();

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

  // SSE接続
  const eventSource = new EventSource('/events');

  eventSource.onmessage = function(event) {
    const slideId = parseInt(event.data, 10);

    // 現在のスライドと異なる場合のみ更新
    if (slideId !== currentSlideId) {
      // Turbo Frameを使ってスライドコンテンツを更新
      const frame = document.getElementById('slide-content');
      if (frame) {
        // デッキモードかどうかでURLを分岐
        if (deckName) {
          window.history.pushState({}, '', `/deck/${deckName}/viewer?slide=${slideId}`);
          frame.src = `/deck/${deckName}/viewer?slide=${slideId}`;
        } else {
          window.history.pushState({}, '', `/viewer?slide=${slideId}`);
          frame.src = `/viewer?slide=${slideId}`;
        }
        currentSlideId = slideId;

        // スライド進捗を更新
        updateSlideProgress(slideId);

        // Turbo Frameのsrcを設定して自動リロード
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
  const deckName = getCurrentDeckName();

  // ナビゲーションリンククリック時にURLを更新
  document.addEventListener("click", function(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        // URLを更新してから、Turbo Frameに処理を任せる
        if (deckName) {
          window.history.pushState({}, '', `/deck/${deckName}/slide/${parsed.slideId}`);
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
          if (deckName) {
            window.history.pushState({}, '', `/deck/${deckName}/slide/${parsed.slideId}`);
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
          if (deckName) {
            window.history.pushState({}, '', `/deck/${deckName}/slide/${parsed.slideId}`);
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
