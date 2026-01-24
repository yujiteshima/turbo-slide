import { Controller } from '@hotwired/stimulus';
import { parseSlideUrl, calculateSlideProgress, formatSlideText } from './progress_controller.js';
import { buildSlideUrl } from './navigation_controller.js';

/**
 * Build API URL for slide change
 * @param {number} slideId - Slide number
 * @param {string|null} deckName - Deck name or null/empty for default
 * @returns {string} API URL
 */
export function buildApiUrl(slideId, deckName) {
  if (deckName) {
    return `/api/deck/${deckName}/slide/${slideId}`;
  }
  return `/api/slide/${slideId}`;
}

export default class PresenterController extends Controller {
  static targets = ['frame', 'progressBar', 'progressText'];

  static values = {
    deckName: { type: String, default: '' },
    currentSlide: { type: Number, default: 1 },
    totalSlides: { type: Number, default: 12 },
  };

  connect() {
    this.updateProgress();
    this.setupEventListeners();
  }

  disconnect() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleNavClick = this.handleNavClick.bind(this);

    document.addEventListener('keydown', this.boundHandleKeydown);
    document.addEventListener('click', this.boundHandleNavClick);
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    document.removeEventListener('click', this.boundHandleNavClick);
  }

  handleKeydown(e) {
    if (e.key === 'ArrowRight') {
      const nextLink = document.querySelector('a[data-nav="next"]');
      if (nextLink && !nextLink.classList.contains('disabled')) {
        const parsed = parseSlideUrl(nextLink.href);
        if (parsed) {
          e.preventDefault();
          this.changeSlide(parsed.slideId);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const prevLink = document.querySelector('a[data-nav="prev"]');
      if (prevLink && !prevLink.classList.contains('disabled')) {
        const parsed = parseSlideUrl(prevLink.href);
        if (parsed) {
          e.preventDefault();
          this.changeSlide(parsed.slideId);
        }
      }
    }
  }

  handleNavClick(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        e.preventDefault();
        this.changeSlide(parsed.slideId);
      }
    }
  }

  async changeSlide(slideId) {
    try {
      const apiUrl = buildApiUrl(slideId, this.deckNameValue);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.currentSlideValue = slideId;
        this.updateProgress();

        const url = buildSlideUrl(slideId, this.deckNameValue, 'presenter');
        window.history.pushState({}, '', url);

        if (this.hasFrameTarget) {
          this.frameTarget.src = url;
          this.frameTarget.reload();
        }
      }
    } catch (error) {
      // Silently ignore errors
    }
  }

  updateProgress() {
    if (this.hasProgressTextTarget) {
      this.progressTextTarget.textContent = formatSlideText(this.currentSlideValue, this.totalSlidesValue);
    }

    if (this.hasProgressBarTarget) {
      const progress = calculateSlideProgress(this.currentSlideValue, this.totalSlidesValue);
      this.progressBarTarget.style.width = `${progress}%`;
    }
  }
}
