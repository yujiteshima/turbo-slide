// src/controllers/homeController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * ホームページコントローラー
 * デッキ選択ページの表示を担当
 */
export class HomeController {
  /**
   * @param {Object} options
   * @param {import('../services/deckService.js').DeckService} options.deckService
   * @param {Object} options.config
   */
  constructor({ deckService, config }) {
    this.deckService = deckService;
    this.config = config;
  }

  /**
   * ホームページHTMLを読み込み
   */
  loadHomeTemplate() {
    return fs.readFileSync(path.join(ROOT_DIR, "views/home.html"), "utf-8");
  }

  /**
   * デッキカードHTMLを生成
   * @param {Object} deck - デッキ情報
   * @returns {string} HTMLカード
   */
  renderDeckCard(deck) {
    const typeClass = deck.type === 'html' ? 'html' : 'pdf';
    const title = deck.title || deck.name;

    // defaultデッキは従来のURLを使用
    const isDefault = deck.name === 'default';
    const slideUrl = isDefault ? '/slide/1' : deck.url;
    const presenterUrl = isDefault ? '/presenter' : `${deck.url}/presenter`;
    const viewerUrl = isDefault ? '/viewer' : `${deck.url}/viewer`;

    return `
      <div class="deck-card">
        <div class="deck-header">
          <h2 class="deck-name">${title}</h2>
          <span class="deck-type ${typeClass}">${deck.type}</span>
        </div>
        <div class="deck-meta">
          <div class="deck-meta-item">
            <span>${deck.slideCount} slides</span>
          </div>
        </div>
        <div class="deck-actions">
          <div class="deck-actions-row">
            <a href="${slideUrl}" class="deck-btn deck-btn-primary">
              Slide Mode
            </a>
            <a href="${presenterUrl}" class="deck-btn deck-btn-primary">
              Presenter
            </a>
          </div>
          <a href="${viewerUrl}" class="deck-btn deck-btn-secondary" target="_blank">
            Viewer (別タブ)
          </a>
        </div>
      </div>
    `;
  }

  /**
   * ホームページ表示
   * GET /
   */
  getHome = (req, res) => {
    const decks = this.deckService.getAllDecksInfo();

    let deckCardsHtml;
    if (decks.length === 0) {
      deckCardsHtml = `
        <div class="no-decks">
          <div class="no-decks-icon">📂</div>
          <h2>No decks found</h2>
          <p>Add slide files to the slides/decks directory to get started.</p>
        </div>
      `;
    } else {
      deckCardsHtml = decks.map(deck => this.renderDeckCard(deck)).join('\n');
    }

    const template = this.loadHomeTemplate();
    const html = template.replace("{{DECK_CARDS}}", deckCardsHtml);

    res.send(html);
  };
}

export function createHomeController(options) {
  return new HomeController(options);
}

export default {
  HomeController,
  createHomeController
};
