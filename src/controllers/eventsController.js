// src/controllers/eventsController.js

/**
 * SSEイベントコントローラー
 * Server-Sent Eventsのエンドポイントを担当
 */
export class EventsController {
  /**
   * @param {Object} options
   * @param {import('../services/sseService.js').SseService} options.sseService
   */
  constructor({ sseService }) {
    this.sseService = sseService;
  }

  /**
   * SSEエンドポイント
   * GET /events
   */
  getEvents = (req, res) => {
    // クライアントを追加（ヘッダー設定と初期データ送信も含む）
    const cleanup = this.sseService.addClient(res);

    // クライアントが切断した時の処理
    req.on("close", cleanup);
  };
}

export function createEventsController(options) {
  return new EventsController(options);
}

export default {
  EventsController,
  createEventsController
};
