// src/controllers/slideController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * スライドコントローラー
 * 通常スライドの表示を担当
 */
export class SlideController {
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
   * スライド表示
   * GET /slide/:id
   */
  getSlide = (req, res) => {
    const slideId = parseInt(req.params.id, 10);
    const totalSlides = this.slideService.getSlideCount();

    // スライド番号のバリデーション
    if (!this.slideService.isValidSlideId(slideId)) {
      return res.redirect("/slide/1");
    }

    const slideContent = this.slideService.loadSlide(slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'slide', null);

    // Turbo Frameリクエストの場合はスライドコンテンツとナビゲーションを返す
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
      .replace("{{TOTAL_SLIDES}}", totalSlides);

    res.send(html);
  };

  /**
   * ルートリダイレクト
   * GET /
   */
  redirectToFirst = (req, res) => {
    res.redirect("/slide/1");
  };
}

export function createSlideController(options) {
  return new SlideController(options);
}

export default {
  SlideController,
  createSlideController
};
