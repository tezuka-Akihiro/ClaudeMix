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
  oauthId: string | null;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  createdAt: string;
  updatedAt: string;
}

/**
 * Retrieve user by OAuth provider and ID
 *
 * @param provider - OAuth provider ('google' or 'apple')
 * @param oauthId - OAuth provider's user ID
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns User object if found, null otherwise
 *
 * Note:
 * - Used during OAuth callback to check if user already exists
 * - Combination of provider + oauthId should be unique
 */
export async function getUserByOAuth(
  provider: 'google' | 'apple',
  oauthId: string,
  context: CloudflareLoadContext
): Promise<User | null> {
  try {
    const db = context.env.DB;

    const result = await db
      .prepare(
        'SELECT id, email, oauthProvider, oauthId, subscriptionStatus, createdAt, updatedAt FROM users WHERE oauthProvider = ? AND oauthId = ?'
      )
      .bind(provider, oauthId)
      .first<User>();

    return result || null;
  } catch (error) {
    console.error('Error retrieving user by OAuth:', error);
    return null;
  }
}
