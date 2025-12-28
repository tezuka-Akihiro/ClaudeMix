/**
 * sanitizeEmail.test.ts
 * Unit tests for email sanitization logic
 *
 * @layer 純粋ロジック層 (lib)
 */

import { describe, it, expect } from 'vitest';
import { sanitizeEmail } from './sanitizeEmail';

describe('sanitizeEmail', () => {
  describe('normalization', () => {
    it('should convert uppercase to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should trim leading whitespace', () => {
      expect(sanitizeEmail('  user@example.com')).toBe('user@example.com');
    });

    it('should trim trailing whitespace', () => {
      expect(sanitizeEmail('user@example.com  ')).toBe('user@example.com');
    });

    it('should trim both leading and trailing whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should handle mixed case email', () => {
      expect(sanitizeEmail('UsEr@ExAmPlE.CoM')).toBe('user@example.com');
    });

    it('should preserve valid email structure', () => {
      expect(sanitizeEmail('user+tag@example.com')).toBe('user+tag@example.com');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for null input', () => {
      expect(sanitizeEmail(null as any)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitizeEmail(undefined as any)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeEmail(123 as any)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(sanitizeEmail('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(sanitizeEmail('   ')).toBe('');
    });

    it('should handle tab and newline characters', () => {
      expect(sanitizeEmail('\t\nuser@example.com\n\t')).toBe('user@example.com');
    });
  });
});
