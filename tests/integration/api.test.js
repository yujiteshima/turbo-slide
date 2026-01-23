// tests/integration/api.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('API Routes', () => {
  let app;
  let services;

  beforeAll(async () => {
    const result = createApp();
    app = result.app;
    services = result.services;
    await result.initialize();
  });

  describe('POST /api/slide/:id', () => {
    it('changes slide and returns success', async () => {
      const response = await request(app)
        .post('/api/slide/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentSlide).toBe(2);
    });

    it('broadcasts slide change to SSE service', async () => {
      await request(app)
        .post('/api/slide/3')
        .expect(200);

      expect(services.sseService.getCurrentSlide()).toBe(3);
    });

    it('returns error for invalid slide ID', async () => {
      const response = await request(app)
        .post('/api/slide/999')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });

    it('returns error for non-numeric slide ID', async () => {
      const response = await request(app)
        .post('/api/slide/abc')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });
  });

  describe('GET /api/decks', () => {
    it('returns array of deck info', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('returns deck info with required fields', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      // デッキがある場合のみフィールドをチェック
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('slideCount');
        expect(response.body[0]).toHaveProperty('url');
      }
    });
  });
});
