/**
 * validateEmail.ts
 * Purpose: Validate email address format
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility メールアドレスフォーマット検証
 */

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

/**
 * Validate email address format using spec-defined rules
 *
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 *
 * Validation Rules (from spec):
 * - Must be a string
 * - Must match spec-defined regex pattern
 * - Must not exceed spec-defined maximum length
 * - No leading/trailing dots in local part
 * - No consecutive dots in local part
 */
export function validateEmail(email: unknown): boolean {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { pattern, max_length } = spec.validation.email;

  // Type guard
  if (typeof email !== 'string') {
    return false;
  }

  // Empty string check
  if (!email || email.trim() === '') {
    return false;
  }

  // Length check (from spec)
  if (email.length > max_length) {
    return false;
  }

  // Email regex pattern (from spec)
  const emailPattern = new RegExp(pattern);
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
