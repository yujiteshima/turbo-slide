import { describe, it, expect, vi } from 'vitest';

describe('ProgressController', () => {
  describe('parseSlideUrl', () => {
    it('parses deck slide URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      const result = parseSlideUrl('/deck/my-deck/slide/5');
      expect(result).toEqual({ deckName: 'my-deck', mode: 'slide', slideId: 5 });
    });

    it('parses deck presenter URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      const result = parseSlideUrl('/deck/demo/presenter/3');
      expect(result).toEqual({ deckName: 'demo', mode: 'presenter', slideId: 3 });
    });

    it('parses deck viewer URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      const result = parseSlideUrl('/deck/test/viewer/1');
      expect(result).toEqual({ deckName: 'test', mode: 'viewer', slideId: 1 });
    });

    it('parses simple slide URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      const result = parseSlideUrl('/slide/7');
      expect(result).toEqual({ deckName: null, mode: 'slide', slideId: 7 });
    });

    it('parses simple presenter URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      const result = parseSlideUrl('/presenter/2');
      expect(result).toEqual({ deckName: null, mode: 'presenter', slideId: 2 });
    });

    it('returns null for invalid URL', async () => {
      const { parseSlideUrl } = await import('../../../public/controllers/progress_controller.js');
      expect(parseSlideUrl('/home')).toBeNull();
      expect(parseSlideUrl('/api/decks')).toBeNull();
    });
  });

  describe('calculateSlideProgress', () => {
    it('calculates progress for first slide', async () => {
      const { calculateSlideProgress } = await import('../../../public/controllers/progress_controller.js');
      expect(calculateSlideProgress(1, 10)).toBeCloseTo(10);
    });

    it('calculates progress for last slide', async () => {
      const { calculateSlideProgress } = await import('../../../public/controllers/progress_controller.js');
      expect(calculateSlideProgress(10, 10)).toBe(100);
    });

    it('calculates progress for middle slide', async () => {
      const { calculateSlideProgress } = await import('../../../public/controllers/progress_controller.js');
      expect(calculateSlideProgress(5, 10)).toBe(50);
    });
  });

  describe('formatSlideText', () => {
    it('formats slide text as current/total', async () => {
      const { formatSlideText } = await import('../../../public/controllers/progress_controller.js');
      expect(formatSlideText(3, 12)).toBe('3/12');
    });
  });

  describe('ProgressController values', () => {
    it('has default totalSlides of 12', async () => {
      const { default: ProgressController } = await import('../../../public/controllers/progress_controller.js');
      expect(ProgressController.values.totalSlides.default).toBe(12);
    });

    it('has default currentSlide of 1', async () => {
      const { default: ProgressController } = await import('../../../public/controllers/progress_controller.js');
      expect(ProgressController.values.currentSlide.default).toBe(1);
    });
  });
});
