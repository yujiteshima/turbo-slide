// src/routes/deckRoutes.js
import express from "express";

/**
 * デッキルートを作成
 * @param {import('../controllers/deckController.js').DeckController} deckController
 * @returns {express.Router}
 */
export function createDeckRoutes(deckController) {
  const router = express.Router();

  // GET /deck/:deckName - リダイレクト
  router.get("/:deckName", deckController.redirectToFirst);

  // GET /deck/:deckName/slide/:id - スライド表示
  router.get("/:deckName/slide/:id", deckController.getSlide);

  // GET /deck/:deckName/presenter - プレゼンターリダイレクト
  router.get("/:deckName/presenter", deckController.redirectToPresenter);

  // GET /deck/:deckName/presenter/:id - プレゼンター表示
  router.get("/:deckName/presenter/:id", deckController.getPresenter);

  // GET /deck/:deckName/viewer - ビューアー表示
  router.get("/:deckName/viewer", deckController.getViewer);

  // GET /deck/:deckName/print - プリント表示
  router.get("/:deckName/print", deckController.getPrint);

  return router;
}

export default { createDeckRoutes };
