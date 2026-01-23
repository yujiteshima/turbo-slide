// src/routes/slideRoutes.js
import express from "express";

/**
 * スライドルートを作成
 * @param {import('../controllers/slideController.js').SlideController} slideController
 * @returns {express.Router}
 */
export function createSlideRoutes(slideController) {
  const router = express.Router();

  // GET /slide/:id - スライド表示
  router.get("/:id", slideController.getSlide);

  return router;
}

export default { createSlideRoutes };
