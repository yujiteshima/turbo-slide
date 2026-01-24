import { Controller } from '@hotwired/stimulus';

/**
 * Parse slide URL to extract deck name, mode, and slide ID
 * @param {string} url - URL path
 * @returns {Object|null} Parsed URL info or null if invalid
 */
export function parseSlideUrl(url) {
  // Deck URL pattern: /deck/:deckName/(slide|presenter|viewer)/:id
  const deckMatch = url.match(/\/deck\/([^\/]+)\/(slide|presenter|viewer)\/(\d+)/);
  if (deckMatch) {
    return { deckName: deckMatch[1], mode: deckMatch[2], slideId: parseInt(deckMatch[3], 10) };
  }

  // Simple URL pattern: /(slide|presenter|viewer)/:id
  const slideMatch = url.match(/\/(slide|presenter|viewer)\/(\d+)/);
  if (slideMatch) {
    return { deckName: null, mode: slideMatch[1], slideId: parseInt(slideMatch[2], 10) };
  }

  return null;
}

/**
 * Calculate slide progress percentage
 * @param {number} current - Current slide number
 * @param {number} total - Total number of slides
 * @returns {number} Progress percentage (0-100)
 */
export function calculateSlideProgress(current, total) {
  return (current / total) * 100;
}

/**
 * Format slide text as "current/total"
 * @param {number} current - Current slide number
 * @param {number} total - Total number of slides
 * @returns {string} Formatted slide text
 */
export function formatSlideText(current, total) {
  return `${current}/${total}`;
}

export default class ProgressController extends Controller {
  static targets = ['bar', 'text'];

  static values = {
    totalSlides: { type: Number, default: 12 },
    currentSlide: { type: Number, default: 1 },
    deckName: { type: String, default: '' },
  };

  connect() {
    this.updateFromUrl();
    this.render();
    this.setupEventListeners();
  }

  disconnect() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.boundUpdateProgress = () => setTimeout(() => this.updateProgress(), 100);
    this.boundUpdateFromUrl = () => this.updateFromUrl();

    document.addEventListener('turbo:frame-load', this.boundUpdateProgress);
    window.addEventListener('popstate', this.boundUpdateFromUrl);
    document.addEventListener('turbo:load', this.boundUpdateFromUrl);
    document.addEventListener('click', this.handleClick.bind(this));
  }

  removeEventListeners() {
    document.removeEventListener('turbo:frame-load', this.boundUpdateProgress);
    window.removeEventListener('popstate', this.boundUpdateFromUrl);
    document.removeEventListener('turbo:load', this.boundUpdateFromUrl);
  }

  handleClick(e) {
    const link = e.target.closest('a[data-turbo-frame]');
    if (link) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        setTimeout(() => {
          this.currentSlideValue = parsed.slideId;
          this.render();
        }, 50);
      }
    }
  }

  updateFromUrl() {
    const parsed = parseSlideUrl(window.location.pathname);
    if (parsed) {
      this.currentSlideValue = parsed.slideId;
      this.render();
    }
  }

  updateProgress() {
    this.updateFromUrl();
  }

  render() {
    if (this.hasTextTarget) {
      this.textTarget.textContent = formatSlideText(this.currentSlideValue, this.totalSlidesValue);
    }

    if (this.hasBarTarget) {
      const progress = calculateSlideProgress(this.currentSlideValue, this.totalSlidesValue);
      this.barTarget.style.width = `${progress}%`;
    }
  }

  // Action to update slide from external event
  update(event) {
    const { slideId } = event.detail;
    if (slideId) {
      this.currentSlideValue = slideId;
      this.render();
    }
  }
}
