// src/controllers/deckController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * デッキコントローラー
 * インポートデッキの表示を担当
 */
export class DeckController {
  /**
   * @param {Object} options
   * @param {import('../services/deckService.js').DeckService} options.deckService
   * @param {import('../services/navigationService.js').NavigationService} options.navigationService
   * @param {Object} options.config
   */
  constructor({ deckService, navigationService, config }) {
    this.deckService = deckService;
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
   * プリントレイアウトHTMLを読み込み
   */
  loadPrintLayout() {
    return fs.readFileSync(path.join(ROOT_DIR, "views/print.html"), "utf-8");
  }

  /**
   * デッキ最初のスライドへリダイレクト
   * GET /deck/:deckName
   */
  redirectToFirst = (req, res) => {
    const deckName = req.params.deckName;
    if (!this.deckService.deckExists(deckName)) {
      return res.status(404).send("Deck not found");
    }
    res.redirect(`/deck/${deckName}/slide/1`);
  };

  /**
   * デッキスライド表示
   * GET /deck/:deckName/slide/:id
   */
  getSlide = (req, res) => {
    const deckName = req.params.deckName;
    const slideId = parseInt(req.params.id, 10);
    const totalSlides = this.deckService.getImportedSlideCount(deckName);

    if (!this.deckService.deckExists(deckName)) {
      return res.status(404).send("Deck not found");
    }

    if (!this.deckService.isValidSlideId(deckName, slideId)) {
      return res.redirect(`/deck/${deckName}/slide/1`);
    }

    const slideContent = this.deckService.loadImportedSlide(deckName, slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'slide', deckName);

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
    const layout = this.loadLayout();
    const html = layout
      .replace("{{SLIDE_CONTENT}}", slideContent)
      .replace("{{NAV_BUTTONS}}", navButtons)
      .replace("{{DECK_TITLE}}", deckName)
      .replace("{{TOTAL_SLIDES}}", totalSlides)
      .replace('<script src="/script.js"></script>', `<script>window.DECK_NAME = "${deckName}"; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

    res.send(html);
  };

  /**
   * デッキプレゼンターモードリダイレクト
   * GET /deck/:deckName/presenter
   */
  redirectToPresenter = (req, res) => {
    const deckName = req.params.deckName;
    res.redirect(`/deck/${deckName}/presenter/1`);
  };

  /**
   * デッキプレゼンター表示
   * GET /deck/:deckName/presenter/:id
   */
  getPresenter = (req, res) => {
    const deckName = req.params.deckName;
    const slideId = parseInt(req.params.id, 10);
    const totalSlides = this.deckService.getImportedSlideCount(deckName);

    if (!this.deckService.deckExists(deckName)) {
      return res.status(404).send("Deck not found");
    }

    if (!this.deckService.isValidSlideId(deckName, slideId)) {
      return res.redirect(`/deck/${deckName}/presenter/1`);
    }

    const slideContent = this.deckService.loadImportedSlide(deckName, slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'presenter', deckName);

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
    const layout = this.loadLayout();
    const html = layout
      .replace("{{SLIDE_CONTENT}}", slideContent)
      .replace("{{NAV_BUTTONS}}", navButtons)
      .replace("{{DECK_TITLE}}", deckName)
      .replace("{{TOTAL_SLIDES}}", totalSlides)
      .replace('<script src="/script.js"></script>', `<script>window.PRESENTER_MODE = true; window.DECK_NAME = "${deckName}"; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

    res.send(html);
  };

  /**
   * デッキビューアー表示
   * GET /deck/:deckName/viewer
   */
  getViewer = (req, res) => {
    const deckName = req.params.deckName;
    const slideId = req.query.slide ? parseInt(req.query.slide, 10) : 1;
    const totalSlides = this.deckService.getImportedSlideCount(deckName);

    if (!this.deckService.deckExists(deckName)) {
      return res.status(404).send("Deck not found");
    }

    if (!this.deckService.isValidSlideId(deckName, slideId)) {
      return res.redirect(`/deck/${deckName}/viewer`);
    }

    const slideContent = this.deckService.loadImportedSlide(deckName, slideId);
    if (!slideContent) {
      return res.status(404).send("Slide not found");
    }

    const navButtons = this.navigationService.renderNavButtons(slideId, totalSlides, 'slide', deckName);

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
    const layout = this.loadLayout();
    const html = layout
      .replace("{{SLIDE_CONTENT}}", slideContent)
      .replace("{{NAV_BUTTONS}}", navButtons)
      .replace("{{DECK_TITLE}}", deckName)
      .replace("{{TOTAL_SLIDES}}", totalSlides)
      // Viewer modeではロゴのリンクを無効化
      .replace('<a href="/" class="deck-title-link">', '<span class="deck-title-link deck-title-disabled">')
      .replace('</a>\n    <div class="top-bar-right">', '</span>\n    <div class="top-bar-right">')
      .replace('<script src="/script.js"></script>', `<script>window.VIEWER_MODE = true; window.DECK_NAME = "${deckName}"; window.CURRENT_SLIDE = ${slideId}; window.TOTAL_SLIDES = ${totalSlides};</script><script src="/script.js"></script>`);

    res.send(html);
  };

  /**
   * デッキプリント表示
   * GET /deck/:deckName/print
   */
  getPrint = (req, res) => {
    const deckName = req.params.deckName;
    const totalSlides = this.deckService.getImportedSlideCount(deckName);

    if (!this.deckService.deckExists(deckName)) {
      return res.status(404).send("Deck not found");
    }

    const printLayout = this.loadPrintLayout();

    let allSlides = '';
    for (let i = 1; i <= totalSlides; i++) {
      const slideContent = this.deckService.loadImportedSlide(deckName, i);
      if (slideContent) {
        allSlides += `<div class="print-slide">${slideContent}</div>\n`;
      }
    }

    const html = printLayout.replace("{{ALL_SLIDES}}", allSlides);
    res.send(html);
  };
}

export function createDeckController(options) {
  return new DeckController(options);
}

export default {
  DeckController,
  createDeckController
};
