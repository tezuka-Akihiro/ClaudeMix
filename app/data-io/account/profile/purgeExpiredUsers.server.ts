/**
 * purgeExpiredUsers.server.ts
 * Purpose: Physically delete users who have been in hibernation for more than 30 days
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility 冬眠期間超過ユーザーの物理削除と外部サービス連携解除
 */

import Stripe from 'stripe';

interface CloudflareEnv {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  ENABLE_STRIPE_MOCK?: string;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

interface PurgeResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Physically delete users who have been soft-deleted for more than 30 days.
 * This includes deleting Stripe Customer objects and D1 records.
 *
 * @param context - Cloudflare Load Context
 * @returns Summary of the purge operation
 */
export async function purgeExpiredUsers(
  context: CloudflareLoadContext
): Promise<PurgeResult> {
  const result: PurgeResult = {
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  try {
    const db = context.env.DB;
    
    // 1. Get users who were soft-deleted more than 30 days ago
    // Using 30 days as defined in profile-spec.yaml hibernation_days
    const expiredUsers = await db
      .prepare('SELECT id, stripe_customer_id AS stripeCustomerId FROM users WHERE deleted_at < datetime(\'now\', \'-30 days\')')
      .all<{ id: string; stripeCustomerId: string | null }>();

    if (!expiredUsers.results || expiredUsers.results.length === 0) {
      return result;
    }

    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
      httpClient: Stripe.createFetchHttpClient(),
    });

    for (const user of expiredUsers.results) {
      try {
        // 2. Delete Stripe Customer if exists
        if (user.stripeCustomerId) {
          const isMockEnabled = context.env.ENABLE_STRIPE_MOCK === 'true';
          const isPlaceholderKey = !context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET_KEY === 'sk_test_xxxxxxxxxxxxxxxxxxxx';
          
          if (!(process.env.NODE_ENV !== 'production' && (isMockEnabled || isPlaceholderKey))) {
            try {
              await stripe.customers.del(user.stripeCustomerId);
            } catch (stripeError: any) {
              // Even if Stripe deletion fails, we might want to log it and decide whether to continue
              // According to the proposal: "失敗時はそのユーザーをスキップしてログ記録"
              console.error(`Stripe Customer deletion failed for user ${user.id}:`, stripeError);
              throw stripeError;
            }
          }
        }

        // 3. Delete from subscriptions table (D1)
        // Note: initial_schema.sql has ON DELETE CASCADE for subscriptions(user_id) -> users(id),
        // but let's be explicit if needed, or rely on CASCADE. 
        // The proposal says: "D1: DELETE FROM subscriptions WHERE user_id = ?"
        await db.prepare('DELETE FROM subscriptions WHERE user_id = ?').bind(user.id).run();

        // 4. Delete from users table (D1)
        await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

        result.successCount++;
      } catch (error: any) {
        result.failureCount++;
        result.errors.push({
          userId: user.id,
          error: error.message || 'Unknown error during purge',
        });
        console.error(`Failed to purge user ${user.id}:`, error);
      }
    }
  } catch (error: any) {
    console.error('Critical error during purgeExpiredUsers execution:', error);
    // This is a global failure (e.g. DB connection)
    throw error;
  }

  return result;
}
