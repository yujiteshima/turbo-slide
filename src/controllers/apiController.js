// src/controllers/apiController.js

/**
 * APIコントローラー
 * REST APIエンドポイントを担当
 */
export class ApiController {
  /**
   * @param {Object} options
   * @param {import('../services/slideService.js').SlideService} options.slideService
   * @param {import('../services/deckService.js').DeckService} options.deckService
   * @param {import('../services/sseService.js').SseService} options.sseService
   */
  constructor({ slideService, deckService, sseService }) {
    this.slideService = slideService;
    this.deckService = deckService;
    this.sseService = sseService;
  }

  /**
   * スライド変更API
   * POST /api/slide/:id
   */
  changeSlide = (req, res) => {
    const slideId = parseInt(req.params.id, 10);

    if (!this.slideService.isValidSlideId(slideId)) {
      return res.status(400).json({ error: "Invalid slide ID" });
    }

    this.sseService.broadcastSlideChange(slideId);
    res.json({ success: true, currentSlide: slideId });
  };

  /**
   * デッキ一覧API
   * GET /api/decks
   */
  getDecks = (req, res) => {
    const decks = this.deckService.getAllDecksInfo();
    res.json(decks);
  };
}

export function createApiController(options) {
  return new ApiController(options);
}

export default {
  ApiController,
  createApiController
};
