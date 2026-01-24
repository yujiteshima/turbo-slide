import { describe, it, expect, vi } from 'vitest';

describe('ViewerController', () => {
  describe('buildViewerUrl', () => {
    it('builds deck viewer URL', async () => {
      const { buildViewerUrl } = await import('../../../public/controllers/viewer_controller.js');
      expect(buildViewerUrl(5, 'my-deck')).toBe('/deck/my-deck/viewer?slide=5');
    });

    it('builds simple viewer URL when no deck name', async () => {
      const { buildViewerUrl } = await import('../../../public/controllers/viewer_controller.js');
      expect(buildViewerUrl(3, null)).toBe('/viewer?slide=3');
    });

    it('builds simple viewer URL when deck name is empty', async () => {
      const { buildViewerUrl } = await import('../../../public/controllers/viewer_controller.js');
      expect(buildViewerUrl(7, '')).toBe('/viewer?slide=7');
    });
  });

  describe('ViewerController values', () => {
    it('has deckName value', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.values.deckName).toBeDefined();
    });

    it('has currentSlide value', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.values.currentSlide).toBeDefined();
    });

    it('has totalSlides value', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.values.totalSlides).toBeDefined();
    });

    it('has eventsUrl value', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.values.eventsUrl).toBeDefined();
    });

    it('has default eventsUrl of /events', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.values.eventsUrl.default).toBe('/events');
    });
  });

  describe('ViewerController targets', () => {
    it('has frame target', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.targets).toContain('frame');
    });

    it('has nav target', async () => {
      const { default: ViewerController } = await import('../../../public/controllers/viewer_controller.js');
      expect(ViewerController.targets).toContain('nav');
    });
  });
});
