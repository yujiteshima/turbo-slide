// src/services/slideService.js
import fs from "fs";
import path from "path";

/**
 * スライドサービス
 * スライドファイルの読み込みとカウントを担当
 */
export class SlideService {
  /**
   * @param {string} slidesDir - スライドディレクトリのパス
   */
  constructor(slidesDir) {
    this.slidesDir = path.resolve(slidesDir);
  }

  /**
   * スライド数を取得
   * @returns {number} スライド数
   */
  getSlideCount() {
    if (!fs.existsSync(this.slidesDir)) {
      return 0;
    }
    const files = fs.readdirSync(this.slidesDir);
    return files.filter(f => f.match(/^slide-\d+\.html$/)).length;
  }

  /**
   * スライドHTMLを読み込み
   * @param {number} index - スライド番号（1始まり）
   * @returns {string|null} スライドHTML（.slideでラップ済み）、存在しない場合はnull
   */
  loadSlide(index) {
    const fileName = `slide-${String(index).padStart(2, "0")}.html`;
    const filePath = path.join(this.slidesDir, fileName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return `<div class="slide">${content}</div>`;
  }

  /**
   * スライドが存在するか確認
   * @param {number} index - スライド番号
   * @returns {boolean} 存在する場合true
   */
  slideExists(index) {
    const fileName = `slide-${String(index).padStart(2, "0")}.html`;
    const filePath = path.join(this.slidesDir, fileName);
    return fs.existsSync(filePath);
  }

  /**
   * スライド番号が有効か検証
   * @param {number} slideId - スライド番号
   * @returns {boolean} 有効な場合true
   */
  isValidSlideId(slideId) {
    const totalSlides = this.getSlideCount();
    return !isNaN(slideId) && slideId >= 1 && slideId <= totalSlides;
  }
}

/**
 * ファクトリ関数
 * @param {string} slidesDir - スライドディレクトリのパス
 * @returns {SlideService} スライドサービスインスタンス
 */
export function createSlideService(slidesDir) {
  return new SlideService(slidesDir);
}

export default {
  SlideService,
  createSlideService
};
