// src/config/index.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

/**
 * デフォルト設定
 */
const defaultConfig = {
  title: "Turbo Slide",
  author: "",
  timer: 600,
  slidesDir: "./slides",
  imagesDir: "./slides/images"
};

/**
 * 設定ファイルを読み込む
 * @param {string} [configPath] - 設定ファイルのパス（省略時はルートのturbo-slide.config.json）
 * @returns {Object} 設定オブジェクト
 */
export function loadConfig(configPath = null) {
  const filePath = configPath || path.join(ROOT_DIR, "turbo-slide.config.json");

  if (fs.existsSync(filePath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return { ...defaultConfig, ...userConfig };
    } catch (error) {
      console.warn("Warning: Failed to parse turbo-slide.config.json, using defaults");
      return { ...defaultConfig };
    }
  }
  return { ...defaultConfig };
}

/**
 * ルートディレクトリを取得
 * @returns {string} ルートディレクトリのパス
 */
export function getRootDir() {
  return ROOT_DIR;
}

/**
 * デフォルト設定を取得
 * @returns {Object} デフォルト設定オブジェクト
 */
export function getDefaultConfig() {
  return { ...defaultConfig };
}

export default {
  loadConfig,
  getRootDir,
  getDefaultConfig
};
