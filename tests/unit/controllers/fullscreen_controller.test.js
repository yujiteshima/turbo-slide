import { describe, it, expect, vi } from 'vitest';

describe('FullscreenController', () => {
  describe('FullscreenController class', () => {
    it('exports FullscreenController as default', async () => {
      const { default: FullscreenController } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(FullscreenController).toBeDefined();
    });

    it('has toggle action', async () => {
      const { default: FullscreenController } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(FullscreenController.prototype.toggle).toBeDefined();
    });

    it('has button target', async () => {
      const { default: FullscreenController } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(FullscreenController.targets).toContain('button');
    });
  });

  describe('getFullscreenIcon', () => {
    it('returns exit icon when fullscreen', async () => {
      const { getFullscreenIcon } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(getFullscreenIcon(true)).toBe('⛶');
    });

    it('returns enter icon when not fullscreen', async () => {
      const { getFullscreenIcon } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(getFullscreenIcon(false)).toBe('⛶');
    });
  });

  describe('getFullscreenTitle', () => {
    it('returns exit title when fullscreen', async () => {
      const { getFullscreenTitle } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(getFullscreenTitle(true)).toBe('フルスクリーン解除');
    });

    it('returns enter title when not fullscreen', async () => {
      const { getFullscreenTitle } = await import('../../../public/controllers/fullscreen_controller.js');
      expect(getFullscreenTitle(false)).toBe('フルスクリーン');
    });
  });
});
