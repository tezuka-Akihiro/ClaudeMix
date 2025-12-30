/**
 * コンテンツ可視範囲の判定結果
 */
export interface ContentVisibility {
  showFullContent: boolean
  visiblePercentage: number
}

/**
 * サブスクリプション状態に基づいて、記事のどの範囲を表示すべきかを判定する純粋関数
 *
 * @param hasActiveSubscription - サブスクリプションがアクティブかどうか
 * @param freeContentPercentage - 記事の公開割合（0-100%）
 * @returns コンテンツ可視範囲の判定結果
 *
 * @example
 * // 契約ユーザーは常に全文表示
 * determineContentVisibility(true, 30)
 * // => { showFullContent: true, visiblePercentage: 100 }
 *
 * @example
 * // 未契約ユーザーはfreeContentPercentageで指定された割合まで表示
 * determineContentVisibility(false, 30)
 * // => { showFullContent: false, visiblePercentage: 30 }
 */
export function determineContentVisibility(
  hasActiveSubscription: boolean,
  freeContentPercentage: number
): ContentVisibility {
  if (hasActiveSubscription) {
    return {
      showFullContent: true,
      visiblePercentage: 100,
    }
  }

  return {
    showFullContent: false,
    visiblePercentage: freeContentPercentage,
  }
}
