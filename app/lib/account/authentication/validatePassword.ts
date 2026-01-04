/**
 * validatePassword.ts
 * Purpose: Validate password strength and format
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility パスワード強度検証
 */

import { loadSharedSpec } from '~/spec-loader/specLoader.server';
import type { ValidationSpec } from '~/specs/shared/types';

/**
 * Validate password strength and format using spec-defined rules
 *
 * @param password - Password to validate
 * @returns true if password is valid, false otherwise
 *
 * Validation Rules (from spec):
 * - Must be a string
 * - Minimum length (spec-defined)
 * - Maximum length (spec-defined)
 * - Must match spec-defined complexity pattern (uppercase, lowercase, digits)
 * - No leading or trailing whitespace
 */
export function validatePassword(password: unknown): boolean {
  const validationSpec = loadSharedSpec<ValidationSpec>('validation');
  const { min_length, max_length, pattern } = validationSpec.password;

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

  // Length checks (from spec)
  if (password.length < min_length) {
    return false; // Too short
  }

  if (password.length > max_length) {
    return false; // Too long (prevent DoS attacks)
  }

  // Complexity check (from spec): must contain uppercase, lowercase, and digits
  const passwordPattern = new RegExp(pattern);
  if (!passwordPattern.test(password)) {
    return false; // Does not meet complexity requirements
  }

  return true;
}

/**
 * Get password requirements for display in UI
 *
 * @returns Array of password requirement strings
 */
export function getPasswordRequirements(): string[] {
  const validationSpec = loadSharedSpec<ValidationSpec>('validation');
  return validationSpec.password.requirements;
}
