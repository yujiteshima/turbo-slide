// tests/unit/services/deckService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeckService, createDeckService } from '../../../src/services/deckService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures/imported');

describe('DeckService', () => {
  let deckService;

  beforeEach(() => {
    deckService = new DeckService(FIXTURES_DIR);
  });

  describe('getImportedDecks', () => {
    it('returns list of imported deck directories', () => {
      const decks = deckService.getImportedDecks();
      expect(decks).toContain('test-deck');
    });

    it('returns empty array for non-existent directory', () => {
      const service = new DeckService('/non/existent/path');
      const decks = service.getImportedDecks();
      expect(decks).toEqual([]);
    });
  });

  describe('getImportedSlideCount', () => {
    it('returns correct slide count for deck', () => {
      const count = deckService.getImportedSlideCount('test-deck');
      expect(count).toBe(2);
    });

    it('returns 0 for non-existent deck', () => {
      const count = deckService.getImportedSlideCount('non-existent');
      expect(count).toBe(0);
    });
  });

  describe('loadImportedSlide', () => {
    it('returns HTML with image tag for existing slide', () => {
      const html = deckService.loadImportedSlide('test-deck', 1);

      expect(html).not.toBeNull();
      expect(html).toContain('imported-slide-container');
      expect(html).toContain('/imported/test-deck/slide-01.png');
    });

    it('returns null for non-existent slide', () => {
      const html = deckService.loadImportedSlide('test-deck', 999);
      expect(html).toBeNull();
    });
  });

  describe('deckExists', () => {
    it('returns true for existing deck', () => {
      expect(deckService.deckExists('test-deck')).toBe(true);
    });

    it('returns false for non-existent deck', () => {
      expect(deckService.deckExists('non-existent')).toBe(false);
    });
  });

  describe('isValidSlideId', () => {
    it('returns true for valid slide IDs', () => {
      expect(deckService.isValidSlideId('test-deck', 1)).toBe(true);
      expect(deckService.isValidSlideId('test-deck', 2)).toBe(true);
    });

    it('returns false for invalid slide IDs', () => {
      expect(deckService.isValidSlideId('test-deck', 0)).toBe(false);
      expect(deckService.isValidSlideId('test-deck', 3)).toBe(false);
      expect(deckService.isValidSlideId('test-deck', NaN)).toBe(false);
    });
  });

  describe('getDeckInfo', () => {
    it('returns deck info for existing deck', () => {
      const info = deckService.getDeckInfo('test-deck');

      expect(info).not.toBeNull();
      expect(info.name).toBe('test-deck');
      expect(info.slideCount).toBe(2);
      expect(info.url).toBe('/deck/test-deck');
    });

    it('returns null for non-existent deck', () => {
      const info = deckService.getDeckInfo('non-existent');
      expect(info).toBeNull();
    });
  });

  describe('getAllDecksInfo', () => {
    it('returns array of all deck info', () => {
      const allInfo = deckService.getAllDecksInfo();

      expect(allInfo).toBeInstanceOf(Array);
      expect(allInfo.length).toBeGreaterThan(0);
      expect(allInfo[0]).toHaveProperty('name');
      expect(allInfo[0]).toHaveProperty('slideCount');
      expect(allInfo[0]).toHaveProperty('url');
    });
  });

  describe('createDeckService factory', () => {
    it('creates a DeckService instance', () => {
      const service = createDeckService(FIXTURES_DIR);
      expect(service).toBeInstanceOf(DeckService);
    });
  });
});
