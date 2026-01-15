/**
 * getSubscriptionStatus.server.ts
 * Purpose: Get user's subscription status from account service
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility サービス間連携（blogサービス → accountサービス）
 */

import { getSubscriptionByUserId } from '~/data-io/account/subscription/getSubscriptionByUserId.server'

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * サブスクリプション状態の判定結果
 */
export interface SubscriptionStatus {
  hasActiveSubscription: boolean
}

/**
 * ユーザーのサブスクリプション状態を取得し、有効なサブスクリプションが存在するかを判定
 *
 * @param userId - ユーザーID（nullまたは空文字の場合は未認証として扱う）
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns サブスクリプション状態の判定結果
 *
 * @example
 * // 認証済みユーザーのサブスクリプション状態を確認
 * const status = await getSubscriptionStatus('user_123', context)
 * if (status.hasActiveSubscription) {
 *   // 全文表示
 * } else {
 *   // 部分表示 + ペイウォール
 * }
 *
 * @example
 * // 未認証ユーザー
 * const status = await getSubscriptionStatus(null, context)
 * // => { hasActiveSubscription: false }
 */
export async function getSubscriptionStatus(
  userId: string | null,
  context: CloudflareLoadContext
): Promise<SubscriptionStatus> {
  try {
    // 未認証ユーザーの場合は早期リターン
    if (!userId || userId.trim() === '') {
      return { hasActiveSubscription: false }
    }

    // accountサービスのdata-io層を呼び出してサブスクリプションデータを取得
    const subscription = await getSubscriptionByUserId(userId, context)

    // サブスクリプションが存在しない場合
    if (!subscription) {
      return { hasActiveSubscription: false }
    }

    // サブスクリプションのステータスが'active'でない場合
    if (subscription.status !== 'active') {
      return { hasActiveSubscription: false }
    }

    // current_period_endが過去の場合
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd)
    const now = new Date()
    if (currentPeriodEnd < now) {
      return { hasActiveSubscription: false }
    }

    // 全ての条件を満たす場合、有効なサブスクリプションと判定
    return { hasActiveSubscription: true }
  } catch (error) {
    // エラー発生時は安全側（記事を制限する方向）に倒す
    console.error('Error in getSubscriptionStatus:', error)
    return { hasActiveSubscription: false }
  }
}
