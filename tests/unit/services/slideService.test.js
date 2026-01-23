// tests/unit/services/slideService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { SlideService, createSlideService } from '../../../src/services/slideService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures/slides');

describe('SlideService', () => {
  let slideService;

  beforeEach(() => {
    slideService = new SlideService(FIXTURES_DIR);
  });

  describe('getSlideCount', () => {
    it('returns correct slide count', () => {
      const count = slideService.getSlideCount();
      expect(count).toBe(3);
    });

    it('returns 0 for non-existent directory', () => {
      const service = new SlideService('/non/existent/path');
      const count = service.getSlideCount();
      expect(count).toBe(0);
    });
  });

  describe('loadSlide', () => {
    it('loads and wraps slide content with .slide div', () => {
      const content = slideService.loadSlide(1);

      expect(content).not.toBeNull();
      expect(content).toContain('<div class="slide">');
      expect(content).toContain('Test Slide 1');
    });

    it('returns null for non-existent slide', () => {
      const content = slideService.loadSlide(999);
      expect(content).toBeNull();
    });

    it('pads slide number with leading zero', () => {
      // slide-01.html should be loaded for index 1
      const content = slideService.loadSlide(1);
      expect(content).toContain('Test Slide 1');
    });
  });

  describe('slideExists', () => {
    it('returns true for existing slide', () => {
      expect(slideService.slideExists(1)).toBe(true);
      expect(slideService.slideExists(2)).toBe(true);
      expect(slideService.slideExists(3)).toBe(true);
    });

    it('returns false for non-existent slide', () => {
      expect(slideService.slideExists(0)).toBe(false);
      expect(slideService.slideExists(999)).toBe(false);
    });
  });

  describe('isValidSlideId', () => {
    it('returns true for valid slide IDs', () => {
      expect(slideService.isValidSlideId(1)).toBe(true);
      expect(slideService.isValidSlideId(2)).toBe(true);
      expect(slideService.isValidSlideId(3)).toBe(true);
    });

    it('returns false for invalid slide IDs', () => {
      expect(slideService.isValidSlideId(0)).toBe(false);
      expect(slideService.isValidSlideId(4)).toBe(false);
      expect(slideService.isValidSlideId(-1)).toBe(false);
      expect(slideService.isValidSlideId(NaN)).toBe(false);
    });
  });

  describe('createSlideService factory', () => {
    it('creates a SlideService instance', () => {
      const service = createSlideService(FIXTURES_DIR);
      expect(service).toBeInstanceOf(SlideService);
      expect(service.getSlideCount()).toBe(3);
    });
  });
});
