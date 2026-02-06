/**
 * getUserById.server.ts
 * Purpose: Retrieve user information from Cloudflare D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare D1データベース読み取り
 */

import type { User } from '~/specs/account/types';

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Retrieve user information from Cloudflare D1 database by user ID
 *
 * @param userId - User ID to retrieve
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns User data if found, null otherwise
 */
export async function getUserById(
  userId: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    // Return null for empty user ID
    if (!userId) {
      return null;
    }

    // Query user from D1 database using parameterized query (SQL injection protection)
    const db = context.env.DB;
    const stmt = db.prepare(`
      SELECT
        id,
        email,
        password_hash AS passwordHash,
        subscription_status AS subscriptionStatus,
        stripe_customer_id AS stripeCustomerId,
        oauth_provider AS oauthProvider,
        google_id AS googleId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE id = ?
    `).bind(userId);
    const user = await stmt.first<User>();

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error retrieving user by ID:', error);
    return null;
  }
}
