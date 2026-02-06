/**
 * updateUserStripeCustomerId.server.ts
 * Purpose: Update user's Stripe customer ID in D1 database
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
 * Update user's Stripe customer ID
 *
 * @param userId - User ID to update
 * @param stripeCustomerId - Stripe customer ID to save
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if update successful, false otherwise
 */
export async function updateUserStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    const db = context.env.DB
    const now = new Date().toISOString()

    const result = await db
      .prepare('UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?')
      .bind(stripeCustomerId, now, userId)
      .run()

    return result.meta.changes > 0
  } catch (error) {
    console.error('Error updating user Stripe customer ID:', error)
    throw new Error('Failed to update Stripe customer ID')
  }
}
