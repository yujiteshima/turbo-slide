// tests/unit/services/navigationService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationService, createNavigationService, getNavigationService } from '../../../src/services/navigationService.js';

describe('NavigationService', () => {
  let navService;

  beforeEach(() => {
    navService = createNavigationService();
  });

  describe('renderNavButtons', () => {
    it('renders navigation buttons with correct URLs', () => {
      const html = navService.renderNavButtons(2, 5, 'slide', null);

      expect(html).toContain('href="/slide/1"');
      expect(html).toContain('href="/slide/3"');
      expect(html).toContain('data-nav="prev"');
      expect(html).toContain('data-nav="next"');
    });

    it('disables prev button on first slide', () => {
      const html = navService.renderNavButtons(1, 5, 'slide', null);

      expect(html).toContain('class="btn disabled"');
      expect(html).toContain('href="/slide/0"');
    });

    it('disables next button on last slide', () => {
      const html = navService.renderNavButtons(5, 5, 'slide', null);

      expect(html).toMatch(/href="\/slide\/6"[^>]*class="btn disabled"/);
    });

    it('generates deck URLs when deckName is provided', () => {
      const html = navService.renderNavButtons(2, 5, 'slide', 'my-deck');

      expect(html).toContain('href="/deck/my-deck/slide/1"');
      expect(html).toContain('href="/deck/my-deck/slide/3"');
    });

    it('generates presenter URLs in presenter mode', () => {
      const html = navService.renderNavButtons(2, 5, 'presenter', null);

      expect(html).toContain('href="/presenter/1"');
      expect(html).toContain('href="/presenter/3"');
    });

    it('generates deck presenter URLs', () => {
      const html = navService.renderNavButtons(2, 5, 'presenter', 'my-deck');

      expect(html).toContain('href="/deck/my-deck/presenter/1"');
      expect(html).toContain('href="/deck/my-deck/presenter/3"');
    });

    it('includes turbo-frame attribute in slide mode', () => {
      const html = navService.renderNavButtons(2, 5, 'slide', null);
      expect(html).toContain('data-turbo-frame="slide-content"');
    });

    it('excludes turbo-frame attribute in presenter mode', () => {
      const html = navService.renderNavButtons(2, 5, 'presenter', null);
      expect(html).not.toContain('data-turbo-frame="slide-content"');
    });
  });

  describe('getSlideUrl', () => {
    it('returns slide URL without deck', () => {
      expect(navService.getSlideUrl(3)).toBe('/slide/3');
    });

    it('returns deck slide URL with deckName', () => {
      expect(navService.getSlideUrl(3, 'my-deck')).toBe('/deck/my-deck/slide/3');
    });
  });

  describe('getPresenterUrl', () => {
    it('returns presenter URL without deck', () => {
      expect(navService.getPresenterUrl(3)).toBe('/presenter/3');
    });

    it('returns deck presenter URL with deckName', () => {
      expect(navService.getPresenterUrl(3, 'my-deck')).toBe('/deck/my-deck/presenter/3');
    });
  });

  describe('getViewerUrl', () => {
    it('returns viewer URL without deck', () => {
      expect(navService.getViewerUrl()).toBe('/viewer');
    });

    it('returns viewer URL with slide', () => {
      expect(navService.getViewerUrl(null, 5)).toBe('/viewer?slide=5');
    });

    it('returns deck viewer URL with deckName', () => {
      expect(navService.getViewerUrl('my-deck')).toBe('/deck/my-deck/viewer');
    });
  });

  describe('getPrintUrl', () => {
    it('returns print URL without deck', () => {
      expect(navService.getPrintUrl()).toBe('/print');
    });

    it('returns deck print URL with deckName', () => {
      expect(navService.getPrintUrl('my-deck')).toBe('/deck/my-deck/print');
    });
  });

  describe('getNavigationService singleton', () => {
    it('returns same instance', () => {
      const instance1 = getNavigationService();
      const instance2 = getNavigationService();
      expect(instance1).toBe(instance2);
    });
  });
});
