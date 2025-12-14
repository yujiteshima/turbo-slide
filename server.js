// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 設定ファイルを読み込み
function loadConfig() {
  const configPath = path.join(__dirname, "turbo-slide.config.json");
  const defaultConfig = {
    title: "Turbo Slide",
    author: "",
    timer: 600,
    slidesDir: "./slides",
    imagesDir: "./slides/images"
  };

  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return { ...defaultConfig, ...userConfig };
    } catch (error) {
      console.warn("Warning: Failed to parse turbo-slide.config.json, using defaults");
      return defaultConfig;
    }
  }
  return defaultConfig;
}

const config = loadConfig();

// スライド状態管理
let currentSlide = 1;
const clients = [];

// ディレクトリパスを設定から取得
const SLIDES_DIR = path.resolve(__dirname, config.slidesDir);
const IMAGES_DIR = path.resolve(__dirname, config.imagesDir);

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(IMAGES_DIR));
// サンプルスライドの画像も配信
app.use("/samples", express.static(path.join(__dirname, "samples")));
app.use(express.json());

// スライド数を動的に取得
function getSlideCount() {
  if (!fs.existsSync(SLIDES_DIR)) {
    return 0;
  }
  const files = fs.readdirSync(SLIDES_DIR);
  return files.filter(f => f.match(/^slide-\d+\.html$/)).length;
}

// スライドHTMLを読み込み（.slideラッパーで包む）
function loadSlide(index) {
  const fileName = `slide-${String(index).padStart(2, "0")}.html`;
  const filePath = path.join(SLIDES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  // Transform Scale用に.slideでラップ
  return `<div class="slide">${content}</div>`;
}

// レイアウトHTMLを読み込み
function loadLayout() {
  return fs.readFileSync(path.join(__dirname, "views/layout.html"), "utf-8");
}

// ナビゲーションボタンを生成
function renderNavButtons(currentIndex, mode = 'slide') {
  const totalSlides = getSlideCount();
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === totalSlides ? 'btn disabled' : 'btn';

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
  const totalSlides = getSlideCount();

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
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
  const totalSlides = getSlideCount();

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
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
  const totalSlides = getSlideCount();

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
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
  const totalSlides = getSlideCount();

  // スライド番号のバリデーション
  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
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

// PDF印刷用ページ: 全スライドを表示
app.get("/print", (req, res) => {
  const printLayout = fs.readFileSync(path.join(__dirname, "views/print.html"), "utf-8");
  const totalSlides = getSlideCount();

  // 全スライドを読み込んでラップ
  let allSlides = '';
  for (let i = 1; i <= totalSlides; i++) {
    const slideContent = loadSlide(i);
    if (slideContent) {
      allSlides += `<div class="print-slide">${slideContent}</div>\n`;
    }
  }

  const html = printLayout.replace("{{ALL_SLIDES}}", allSlides);
  res.send(html);
});


// テストページ
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "test/test.html"));
});

app.listen(PORT, () => {
  const totalSlides = getSlideCount();
  console.log(`🚀 ${config.title} running at http://localhost:${PORT}`);
  console.log(`   Slides directory: ${config.slidesDir}`);
  console.log(`   Total slides: ${totalSlides}`);
  console.log(`   Timer: ${config.timer} seconds`);
  if (totalSlides === 0) {
    console.log(`\n⚠️  No slides found. Create slides in ${config.slidesDir}/`);
    console.log(`   Example: slide-01.html, slide-02.html, ...`);
    console.log(`\n📁 Sample slides available in samples/hotwire-lt/`);
  }
});
