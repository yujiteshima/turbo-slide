// tests/integration/presenter.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Presenter Routes', () => {
  let app;

  beforeAll(async () => {
    const result = createApp();
    app = result.app;
    await result.initialize();
  });

  describe('GET /presenter', () => {
    it('redirects to /presenter/1', async () => {
      const response = await request(app)
        .get('/presenter')
        .expect(302);

      expect(response.headers.location).toBe('/presenter/1');
    });
  });

  describe('GET /presenter/:id', () => {
    it('returns HTML with PRESENTER_MODE flag', async () => {
      const response = await request(app)
        .get('/presenter/1')
        .expect(200);

      expect(response.text).toContain('window.PRESENTER_MODE = true');
      expect(response.text).toContain('window.CURRENT_SLIDE = 1');
    });

    it('returns Turbo Frame content for Turbo Frame request', async () => {
      const response = await request(app)
        .get('/presenter/1')
        .set('Turbo-Frame', 'slide-content')
        .expect(200);

      expect(response.text).toContain('<turbo-frame id="slide-content">');
      expect(response.text).not.toContain('window.PRESENTER_MODE');
    });

    it('redirects to /presenter/1 for invalid slide ID', async () => {
      const response = await request(app)
        .get('/presenter/999')
        .expect(302);

      expect(response.headers.location).toBe('/presenter/1');
    });
  });
});
