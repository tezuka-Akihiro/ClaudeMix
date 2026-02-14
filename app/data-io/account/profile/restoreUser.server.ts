/**
 * restoreUser.server.ts
 * Purpose: Restore a hibernating user by clearing deleted_at
 *
 * @layer Data-IO層 (副作用層)
 * @responsibility ユーザーの論理削除状態の解除（復旧）
 */

/**
 * Restore user from hibernation by clearing deleted_at
 *
 * @param userId - User ID to restore
 * @param context - Cloudflare Load Context
 * @returns true if restoration successful, false otherwise
 */
export async function restoreUser(
  userId: string,
  context: any
): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

    const db = context.env.DB;

    // Clear deleted_at to restore the account
    const stmt = db.prepare('UPDATE users SET deleted_at = NULL, updated_at = DATETIME(\'now\') WHERE id = ?').bind(userId);

    await stmt.run();

    return true;
  } catch (error) {
    console.error('Error restoring user:', error);
    return false;
  }
}
