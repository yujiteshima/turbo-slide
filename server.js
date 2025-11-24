// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// スライド状態管理
let currentSlide = 1;
const clients = [];

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "slides/images")));
app.use(express.json());

// スライド数を取得
const SLIDES_DIR = path.join(__dirname, "slides");
function getSlideCount() {
  const files = fs.readdirSync(SLIDES_DIR);
  return files.filter(f => f.match(/^slide-\d+\.html$/)).length;
}

const TOTAL_SLIDES = getSlideCount();

// スライドHTMLを読み込み
function loadSlide(index) {
  const fileName = `slide-${String(index).padStart(2, "0")}.html`;
  const filePath = path.join(SLIDES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf-8");
}

// レイアウトHTMLを読み込み
function loadLayout() {
  return fs.readFileSync(path.join(__dirname, "views/layout.html"), "utf-8");
}

// ナビゲーションボタンを生成
function renderNavButtons(currentIndex, mode = 'slide') {
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === TOTAL_SLIDES ? 'btn disabled' : 'btn';

  const baseUrl = mode === 'presenter' ? '/presenter' : '/slide';
  const turboFrame = mode === 'presenter' ? '' : 'data-turbo-frame="slide-content"';

  return `
    <a href="${baseUrl}/${currentIndex - 1}" class="${prevClass}" data-nav="prev" ${turboFrame}>
      &larr; Prev
    </a>
    <a href="${baseUrl}/${currentIndex + 1}" class="${nextClass}" data-nav="next" ${turboFrame}>
      Next &rarr;
    </a>
  `;
}

// SSEエンドポイント: クライアントにスライド変更を通知
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 現在のスライドを送信
  res.write(`data: ${currentSlide}\n\n`);

  // クライアントリストに追加
  clients.push(res);

  // クライアントが切断した時の処理
  req.on("close", () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// スライド変更を全クライアントにブロードキャスト
function broadcastSlideChange(slideId) {
  currentSlide = slideId;

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return;
  }

  const navButtons = renderNavButtons(slideId);
  const turboStream = `
    <turbo-stream action="replace" target="slide-content">
      <template>
        <turbo-frame id="slide-content">
          ${slideContent}
          <div class="nav" style="display: none;">
            ${navButtons}
          </div>
        </turbo-frame>
      </template>
    </turbo-stream>
  `;

  clients.forEach((client) => {
    try {
      client.write(`data: ${slideId}\n\n`);
    } catch (error) {
      // クライアント接続エラーは無視
    }
  });
}

// プレゼンター用: スライド変更APIエンドポイント
app.post("/api/slide/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.status(400).json({ error: "Invalid slide ID" });
  }

  broadcastSlideChange(slideId);
  res.json({ success: true, currentSlide: slideId });
});

// プレゼンター用ページ
app.get("/presenter", (req, res) => {
  res.redirect("/presenter/1");
});

app.get("/presenter/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.redirect("/presenter/1");
  }

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, 'presenter');

  // Turbo Frameリクエストの場合はフレームコンテンツのみを返す
  if (req.headers["turbo-frame"]) {
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  // 通常のリクエストの場合は完全なページを返す
  const layout = loadLayout();
  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.CURRENT_SLIDE = ${slideId};</script><script src="/script.js"></script>`);

  res.send(html);
});

// ビューアー用ページ
app.get("/viewer", (req, res) => {
  // クエリパラメータからスライドIDを取得、なければcurrentSlideを使用
  const slideId = req.query.slide ? parseInt(req.query.slide, 10) : currentSlide;

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.redirect("/viewer");
  }

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId);

  // Turbo Frameリクエストの場合はフレームコンテンツのみを返す
  if (req.headers["turbo-frame"]) {
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  // 通常のリクエストの場合は完全なページを返す
  const layout = loadLayout();
  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.CURRENT_SLIDE = ${slideId};</script><script src="/script.js"></script>`);

  res.send(html);
});

// ルート: 最初のスライドにリダイレクト
app.get("/", (req, res) => {
  res.redirect("/slide/1");
});

// スライド表示: Turbo Frame対応
app.get("/slide/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);

  // スライド番号のバリデーション
  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.redirect("/slide/1");
  }

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  // Turbo Frameリクエストの場合はスライドコンテンツとナビゲーションを返す
  if (req.headers["turbo-frame"]) {
    const navButtons = renderNavButtons(slideId);
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  // 通常のリクエストの場合は完全なページを返す
  const layout = loadLayout();
  const navButtons = renderNavButtons(slideId);

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons);

  res.send(html);
});

// テストページ
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "test/test.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Turbo Slide Demo running at http://localhost:${PORT}`);
  console.log(`   Total slides: ${TOTAL_SLIDES}`);
  console.log(`   Test page: http://localhost:${PORT}/test`);
});
