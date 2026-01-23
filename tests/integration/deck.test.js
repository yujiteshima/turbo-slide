// tests/integration/deck.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from '../../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DECKS_DIR = path.resolve(__dirname, '../fixtures/decks');

describe('Deck Routes', () => {
  let app;
  let services;

  beforeAll(async () => {
    const result = createApp({ decksDir: FIXTURES_DECKS_DIR });
    app = result.app;
    services = result.services;
    await result.initialize();
  });

  describe('GET /deck/:deckName', () => {
    it('redirects to first slide for existing deck', async () => {
      const response = await request(app)
        .get('/deck/test-deck')
        .expect(302);

      expect(response.headers.location).toBe('/deck/test-deck/slide/1');
    });

    it('returns 404 for non-existent deck', async () => {
      await request(app)
        .get('/deck/non-existent-deck')
        .expect(404);
    });
  });

  describe('GET /deck/:deckName/slide/:id', () => {
    it('returns slide HTML for valid slide ID', async () => {
      const response = await request(app)
        .get('/deck/test-deck/slide/1')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('turbo-frame');
    });

    it('returns slide with navigation buttons', async () => {
      const response = await request(app)
        .get('/deck/test-deck/slide/1')
        .expect(200);

      expect(response.text).toContain('data-nav="prev"');
      expect(response.text).toContain('data-nav="next"');
    });

    it('returns Turbo Frame for turbo-frame request', async () => {
      const response = await request(app)
        .get('/deck/test-deck/slide/1')
        .set('turbo-frame', 'slide-content')
        .expect(200);

      expect(response.text).toContain('<turbo-frame id="slide-content">');
      expect(response.text).not.toContain('<!doctype html>');
    });

    it('redirects to slide 1 for invalid slide ID', async () => {
      const response = await request(app)
        .get('/deck/test-deck/slide/999')
        .expect(302);

      expect(response.headers.location).toBe('/deck/test-deck/slide/1');
    });

    it('returns 404 for non-existent deck', async () => {
      await request(app)
        .get('/deck/non-existent-deck/slide/1')
        .expect(404);
    });
  });

  describe('GET /deck/:deckName/presenter', () => {
    it('redirects to presenter slide 1', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter')
        .expect(302);

      expect(response.headers.location).toBe('/deck/test-deck/presenter/1');
    });
  });

  describe('GET /deck/:deckName/presenter/:id', () => {
    it('returns presenter HTML for valid slide ID', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/1')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('PRESENTER_MODE = true');
    });

    it('includes deck name in script', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/1')
        .expect(200);

      expect(response.text).toContain('DECK_NAME = "test-deck"');
    });

    it('includes total slides in script', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/1')
        .expect(200);

      expect(response.text).toContain('TOTAL_SLIDES = 2');
    });

    it('includes current slide in script', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/2')
        .expect(200);

      expect(response.text).toContain('CURRENT_SLIDE = 2');
    });

    it('returns Turbo Frame for turbo-frame request', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/1')
        .set('turbo-frame', 'slide-content')
        .expect(200);

      expect(response.text).toContain('<turbo-frame id="slide-content">');
      expect(response.text).not.toContain('<!doctype html>');
    });

    it('redirects to presenter slide 1 for invalid slide ID', async () => {
      const response = await request(app)
        .get('/deck/test-deck/presenter/999')
        .expect(302);

      expect(response.headers.location).toBe('/deck/test-deck/presenter/1');
    });

    it('returns 404 for non-existent deck', async () => {
      await request(app)
        .get('/deck/non-existent-deck/presenter/1')
        .expect(404);
    });
  });

  describe('GET /deck/:deckName/viewer', () => {
    it('returns viewer HTML', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('VIEWER_MODE = true');
    });

    it('includes deck name in script', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer')
        .expect(200);

      expect(response.text).toContain('DECK_NAME = "test-deck"');
    });

    it('includes total slides in script', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer')
        .expect(200);

      expect(response.text).toContain('TOTAL_SLIDES = 2');
    });

    it('accepts slide query parameter', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer?slide=2')
        .expect(200);

      expect(response.text).toContain('CURRENT_SLIDE = 2');
    });

    it('defaults to slide 1 when no query parameter', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer')
        .expect(200);

      expect(response.text).toContain('CURRENT_SLIDE = 1');
    });

    it('returns Turbo Frame for turbo-frame request', async () => {
      const response = await request(app)
        .get('/deck/test-deck/viewer')
        .set('turbo-frame', 'slide-content')
        .expect(200);

      expect(response.text).toContain('<turbo-frame id="slide-content">');
      expect(response.text).not.toContain('<!doctype html>');
    });

    it('returns 404 for non-existent deck', async () => {
      await request(app)
        .get('/deck/non-existent-deck/viewer')
        .expect(404);
    });
  });

  describe('GET /deck/:deckName/print', () => {
    it('returns print HTML with all slides', async () => {
      const response = await request(app)
        .get('/deck/test-deck/print')
        .expect(200);

      expect(response.text).toContain('<!doctype html>');
      expect(response.text).toContain('print-slide');
    });

    it('returns 404 for non-existent deck', async () => {
      await request(app)
        .get('/deck/non-existent-deck/print')
        .expect(404);
    });
  });
});

describe('Deck API Routes', () => {
  let app;
  let services;

  beforeAll(async () => {
    const result = createApp({ decksDir: FIXTURES_DECKS_DIR });
    app = result.app;
    services = result.services;
    await result.initialize();
  });

  describe('POST /api/deck/:deckName/slide/:id', () => {
    it('changes slide and returns success', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentSlide).toBe(1);
    });

    it('broadcasts slide change to SSE service', async () => {
      await request(app)
        .post('/api/deck/test-deck/slide/2')
        .expect(200);

      expect(services.sseService.getCurrentSlide()).toBe(2);
    });

    it('can broadcast any valid slide ID within deck range', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentSlide).toBe(2);
    });

    it('returns error for slide ID exceeding deck total', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/999')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });

    it('returns error for non-numeric slide ID', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/abc')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });

    it('returns error for zero slide ID', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/0')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });

    it('returns error for negative slide ID', async () => {
      const response = await request(app)
        .post('/api/deck/test-deck/slide/-1')
        .expect(400);

      expect(response.body.error).toBe('Invalid slide ID');
    });

    it('returns 404 for non-existent deck', async () => {
      const response = await request(app)
        .post('/api/deck/non-existent-deck/slide/1')
        .expect(404);

      expect(response.body.error).toBe('Deck not found');
    });
  });

  describe('GET /api/decks', () => {
    it('returns array of all decks', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('includes test-deck in deck list', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      const testDeck = response.body.find(d => d.name === 'test-deck');
      expect(testDeck).toBeDefined();
    });

    it('returns deck info with required fields', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      const testDeck = response.body.find(d => d.name === 'test-deck');
      if (testDeck) {
        expect(testDeck).toHaveProperty('name');
        expect(testDeck).toHaveProperty('type');
        expect(testDeck).toHaveProperty('slideCount');
        expect(testDeck).toHaveProperty('url');
      }
    });

    it('returns correct slide count for PDF deck', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      const testDeck = response.body.find(d => d.name === 'test-deck');
      if (testDeck) {
        expect(testDeck.slideCount).toBe(2);
        expect(testDeck.type).toBe('pdf');
      }
    });

    it('returns correct URL for deck', async () => {
      const response = await request(app)
        .get('/api/decks')
        .expect(200);

      const testDeck = response.body.find(d => d.name === 'test-deck');
      if (testDeck) {
        expect(testDeck.url).toBe('/deck/test-deck');
      }
    });
  });
});
