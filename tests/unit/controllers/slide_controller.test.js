import { describe, it, expect, vi } from 'vitest';

describe('SlideController', () => {
  describe('values', () => {
    it('has default design width of 960', async () => {
      const { default: SlideController } = await import('../../../public/controllers/slide_controller.js');
      expect(SlideController.values.designWidth.default).toBe(960);
    });

    it('has default design height of 540', async () => {
      const { default: SlideController } = await import('../../../public/controllers/slide_controller.js');
      expect(SlideController.values.designHeight.default).toBe(540);
    });
  });

  describe('calculateScale', () => {
    it('calculates correct scale for 2x container', async () => {
      const { calculateScale } = await import('../../../public/controllers/slide_controller.js');

      // Container: 1920x1080, Design: 960x540 -> scale = 2
      const scale = calculateScale(1920, 1080, 960, 540);
      expect(scale).toBe(2);
    });

    it('uses minimum scale to maintain aspect ratio (width limited)', async () => {
      const { calculateScale } = await import('../../../public/controllers/slide_controller.js');

      // Container: 800x1080, Design: 960x540
      // scaleX = 800/960 = 0.833..., scaleY = 1080/540 = 2
      // min scale = 0.833...
      const scale = calculateScale(800, 1080, 960, 540);
      expect(scale).toBeCloseTo(800 / 960);
    });

    it('uses minimum scale to maintain aspect ratio (height limited)', async () => {
      const { calculateScale } = await import('../../../public/controllers/slide_controller.js');

      // Container: 1920x400, Design: 960x540
      // scaleX = 1920/960 = 2, scaleY = 400/540 = 0.74...
      // min scale = 0.74...
      const scale = calculateScale(1920, 400, 960, 540);
      expect(scale).toBeCloseTo(400 / 540);
    });

    it('handles 1:1 scale', async () => {
      const { calculateScale } = await import('../../../public/controllers/slide_controller.js');

      const scale = calculateScale(960, 540, 960, 540);
      expect(scale).toBe(1);
    });
  });

  describe('applySlideTransform', () => {
    it('applies transform style to slide element', async () => {
      const { applySlideTransform } = await import('../../../public/controllers/slide_controller.js');

      const slide = document.createElement('div');
      applySlideTransform(slide, 2);

      expect(slide.style.transform).toBe('translate(-50%, -50%) scale(2)');
    });

    it('adds scaled class to slide element', async () => {
      const { applySlideTransform } = await import('../../../public/controllers/slide_controller.js');

      const slide = document.createElement('div');
      applySlideTransform(slide, 1.5);

      expect(slide.classList.contains('scaled')).toBe(true);
    });
  });
});
