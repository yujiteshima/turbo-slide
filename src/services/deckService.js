// src/services/deckService.js
import fs from "fs";
import path from "path";

/**
 * デッキサービス
 * インポートされたデッキ（PDF等）の管理を担当
 */
export class DeckService {
  /**
   * @param {string} importedDir - インポートデッキのディレクトリパス
   */
  constructor(importedDir) {
    this.importedDir = path.resolve(importedDir);
  }

  /**
   * インポートデッキ一覧を取得
   * @returns {string[]} デッキ名の配列
   */
  getImportedDecks() {
    if (!fs.existsSync(this.importedDir)) {
      return [];
    }

    return fs.readdirSync(this.importedDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }

  /**
   * インポートデッキのスライド数を取得
   * @param {string} deckName - デッキ名
   * @returns {number} スライド数
   */
  getImportedSlideCount(deckName) {
    const deckDir = path.join(this.importedDir, deckName);
    if (!fs.existsSync(deckDir)) {
      return 0;
    }

    const files = fs.readdirSync(deckDir);
    return files.filter(f => f.match(/^slide-\d+\.png$/i)).length;
  }

  /**
   * インポートデッキのスライドHTMLを生成
   * @param {string} deckName - デッキ名
   * @param {number} index - スライド番号（1始まり）
   * @returns {string|null} スライドHTML、存在しない場合はnull
   */
  loadImportedSlide(deckName, index) {
    const deckDir = path.join(this.importedDir, deckName);
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

  /**
   * デッキが存在するか確認
   * @param {string} deckName - デッキ名
   * @returns {boolean} 存在する場合true
   */
  deckExists(deckName) {
    return this.getImportedDecks().includes(deckName);
  }

  /**
   * スライド番号が有効か検証
   * @param {string} deckName - デッキ名
   * @param {number} slideId - スライド番号
   * @returns {boolean} 有効な場合true
   */
  isValidSlideId(deckName, slideId) {
    const totalSlides = this.getImportedSlideCount(deckName);
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

    return {
      name: deckName,
      slideCount: this.getImportedSlideCount(deckName),
      url: `/deck/${deckName}`
    };
  }

  /**
   * 全デッキ情報を取得
   * @returns {Object[]} デッキ情報の配列
   */
  getAllDecksInfo() {
    return this.getImportedDecks().map(name => this.getDeckInfo(name));
  }
}

/**
 * ファクトリ関数
 * @param {string} importedDir - インポートデッキのディレクトリパス
 * @returns {DeckService} デッキサービスインスタンス
 */
export function createDeckService(importedDir) {
  return new DeckService(importedDir);
}

export default {
  DeckService,
  createDeckService
};
