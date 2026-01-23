// src/controllers/printController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * プリントコントローラー
 * PDF印刷用ページの表示を担当
 */
export class PrintController {
  /**
   * @param {Object} options
   * @param {import('../services/slideService.js').SlideService} options.slideService
   */
  constructor({ slideService }) {
    this.slideService = slideService;
  }

  /**
   * プリントレイアウトHTMLを読み込み
   */
  loadPrintLayout() {
    return fs.readFileSync(path.join(ROOT_DIR, "views/print.html"), "utf-8");
  }

  /**
   * プリント用ページ表示
   * GET /print
   */
  getPrint = (req, res) => {
    const printLayout = this.loadPrintLayout();
    const totalSlides = this.slideService.getSlideCount();

    // 全スライドを読み込んでラップ
    let allSlides = '';
    for (let i = 1; i <= totalSlides; i++) {
      const slideContent = this.slideService.loadSlide(i);
      if (slideContent) {
        allSlides += `<div class="print-slide">${slideContent}</div>\n`;
      }
    }

    const html = printLayout.replace("{{ALL_SLIDES}}", allSlides);
    res.send(html);
  };
}

export function createPrintController(options) {
  return new PrintController(options);
}

export default {
  PrintController,
  createPrintController
};
