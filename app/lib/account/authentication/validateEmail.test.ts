/**
 * validateEmail.test.ts
 * Unit tests for email validation logic
 *
 * @layer 純粋ロジック層 (lib)
 */

import { describe, it, expect } from 'vitest';
import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  describe('valid email addresses', () => {
    it('should return true for simple valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return true for email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    it('should return true for email with numbers', () => {
      expect(validateEmail('user123@example456.com')).toBe(true);
    });

    it('should return true for email with hyphen in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBe(true);
    });
  });

  describe('invalid email addresses', () => {
    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should return false for email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should return false for email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should return false for email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should return false for email with multiple @', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });

    it('should return false for email without TLD', () => {
      expect(validateEmail('user@domain')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should return false for email starting with dot', () => {
      expect(validateEmail('.user@example.com')).toBe(false);
    });

    it('should return false for email ending with dot', () => {
      expect(validateEmail('user.@example.com')).toBe(false);
    });

    it('should return false for email with consecutive dots', () => {
      expect(validateEmail('user..name@example.com')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null input', () => {
      expect(validateEmail(null as any)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(validateEmail(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(validateEmail(123 as any)).toBe(false);
    });

    it('should return false for very long email (>254 chars)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });
});
