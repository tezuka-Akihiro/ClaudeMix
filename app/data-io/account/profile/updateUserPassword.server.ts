/**
 * updateUserPassword.server.ts
 * Purpose: Update user's password hash in database
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility データベースのユーザーパスワード更新
 */

/**
 * Update user's password hash in database
 *
 * @param userId - User ID to update
 * @param newPasswordHash - New password hash (already hashed)
 * @param context - Cloudflare Load Context
 * @returns true if update successful, false otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Expects pre-hashed password (hashing done in action layer)
 * - Updates updatedAt timestamp automatically
 *
 * Database Schema:
 * - Table: users
 * - Columns: id (PRIMARY KEY), passwordHash, updatedAt
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string,
  context: any
): Promise<boolean> {
  try {
    // Validation
    if (!userId || !newPasswordHash) {
      return false;
    }

    const db = context.cloudflare.env.DB;
    const now = new Date().toISOString();

    // Update password hash with parameterized query
    const stmt = db
      .prepare('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?')
      .bind(newPasswordHash, now, userId);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error updating user password:', error);
    return false;
  }
}
