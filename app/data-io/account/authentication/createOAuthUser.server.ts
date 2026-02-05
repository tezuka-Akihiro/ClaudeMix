/**
 * createOAuthUser.server.ts
 * Purpose: Create new user account from OAuth provider
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース書き込み
 */

interface CloudflareEnv {
  DB: D1Database;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

export interface OAuthUserData {
  email: string;
  oauthProvider: 'google' | 'apple';
  oauthId: string;
}

/**
 * Create new user account from OAuth provider
 *
 * @param userData - OAuth user data
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns User ID if successful, null otherwise
 *
 * Security:
 * - OAuth users have NULL passwordHash (no password-based login)
 * - Email uniqueness is enforced by database constraint
 * - OAuth provider + ID combination should be unique
 *
 * Note:
 * - Called after successful OAuth authentication
 * - If email already exists, consider account linking strategy
 */
export async function createOAuthUser(
  userData: OAuthUserData,
  context: CloudflareLoadContext
): Promise<string | null> {
  try {
    const db = context.env.DB;
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, oauth_provider, oauth_id, subscription_status, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, 'inactive', ?, ?)`
      )
      .bind(
        userId,
        userData.email,
        userData.oauthProvider,
        userData.oauthId,
        now,
        now
      )
      .run();

    if (result.meta.changes > 0) {
      return userId;
    }

    return null;
  } catch (error) {
    console.error('Error creating OAuth user:', error);
    return null;
  }
}
