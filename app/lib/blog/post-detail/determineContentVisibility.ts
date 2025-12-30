import type { Heading } from '~/specs/blog/types'

/**
 * コンテンツ可視範囲の判定結果
 */
export interface ContentVisibility {
  showFullContent: boolean
  cutoffHeadingId: string | null
}

/**
 * サブスクリプション状態と指定見出しに基づいて、記事のどの範囲を表示すべきかを判定する純粋関数
 *
 * @param hasActiveSubscription - サブスクリプションがアクティブかどうか
 * @param freeContentHeading - 記事の公開範囲見出し（見出しテキスト）
 * @param headings - 見出し情報配列
 * @returns コンテンツ可視範囲の判定結果
 *
 * @example
 * // 契約ユーザーは常に全文表示
 * determineContentVisibility(true, '## 概要', headings)
 * // => { showFullContent: true, cutoffHeadingId: null }
 *
 * @example
 * // 未契約ユーザーは指定見出しまで表示
 * determineContentVisibility(false, '概要', [{ level: 2, text: '概要', id: 'overview' }])
 * // => { showFullContent: false, cutoffHeadingId: 'overview' }
 *
 * @example
 * // 見出しが見つからない場合は全文表示
 * determineContentVisibility(false, '存在しない見出し', headings)
 * // => { showFullContent: true, cutoffHeadingId: null }
 */
export function determineContentVisibility(
  hasActiveSubscription: boolean,
  freeContentHeading: string | null,
  headings: Heading[]
): ContentVisibility {
  // 契約ユーザーは常に全文表示
  if (hasActiveSubscription) {
    return {
      showFullContent: true,
      cutoffHeadingId: null,
    }
  }

  // freeContentHeadingが指定されていない場合は全文公開
  if (!freeContentHeading) {
    return {
      showFullContent: true,
      cutoffHeadingId: null,
    }
  }

  // 見出し配列から該当見出しを検索
  const matchedHeading = headings.find((heading) => heading.text === freeContentHeading)

  // 見出しが見つからない場合は全文公開（フォールバック）
  if (!matchedHeading) {
    return {
      showFullContent: true,
      cutoffHeadingId: null,
    }
  }

  // 見出しが見つかった場合、その見出しIDを返す
  return {
    showFullContent: false,
    cutoffHeadingId: matchedHeading.id,
  }
}
