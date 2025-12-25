/**
 * sanitizeEmail.ts
 * Purpose: Normalize email address for consistent storage and comparison
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility メールアドレス正規化
 */

/**
 * Sanitize email address by normalizing format
 *
 * @param email - Email address to sanitize
 * @returns Normalized email address (lowercase, trimmed)
 *
 * Normalization Steps:
 * 1. Convert to string (if not already)
 * 2. Trim leading/trailing whitespace (including tabs, newlines)
 * 3. Convert to lowercase
 *
 * Security:
 * - Returns empty string for invalid inputs (null, undefined, non-string)
 * - Prevents accidental storage of malformed emails
 *
 * Note: Email addresses are case-insensitive according to RFC 5321,
 * so we normalize to lowercase for consistent storage and comparison
 */
export function sanitizeEmail(email: unknown): string {
  // Type guard
  if (typeof email !== 'string') {
    return '';
  }

  // Trim whitespace (including tabs, newlines)
  const trimmed = email.trim();

  // Return empty string if only whitespace
  if (trimmed === '') {
    return '';
  }

  // Convert to lowercase for consistent storage
  return trimmed.toLowerCase();
}
