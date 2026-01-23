// tests/integration/slides.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Slide Routes', () => {
  let app;

  beforeAll(async () => {
    const result = createApp();
    app = result.app;
    await result.initialize();
  });

  describe('GET /', () => {
    it('returns home page with deck selection', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('Turbo Slide');
      expect(response.text).toContain('deck-card');
    });
  });

  describe('GET /slide/:id', () => {
    it('returns HTML for valid slide', async () => {
      const response = await request(app)
        .get('/slide/1')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('turbo-frame');
    });

    it('returns Turbo Frame content for Turbo Frame request', async () => {
      const response = await request(app)
        .get('/slide/1')
        .set('Turbo-Frame', 'slide-content')
        .expect(200);

      expect(response.text).toContain('<turbo-frame id="slide-content">');
      expect(response.text).not.toContain('<!doctype html>');
    });

    it('redirects to /slide/1 for invalid slide ID', async () => {
      const response = await request(app)
        .get('/slide/999')
        .expect(302);

      expect(response.headers.location).toBe('/slide/1');
    });

    it('redirects to /slide/1 for non-numeric ID', async () => {
      const response = await request(app)
        .get('/slide/abc')
        .expect(302);

      expect(response.headers.location).toBe('/slide/1');
    });

    it('has clickable logo link to home page', async () => {
      const response = await request(app)
        .get('/slide/1')
        .expect(200);

      expect(response.text).toContain('<a href="/" class="deck-title-link">');
    });
  });

  describe('GET /presenter/:id', () => {
    it('has clickable logo link to home page', async () => {
      const response = await request(app)
        .get('/presenter/1')
        .expect(200);

      expect(response.text).toContain('<a href="/" class="deck-title-link">');
    });
  });

  describe('GET /viewer', () => {
    it('has disabled logo link (not clickable)', async () => {
      const response = await request(app)
        .get('/viewer')
        .expect(200);

      expect(response.text).toContain('<span class="deck-title-link deck-title-disabled">');
      expect(response.text).not.toContain('<a href="/" class="deck-title-link">');
    });
  });
});
