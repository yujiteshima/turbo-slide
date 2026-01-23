// src/services/pdfService.js
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";

/**
 * PDFサービス
 * PDFからスライド画像への変換を担当
 */
export class PdfService {
  /**
   * @param {string} importedDir - インポートデッキのディレクトリパス
   */
  constructor(importedDir) {
    this.importedDir = path.resolve(importedDir);
  }

  /**
   * PDFを画像に変換
   * @param {string} pdfPath - PDFファイルのパス
   * @param {string} outputDir - 出力ディレクトリのパス
   * @returns {Promise<number>} 生成されたスライド数
   */
  async convertPdfToImages(pdfPath, outputDir) {
    const { pdf } = await import("pdf-to-img");
    await fsPromises.mkdir(outputDir, { recursive: true });

    const document = await pdf(pdfPath, { scale: 2 });
    let index = 1;

    for await (const image of document) {
      const fileName = `slide-${String(index).padStart(2, "0")}.png`;
      await fsPromises.writeFile(path.join(outputDir, fileName), image);
      index++;
    }

    return index - 1;
  }

  /**
   * PDFの更新チェック（PDFが画像より新しい場合true）
   * @param {string} pdfPath - PDFファイルのパス
   * @param {string} outputDir - 出力ディレクトリのパス
   * @returns {boolean} 再変換が必要な場合true
   */
  needsReconvert(pdfPath, outputDir) {
    if (!fs.existsSync(outputDir)) {
      return true;
    }

    const pdfStat = fs.statSync(pdfPath);
    const images = fs.readdirSync(outputDir).filter(f => f.match(/^slide-\d+\.png$/i));

    if (images.length === 0) {
      return true;
    }

    const firstImagePath = path.join(outputDir, images[0]);
    const imageStat = fs.statSync(firstImagePath);

    return pdfStat.mtime > imageStat.mtime;
  }

  /**
   * インポートデッキを初期化（サーバー起動時にPDFを変換）
   * @returns {Promise<Object[]>} 変換結果の配列
   */
  async initializeImportedDecks() {
    const results = [];

    if (!fs.existsSync(this.importedDir)) {
      fs.mkdirSync(this.importedDir, { recursive: true });
      return results;
    }

    const files = fs.readdirSync(this.importedDir);
    for (const file of files) {
      if (file.endsWith(".pdf")) {
        const deckName = file.replace(".pdf", "");
        const pdfPath = path.join(this.importedDir, file);
        const outputDir = path.join(this.importedDir, deckName);

        if (this.needsReconvert(pdfPath, outputDir)) {
          console.log(`📄 Converting ${file} to images...`);
          try {
            const slideCount = await this.convertPdfToImages(pdfPath, outputDir);
            console.log(`   ✅ Created ${slideCount} slides in ${deckName}/`);
            results.push({ deckName, slideCount, success: true });
          } catch (error) {
            console.error(`   ❌ Failed to convert ${file}:`, error.message);
            results.push({ deckName, error: error.message, success: false });
          }
        } else {
          results.push({ deckName, skipped: true, success: true });
        }
      }
    }

    return results;
  }

  /**
   * 単一のPDFをインポート
   * @param {string} pdfPath - PDFファイルのパス
   * @param {string} [deckName] - デッキ名（省略時はファイル名から生成）
   * @returns {Promise<Object>} インポート結果
   */
  async importPdf(pdfPath, deckName = null) {
    const name = deckName || path.basename(pdfPath, ".pdf");
    const outputDir = path.join(this.importedDir, name);

    try {
      const slideCount = await this.convertPdfToImages(pdfPath, outputDir);
      return { deckName: name, slideCount, success: true };
    } catch (error) {
      return { deckName: name, error: error.message, success: false };
    }
  }
}

/**
 * ファクトリ関数
 * @param {string} importedDir - インポートデッキのディレクトリパス
 * @returns {PdfService} PDFサービスインスタンス
 */
export function createPdfService(importedDir) {
  return new PdfService(importedDir);
}

export default {
  PdfService,
  createPdfService
};
