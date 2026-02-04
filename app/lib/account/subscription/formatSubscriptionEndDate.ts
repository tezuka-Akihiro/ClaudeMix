/**
 * formatSubscriptionEndDate.ts
 * Purpose: Format subscription end date for Japanese display
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility 日付フォーマット
 */

/**
 * Format subscription end date in Japanese
 *
 * Converts ISO 8601 date string to Japanese format:
 * "〇月〇日まで利用可能"
 *
 * @param isoDateString - ISO 8601 date string (e.g., "2026-03-01T00:00:00.000Z")
 * @returns Formatted Japanese string (e.g., "3月1日まで利用可能")
 */
export function formatSubscriptionEndDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString)

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    const month = date.getMonth() + 1
    const day = date.getDate()

    return `${month}月${day}日まで利用可能`
  } catch {
    return '日付を取得できません'
  }
}

/**
 * Format subscription end date with year
 *
 * @param isoDateString - ISO 8601 date string
 * @returns Formatted Japanese string with year (e.g., "2026年3月1日まで利用可能")
 */
export function formatSubscriptionEndDateWithYear(isoDateString: string): string {
  try {
    const date = new Date(isoDateString)

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    return `${year}年${month}月${day}日まで利用可能`
  } catch {
    return '日付を取得できません'
  }
}

/**
 * Format next billing date
 *
 * @param isoDateString - ISO 8601 date string
 * @returns Formatted Japanese string (e.g., "次回請求日: 3月1日")
 */
export function formatNextBillingDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString)

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    const month = date.getMonth() + 1
    const day = date.getDate()

    return `次回請求日: ${month}月${day}日`
  } catch {
    return '次回請求日: 不明'
  }
}
