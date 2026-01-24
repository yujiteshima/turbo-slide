import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('TimerController', () => {
  describe('formatTime', () => {
    it('formats 300 seconds as 05:00', async () => {
      const { formatTime } = await import('../../../public/controllers/timer_controller.js');
      expect(formatTime(300)).toBe('05:00');
    });

    it('formats 60 seconds as 01:00', async () => {
      const { formatTime } = await import('../../../public/controllers/timer_controller.js');
      expect(formatTime(60)).toBe('01:00');
    });

    it('formats 0 seconds as 00:00', async () => {
      const { formatTime } = await import('../../../public/controllers/timer_controller.js');
      expect(formatTime(0)).toBe('00:00');
    });

    it('formats 65 seconds as 01:05', async () => {
      const { formatTime } = await import('../../../public/controllers/timer_controller.js');
      expect(formatTime(65)).toBe('01:05');
    });

    it('formats 599 seconds as 09:59', async () => {
      const { formatTime } = await import('../../../public/controllers/timer_controller.js');
      expect(formatTime(599)).toBe('09:59');
    });
  });

  describe('calculateProgress', () => {
    it('calculates 0% at start', async () => {
      const { calculateProgress } = await import('../../../public/controllers/timer_controller.js');
      expect(calculateProgress(300, 300)).toBe(0);
    });

    it('calculates 50% at halfway', async () => {
      const { calculateProgress } = await import('../../../public/controllers/timer_controller.js');
      expect(calculateProgress(150, 300)).toBe(50);
    });

    it('calculates 100% at end', async () => {
      const { calculateProgress } = await import('../../../public/controllers/timer_controller.js');
      expect(calculateProgress(0, 300)).toBe(100);
    });
  });

  describe('TimerController values', () => {
    it('has default duration of 300 seconds (5 minutes)', async () => {
      const { default: TimerController } = await import('../../../public/controllers/timer_controller.js');
      expect(TimerController.values.duration.default).toBe(300);
    });
  });
});
