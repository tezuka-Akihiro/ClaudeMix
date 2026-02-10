/**
 * validateOtpFormat.ts
 * Purpose: Validate OTP code format (pure logic, no side effects)
 *
 * @layer 純粋ロジック層 (lib)
 * @responsibility OTPコードのフォーマット検証
 */

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

export interface OtpFormatResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate OTP code format against spec-defined pattern
 *
 * @param otpCode - The OTP code to validate
 * @returns OtpFormatResult indicating validity
 */
export function validateOtpFormat(otpCode: string): OtpFormatResult {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { pattern, error_messages } = spec.validation.otp;

  if (!otpCode) {
    return { valid: false, error: error_messages.required };
  }

  const otpPattern = new RegExp(pattern);
  if (!otpPattern.test(otpCode)) {
    return { valid: false, error: error_messages.invalid_format };
  }

  return { valid: true };
}
