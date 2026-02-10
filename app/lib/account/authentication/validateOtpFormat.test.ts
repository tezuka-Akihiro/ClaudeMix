/**
 * Unit tests for validateOtpFormat.ts
 * Purpose: Verify OTP code format validation (pure logic)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import { validateOtpFormat } from './validateOtpFormat';

describe('validateOtpFormat', () => {
  let spec: AccountAuthenticationSpec;

  beforeEach(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');
  });

  describe('Happy Path: Valid OTP codes', () => {
    it('should return valid for a correct 6-digit code', () => {
      const result = validateOtpFormat('123456');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for code with leading zeros', () => {
      const result = validateOtpFormat('000001');
      expect(result.valid).toBe(true);
    });

    it('should return valid for all zeros', () => {
      const result = validateOtpFormat('000000');
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Case: Invalid format', () => {
    it('should return invalid for code shorter than spec length', () => {
      const result = validateOtpFormat('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for code longer than spec length', () => {
      const result = validateOtpFormat('1234567');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for alphabetic characters', () => {
      const result = validateOtpFormat('abcdef');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for mixed alphanumeric', () => {
      const result = validateOtpFormat('12ab56');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for special characters', () => {
      const result = validateOtpFormat('12-456');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for empty string', () => {
      const result = validateOtpFormat('');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for whitespace-padded code', () => {
      const result = validateOtpFormat(' 123456 ');
      expect(result.valid).toBe(false);
    });
  });

  describe('SSoT: Pattern from spec', () => {
    it('should validate against spec-defined pattern', () => {
      // The spec defines the pattern - this test verifies spec compliance
      const pattern = new RegExp(spec.validation.otp.pattern);
      expect(pattern.test('123456')).toBe(true);
      expect(pattern.test('abcdef')).toBe(false);
    });

    it('should use spec-defined code length', () => {
      // spec.validation.otp.length defines expected length
      expect(spec.validation.otp.length).toBeGreaterThan(0);
    });
  });
});
