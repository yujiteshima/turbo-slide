import { describe, it, expect, vi } from 'vitest';

describe('PresenterController', () => {
  describe('buildApiUrl', () => {
    it('builds deck API URL', async () => {
      const { buildApiUrl } = await import('../../../public/controllers/presenter_controller.js');
      expect(buildApiUrl(5, 'my-deck')).toBe('/api/deck/my-deck/slide/5');
    });

    it('builds simple API URL when no deck name', async () => {
      const { buildApiUrl } = await import('../../../public/controllers/presenter_controller.js');
      expect(buildApiUrl(3, null)).toBe('/api/slide/3');
    });

    it('builds simple API URL when deck name is empty', async () => {
      const { buildApiUrl } = await import('../../../public/controllers/presenter_controller.js');
      expect(buildApiUrl(7, '')).toBe('/api/slide/7');
    });
  });

  describe('PresenterController values', () => {
    it('has deckName value', async () => {
      const { default: PresenterController } = await import('../../../public/controllers/presenter_controller.js');
      expect(PresenterController.values.deckName).toBeDefined();
    });

    it('has currentSlide value', async () => {
      const { default: PresenterController } = await import('../../../public/controllers/presenter_controller.js');
      expect(PresenterController.values.currentSlide).toBeDefined();
    });

    it('has totalSlides value', async () => {
      const { default: PresenterController } = await import('../../../public/controllers/presenter_controller.js');
      expect(PresenterController.values.totalSlides).toBeDefined();
    });

    it('has default currentSlide of 1', async () => {
      const { default: PresenterController } = await import('../../../public/controllers/presenter_controller.js');
      expect(PresenterController.values.currentSlide.default).toBe(1);
    });
  });

  describe('PresenterController targets', () => {
    it('has frame target', async () => {
      const { default: PresenterController } = await import('../../../public/controllers/presenter_controller.js');
      expect(PresenterController.targets).toContain('frame');
    });
  });
});
