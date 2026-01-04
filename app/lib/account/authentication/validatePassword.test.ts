/**
 * validatePassword.test.ts
 * Unit tests for password validation logic
 *
 * @layer 純粋ロジック層 (lib)
 */

import { describe, it, expect } from 'vitest';
import { validatePassword, validatePasswordDetailed, getPasswordRequirements } from './validatePassword';

describe('validatePassword', () => {
  describe('valid passwords (spec requirements: 8+ chars, uppercase, lowercase, digits)', () => {
    it('should return true for password with minimum requirements', () => {
      // Has uppercase (P), lowercase (a,s,s,w,o,r,d), and digits (1,2,3)
      expect(validatePassword('Password123')).toBe(true);
    });

    it('should return true for password with special characters', () => {
      // Has uppercase (P), lowercase (a,s,s), digits (1,2,3), and special char (@)
      expect(validatePassword('Pass@123')).toBe(true);
    });

    it('should return true for long password with all requirements', () => {
      // Has uppercase, lowercase, and digits
      expect(validatePassword('ThisIsAVeryLongPassword123')).toBe(true);
    });

    it('should return true for password with mixed characters', () => {
      expect(validatePassword('MyP@ssw0rd!')).toBe(true);
    });

    it('should return true for exactly 8 characters with all requirements', () => {
      expect(validatePassword('Abcd1234')).toBe(true);
    });
  });

  describe('invalid passwords (complexity requirements)', () => {
    it('should return false for empty string', () => {
      expect(validatePassword('')).toBe(false);
    });

    it('should return false for password shorter than 8 characters', () => {
      expect(validatePassword('Pass1')).toBe(false);
    });

    it('should return false for password with 7 characters', () => {
      expect(validatePassword('Passw0r')).toBe(false);
    });

    it('should return false for password with only lowercase (no uppercase, no digits)', () => {
      expect(validatePassword('password')).toBe(false);
    });

    it('should return false for password without uppercase letters', () => {
      expect(validatePassword('password123')).toBe(false);
    });

    it('should return false for password without lowercase letters', () => {
      expect(validatePassword('PASSWORD123')).toBe(false);
    });

    it('should return false for password without digits', () => {
      expect(validatePassword('Password')).toBe(false);
    });

    it('should return false for password with only spaces', () => {
      expect(validatePassword('        ')).toBe(false);
    });

    it('should return false for password with leading/trailing spaces', () => {
      expect(validatePassword(' Password123 ')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null input', () => {
      expect(validatePassword(null as any)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(validatePassword(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(validatePassword(12345678 as any)).toBe(false);
    });

    it('should return false for very long password (>128 chars)', () => {
      // Even with all requirements, must not exceed max length
      const longPassword = 'Aa1' + 'a'.repeat(200);
      expect(validatePassword(longPassword)).toBe(false);
    });

    it('should return true for password at exactly 128 characters with requirements', () => {
      // Create a password with exactly 128 chars that has all requirements
      const exactLength = 'A1' + 'a'.repeat(126); // 128 chars total
      expect(validatePassword(exactLength)).toBe(true);
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return array of password requirements', () => {
      const requirements = getPasswordRequirements();

      expect(requirements).toBeInstanceOf(Array);
      expect(requirements.length).toBeGreaterThan(0);

      // Should mention key requirements
      const requirementsText = requirements.join(' ');
      expect(requirementsText).toContain('文字');
      expect(requirementsText).toContain('大文字');
      expect(requirementsText).toContain('小文字');
      expect(requirementsText).toContain('数字');
    });
  });
});

describe('validatePasswordDetailed', () => {
  describe('valid passwords', () => {
    it('should return isValid: true for valid password', () => {
      const result = validatePasswordDetailed('Password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('required error', () => {
    it('should return "required" error for empty string', () => {
      const result = validatePasswordDetailed('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('required');
    });

    it('should return "required" error for null', () => {
      const result = validatePasswordDetailed(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('required');
    });

    it('should return "required" error for non-string', () => {
      const result = validatePasswordDetailed(12345);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('required');
    });
  });

  describe('too_short error', () => {
    it('should return "too_short" error for 7 characters', () => {
      const result = validatePasswordDetailed('Pass123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('too_short');
    });

    it('should return "too_short" error for 1 character', () => {
      const result = validatePasswordDetailed('P');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('too_short');
    });
  });

  describe('too_long error', () => {
    it('should return "too_long" error for 129+ characters', () => {
      const longPassword = 'Aa1' + 'a'.repeat(200);
      const result = validatePasswordDetailed(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('too_long');
    });
  });

  describe('weak error', () => {
    it('should return "weak" error for password without uppercase', () => {
      const result = validatePasswordDetailed('password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('weak');
    });

    it('should return "weak" error for password without lowercase', () => {
      const result = validatePasswordDetailed('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('weak');
    });

    it('should return "weak" error for password without digits', () => {
      const result = validatePasswordDetailed('PasswordABC');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('weak');
    });

    it('should return "weak" error for password with only letters', () => {
      const result = validatePasswordDetailed('abcdefghijk');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('weak');
    });
  });
});
