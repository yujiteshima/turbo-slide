import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the number of slides by counting slide-XX.html files
 */
function getSlideCount(): number {
  const slidesDir = path.join(__dirname, '..', 'slides');
  if (!fs.existsSync(slidesDir)) {
    return 0;
  }
  const files = fs.readdirSync(slidesDir);
  return files.filter(f => f.match(/^slide-\d+\.html$/)).length;
}

const SLIDE_COUNT = getSlideCount();

test.describe('Slide Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  // Test each slide for visual consistency
  for (let i = 1; i <= SLIDE_COUNT; i++) {
    const slideId = String(i).padStart(2, '0');

    test(`slide-${slideId} visual snapshot`, async ({ page }) => {
      await page.goto(`/slide/${i}`);

      // Wait for slide content to load
      await page.waitForSelector('.slide');
      await page.waitForLoadState('networkidle');

      // Take screenshot of the slide
      const slide = page.locator('.slide');
      await expect(slide).toHaveScreenshot(`slide-${slideId}.png`);
    });
  }
});

test.describe('Slide Layout Tests', () => {
  test('slide maintains 16:9 aspect ratio', async ({ page }) => {
    await page.goto('/slide/1');
    await page.waitForSelector('.slide');

    const slide = page.locator('.slide');
    const box = await slide.boundingBox();

    if (box) {
      const aspectRatio = box.width / box.height;
      // 16:9 = 1.777...
      expect(aspectRatio).toBeCloseTo(16 / 9, 1);
    }
  });

  test('slide content does not overflow', async ({ page }) => {
    await page.goto('/slide/1');
    await page.waitForSelector('.slide');

    const slide = page.locator('.slide');

    // Check for overflow
    const hasOverflow = await slide.evaluate((el) => {
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });

    expect(hasOverflow).toBe(false);
  });

  test('navigation works with keyboard', async ({ page }) => {
    await page.goto('/slide/1');
    await page.waitForSelector('.slide');

    // Press right arrow to go to next slide
    await page.keyboard.press('ArrowRight');
    await page.waitForURL('**/slide/2');

    expect(page.url()).toContain('/slide/2');

    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForURL('**/slide/1');

    expect(page.url()).toContain('/slide/1');
  });
});

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'desktop-1920', width: 1920, height: 1080 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'laptop-1280', width: 1280, height: 720 },
    { name: 'tablet-landscape', width: 1194, height: 834 },
  ];

  for (const viewport of viewports) {
    test(`slide renders correctly at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/slide/1');
      await page.waitForSelector('.slide');

      // Check slide is visible and has content
      const slide = page.locator('.slide');
      await expect(slide).toBeVisible();

      // Check aspect ratio is maintained
      const box = await slide.boundingBox();
      if (box) {
        const aspectRatio = box.width / box.height;
        expect(aspectRatio).toBeCloseTo(16 / 9, 1);
      }
    });
  }
});

test.describe('Container Query Typography Tests', () => {
  test('scalable font classes are applied', async ({ page }) => {
    await page.goto('/slide/1');
    await page.waitForSelector('.slide');

    // Check if container query is working
    const slide = page.locator('.slide');
    const containerType = await slide.evaluate((el) => {
      return window.getComputedStyle(el).containerType;
    });

    expect(containerType).toBe('size');
  });

  test('font size scales with container', async ({ page }) => {
    // Test at different viewport sizes
    const sizes = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
    ];

    const fontSizes: number[] = [];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/slide/1');
      await page.waitForSelector('.slide');

      // Get computed font size of title element (if using scalable classes)
      const fontSize = await page.evaluate(() => {
        const title = document.querySelector('.slide-title-text, .slide-h1, h1');
        if (title) {
          return parseFloat(window.getComputedStyle(title).fontSize);
        }
        return 0;
      });

      fontSizes.push(fontSize);
    }

    // Font size should be larger at larger viewport
    if (fontSizes[0] > 0 && fontSizes[1] > 0) {
      expect(fontSizes[0]).toBeGreaterThan(fontSizes[1]);
    }
  });
});
