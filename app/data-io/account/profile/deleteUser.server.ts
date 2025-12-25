/**
 * deleteUser.server.ts
 * Purpose: Delete user from database
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility データベースからのユーザー削除
 */

/**
 * Delete user from database
 *
 * @param userId - User ID to delete
 * @param context - Cloudflare Load Context
 * @returns true if deletion successful, false otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Permanent deletion (cannot be undone)
 *
 * Important:
 * - Caller should delete all user sessions before calling this function
 * - Consider soft delete for production (set deletedAt instead of DELETE)
 *
 * Database Schema:
 * - Table: users
 * - Columns: id (PRIMARY KEY)
 */
export async function deleteUser(
  userId: string,
  context: any
): Promise<boolean> {
  try {
    // Validation
    if (!userId) {
      return false;
    }

    const db = context.env.DB;

    // Delete user with parameterized query
    const stmt = db.prepare('DELETE FROM users WHERE id = ?').bind(userId);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
