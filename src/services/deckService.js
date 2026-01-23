// src/services/deckService.js
import fs from "fs";
import path from "path";

/**
 * デッキサービス
 * 統合デッキ構造（HTML + PDF）の管理を担当
 */
export class DeckService {
  /**
   * @param {string} decksDir - デッキのディレクトリパス (slides/decks)
   */
  constructor(decksDir) {
    this.decksDir = path.resolve(decksDir);
  }

  /**
   * デッキ一覧を取得
   * @returns {string[]} デッキ名の配列
   */
  getDecks() {
    if (!fs.existsSync(this.decksDir)) {
      return [];
    }

    return fs.readdirSync(this.decksDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }

  /**
   * デッキのメタデータを読み込み
   * @param {string} deckName - デッキ名
   * @returns {Object|null} deck.jsonの内容、存在しない場合はnull
   */
  getDeckMetadata(deckName) {
    const metadataPath = path.join(this.decksDir, deckName, "deck.json");
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch (error) {
      return null;
    }
  }

  /**
   * デッキのタイプを取得 (html or pdf)
   * @param {string} deckName - デッキ名
   * @returns {string} 'html' または 'pdf'
   */
  getDeckType(deckName) {
    const metadata = this.getDeckMetadata(deckName);
    if (metadata && metadata.type) {
      return metadata.type;
    }

    // メタデータがない場合はファイル形式から判定
    const deckDir = path.join(this.decksDir, deckName);
    if (!fs.existsSync(deckDir)) {
      return "html";
    }

    const files = fs.readdirSync(deckDir);
    if (files.some(f => f.match(/^slide-\d+\.png$/i))) {
      return "pdf";
    }
    return "html";
  }

  /**
   * デッキのスライド数を取得
   * @param {string} deckName - デッキ名
   * @returns {number} スライド数
   */
  getSlideCount(deckName) {
    const metadata = this.getDeckMetadata(deckName);
    if (metadata && metadata.slideCount) {
      return metadata.slideCount;
    }

    const deckDir = path.join(this.decksDir, deckName);
    if (!fs.existsSync(deckDir)) {
      return 0;
    }

    const files = fs.readdirSync(deckDir);
    const type = this.getDeckType(deckName);

    if (type === "pdf") {
      return files.filter(f => f.match(/^slide-\d+\.png$/i)).length;
    } else {
      return files.filter(f => f.match(/^slide-\d+\.html$/i)).length;
    }
  }

  /**
   * デッキのスライドを読み込み
   * @param {string} deckName - デッキ名
   * @param {number} index - スライド番号（1始まり）
   * @returns {string|null} スライドHTML、存在しない場合はnull
   */
  loadSlide(deckName, index) {
    const type = this.getDeckType(deckName);
    const deckDir = path.join(this.decksDir, deckName);
    const paddedIndex = String(index).padStart(2, "0");

    if (type === "pdf") {
      const filePath = path.join(deckDir, `slide-${paddedIndex}.png`);
      if (fs.existsSync(filePath)) {
        return `
<div class="imported-slide-container">
  <img src="/decks/${deckName}/slide-${paddedIndex}.png"
       class="imported-slide-image"
       alt="Slide ${index}" />
</div>`;
      }
    } else {
      const filePath = path.join(deckDir, `slide-${paddedIndex}.html`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        return `<div class="slide-content">${content}</div>`;
      }
    }

    return null;
  }

  /**
   * デッキが存在するか確認
   * @param {string} deckName - デッキ名
   * @returns {boolean} 存在する場合true
   */
  deckExists(deckName) {
    return this.getDecks().includes(deckName);
  }

  /**
   * スライド番号が有効か検証
   * @param {string} deckName - デッキ名
   * @param {number} slideId - スライド番号
   * @returns {boolean} 有効な場合true
   */
  isValidSlideId(deckName, slideId) {
    const totalSlides = this.getSlideCount(deckName);
    return !isNaN(slideId) && slideId >= 1 && slideId <= totalSlides;
  }

  /**
   * デッキ情報を取得
   * @param {string} deckName - デッキ名
   * @returns {Object|null} デッキ情報オブジェクト
   */
  getDeckInfo(deckName) {
    if (!this.deckExists(deckName)) {
      return null;
    }

    const metadata = this.getDeckMetadata(deckName);
    const type = this.getDeckType(deckName);
    const slideCount = this.getSlideCount(deckName);

    return {
      name: deckName,
      title: metadata?.title || deckName,
      author: metadata?.author || "",
      type: type,
      slideCount: slideCount,
      timer: metadata?.timer || 300,
      url: `/deck/${deckName}`
    };
  }

  /**
   * 全デッキ情報を取得
   * @returns {Object[]} デッキ情報の配列
   */
  getAllDecksInfo() {
    return this.getDecks().map(name => this.getDeckInfo(name));
  }

  // --- 後方互換性のためのエイリアス ---

  /**
   * @deprecated getDecks() を使用してください
   */
  getImportedDecks() {
    return this.getDecks().filter(name => this.getDeckType(name) === "pdf");
  }

  /**
   * @deprecated getSlideCount() を使用してください
   */
  getImportedSlideCount(deckName) {
    return this.getSlideCount(deckName);
  }

  /**
   * @deprecated loadSlide() を使用してください
   */
  loadImportedSlide(deckName, index) {
    return this.loadSlide(deckName, index);
  }
}

/**
 * ファクトリ関数
 * @param {string} decksDir - デッキのディレクトリパス
 * @returns {DeckService} デッキサービスインスタンス
 */
export function createDeckService(decksDir) {
  return new DeckService(decksDir);
}

export default {
  DeckService,
  createDeckService
};
