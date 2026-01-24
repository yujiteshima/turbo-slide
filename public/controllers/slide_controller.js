import { Controller } from '@hotwired/stimulus';

/**
 * Calculate scale factor for slide to fit container while maintaining aspect ratio
 * @param {number} containerWidth - Container width in pixels
 * @param {number} containerHeight - Container height in pixels
 * @param {number} designWidth - Design width in pixels
 * @param {number} designHeight - Design height in pixels
 * @returns {number} Scale factor
 */
export function calculateScale(containerWidth, containerHeight, designWidth, designHeight) {
  const scaleX = containerWidth / designWidth;
  const scaleY = containerHeight / designHeight;
  return Math.min(scaleX, scaleY);
}

/**
 * Apply transform to slide element
 * @param {HTMLElement} slide - The slide element
 * @param {number} scale - Scale factor
 */
export function applySlideTransform(slide, scale) {
  slide.style.transform = `translate(-50%, -50%) scale(${scale})`;
  slide.classList.add('scaled');
}

export default class SlideController extends Controller {
  static values = {
    designWidth: { type: Number, default: 960 },
    designHeight: { type: Number, default: 540 },
  };

  connect() {
    this.scaleSlide();
    this.setupEventListeners();
  }

  disconnect() {
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.boundScaleSlide = () => setTimeout(() => this.scaleSlide(), 50);
    this.boundScaleSlideDelayed = () => setTimeout(() => this.scaleSlide(), 100);

    window.addEventListener('resize', this.boundScaleSlide);
    document.addEventListener('turbo:frame-load', this.boundScaleSlide);
    document.addEventListener('fullscreenchange', this.boundScaleSlideDelayed);
  }

  removeEventListeners() {
    window.removeEventListener('resize', this.boundScaleSlide);
    document.removeEventListener('turbo:frame-load', this.boundScaleSlide);
    document.removeEventListener('fullscreenchange', this.boundScaleSlideDelayed);
  }

  scaleSlide() {
    const slide = this.element.querySelector('.slide');
    if (!slide) return;

    const containerWidth = this.element.clientWidth;
    const containerHeight = this.element.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      setTimeout(() => this.scaleSlide(), 50);
      return;
    }

    const scale = calculateScale(
      containerWidth,
      containerHeight,
      this.designWidthValue,
      this.designHeightValue
    );

    applySlideTransform(slide, scale);
  }
}
