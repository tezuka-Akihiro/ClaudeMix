/**
 * validateEmail.ts
 * Purpose: Validate email address format
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility メールアドレスフォーマット検証
 */

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 *
 * Validation Rules:
 * - Must be a string
 * - Must contain exactly one @ symbol
 * - Must have local part (before @) and domain part (after @)
 * - Domain must have at least one dot (TLD required)
 * - Maximum length: 254 characters (RFC 5321)
 * - No leading/trailing dots in local part
 * - No consecutive dots in local part
 * - No spaces allowed
 *
 * Note: This is a basic validation for MVP. For production,
 * consider using a library like validator.js or email-validator
 */
export function validateEmail(email: unknown): boolean {
  // Type guard
  if (typeof email !== 'string') {
    return false;
  }

  // Empty string check
  if (!email || email.trim() === '') {
    return false;
  }

  // Length check (RFC 5321: max 254 characters)
  if (email.length > 254) {
    return false;
  }

  // Basic email regex pattern
  // Pattern explanation:
  // ^[^\s@.] - Start with non-whitespace, non-@, non-dot
  // [^\s@]*  - Zero or more non-whitespace, non-@ characters
  // @        - Exactly one @ symbol
  // [^\s@.] - Domain starts with non-whitespace, non-@, non-dot
  // [^\s@]*  - Zero or more non-whitespace, non-@ characters
  // \.       - At least one dot (TLD separator)
  // [^\s@.]+ - TLD: one or more non-whitespace, non-@, non-dot characters
  // $        - End of string
  const emailPattern = /^[^\s@.][^\s@]*@[^\s@.][^\s@]*\.[^\s@.]+$/;

  if (!emailPattern.test(email)) {
    return false;
  }

  // Check for consecutive dots in local part
  const [localPart] = email.split('@');
  if (localPart.includes('..')) {
    return false;
  }

  // Check for leading/trailing dots in local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}
