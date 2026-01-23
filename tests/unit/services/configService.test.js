// tests/unit/services/configService.test.js
import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, getDefaultConfig, getRootDir } from '../../../src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

describe('ConfigService', () => {
  describe('getDefaultConfig', () => {
    it('returns default config object', () => {
      const config = getDefaultConfig();

      expect(config).toHaveProperty('title', 'Turbo Slide');
      expect(config).toHaveProperty('author', '');
      expect(config).toHaveProperty('timer', 600);
      expect(config).toHaveProperty('slidesDir', './slides');
      expect(config).toHaveProperty('imagesDir', './slides/images');
    });

    it('returns a new object each time', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('loadConfig', () => {
    it('returns defaults for non-existent config file', () => {
      const config = loadConfig('/non/existent/path/config.json');
      const defaults = getDefaultConfig();

      expect(config).toEqual(defaults);
    });

    it('loads config from real config file', () => {
      // This test uses the actual config file in the project
      const config = loadConfig();

      // Should have title from actual config
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('slidesDir');
    });
  });

  describe('getRootDir', () => {
    it('returns project root directory', () => {
      const rootDir = getRootDir();

      expect(rootDir).toContain('turbo-slide');
      expect(rootDir).not.toContain('src');
    });
  });
});
