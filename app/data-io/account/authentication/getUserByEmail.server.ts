/**
 * getUserByEmail.server.ts
 * Purpose: Retrieve user by email from Cloudflare D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare D1データベース読み取り（メールアドレス検索）
 */

import type { User } from '~/specs/account/types';

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  cloudflare: {
    env: CloudflareEnv;
  };
}

/**
 * Get user by email address from D1 database
 *
 * @param email - User's email address
 * @param context - Cloudflare context with D1 database
 * @returns User object if found, null otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Returns null on error (fail-safe)
 */
export async function getUserByEmail(
  email: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    if (!email) {
      return null;
    }

    const db = context.cloudflare.env.DB;
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?').bind(email);
    const user = await stmt.first<User>();

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    return null;
  }
}
