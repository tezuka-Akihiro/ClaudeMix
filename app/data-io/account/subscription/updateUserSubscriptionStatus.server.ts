/**
 * updateUserSubscriptionStatus.server.ts
 * Purpose: Update user's subscription status in D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース更新
 */

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Update user's subscription status
 *
 * @param userId - User ID to update
 * @param subscriptionStatus - New subscription status
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns true if update successful, false otherwise
 * @throws Error if database update fails
 */
export async function updateUserSubscriptionStatus(
  userId: string,
  subscriptionStatus: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  try {
    const db = context.env.DB;
    const now = new Date().toISOString();

    const result = await db
      .prepare('UPDATE users SET subscription_status = ?, updated_at = ? WHERE id = ?')
      .bind(subscriptionStatus, now, userId)
      .run();

    return result.meta.changes > 0;
  } catch (error) {
    console.error('Error updating user subscription status:', error);
    throw new Error('Failed to update subscription status');
  }
}
