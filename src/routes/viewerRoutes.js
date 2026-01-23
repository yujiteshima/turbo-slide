// src/routes/viewerRoutes.js
import express from "express";

/**
 * ビューアールートを作成
 * @param {import('../controllers/viewerController.js').ViewerController} viewerController
 * @returns {express.Router}
 */
export function createViewerRoutes(viewerController) {
  const router = express.Router();

  // GET /viewer - ビューアー表示
  router.get("/", viewerController.getViewer);

  return router;
}

export default { createViewerRoutes };
