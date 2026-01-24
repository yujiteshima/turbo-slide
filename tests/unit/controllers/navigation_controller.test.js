import { describe, it, expect, vi } from 'vitest';

describe('NavigationController', () => {
  describe('buildSlideUrl', () => {
    it('builds deck slide URL', async () => {
      const { buildSlideUrl } = await import('../../../public/controllers/navigation_controller.js');
      expect(buildSlideUrl(5, 'my-deck', 'slide')).toBe('/deck/my-deck/slide/5');
    });

    it('builds deck presenter URL', async () => {
      const { buildSlideUrl } = await import('../../../public/controllers/navigation_controller.js');
      expect(buildSlideUrl(3, 'demo', 'presenter')).toBe('/deck/demo/presenter/3');
    });

    it('builds simple slide URL when no deck name', async () => {
      const { buildSlideUrl } = await import('../../../public/controllers/navigation_controller.js');
      expect(buildSlideUrl(7, null, 'slide')).toBe('/slide/7');
    });

    it('builds simple presenter URL when no deck name', async () => {
      const { buildSlideUrl } = await import('../../../public/controllers/navigation_controller.js');
      expect(buildSlideUrl(2, '', 'presenter')).toBe('/presenter/2');
    });
  });

  describe('NavigationController values', () => {
    it('has mode value', async () => {
      const { default: NavigationController } = await import('../../../public/controllers/navigation_controller.js');
      expect(NavigationController.values.mode).toBeDefined();
    });

    it('has deckName value', async () => {
      const { default: NavigationController } = await import('../../../public/controllers/navigation_controller.js');
      expect(NavigationController.values.deckName).toBeDefined();
    });

    it('has default mode of slide', async () => {
      const { default: NavigationController } = await import('../../../public/controllers/navigation_controller.js');
      expect(NavigationController.values.mode.default).toBe('slide');
    });
  });
});
