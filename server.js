// server.js
import express from "express";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// スライド状態管理
let currentSlide = 1;
const clients = [];

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "slides/images")));
app.use("/imported", express.static(path.join(__dirname, "slides/imported")));
app.use(express.json());

// スライドディレクトリ
const SLIDES_DIR = path.join(__dirname, "slides");
const IMPORTED_DIR = path.join(SLIDES_DIR, "imported");

// デフォルトデッキのスライド数を取得
function getSlideCount() {
  const files = fs.readdirSync(SLIDES_DIR);
  return files.filter(f => f.match(/^slide-\d+\.html$/)).length;
}

const TOTAL_SLIDES = getSlideCount();

// インポートデッキのスライド数を取得
function getImportedSlideCount(deckName) {
  const deckDir = path.join(IMPORTED_DIR, deckName);
  if (!fs.existsSync(deckDir)) return 0;
  const files = fs.readdirSync(deckDir);
  return files.filter(f => f.match(/^slide-\d+\.png$/i)).length;
}

// インポートデッキ一覧を取得
function getImportedDecks() {
  if (!fs.existsSync(IMPORTED_DIR)) return [];
  return fs.readdirSync(IMPORTED_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({
      name: d.name,
      slideCount: getImportedSlideCount(d.name)
    }));
}

// PDF→画像変換
async function convertPdfToImages(pdfPath, outputDir) {
  const { pdf } = await import("pdf-to-img");
  await fsPromises.mkdir(outputDir, { recursive: true });

  const document = await pdf(pdfPath, { scale: 2 });
  let index = 1;

  for await (const image of document) {
    const fileName = `slide-${String(index).padStart(2, "0")}.png`;
    await fsPromises.writeFile(path.join(outputDir, fileName), image);
    index++;
  }

  return index - 1;
}

// PDFの更新日時をチェック
function needsReconvert(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) return true;

  const pdfStat = fs.statSync(pdfPath);
  const outputFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));

  if (outputFiles.length === 0) return true;

  const firstImagePath = path.join(outputDir, outputFiles[0]);
  const imageStat = fs.statSync(firstImagePath);

  return pdfStat.mtime > imageStat.mtime;
}

// インポートデッキの初期化（PDF変換）
async function initializeImportedDecks() {
  if (!fs.existsSync(IMPORTED_DIR)) {
    fs.mkdirSync(IMPORTED_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(IMPORTED_DIR);
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const deckName = file.replace('.pdf', '');
      const pdfPath = path.join(IMPORTED_DIR, file);
      const outputDir = path.join(IMPORTED_DIR, deckName);

      if (needsReconvert(pdfPath, outputDir)) {
        console.log(`📄 Converting ${file} to images...`);
        try {
          const count = await convertPdfToImages(pdfPath, outputDir);
          console.log(`   ✅ Created ${count} slides for "${deckName}"`);
        } catch (error) {
          console.error(`   ❌ Failed to convert ${file}:`, error.message);
        }
      }
    }
  }
}

// デフォルトデッキのスライドHTMLを読み込み
function loadSlide(index) {
  const fileName = `slide-${String(index).padStart(2, "0")}.html`;
  const filePath = path.join(SLIDES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf-8");
}

// インポートデッキのスライドHTMLを生成
function loadImportedSlide(deckName, index) {
  const deckDir = path.join(IMPORTED_DIR, deckName);
  const paddedIndex = String(index).padStart(2, "0");
  const filePath = path.join(deckDir, `slide-${paddedIndex}.png`);

  if (fs.existsSync(filePath)) {
    return `
<div class="imported-slide-container">
  <img src="/imported/${deckName}/slide-${paddedIndex}.png"
       class="imported-slide-image"
       alt="Slide ${index}" />
</div>`;
  }
  return null;
}

// レイアウトHTMLを読み込み
function loadLayout() {
  return fs.readFileSync(path.join(__dirname, "views/layout.html"), "utf-8");
}

// ナビゲーションボタンを生成
function renderNavButtons(currentIndex, totalSlides, mode = 'slide', deckName = null) {
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === totalSlides ? 'btn disabled' : 'btn';

  let baseUrl;
  if (deckName) {
    baseUrl = mode === 'presenter' ? `/deck/${deckName}/presenter` : `/deck/${deckName}/slide`;
  } else {
    baseUrl = mode === 'presenter' ? '/presenter' : '/slide';
  }
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

  clients.forEach((client) => {
    try {
      client.write(`data: ${slideId}\n\n`);
    } catch (error) {
      // クライアント接続エラーは無視
    }
  });
}

// デッキ一覧API
app.get("/api/decks", (req, res) => {
  const decks = [
    { name: "default", slideCount: TOTAL_SLIDES, isDefault: true },
    ...getImportedDecks().map(d => ({ ...d, isDefault: false }))
  ];
  res.json(decks);
});

// プレゼンター用: スライド変更APIエンドポイント
app.post("/api/slide/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.status(400).json({ error: "Invalid slide ID" });
  }

  broadcastSlideChange(slideId);
  res.json({ success: true, currentSlide: slideId });
});

// ========== デフォルトデッキのルート ==========

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

  const navButtons = renderNavButtons(slideId, TOTAL_SLIDES, 'presenter');

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
    .replace("{{DECK_TITLE}}", "LT@frontend.stmn")
    .replace("{{TOTAL_SLIDES}}", String(TOTAL_SLIDES))
    .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${TOTAL_SLIDES};</script><script src="/script.js"></script>`);

  res.send(html);
});

// ビューアー用ページ
app.get("/viewer", (req, res) => {
  const slideId = req.query.slide ? parseInt(req.query.slide, 10) : currentSlide;

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.redirect("/viewer");
  }

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, TOTAL_SLIDES);

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

  const layout = loadLayout();
  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", "LT@frontend.stmn")
    .replace("{{TOTAL_SLIDES}}", String(TOTAL_SLIDES))
    .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${TOTAL_SLIDES};</script><script src="/script.js"></script>`);

  res.send(html);
});

