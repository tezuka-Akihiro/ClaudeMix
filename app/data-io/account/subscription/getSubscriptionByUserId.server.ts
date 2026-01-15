/**
 * getSubscriptionByUserId.server.ts
 * Purpose: Get user's subscription data from D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 */

import type { Subscription } from '~/specs/account/types'

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
 * Get subscription by user ID
 *
 * @param userId - User ID to query
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns Subscription object if found, null otherwise
 */
export async function getSubscriptionByUserId(
  userId: string,
  context: CloudflareLoadContext
): Promise<Subscription | null> {
  try {
    // Return null for empty user ID
    if (!userId) {
      return null
    }

    // Query subscription from D1 database using parameterized query (SQL injection protection)
    const db = context.env.DB
    const stmt = db
      .prepare('SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1')
      .bind(userId)
    const subscription = await stmt.first<Subscription>()

    if (!subscription) {
      return null
    }

    return subscription
  } catch (error) {
    console.error('Error retrieving subscription by user ID:', error)
    return null
  }
}
