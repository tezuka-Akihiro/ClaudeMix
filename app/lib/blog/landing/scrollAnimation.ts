// scrollAnimation - Logic (lib層)
// スクロール位置計算とアニメーション発火判定を行う純粋関数

/**
 * 要素がビューポート内の指定された閾値を超えたかを判定する
 *
 * @param elementTop - 要素の上端位置（viewport topからのピクセル数）
 * @param elementBottom - 要素の下端位置（viewport topからのピクセル数）
 * @param viewportHeight - ビューポートの高さ（ピクセル）
 * @param threshold - 閾値（0.0-1.0の範囲、例: 0.7 = 70%）
 * @returns 要素が閾値を超えてビューポート内に入っている場合true
 *
 * @example
 * shouldTriggerAnimation(100, 200, 1000, 0.7) // => true (要素がビューポートの70%地点を超えている)
 * shouldTriggerAnimation(800, 900, 1000, 0.7) // => false (要素がまだ70%地点に到達していない)
 */
export function shouldTriggerAnimation(
  elementTop: number,
  elementBottom: number,
  viewportHeight: number,
  threshold: number
): boolean {
  // 閾値の妥当性確認
  if (threshold < 0 || threshold > 1) {
    throw new Error('Threshold must be between 0 and 1');
  }

  // ビューポート内の閾値位置を計算（例: 70% = viewportHeight * 0.7）
  const thresholdPosition = viewportHeight * threshold;

  // 要素の下端が閾値位置を超えているか判定
  // elementTopが負の値（画面上部より上）でも、elementBottomが閾値を超えていればtrue
  return elementBottom > thresholdPosition;
}

/**
 * 要素がビューポート内に完全に表示されているかを判定する
 *
 * @param elementTop - 要素の上端位置（viewport topからのピクセル数）
 * @param elementBottom - 要素の下端位置（viewport topからのピクセル数）
 * @param viewportHeight - ビューポートの高さ（ピクセル）
 * @returns 要素が完全にビューポート内に表示されている場合true
 *
 * @example
 * isFullyVisible(100, 200, 1000) // => true
 * isFullyVisible(-50, 200, 1000) // => false (上端が見えていない)
 * isFullyVisible(100, 1100, 1000) // => false (下端が見えていない)
 */
export function isFullyVisible(
  elementTop: number,
  elementBottom: number,
  viewportHeight: number
): boolean {
  return elementTop >= 0 && elementBottom <= viewportHeight;
}

/**
 * 要素がビューポート内に部分的にでも表示されているかを判定する
 *
 * @param elementTop - 要素の上端位置（viewport topからのピクセル数）
 * @param elementBottom - 要素の下端位置（viewport topからのピクセル数）
 * @param viewportHeight - ビューポートの高さ（ピクセル）
 * @returns 要素が部分的にでもビューポート内に表示されている場合true
 *
 * @example
 * isPartiallyVisible(-50, 100, 1000) // => true (一部が見えている)
 * isPartiallyVisible(100, 200, 1000) // => true (完全に見えている)
 * isPartiallyVisible(-200, -50, 1000) // => false (完全に上にある)
 * isPartiallyVisible(1100, 1200, 1000) // => false (完全に下にある)
 */
export function isPartiallyVisible(
  elementTop: number,
  elementBottom: number,
  viewportHeight: number
): boolean {
  return elementBottom > 0 && elementTop < viewportHeight;
}

/**
 * スクロール進捗度を計算する（0.0-1.0の範囲）
 *
 * @param scrollTop - 現在のスクロール位置（ピクセル）
 * @param scrollHeight - ドキュメント全体の高さ（ピクセル）
 * @param viewportHeight - ビューポートの高さ（ピクセル）
 * @returns スクロール進捗度（0.0 = 最上部、1.0 = 最下部）
 *
 * @example
 * calculateScrollProgress(0, 2000, 1000) // => 0.0 (最上部)
 * calculateScrollProgress(500, 2000, 1000) // => 0.5 (中間)
 * calculateScrollProgress(1000, 2000, 1000) // => 1.0 (最下部)
 */
export function calculateScrollProgress(
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number
): number {
  // スクロール可能な最大距離
  const maxScroll = scrollHeight - viewportHeight;

  // 最大距離が0以下の場合（コンテンツが短い）、進捗度は1.0
  if (maxScroll <= 0) {
    return 1.0;
  }

  // 進捗度を計算（0.0-1.0の範囲にクランプ）
  const progress = scrollTop / maxScroll;
  return Math.max(0, Math.min(1, progress));
}
