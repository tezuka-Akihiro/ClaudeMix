/**
 * getSubscriptionByStripeId.server.ts
 * Purpose: Get subscription by Stripe subscription ID from D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 */

import type { Subscription } from '~/specs/account/types'

interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Get subscription by Stripe subscription ID
 *
 * Used in webhook processing to find the subscription record
 * from Stripe events that contain subscription ID.
 *
 * @param stripeSubscriptionId - Stripe subscription ID to search
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns Subscription object if found, null otherwise
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
  context: CloudflareLoadContext
): Promise<Subscription | null> {
  try {
    if (!stripeSubscriptionId) {
      return null
    }

    const db = context.env.DB
    const subscription = await db
      .prepare('SELECT * FROM subscriptions WHERE stripeSubscriptionId = ? LIMIT 1')
      .bind(stripeSubscriptionId)
      .first<Subscription>()

    return subscription || null
  } catch (error) {
    console.error('Error getting subscription by Stripe ID:', error)
    return null
  }
}
