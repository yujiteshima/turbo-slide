// tests/unit/services/deckService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeckService, createDeckService } from '../../../src/services/deckService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures/decks');

describe('DeckService', () => {
  let deckService;

  beforeEach(() => {
    deckService = new DeckService(FIXTURES_DIR);
  });

  describe('getDecks', () => {
    it('returns list of deck directories', () => {
      const decks = deckService.getDecks();
      expect(decks).toContain('test-deck');
      expect(decks).toContain('default');
    });

    it('returns empty array for non-existent directory', () => {
      const service = new DeckService('/non/existent/path');
      const decks = service.getDecks();
      expect(decks).toEqual([]);
    });
  });

  describe('getDeckMetadata', () => {
    it('returns metadata for deck with deck.json', () => {
      const metadata = deckService.getDeckMetadata('test-deck');
      expect(metadata).not.toBeNull();
      expect(metadata.name).toBe('test-deck');
      expect(metadata.type).toBe('pdf');
    });

    it('returns null for non-existent deck', () => {
      const metadata = deckService.getDeckMetadata('non-existent');
      expect(metadata).toBeNull();
    });
  });

  describe('getDeckType', () => {
    it('returns pdf for PDF deck', () => {
      expect(deckService.getDeckType('test-deck')).toBe('pdf');
    });

    it('returns html for HTML deck', () => {
      expect(deckService.getDeckType('default')).toBe('html');
    });
  });

  describe('getSlideCount', () => {
    it('returns correct slide count for PDF deck', () => {
      const count = deckService.getSlideCount('test-deck');
      expect(count).toBe(2);
    });

    it('returns correct slide count for HTML deck', () => {
      const count = deckService.getSlideCount('default');
      expect(count).toBe(3);
    });

    it('returns 0 for non-existent deck', () => {
      const count = deckService.getSlideCount('non-existent');
      expect(count).toBe(0);
    });
  });

  describe('loadSlide', () => {
    it('returns HTML with image tag for PDF deck slide', () => {
      const html = deckService.loadSlide('test-deck', 1);

      expect(html).not.toBeNull();
      expect(html).toContain('imported-slide-container');
      expect(html).toContain('/decks/test-deck/slide-01.png');
    });

    it('returns HTML content for HTML deck slide', () => {
      const html = deckService.loadSlide('default', 1);

      expect(html).not.toBeNull();
      expect(html).toContain('slide-content');
    });

    it('returns null for non-existent slide', () => {
      const html = deckService.loadSlide('test-deck', 999);
      expect(html).toBeNull();
    });
  });

  describe('deckExists', () => {
    it('returns true for existing deck', () => {
      expect(deckService.deckExists('test-deck')).toBe(true);
      expect(deckService.deckExists('default')).toBe(true);
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
    it('returns deck info for existing PDF deck', () => {
      const info = deckService.getDeckInfo('test-deck');

      expect(info).not.toBeNull();
      expect(info.name).toBe('test-deck');
      expect(info.type).toBe('pdf');
      expect(info.slideCount).toBe(2);
      expect(info.url).toBe('/deck/test-deck');
    });

    it('returns deck info for existing HTML deck', () => {
      const info = deckService.getDeckInfo('default');

      expect(info).not.toBeNull();
      expect(info.name).toBe('default');
      expect(info.type).toBe('html');
      expect(info.slideCount).toBe(3);
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
      expect(allInfo.length).toBeGreaterThanOrEqual(2);
      expect(allInfo.some(d => d.name === 'test-deck')).toBe(true);
      expect(allInfo.some(d => d.name === 'default')).toBe(true);
    });

    it('includes required fields', () => {
      const allInfo = deckService.getAllDecksInfo();

      expect(allInfo[0]).toHaveProperty('name');
      expect(allInfo[0]).toHaveProperty('type');
      expect(allInfo[0]).toHaveProperty('slideCount');
      expect(allInfo[0]).toHaveProperty('url');
    });
  });

  // 後方互換性テスト
  describe('backward compatibility', () => {
    it('getImportedDecks returns only PDF decks', () => {
      const decks = deckService.getImportedDecks();
      expect(decks).toContain('test-deck');
      expect(decks).not.toContain('default');
    });

    it('getImportedSlideCount works as alias', () => {
      const count = deckService.getImportedSlideCount('test-deck');
      expect(count).toBe(2);
    });

    it('loadImportedSlide works as alias', () => {
      const html = deckService.loadImportedSlide('test-deck', 1);
      expect(html).not.toBeNull();
    });
  });

  describe('createDeckService factory', () => {
    it('creates a DeckService instance', () => {
      const service = createDeckService(FIXTURES_DIR);
      expect(service).toBeInstanceOf(DeckService);
    });
  });
});
