// src/routes/apiRoutes.js
import express from "express";

/**
 * APIルートを作成
 * @param {import('../controllers/apiController.js').ApiController} apiController
 * @returns {express.Router}
 */
export function createApiRoutes(apiController) {
  const router = express.Router();

  // POST /api/slide/:id - スライド変更
  router.post("/slide/:id", apiController.changeSlide);

  // POST /api/deck/:deckName/slide/:id - デッキスライド変更
  router.post("/deck/:deckName/slide/:id", apiController.changeDeckSlide);

  // GET /api/decks - デッキ一覧
  router.get("/decks", apiController.getDecks);

  return router;
}

export default { createApiRoutes };
