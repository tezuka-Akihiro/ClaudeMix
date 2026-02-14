/**
 * getUserByOAuth.server.ts
 * Purpose: Retrieve user by OAuth provider and ID
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース読み取り
 */

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

export interface User {
  id: string;
  email: string;
  oauthProvider: string | null;
  googleId: string | null;
  subscriptionStatus: 'active' | 'inactive' | string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retrieve user by OAuth provider and Google ID
 *
 * @param provider - OAuth provider ('google' or 'apple')
 * @param googleId - Google OAuth user ID
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns User object if found, null otherwise
 *
 * Note:
 * - Used during OAuth callback to check if user already exists
 * - Combination of provider + googleId should be unique
 */
export async function getUserByOAuth(
  provider: 'google' | 'apple',
  googleId: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    const db = context.env.DB;

    const result = await db
      .prepare(
        'SELECT id, email, oauth_provider AS oauthProvider, google_id AS googleId, subscription_status AS subscriptionStatus, deleted_at AS deletedAt, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE oauth_provider = ? AND google_id = ?'
      )
      .bind(provider, googleId)
      .first<User>();

    return result || null;
  } catch (error) {
    console.error('Error retrieving user by OAuth:', error);
    return null;
  }
}
