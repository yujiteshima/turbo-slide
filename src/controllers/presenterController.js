// src/controllers/presenterController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * プレゼンターコントローラー
 * プレゼンターモードの表示を担当
 */
export class PresenterController {
  /**
   * @param {Object} options
   * @param {import('../services/slideService.js').SlideService} options.slideService
   * @param {import('../services/navigationService.js').NavigationService} options.navigationService
   * @param {Object} options.config
   */
  constructor({ slideService, navigationService, config }) {
    this.slideService = slideService;
    this.navigationService = navigationService;
    this.config = config;
  }

  /**
   * レイアウトHTMLを読み込み
   */
  loadLayout() {
    return fs.readFileSync(path.join(ROOT_DIR, "views/layout.html"), "utf-8");
  }

  /**
   * プレゼンターモードリダイレクト
   * GET /presenter
   */
  redirectToFirst = (req, res) => {
    res.redirect("/presenter/1");
  };

  /**
   * プレゼンター表示
   * GET /presenter/:id
   */
  getPresenter = (req, res) => {
    const slideId = parseInt(req.params.id, 10);
    const totalSlides = this.slideService.getSlideCount();

    if (!this.slideService.isValidSlideId(slideId)) {
      return res.redirect("/presenter/1");
    }

    const slideContent = this.slideService.loadSlide(slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'presenter', null);

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
      .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

    res.send(html);
  };
}

export function createPresenterController(options) {
  return new PresenterController(options);
}

export default {
  PresenterController,
  createPresenterController
};
