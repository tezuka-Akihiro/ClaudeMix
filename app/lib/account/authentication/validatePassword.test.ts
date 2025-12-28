/**
 * validatePassword.test.ts
 * Unit tests for password validation logic
 *
 * @layer 純粋ロジック層 (lib)
 */

import { describe, it, expect } from 'vitest';
import { validatePassword } from './validatePassword';

describe('validatePassword', () => {
  describe('valid passwords', () => {
    it('should return true for password with minimum length (8 chars)', () => {
      expect(validatePassword('password')).toBe(true);
    });

    it('should return true for password with uppercase letters', () => {
      expect(validatePassword('Password123')).toBe(true);
    });

    it('should return true for password with special characters', () => {
      expect(validatePassword('Pass@123')).toBe(true);
    });

    it('should return true for long password', () => {
      expect(validatePassword('ThisIsAVeryLongPasswordWithMoreThan8Characters')).toBe(true);
    });

    it('should return true for password with mixed characters', () => {
      expect(validatePassword('MyP@ssw0rd!')).toBe(true);
    });
  });

  describe('invalid passwords', () => {
    it('should return false for empty string', () => {
      expect(validatePassword('')).toBe(false);
    });

    it('should return false for password shorter than 8 characters', () => {
      expect(validatePassword('pass')).toBe(false);
    });

    it('should return false for password with 7 characters', () => {
      expect(validatePassword('passwor')).toBe(false);
    });

    it('should return false for password with only spaces', () => {
      expect(validatePassword('        ')).toBe(false);
    });

    it('should return false for password with leading/trailing spaces', () => {
      expect(validatePassword(' password ')).toBe(false);
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
      const longPassword = 'a'.repeat(200);
      expect(validatePassword(longPassword)).toBe(false);
    });
  });
});
