// src/routes/presenterRoutes.js
import express from "express";

/**
 * プレゼンタールートを作成
 * @param {import('../controllers/presenterController.js').PresenterController} presenterController
 * @returns {express.Router}
 */
export function createPresenterRoutes(presenterController) {
  const router = express.Router();

  // GET /presenter - リダイレクト
  router.get("/", presenterController.redirectToFirst);

  // GET /presenter/:id - プレゼンター表示
  router.get("/:id", presenterController.getPresenter);

  return router;
}

export default { createPresenterRoutes };
