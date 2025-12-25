/**
 * validatePassword.ts
 * Purpose: Validate password strength and format
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility パスワード強度検証
 */

/**
 * Validate password strength and format
 *
 * @param password - Password to validate
 * @returns true if password is valid, false otherwise
 *
 * Validation Rules:
 * - Must be a string
 * - Minimum length: 8 characters
 * - Maximum length: 128 characters
 * - No leading or trailing whitespace
 * - Cannot be only whitespace
 *
 * Note: This is a basic validation for MVP. For production,
 * consider adding complexity requirements (uppercase, lowercase,
 * numbers, special characters, etc.)
 */
export function validatePassword(password: unknown): boolean {
  // Type guard
  if (typeof password !== 'string') {
    return false;
  }

  // Empty check
  if (!password) {
    return false;
  }

  // Whitespace checks
  if (password.trim() !== password) {
    return false; // Has leading or trailing whitespace
  }

  if (password.trim() === '') {
    return false; // Only whitespace
  }

  // Length checks
  if (password.length < 8) {
    return false; // Too short
  }

  if (password.length > 128) {
    return false; // Too long (prevent DoS attacks)
  }

  return true;
}
