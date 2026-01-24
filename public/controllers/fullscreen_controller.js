import { Controller } from '@hotwired/stimulus';

/**
 * Get fullscreen icon based on state
 * @param {boolean} isFullscreen - Whether in fullscreen mode
 * @returns {string} Icon character
 */
export function getFullscreenIcon(isFullscreen) {
  return '⛶';
}

/**
 * Get fullscreen button title based on state
 * @param {boolean} isFullscreen - Whether in fullscreen mode
 * @returns {string} Title text
 */
export function getFullscreenTitle(isFullscreen) {
  return isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン';
}

export default class FullscreenController extends Controller {
  static targets = ['button'];

  connect() {
    this.setupEventListeners();
  }

  disconnect() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.boundUpdateButton = this.updateButton.bind(this);
    document.addEventListener('fullscreenchange', this.boundUpdateButton);
  }

  removeEventListeners() {
    document.removeEventListener('fullscreenchange', this.boundUpdateButton);
  }

  toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('フルスクリーン化に失敗:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  updateButton() {
    if (this.hasButtonTarget) {
      const isFullscreen = !!document.fullscreenElement;
      this.buttonTarget.textContent = getFullscreenIcon(isFullscreen);
      this.buttonTarget.title = getFullscreenTitle(isFullscreen);
    }
  }
}
