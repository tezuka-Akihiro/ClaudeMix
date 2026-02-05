/**
 * updateSubscriptionCancellation.server.ts
 * Purpose: Update subscription cancellation status in D1 database
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
 * Update subscription cancellation status
 *
 * Sets or clears the canceledAt timestamp based on cancel_at_period_end flag.
 * Status remains 'active' until period ends - user can still access content.
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param canceledAt - Cancellation timestamp (ISO string) or null to clear
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if update successful, false otherwise
 */
export async function updateSubscriptionCancellation(
  stripeSubscriptionId: string,
  canceledAt: string | null,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    const db = context.env.DB
    const now = new Date().toISOString()

    const result = await db
      .prepare(
        `UPDATE subscriptions
        SET canceled_at = ?, updated_at = ?
        WHERE stripe_subscription_id = ?`
      )
      .bind(canceledAt, now, stripeSubscriptionId)
      .run()

    return result.meta.changes > 0
  } catch (error) {
    console.error('Error updating subscription cancellation:', error)
    throw new Error('Failed to update subscription cancellation')
  }
}

/**
 * Update subscription status (for final cancellation or other status changes)
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param status - New status value
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if update successful, false otherwise
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    const db = context.env.DB
    const now = new Date().toISOString()

    const result = await db
      .prepare(
        `UPDATE subscriptions
        SET status = ?, updated_at = ?
        WHERE stripe_subscription_id = ?`
      )
      .bind(status, now, stripeSubscriptionId)
      .run()

    return result.meta.changes > 0
  } catch (error) {
    console.error('Error updating subscription status:', error)
    throw new Error('Failed to update subscription status')
  }
}
