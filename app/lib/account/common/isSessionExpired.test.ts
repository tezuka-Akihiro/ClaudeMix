/**
 * Unit tests for isSessionExpired.ts
 * Purpose: Verify session expiration logic (pure function)
 */

import { describe, it, expect } from 'vitest';
import { isSessionExpired } from './isSessionExpired';

describe('isSessionExpired', () => {
  describe('Happy Path: Session validity checks', () => {
    it('should return false for valid session (expires in the future)', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      // Act
      const result = isSessionExpired(futureDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for expired session (expired in the past)', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      // Act
      const result = isSessionExpired(pastDate);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for session expiring exactly now', () => {
      // Arrange
      const nowDate = new Date(Date.now()).toISOString();

      // Act
      const result = isSessionExpired(nowDate);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases: Invalid or boundary inputs', () => {
    it('should return true for invalid date string', () => {
      // Arrange
      const invalidDate = 'invalid-date';

      // Act
      const result = isSessionExpired(invalidDate);

      // Assert
      expect(result).toBe(true); // Treat invalid dates as expired for security
    });

    it('should return true for empty string', () => {
      // Arrange
      const emptyDate = '';

      // Act
      const result = isSessionExpired(emptyDate);

      // Assert
      expect(result).toBe(true); // Treat empty as expired for security
    });

    it('should handle dates far in the future correctly', () => {
      // Arrange
      const farFutureDate = new Date(Date.now() + 31536000000).toISOString(); // 1 year from now

      // Act
      const result = isSessionExpired(farFutureDate);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle dates far in the past correctly', () => {
      // Arrange
      const farPastDate = new Date(Date.now() - 31536000000).toISOString(); // 1 year ago

      // Act
      const result = isSessionExpired(farPastDate);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Security: Fail-safe for uncertain cases', () => {
    it('should return true for Date object (wrong input type)', () => {
      // Arrange
      const dateObject = new Date() as any;

      // Act
      const result = isSessionExpired(dateObject);

      // Assert
      expect(result).toBe(true); // Fail-safe: reject non-string inputs
    });
  });
});
