/**
 * updateSubscriptionPeriod.server.ts
 * Purpose: Update subscription period dates in D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース更新
 */

interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * Update subscription period end date
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param currentPeriodStart - New period start date (ISO string)
 * @param currentPeriodEnd - New period end date (ISO string)
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if update successful, false otherwise
 */
export async function updateSubscriptionPeriod(
  stripeSubscriptionId: string,
  currentPeriodStart: string,
  currentPeriodEnd: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    const db = context.env.DB
    const now = new Date().toISOString()

    const result = await db
      .prepare(
        `UPDATE subscriptions
        SET current_period_start = ?, current_period_end = ?, updated_at = ?
        WHERE stripe_subscription_id = ?`
      )
      .bind(currentPeriodStart, currentPeriodEnd, now, stripeSubscriptionId)
      .run()

    return result.meta.changes > 0
  } catch (error) {
    console.error('Error updating subscription period:', error)
    throw new Error('Failed to update subscription period')
  }
}
