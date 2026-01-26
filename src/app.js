// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadConfig, getRootDir } from "./config/index.js";
import { createSlideService, createDeckService, createPdfService, getSseService, getNavigationService } from "./services/index.js";
import { createSlideController, createPresenterController, createViewerController, createDeckController, createApiController, createEventsController, createPrintController, createHomeController } from "./controllers/index.js";
import { createSlideRoutes, createPresenterRoutes, createViewerRoutes, createDeckRoutes, createApiRoutes, createEventsRoutes, createPrintRoutes } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Expressアプリケーションを作成
 * @param {Object} [options] - オプション
 * @param {string} [options.configPath] - 設定ファイルのパス
 * @param {string} [options.decksDir] - デッキディレクトリのパス（テスト用）
 * @returns {Object} { app, config, services, initialize }
 */
export function createApp(options = {}) {
  const app = express();
  const ROOT_DIR = getRootDir();

  // 設定読み込み
  const config = loadConfig(options.configPath);

  // ディレクトリパスを設定から取得（オプションで上書き可能）
  const SLIDES_DIR = path.resolve(ROOT_DIR, config.slidesDir);
  const IMAGES_DIR = path.resolve(ROOT_DIR, config.imagesDir);
  const DECKS_DIR = options.decksDir || path.join(SLIDES_DIR, "decks");
  const IMPORT_DIR = options.importDir || path.join(SLIDES_DIR, "import");

  // サービス作成
  const slideService = createSlideService(path.join(DECKS_DIR, "default"));
  const deckService = createDeckService(DECKS_DIR);
  const pdfService = createPdfService(DECKS_DIR, IMPORT_DIR);
  const sseService = getSseService();
  const navigationService = getNavigationService();

  const services = {
    slideService,
    deckService,
    pdfService,
    sseService,
    navigationService
  };

  // コントローラー作成
  const slideController = createSlideController({ slideService, navigationService, config });
  const presenterController = createPresenterController({ slideService, navigationService, config });
  const viewerController = createViewerController({ slideService, navigationService, sseService, config });
  const deckController = createDeckController({ deckService, navigationService, config });
  const apiController = createApiController({ slideService, deckService, sseService });
  const eventsController = createEventsController({ sseService });
  const printController = createPrintController({ slideService });
  const homeController = createHomeController({ deckService, config });

  // ミドルウェア設定
  app.use(express.static(path.join(ROOT_DIR, "public")));
  app.use("/images", express.static(path.join(DECKS_DIR, "default", "images")));
  app.use("/samples", express.static(path.join(ROOT_DIR, "samples")));
  app.use("/decks", express.static(DECKS_DIR));
  // 後方互換性: /imported も /decks にマッピング
  app.use("/imported", express.static(DECKS_DIR));
  app.use(express.json());

  // ルート設定
  app.get("/", homeController.getHome);
  app.use("/slide", createSlideRoutes(slideController));
  app.use("/presenter", createPresenterRoutes(presenterController));
  app.use("/viewer", createViewerRoutes(viewerController));
  app.use("/deck", createDeckRoutes(deckController));
  app.use("/api", createApiRoutes(apiController));
  app.use("/events", createEventsRoutes(eventsController));
  app.use("/print", createPrintRoutes(printController));

  // テストページ
  app.get("/test", (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "test/test.html"));
  });

  /**
   * サーバー初期化（PDF変換など）
   */
  async function initialize() {
    // importディレクトリからの処理（新規 + 更新）
    await pdfService.processImportDirectory();

    // 従来の source.pdf 方式も引き続きサポート
    await pdfService.initializeImportedDecks();
  }

  return { app, config, services, initialize };
}

export default { createApp };
