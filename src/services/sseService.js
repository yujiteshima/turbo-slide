// src/services/sseService.js

/**
 * SSE（Server-Sent Events）サービス
 * プレゼンター/ビューアー間のリアルタイム同期を担当
 */
export class SseService {
  constructor() {
    this.currentSlide = 1;
    this.clients = [];
  }

  /**
   * 現在のスライド番号を取得
   * @returns {number} 現在のスライド番号
   */
  getCurrentSlide() {
    return this.currentSlide;
  }

  /**
   * 現在のスライド番号を設定
   * @param {number} slideId - スライド番号
   */
  setCurrentSlide(slideId) {
    this.currentSlide = slideId;
  }

  /**
   * クライアント数を取得
   * @returns {number} 接続中のクライアント数
   */
  getClientCount() {
    return this.clients.length;
  }

  /**
   * SSEクライアントを追加
   * @param {Response} res - Express Response オブジェクト
   * @returns {Function} クライアント削除用のクリーンアップ関数
   */
  addClient(res) {
    // SSEヘッダーを設定
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 現在のスライドを送信
    res.write(`data: ${this.currentSlide}\n\n`);

    // クライアントリストに追加
    this.clients.push(res);

    // クリーンアップ関数を返す
    return () => {
      this.removeClient(res);
    };
  }

  /**
   * SSEクライアントを削除
   * @param {Response} res - Express Response オブジェクト
   */
  removeClient(res) {
    const index = this.clients.indexOf(res);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

  /**
   * スライド変更を全クライアントにブロードキャスト
   * @param {number} slideId - スライド番号
   */
  broadcastSlideChange(slideId) {
    this.currentSlide = slideId;

    this.clients.forEach((client) => {
      try {
        client.write(`data: ${slideId}\n\n`);
      } catch (error) {
        // クライアント接続エラーは無視
      }
    });
  }

  /**
   * 全クライアントの接続を閉じる
   */
  closeAllConnections() {
    this.clients.forEach((client) => {
      try {
        client.end();
      } catch (error) {
        // エラーは無視
      }
    });
    this.clients = [];
  }
}

// シングルトンインスタンス
let instance = null;

/**
 * シングルトンインスタンスを取得
 * @returns {SseService} SSEサービスインスタンス
 */
export function getSseService() {
  if (!instance) {
    instance = new SseService();
  }
  return instance;
}

/**
 * ファクトリ関数（テスト用に新しいインスタンスを作成）
 * @returns {SseService} 新しいSSEサービスインスタンス
 */
export function createSseService() {
  return new SseService();
}

export default {
  SseService,
  getSseService,
  createSseService
};
