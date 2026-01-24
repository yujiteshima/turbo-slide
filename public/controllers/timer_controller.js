import { Controller } from '@hotwired/stimulus';

/**
 * Format seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Calculate progress percentage
 * @param {number} remaining - Remaining time in seconds
 * @param {number} total - Total time in seconds
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(remaining, total) {
  return ((total - remaining) / total) * 100;
}

export default class TimerController extends Controller {
  static targets = ['display', 'progress'];

  static values = {
    duration: { type: Number, default: 300 },
  };

  connect() {
    this.remaining = this.durationValue;
    this.render();
    this.startTimer();
  }

  disconnect() {
    this.stopTimer();
  }

  startTimer() {
    this.intervalId = setInterval(() => {
      if (this.remaining <= 0) return;
      this.remaining -= 1;
      this.render();
    }, 1000);
  }

  stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    if (this.hasDisplayTarget) {
      this.displayTarget.textContent = formatTime(this.remaining);
    }

    if (this.hasProgressTarget) {
      const progress = calculateProgress(this.remaining, this.durationValue);
      this.progressTarget.style.width = `${progress}%`;
    }
  }
}
