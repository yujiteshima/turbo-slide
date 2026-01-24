import { Controller } from '@hotwired/stimulus';
import { parseSlideUrl } from './progress_controller.js';

/**
 * Build slide URL based on deck name and mode
 * @param {number} slideId - Slide number
 * @param {string|null} deckName - Deck name or null/empty for default
 * @param {string} mode - Mode (slide, presenter, viewer)
 * @returns {string} URL path
 */
export function buildSlideUrl(slideId, deckName, mode) {
  if (deckName) {
    return `/deck/${deckName}/${mode}/${slideId}`;
  }
  return `/${mode}/${slideId}`;
}

export default class NavigationController extends Controller {
  static values = {
    mode: { type: String, default: 'slide' },
    deckName: { type: String, default: '' },
  };

  connect() {
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
      this.navigateNext(e);
    } else if (e.key === 'ArrowLeft') {
      this.navigatePrev(e);
    }
  }

  handleNavClick(e) {
    const link = e.target.closest('a[data-nav]');
    if (link && !link.classList.contains('disabled')) {
      const parsed = parseSlideUrl(link.href);
      if (parsed) {
        const url = buildSlideUrl(parsed.slideId, this.deckNameValue, this.modeValue);
        window.history.pushState({}, '', url);
      }
    }
  }

  navigateNext(e) {
    const nextLink = document.querySelector('a[data-nav="next"]');
    if (nextLink && !nextLink.classList.contains('disabled')) {
      const parsed = parseSlideUrl(nextLink.href);
      if (parsed) {
        e.preventDefault();
        const url = buildSlideUrl(parsed.slideId, this.deckNameValue, this.modeValue);
        window.history.pushState({}, '', url);
        nextLink.click();
      }
    }
  }

  navigatePrev(e) {
    const prevLink = document.querySelector('a[data-nav="prev"]');
    if (prevLink && !prevLink.classList.contains('disabled')) {
      const parsed = parseSlideUrl(prevLink.href);
      if (parsed) {
        e.preventDefault();
        const url = buildSlideUrl(parsed.slideId, this.deckNameValue, this.modeValue);
        window.history.pushState({}, '', url);
        prevLink.click();
      }
    }
  }
}
