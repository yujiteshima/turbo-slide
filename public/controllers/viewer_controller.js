import { Controller } from '@hotwired/stimulus';
import { calculateSlideProgress, formatSlideText } from './progress_controller.js';

/**
 * Build viewer URL with slide query parameter
 * @param {number} slideId - Slide number
 * @param {string|null} deckName - Deck name or null/empty for default
 * @returns {string} Viewer URL
 */
export function buildViewerUrl(slideId, deckName) {
  if (deckName) {
    return `/deck/${deckName}/viewer?slide=${slideId}`;
  }
  return `/viewer?slide=${slideId}`;
}

export default class ViewerController extends Controller {
  static targets = ['frame', 'nav', 'progressBar', 'progressText'];

  static values = {
    deckName: { type: String, default: '' },
    currentSlide: { type: Number, default: 1 },
    totalSlides: { type: Number, default: 12 },
    eventsUrl: { type: String, default: '/events' },
  };

  connect() {
    this.hideNav();
    this.updateProgress();
    this.setupSSE();
  }

  disconnect() {
    this.closeSSE();
  }

  hideNav() {
    if (this.hasNavTarget) {
      this.navTarget.style.display = 'none';
    }
  }

  setupSSE() {
    this.eventSource = new EventSource(this.eventsUrlValue);

    this.eventSource.onmessage = (event) => {
      const slideId = parseInt(event.data, 10);

      if (slideId !== this.currentSlideValue) {
        this.currentSlideValue = slideId;
        this.updateProgress();
        this.loadSlide(slideId);
      }
    };

    this.eventSource.onerror = () => {
      // Silently ignore errors
    };
  }

  closeSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  loadSlide(slideId) {
    const url = buildViewerUrl(slideId, this.deckNameValue);
    window.history.pushState({}, '', url);

    if (this.hasFrameTarget) {
      this.frameTarget.src = url;
      this.frameTarget.reload();
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
