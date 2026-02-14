/**
 * softDeleteUser.server.ts
 * Purpose: Mark user as deleted (logical deletion) in database
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility データベースでのユーザー論理削除（冬眠状態への移行）
 */

/**
 * Mark user as deleted (soft delete) in database
 *
 * @param userId - User ID to mark as deleted
 * @param context - Cloudflare Load Context
 * @returns true if update successful, false otherwise
 *
 * Security:
 * - Uses parameterized queries to prevent SQL injection
 *
 * Important:
 * - Logical deletion records the current time in deleted_at
 * - Actual physical deletion is handled by a batch process after 30 days
 */
export async function softDeleteUser(
  userId: string,
  context: any
): Promise<boolean> {
  try {
    // Validation
    if (!userId) {
      return false;
    }

    const db = context.env.DB;

    // Update deleted_at with current timestamp
    const stmt = db.prepare('UPDATE users SET deleted_at = DATETIME(\'now\'), updated_at = DATETIME(\'now\') WHERE id = ?').bind(userId);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
}
