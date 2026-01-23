// src/controllers/viewerController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * ビューアーコントローラー
 * ビューアーモード（SSE同期）の表示を担当
 */
export class ViewerController {
  /**
   * @param {Object} options
   * @param {import('../services/slideService.js').SlideService} options.slideService
   * @param {import('../services/navigationService.js').NavigationService} options.navigationService
   * @param {import('../services/sseService.js').SseService} options.sseService
   * @param {Object} options.config
   */
  constructor({ slideService, navigationService, sseService, config }) {
    this.slideService = slideService;
    this.navigationService = navigationService;
    this.sseService = sseService;
    this.config = config;
  }

  /**
   * レイアウトHTMLを読み込み
   */
  loadLayout() {
    return fs.readFileSync(path.join(ROOT_DIR, "views/layout.html"), "utf-8");
  }

  /**
   * ビューアー表示
   * GET /viewer
   */
  getViewer = (req, res) => {
    // クエリパラメータからスライドIDを取得、なければcurrentSlideを使用
    const slideId = req.query.slide
      ? parseInt(req.query.slide, 10)
      : this.sseService.getCurrentSlide();
    const totalSlides = this.slideService.getSlideCount();

    if (!this.slideService.isValidSlideId(slideId)) {
      return res.redirect("/viewer");
    }

    const slideContent = this.slideService.loadSlide(slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'slide', null);

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
    const layout = this.loadLayout();
    const html = layout
      .replace("{{SLIDE_CONTENT}}", slideContent)
      .replace("{{NAV_BUTTONS}}", navButtons)
      .replace("{{DECK_TITLE}}", this.config.title)
      .replace("{{TOTAL_SLIDES}}", totalSlides)
      // Viewer modeではロゴのリンクを無効化
      .replace('<a href="/" class="deck-title-link">', '<span class="deck-title-link deck-title-disabled">')
      .replace('</a>\n    <div class="top-bar-right">', '</span>\n    <div class="top-bar-right">')
      .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

    res.send(html);
  };
}

export function createViewerController(options) {
  return new ViewerController(options);
}

export default {
  ViewerController,
  createViewerController
};
