/**
 * isSessionExpired.ts
 * Purpose: Check if a session has expired based on expiresAt timestamp
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility セッション有効期限の判定（副作用なし）
 */

/**
 * Check if a session has expired
 *
 * @param expiresAt - ISO 8601 timestamp string of when the session expires
 * @returns true if session is expired, false if still valid
 *
 * Security: Returns true for invalid inputs (fail-safe)
 */
export function isSessionExpired(expiresAt: string): boolean {
  try {
    // Validate input type
    if (typeof expiresAt !== 'string' || !expiresAt) {
      return true; // Fail-safe: treat invalid input as expired
    }

    // Parse date
    const expiryDate = new Date(expiresAt);

    // Check for invalid date
    if (isNaN(expiryDate.getTime())) {
      return true; // Fail-safe: treat invalid date as expired
    }

    // Compare with current time
    const now = new Date();
    return expiryDate.getTime() <= now.getTime();
  } catch {
    // Fail-safe: treat any error as expired for security
    return true;
  }
}
