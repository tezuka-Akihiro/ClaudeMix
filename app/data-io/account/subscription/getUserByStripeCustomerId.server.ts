/**
 * getUserByStripeCustomerId.server.ts
 * Purpose: Get user by Stripe customer ID from D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 */

interface CloudflareEnv {
  DB: D1Database
}

interface CloudflareLoadContext {
  env: CloudflareEnv
}

/**
 * User type for database query result
 */
export interface User {
  id: string
  email: string
  subscriptionStatus: string
  stripeCustomerId: string | null
  oauthProvider: string | null
  googleId: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Get user by Stripe customer ID
 *
 * Used in webhook processing to identify the user from Stripe events
 * that only contain customer ID (e.g., invoice.paid).
 *
 * @param stripeCustomerId - Stripe customer ID to search
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns User object if found, null otherwise
 */
export async function getUserByStripeCustomerId(
  stripeCustomerId: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    if (!stripeCustomerId) {
      return null
    }

    const db = context.env.DB
    const user = await db
      .prepare(`
        SELECT
          id,
          email,
          subscription_status AS subscriptionStatus,
          stripe_customer_id AS stripeCustomerId,
          oauth_provider AS oauthProvider,
          google_id AS googleId,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM users
        WHERE stripe_customer_id = ?
        LIMIT 1
      `)
      .bind(stripeCustomerId)
      .first<User>()

    return user || null
  } catch (error) {
    console.error('Error getting user by Stripe customer ID:', error)
    return null
  }
}
