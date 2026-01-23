// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadConfig, getRootDir } from "./config/index.js";
import { createSlideService, createDeckService, createPdfService, getSseService, getNavigationService } from "./services/index.js";
import { createSlideController, createPresenterController, createViewerController, createDeckController, createApiController, createEventsController, createPrintController } from "./controllers/index.js";
import { createSlideRoutes, createPresenterRoutes, createViewerRoutes, createDeckRoutes, createApiRoutes, createEventsRoutes, createPrintRoutes } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Expressアプリケーションを作成
 * @param {Object} [options] - オプション
 * @param {string} [options.configPath] - 設定ファイルのパス
 * @returns {Object} { app, config, services, initialize }
 */
export function createApp(options = {}) {
  const app = express();
  const ROOT_DIR = getRootDir();

  // 設定読み込み
  const config = loadConfig(options.configPath);

  // ディレクトリパスを設定から取得
  const SLIDES_DIR = path.resolve(ROOT_DIR, config.slidesDir);
  const IMAGES_DIR = path.resolve(ROOT_DIR, config.imagesDir);
  const IMPORTED_DIR = path.join(SLIDES_DIR, "imported");

  // サービス作成
  const slideService = createSlideService(SLIDES_DIR);
  const deckService = createDeckService(IMPORTED_DIR);
  const pdfService = createPdfService(IMPORTED_DIR);
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

  // ミドルウェア設定
  app.use(express.static(path.join(ROOT_DIR, "public")));
  app.use("/images", express.static(IMAGES_DIR));
  app.use("/samples", express.static(path.join(ROOT_DIR, "samples")));
  app.use("/imported", express.static(IMPORTED_DIR));
  app.use(express.json());

  // ルート設定
  app.get("/", slideController.redirectToFirst);
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
    await pdfService.initializeImportedDecks();
  }

  return { app, config, services, initialize };
}

export default { createApp };
