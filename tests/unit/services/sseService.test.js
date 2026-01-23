// tests/unit/services/sseService.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SseService, createSseService, getSseService } from '../../../src/services/sseService.js';

describe('SseService', () => {
  let sseService;

  beforeEach(() => {
    sseService = createSseService();
  });

  describe('getCurrentSlide', () => {
    it('returns default slide 1', () => {
      expect(sseService.getCurrentSlide()).toBe(1);
    });
  });

  describe('setCurrentSlide', () => {
    it('sets current slide', () => {
      sseService.setCurrentSlide(5);
      expect(sseService.getCurrentSlide()).toBe(5);
    });
  });

  describe('getClientCount', () => {
    it('returns 0 initially', () => {
      expect(sseService.getClientCount()).toBe(0);
    });
  });

  describe('addClient', () => {
    it('adds client and sends current slide', () => {
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      sseService.setCurrentSlide(3);
      const cleanup = sseService.addClient(mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.write).toHaveBeenCalledWith('data: 3\n\n');
      expect(sseService.getClientCount()).toBe(1);
      expect(typeof cleanup).toBe('function');
    });

    it('returns cleanup function that removes client', () => {
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      const cleanup = sseService.addClient(mockRes);
      expect(sseService.getClientCount()).toBe(1);

      cleanup();
      expect(sseService.getClientCount()).toBe(0);
    });
  });

  describe('removeClient', () => {
    it('removes client from list', () => {
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      sseService.addClient(mockRes);
      expect(sseService.getClientCount()).toBe(1);

      sseService.removeClient(mockRes);
      expect(sseService.getClientCount()).toBe(0);
    });

    it('does nothing for non-existent client', () => {
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      sseService.removeClient(mockRes);
      expect(sseService.getClientCount()).toBe(0);
    });
  });

  describe('broadcastSlideChange', () => {
    it('updates current slide and broadcasts to all clients', () => {
      const mockRes1 = {
        setHeader: vi.fn(),
        write: vi.fn()
      };
      const mockRes2 = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      sseService.addClient(mockRes1);
      sseService.addClient(mockRes2);

      // Clear initial write calls
      mockRes1.write.mockClear();
      mockRes2.write.mockClear();

      sseService.broadcastSlideChange(7);

      expect(sseService.getCurrentSlide()).toBe(7);
      expect(mockRes1.write).toHaveBeenCalledWith('data: 7\n\n');
      expect(mockRes2.write).toHaveBeenCalledWith('data: 7\n\n');
    });

    it('handles write errors gracefully', () => {
      // First add a client that works normally
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn()
      };

      sseService.addClient(mockRes);

      // Then make write throw an error for subsequent calls
      mockRes.write.mockImplementation(() => {
        throw new Error('Connection closed');
      });

      // Should not throw when broadcasting
      expect(() => sseService.broadcastSlideChange(5)).not.toThrow();
    });
  });

  describe('closeAllConnections', () => {
    it('closes all client connections', () => {
      const mockRes1 = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn()
      };
      const mockRes2 = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn()
      };

      sseService.addClient(mockRes1);
      sseService.addClient(mockRes2);
      expect(sseService.getClientCount()).toBe(2);

      sseService.closeAllConnections();

      expect(mockRes1.end).toHaveBeenCalled();
      expect(mockRes2.end).toHaveBeenCalled();
      expect(sseService.getClientCount()).toBe(0);
    });
  });

  describe('getSseService singleton', () => {
    it('returns same instance', () => {
      const instance1 = getSseService();
      const instance2 = getSseService();
      expect(instance1).toBe(instance2);
    });
  });
});
