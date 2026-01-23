// src/routes/printRoutes.js
import express from "express";

/**
 * プリントルートを作成
 * @param {import('../controllers/printController.js').PrintController} printController
 * @returns {express.Router}
 */
export function createPrintRoutes(printController) {
  const router = express.Router();

  // GET /print - プリント表示
  router.get("/", printController.getPrint);

  return router;
}

export default { createPrintRoutes };
