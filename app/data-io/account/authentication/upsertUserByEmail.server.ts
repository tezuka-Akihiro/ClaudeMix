/**
 * upsertUserByEmail.server.ts
 * Purpose: Get existing user or create new passwordless user by email for OTP auth
 *
 * @layer 副作用層 (data-io)
 * @responsibility D1データベースへのユーザーUpsert（OTP認証用）
 */

import type { User } from '~/specs/account/types';

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Get existing user or create a new passwordless user by email
 *
 * OTP認証では、メールアドレスだけでユーザーを特定する。
 * 既存ユーザーがいればそのまま返し、いなければ新規作成する。
 *
 * @param email - User's email address
 * @param context - Cloudflare context with D1 database
 * @returns User object if found/created, null on error
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Returns null on error (fail-safe)
 * - New users created with null password_hash (passwordless)
 */
export async function upsertUserByEmail(
  email: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    if (!email) {
      return null;
    }

    const db = context.env.DB;

    // First, try to find existing user
    const selectStmt = db.prepare(`
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
      WHERE email = ?
    `).bind(email);
    const existingUser = await selectStmt.first<User>();

    if (existingUser) {
      return existingUser;
    }

    // User doesn't exist: create new passwordless user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = db
      .prepare(
        'INSERT INTO users (id, email, password_hash, subscription_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(userId, email, null, 'inactive', now, now);

    await insertStmt.run();

    // Fetch the newly created user
    const newUserStmt = db.prepare(`
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
      WHERE email = ?
    `).bind(email);

    return await newUserStmt.first<User>();
  } catch (error) {
    console.error('Error upserting user by email:', error);
    return null;
  }
}
