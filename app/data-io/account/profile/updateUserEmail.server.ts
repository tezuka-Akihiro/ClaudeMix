/**
 * updateUserEmail.server.ts
 * Purpose: Update user's email address in database
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility データベースのユーザーメールアドレス更新
 */

/**
 * Update user's email address in database
 *
 * @param userId - User ID to update
 * @param newEmail - New email address
 * @param context - Cloudflare Load Context
 * @returns true if update successful, false otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 * - Updates updatedAt timestamp automatically
 *
 * Database Schema:
 * - Table: users
 * - Columns: id (PRIMARY KEY), email (UNIQUE), updatedAt
 */
export async function updateUserEmail(
  userId: string,
  newEmail: string,
  context: any
): Promise<boolean> {
  try {
    // Validation
    if (!userId || !newEmail) {
      return false;
    }

    const db = context.env.DB;
    const now = new Date().toISOString();

    // Update email with parameterized query
    const stmt = db
      .prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?')
      .bind(newEmail, now, userId);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error updating user email:', error);
    return false;
  }
}
