/**
 * Unit tests for hashPassword.server.ts
 * Purpose: Verify password hashing functionality
 */

import { describe, it, expect } from 'vitest';
import { hashPassword } from './hashPassword.server';

describe('hashPassword.server', () => {
  describe('Happy Path: Password hashing', () => {
    it('should hash password successfully', async () => {
      // Arrange
      const password = 'MySecurePassword123';

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password); // Hash should be different from plain password
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password (salt)', async () => {
      // Arrange
      const password = 'SamePassword123';

      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Assert
      expect(hash1).not.toBe(hash2); // Different salts = different hashes
      expect(hash1.length).toBeGreaterThan(0);
      expect(hash2.length).toBeGreaterThan(0);
    });

    it('should handle passwords with special characters', async () => {
      // Arrange
      const password = 'P@ssw0rd!#$%^&*()';

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
    });

    it('should handle long passwords', async () => {
      // Arrange
      const password = 'A'.repeat(100);

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
    });
  });

  describe('Edge Cases: Invalid inputs', () => {
    it('should handle empty password', async () => {
      // Arrange
      const password = '';

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toBeTruthy(); // bcrypt can hash empty strings
      expect(typeof hash).toBe('string');
    });

    it('should handle whitespace-only password', async () => {
      // Arrange
      const password = '   ';

      // Act
      const hash = await hashPassword(password);

      // Assert
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });
  });

  describe('Performance: Hashing should complete in reasonable time', () => {
    it('should hash password within 500ms', async () => {
      // Arrange
      const password = 'PerformanceTest123';
      const startTime = Date.now();

      // Act
      await hashPassword(password);

      // Assert
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // bcrypt should be fast enough
    });
  });
});
