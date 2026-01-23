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
   * @param {string} decksDir - デッキのディレクトリパス (slides/decks)
   */
  constructor(decksDir) {
    this.decksDir = path.resolve(decksDir);
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
   * デッキを初期化（サーバー起動時にPDFを変換）
   * 各デッキディレクトリ内の source.pdf を検索して変換
   * @returns {Promise<Object[]>} 変換結果の配列
   */
  async initializeImportedDecks() {
    const results = [];

    if (!fs.existsSync(this.decksDir)) {
      fs.mkdirSync(this.decksDir, { recursive: true });
      return results;
    }

    // 各デッキディレクトリをスキャン
    const entries = fs.readdirSync(this.decksDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const deckName = entry.name;
      const deckDir = path.join(this.decksDir, deckName);
      const sourcePdfPath = path.join(deckDir, "source.pdf");

      // source.pdf が存在する場合のみ変換
      if (fs.existsSync(sourcePdfPath)) {
        if (this.needsReconvert(sourcePdfPath, deckDir)) {
          console.log(`📄 Converting ${deckName}/source.pdf to images...`);
          try {
            const slideCount = await this.convertPdfToImages(sourcePdfPath, deckDir);
            console.log(`   ✅ Created ${slideCount} slides in ${deckName}/`);

            // deck.jsonのslideCountを更新
            await this.updateDeckMetadata(deckDir, slideCount);

            results.push({ deckName, slideCount, success: true });
          } catch (error) {
            console.error(`   ❌ Failed to convert ${deckName}/source.pdf:`, error.message);
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
   * deck.jsonのslideCountを更新
   * @param {string} deckDir - デッキディレクトリのパス
   * @param {number} slideCount - スライド数
   */
  async updateDeckMetadata(deckDir, slideCount) {
    const metadataPath = path.join(deckDir, "deck.json");
    let metadata = {};

    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      } catch (error) {
        // パースエラーの場合は新規作成
      }
    }

    metadata.slideCount = slideCount;
    metadata.type = "pdf";

    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * 単一のPDFをインポート
   * @param {string} pdfPath - PDFファイルのパス
   * @param {string} [deckName] - デッキ名（省略時はファイル名から生成）
   * @returns {Promise<Object>} インポート結果
   */
  async importPdf(pdfPath, deckName = null) {
    const name = deckName || path.basename(pdfPath, ".pdf");
    const outputDir = path.join(this.decksDir, name);

    try {
      // source.pdfとしてコピー
      await fsPromises.mkdir(outputDir, { recursive: true });
      const destPdfPath = path.join(outputDir, "source.pdf");
      await fsPromises.copyFile(pdfPath, destPdfPath);

      const slideCount = await this.convertPdfToImages(destPdfPath, outputDir);
      await this.updateDeckMetadata(outputDir, slideCount);

      return { deckName: name, slideCount, success: true };
    } catch (error) {
      return { deckName: name, error: error.message, success: false };
    }
  }
}

/**
 * ファクトリ関数
 * @param {string} decksDir - デッキのディレクトリパス
 * @returns {PdfService} PDFサービスインスタンス
 */
export function createPdfService(decksDir) {
  return new PdfService(decksDir);
}

export default {
  PdfService,
  createPdfService
};
