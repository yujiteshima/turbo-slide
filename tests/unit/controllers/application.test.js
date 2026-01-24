import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

describe('Stimulus Application', () => {
  let application;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="app"></div>';
  });

  describe('initialization', () => {
    it('creates a Stimulus application instance', async () => {
      const { startApplication } = await import('../../../public/controllers/application.js');
      application = startApplication();

      expect(application).toBeInstanceOf(Application);
    });

    it('returns the same application instance when called multiple times', async () => {
      const { startApplication } = await import('../../../public/controllers/application.js');
      const app1 = startApplication();
      const app2 = startApplication();

      expect(app1).toBe(app2);
    });

    it('exports getApplication function', async () => {
      const { startApplication, getApplication } = await import('../../../public/controllers/application.js');
      startApplication();

      expect(getApplication()).toBeInstanceOf(Application);
    });
  });
});
