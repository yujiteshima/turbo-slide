// src/services/navigationService.js

/**
 * ナビゲーションサービス
 * ナビゲーションボタンのHTML生成を担当
 */
export class NavigationService {
  /**
   * ナビゲーションボタンを生成
   * @param {number} currentIndex - 現在のスライド番号
   * @param {number} totalSlides - 総スライド数
   * @param {string} [mode='slide'] - モード（'slide' | 'presenter'）
   * @param {string|null} [deckName=null] - デッキ名（インポートデッキの場合）
   * @returns {string} ナビゲーションボタンのHTML
   */
  renderNavButtons(currentIndex, totalSlides, mode = 'slide', deckName = null) {
    const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
    const nextClass = currentIndex === totalSlides ? 'btn disabled' : 'btn';

    let baseUrl;
    if (deckName) {
      baseUrl = mode === 'presenter' ? `/deck/${deckName}/presenter` : `/deck/${deckName}/slide`;
    } else {
      baseUrl = mode === 'presenter' ? '/presenter' : '/slide';
    }
    const turboFrame = mode === 'presenter' ? '' : 'data-turbo-frame="slide-content"';

    return `
    <a href="${baseUrl}/${currentIndex - 1}" class="${prevClass}" data-nav="prev" ${turboFrame}>
      &larr; Prev
    </a>
    <a href="${baseUrl}/${currentIndex + 1}" class="${nextClass}" data-nav="next" ${turboFrame}>
      Next &rarr;
    </a>
  `;
  }

  /**
   * スライドモードのURLを生成
   * @param {number} slideId - スライド番号
   * @param {string|null} [deckName=null] - デッキ名
   * @returns {string} URL
   */
  getSlideUrl(slideId, deckName = null) {
    if (deckName) {
      return `/deck/${deckName}/slide/${slideId}`;
    }
    return `/slide/${slideId}`;
  }

  /**
   * プレゼンターモードのURLを生成
   * @param {number} slideId - スライド番号
   * @param {string|null} [deckName=null] - デッキ名
   * @returns {string} URL
   */
  getPresenterUrl(slideId, deckName = null) {
    if (deckName) {
      return `/deck/${deckName}/presenter/${slideId}`;
    }
    return `/presenter/${slideId}`;
  }

  /**
   * ビューアーモードのURLを生成
   * @param {string|null} [deckName=null] - デッキ名
   * @param {number|null} [slideId=null] - スライド番号
   * @returns {string} URL
   */
  getViewerUrl(deckName = null, slideId = null) {
    if (deckName) {
      return `/deck/${deckName}/viewer`;
    }
    if (slideId) {
      return `/viewer?slide=${slideId}`;
    }
    return '/viewer';
  }

  /**
   * プリントURLを生成
   * @param {string|null} [deckName=null] - デッキ名
   * @returns {string} URL
   */
  getPrintUrl(deckName = null) {
    if (deckName) {
      return `/deck/${deckName}/print`;
    }
    return '/print';
  }
}

// シングルトンインスタンス
let instance = null;

/**
 * シングルトンインスタンスを取得
 * @returns {NavigationService} ナビゲーションサービスインスタンス
 */
export function getNavigationService() {
  if (!instance) {
    instance = new NavigationService();
  }
  return instance;
}

/**
 * ファクトリ関数（テスト用）
 * @returns {NavigationService} 新しいナビゲーションサービスインスタンス
 */
export function createNavigationService() {
  return new NavigationService();
}

export default {
  NavigationService,
  getNavigationService,
  createNavigationService
};
