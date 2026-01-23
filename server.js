// server.js
import express from "express";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const IMPORTED_DIR = path.join(SLIDES_DIR, "imported");

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

  return index - 1; // スライド数を返す
}

// PDFの更新チェック（PDFが画像より新しい場合true）
function needsReconvert(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) return true;

  const pdfStat = fs.statSync(pdfPath);
  const images = fs.readdirSync(outputDir).filter(f => f.match(/^slide-\d+\.png$/i));

  if (images.length === 0) return true;

  const firstImagePath = path.join(outputDir, images[0]);
  const imageStat = fs.statSync(firstImagePath);

  return pdfStat.mtime > imageStat.mtime;
}

// インポートデッキの初期化（サーバー起動時にPDFを変換）
async function initializeImportedDecks() {
  if (!fs.existsSync(IMPORTED_DIR)) {
    fs.mkdirSync(IMPORTED_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(IMPORTED_DIR);
  for (const file of files) {
    if (file.endsWith(".pdf")) {
      const deckName = file.replace(".pdf", "");
      const pdfPath = path.join(IMPORTED_DIR, file);
      const outputDir = path.join(IMPORTED_DIR, deckName);

      if (needsReconvert(pdfPath, outputDir)) {
        console.log(`📄 Converting ${file} to images...`);
        try {
          const slideCount = await convertPdfToImages(pdfPath, outputDir);
          console.log(`   ✅ Created ${slideCount} slides in ${deckName}/`);
        } catch (error) {
          console.error(`   ❌ Failed to convert ${file}:`, error.message);
        }
      }
    }
  }
}

// インポートデッキ一覧を取得
function getImportedDecks() {
  if (!fs.existsSync(IMPORTED_DIR)) return [];

  return fs.readdirSync(IMPORTED_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

// インポートデッキのスライド数を取得
function getImportedSlideCount(deckName) {
  const deckDir = path.join(IMPORTED_DIR, deckName);
  if (!fs.existsSync(deckDir)) return 0;

  const files = fs.readdirSync(deckDir);
  return files.filter(f => f.match(/^slide-\d+\.png$/i)).length;
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

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(IMAGES_DIR));
// サンプルスライドの画像も配信
app.use("/samples", express.static(path.join(__dirname, "samples")));
// インポートスライドの画像を配信
app.use("/imported", express.static(IMPORTED_DIR));
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
function renderNavButtons(currentIndex, mode = 'slide', deckName = null) {
  const totalSlides = deckName ? getImportedSlideCount(deckName) : getSlideCount();
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

// デッキ一覧API
app.get("/api/decks", (req, res) => {
  const decks = getImportedDecks().map(name => ({
    name,
    slideCount: getImportedSlideCount(name),
    url: `/deck/${name}`
  }));
  res.json(decks);
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
    .replace("{{DECK_TITLE}}", config.title)
    .replace("{{TOTAL_SLIDES}}", totalSlides)
    .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

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
    .replace("{{DECK_TITLE}}", config.title)
    .replace("{{TOTAL_SLIDES}}", totalSlides)
    .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

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
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", config.title)
    .replace("{{TOTAL_SLIDES}}", totalSlides);

  res.send(html);
});

// ========================================
// インポートデッキ用ルーティング
// ========================================

// デッキ: 最初のスライドへリダイレクト
app.get("/deck/:deckName", (req, res) => {
  const deckName = req.params.deckName;
  if (!getImportedDecks().includes(deckName)) {
    return res.status(404).send("Deck not found");
  }
  res.redirect(`/deck/${deckName}/slide/1`);
});

// デッキ: スライド表示
app.get("/deck/:deckName/slide/:id", (req, res) => {
  const deckName = req.params.deckName;
  const slideId = parseInt(req.params.id, 10);
  const totalSlides = getImportedSlideCount(deckName);

  if (!getImportedDecks().includes(deckName)) {
    return res.status(404).send("Deck not found");
  }

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/slide/1`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  // Turbo Frameリクエストの場合
  if (req.headers["turbo-frame"]) {
    const navButtons = renderNavButtons(slideId, 'slide', deckName);
    return res.send(`
      <turbo-frame id="slide-content">
        ${slideContent}
        <div class="nav" style="display: none;">
          ${navButtons}
        </div>
      </turbo-frame>
    `);
  }

  // 通常のリクエスト
  const layout = loadLayout();
  const navButtons = renderNavButtons(slideId, 'slide', deckName);

  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckName)
    .replace("{{TOTAL_SLIDES}}", totalSlides)
    .replace('<script src="/script.js"></script>', `<script>window.DECK_NAME = "${deckName}"; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

  res.send(html);
});

// デッキ: プレゼンターモード
app.get("/deck/:deckName/presenter", (req, res) => {
  const deckName = req.params.deckName;
  res.redirect(`/deck/${deckName}/presenter/1`);
});

app.get("/deck/:deckName/presenter/:id", (req, res) => {
  const deckName = req.params.deckName;
  const slideId = parseInt(req.params.id, 10);
  const totalSlides = getImportedSlideCount(deckName);

  if (!getImportedDecks().includes(deckName)) {
    return res.status(404).send("Deck not found");
  }

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/presenter/1`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, 'presenter', deckName);

  // Turbo Frameリクエストの場合
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

  // 通常のリクエスト
  const layout = loadLayout();
  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckName)
    .replace("{{TOTAL_SLIDES}}", totalSlides)
    .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.DECK_NAME = "${deckName}"; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

  res.send(html);
});

// デッキ: ビューアーモード
app.get("/deck/:deckName/viewer", (req, res) => {
  const deckName = req.params.deckName;
  const slideId = req.query.slide ? parseInt(req.query.slide, 10) : 1;
  const totalSlides = getImportedSlideCount(deckName);

  if (!getImportedDecks().includes(deckName)) {
    return res.status(404).send("Deck not found");
  }

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect(`/deck/${deckName}/viewer`);
  }

  const slideContent = loadImportedSlide(deckName, slideId);
  if (!slideContent) {
    return res.status(404).send("Slide not found");
  }

  const navButtons = renderNavButtons(slideId, 'slide', deckName);

  // Turbo Frameリクエストの場合
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

  // 通常のリクエスト
  const layout = loadLayout();
  const html = layout
    .replace("{{SLIDE_CONTENT}}", slideContent)
    .replace("{{NAV_BUTTONS}}", navButtons)
    .replace("{{DECK_TITLE}}", deckName)
    .replace("{{TOTAL_SLIDES}}", totalSlides)
    .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.DECK_NAME = "${deckName}"; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

  res.send(html);
});

// デッキ: PDF印刷用ページ
app.get("/deck/:deckName/print", (req, res) => {
  const deckName = req.params.deckName;
  const totalSlides = getImportedSlideCount(deckName);

  if (!getImportedDecks().includes(deckName)) {
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

// サーバー起動
async function startServer() {
  // インポートデッキの初期化
  await initializeImportedDecks();

  app.listen(PORT, () => {
    const totalSlides = getSlideCount();
    const importedDecks = getImportedDecks();

    console.log(`🚀 ${config.title} running at http://localhost:${PORT}`);
    console.log(`   Slides directory: ${config.slidesDir}`);
    console.log(`   Total slides: ${totalSlides}`);
    console.log(`   Timer: ${config.timer} seconds`);

    if (importedDecks.length > 0) {
      console.log(`\n📁 Imported decks:`);
      importedDecks.forEach(deck => {
        const count = getImportedSlideCount(deck);
        console.log(`   - ${deck}: ${count} slides → http://localhost:${PORT}/deck/${deck}`);
      });
    }

    if (totalSlides === 0 && importedDecks.length === 0) {
      console.log(`\n⚠️  No slides found. Create slides in ${config.slidesDir}/`);
      console.log(`   Example: slide-01.html, slide-02.html, ...`);
      console.log(`\n📁 Sample slides available in samples/hotwire-lt/`);
      console.log(`\n💡 Or import Google Slides:`);
      console.log(`   1. Export from Google Slide as PDF`);
      console.log(`   2. Place PDF in ${config.slidesDir}/imported/`);
      console.log(`   3. Restart server`);
    }
  });
}

startServer();
