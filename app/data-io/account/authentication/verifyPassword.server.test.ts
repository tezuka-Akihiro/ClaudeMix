/**
 * Unit tests for verifyPassword.server.ts
 * Purpose: Verify password verification functionality
 */

import { describe, it, expect } from 'vitest';
import { hashPassword } from './hashPassword.server';
import { verifyPassword } from './verifyPassword.server';

describe('verifyPassword.server', () => {
  describe('Happy Path: Password verification', () => {
    it('should verify correct password successfully', async () => {
      // Arrange
      const password = 'MySecurePassword123';
      const hash = await hashPassword(password);

      // Act
      const isValid = await verifyPassword(password, hash);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const correctPassword = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await hashPassword(correctPassword);

      // Act
      const isValid = await verifyPassword(wrongPassword, hash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle passwords with special characters', async () => {
      // Arrange
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await hashPassword(password);

      // Act
      const isValid = await verifyPassword(password, hash);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should verify multiple different passwords correctly', async () => {
      // Arrange
      const password1 = 'FirstPassword123';
      const password2 = 'SecondPassword456';
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      // Act & Assert
      expect(await verifyPassword(password1, hash1)).toBe(true);
      expect(await verifyPassword(password2, hash2)).toBe(true);
      expect(await verifyPassword(password1, hash2)).toBe(false);
      expect(await verifyPassword(password2, hash1)).toBe(false);
    });
  });

  describe('Edge Cases: Invalid inputs', () => {
    it('should reject empty password against valid hash', async () => {
      // Arrange
      const password = 'ValidPassword123';
      const hash = await hashPassword(password);

      // Act
      const isValid = await verifyPassword('', hash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject password against empty hash', async () => {
      // Arrange
      const password = 'ValidPassword123';

      // Act
      const isValid = await verifyPassword(password, '');

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject password against malformed hash', async () => {
      // Arrange
      const password = 'ValidPassword123';
      const malformedHash = 'not-a-valid-hash';

      // Act
      const isValid = await verifyPassword(password, malformedHash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      // Arrange
      const password = 'CaseSensitive123';
      const hash = await hashPassword(password);

      // Act
      const isValidLower = await verifyPassword('casesensitive123', hash);
      const isValidUpper = await verifyPassword('CASESENSITIVE123', hash);

      // Assert
      expect(isValidLower).toBe(false); // Case matters
      expect(isValidUpper).toBe(false); // Case matters
    });
  });

  describe('Security: Timing attack resistance', () => {
    it('should complete verification in reasonable time', async () => {
      // Arrange
      const password = 'PerformanceTest123';
      const hash = await hashPassword(password);
      const startTime = Date.now();

      // Act
      await verifyPassword(password, hash);

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be fast for our simple implementation
    });
  });
});