// ルート: 最初のスライドにリダイレクト
app.get("/", (req, res) => {
  res.redirect("/slide/1");
});

// スライド表示: Turbo Frame対応
app.get("/slide/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);

  if (isNaN(slideId) || slideId < 1 || slideId > TOTAL_SLIDES) {
    return res.redirect("/slide/1");
  }

  const slideContent = loadSlide(slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  if (req.headers["turbo-frame"]) {
    const navButtons = renderNavButtons(slideId, TOTAL_SLIDES);
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  const layout = loadLayout();
  const navButtons = renderNavButtons(slideId, TOTAL_SLIDES);

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", "LT@frontend.stmn")
    .replace("{{TOTAL_SLIDES}}", String(TOTAL_SLIDES));

  res.send(html);
});

// PDF印刷用ページ: 全スライドを表示
app.get("/print", (req, res) => {
  const printLayout = fs.readFileSync(path.join(__dirname, "views/print.html"), "utf-8");

  let allSlides = '';
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const slideContent = loadSlide(i);
    if (slideContent) {
      allSlides += `<div class="print-slide">${slideContent}</div>\n`;
    }
  }

  const html = printLayout.replace("{{ALL_SLIDES}}", allSlides);
  res.send(html);
});

// ========== インポートデッキのルート ==========

// インポートデッキ: ルート
app.get("/deck/:deckName", (req, res) => {
  res.redirect(`/deck/${req.params.deckName}/slide/1`);
});

// インポートデッキ: スライド表示
app.get("/deck/:deckName/slide/:id", (req, res) => {
  const { deckName } = req.params;
  const slideId = parseInt(req.params.id, 10);
  const totalSlides = getImportedSlideCount(deckName);

  if (totalSlides === 0) {
    return res.status(404).send("Deck not found");
  }

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/slide/1`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  if (req.headers["turbo-frame"]) {
    const navButtons = renderNavButtons(slideId, totalSlides, 'slide', deckName);
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  const layout = loadLayout();
  const navButtons = renderNavButtons(slideId, totalSlides, 'slide', deckName);
  const deckTitle = deckName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckTitle)
    .replace("{{TOTAL_SLIDES}}", String(totalSlides));

  res.send(html);
});

// インポートデッキ: プレゼンターモード
app.get("/deck/:deckName/presenter", (req, res) => {
  res.redirect(`/deck/${req.params.deckName}/presenter/1`);
});

app.get("/deck/:deckName/presenter/:id", (req, res) => {
  const { deckName } = req.params;
  const slideId = parseInt(req.params.id, 10);
  const totalSlides = getImportedSlideCount(deckName);

  if (totalSlides === 0) {
    return res.status(404).send("Deck not found");
  }

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/presenter/1`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, totalSlides, 'presenter', deckName);

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

  const layout = loadLayout();
  const deckTitle = deckName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckTitle)
    .replace("{{TOTAL_SLIDES}}", String(totalSlides))
    .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides}; window.DECK_NAME = "${deckName}";</script><script src="/script.js"></script>`);

  res.send(html);
});

// インポートデッキ: ビューアーモード
app.get("/deck/:deckName/viewer", (req, res) => {
  const { deckName } = req.params;
  const totalSlides = getImportedSlideCount(deckName);

  if (totalSlides === 0) {
    return res.status(404).send("Deck not found");
  }

  const slideId = req.query.slide ? parseInt(req.query.slide, 10) : 1;

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/viewer`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, totalSlides, 'slide', deckName);

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

  const layout = loadLayout();
  const deckTitle = deckName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckTitle)
    .replace("{{TOTAL_SLIDES}}", String(totalSlides))
    .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides}; window.DECK_NAME = "${deckName}";</script><script src="/script.js"></script>`);

  res.send(html);
});

// インポートデッキ: PDF印刷用ページ
app.get("/deck/:deckName/print", (req, res) => {
  const { deckName } = req.params;
  const totalSlides = getImportedSlideCount(deckName);

  if (totalSlides === 0) {
    return res.status(404).send("Deck not found");
  }

  const printLayout = fs.readFileSync(path.join(__dirname, "views/print.html"), "utf-8");

  let allSlides = '';
  for (let i = 1; i <= totalSlides; i++) {
    const slideContent = loadImportedSlide(deckName, i);
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

// サーバー起動
async function startServer() {
  // インポートデッキの初期化
  console.log("🔄 Initializing imported decks...");
  await initializeImportedDecks();

  const decks = getImportedDecks();
  if (decks.length > 0) {
    console.log(`📚 Available imported decks:`);
    decks.forEach(d => console.log(`   - ${d.name} (${d.slideCount} slides)`));
  }

  app.listen(PORT, () => {
    console.log(`🚀 Turbo Slide Demo running at http://localhost:${PORT}`);
    console.log(`   Default deck: ${TOTAL_SLIDES} slides`);
    console.log(`   Test page: http://localhost:${PORT}/test`);
    if (decks.length > 0) {
      console.log(`   Imported decks: http://localhost:${PORT}/deck/<deck-name>`);
    }
  });
}

startServer();
