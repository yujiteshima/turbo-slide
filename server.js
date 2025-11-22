// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "slides/images")));

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
function renderNavButtons(currentIndex) {
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === TOTAL_SLIDES ? 'btn disabled' : 'btn';

  return `
    <a href="/slide/${currentIndex - 1}" class="${prevClass}" data-nav="prev" data-turbo-frame="slide-content">
      &larr; Prev
    </a>
    <a href="/slide/${currentIndex + 1}" class="${nextClass}" data-nav="next" data-turbo-frame="slide-content">
      Next &rarr;
    </a>
  `;
}

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
        <div class="nav">
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
