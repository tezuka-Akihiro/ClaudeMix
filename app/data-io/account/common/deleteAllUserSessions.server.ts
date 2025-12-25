/**
 * deleteAllUserSessions.server.ts
 * Purpose: Delete all sessions for a specific user from D1 database
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility D1データベース一括削除
 */

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
 * Delete all sessions for a specific user from D1 database
 *
 * @param userId - User ID whose sessions should be deleted
 * @param context - Cloudflare Workers load context with D1 binding
 * @returns Number of sessions deleted
 * @throws Error if database operations fail
 */
export async function deleteAllUserSessions(
  userId: string,
  context: CloudflareLoadContext
): Promise<number> {
  try {
    const db = context.env.DB;

    // Delete all sessions for the user
    const result = await db
      .prepare('DELETE FROM sessions WHERE userId = ?')
      .bind(userId)
      .run();

    // Return number of deleted rows
    return result.meta.changes || 0;
  } catch (error) {
    console.error('Error deleting all user sessions:', error);
    throw new Error('Failed to delete all user sessions');
  }
}
