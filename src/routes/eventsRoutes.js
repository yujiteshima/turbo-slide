// src/routes/eventsRoutes.js
import express from "express";

/**
 * SSEイベントルートを作成
 * @param {import('../controllers/eventsController.js').EventsController} eventsController
 * @returns {express.Router}
 */
export function createEventsRoutes(eventsController) {
  const router = express.Router();

  // GET /events - SSEエンドポイント
  router.get("/", eventsController.getEvents);

  return router;
}

export default { createEventsRoutes };
