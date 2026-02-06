/**
 * Unit tests for createSessionData.ts
 * Purpose: Verify session data creation logic (pure function)
 */

import { describe, it, expect } from 'vitest';
import { createSessionData } from './createSessionData';
import { loadSharedSpec } from '../../../../tests/utils/loadSpec';
import type { ServerSpec } from '~/specs/shared/types';

describe('createSessionData', () => {
  describe('Happy Path: Session data creation', () => {
    it('should create session data with valid userId and sessionId', () => {
      // Arrange
      const userId = 'user-123';
      const sessionId = 'session-abc-123';

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      expect(result).toHaveProperty('sessionId', sessionId);
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('createdAt');
    });

    it('should create expiresAt with default duration in the future', async () => {
      // Arrange
      const serverSpec = await loadSharedSpec<ServerSpec>('server');
      const maxAge = serverSpec.security.session_max_age;
      const userId = 'user-123';
      const sessionId = 'session-abc-123';
      const beforeCreation = Date.now();

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      const expiresAtDate = new Date(result.expiresAt);
      const expectedExpiry = new Date(beforeCreation + maxAge * 1000);
      const timeDiff = Math.abs(expiresAtDate.getTime() - expectedExpiry.getTime());

      // Allow 1 second tolerance for test execution time
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should create createdAt as current timestamp', () => {
      // Arrange
      const userId = 'user-123';
      const sessionId = 'session-abc-123';
      const beforeCreation = Date.now();

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      const createdAtDate = new Date(result.createdAt);
      const afterCreation = Date.now();

      expect(createdAtDate.getTime()).toBeGreaterThanOrEqual(beforeCreation);
      expect(createdAtDate.getTime()).toBeLessThanOrEqual(afterCreation);
    });

    it('should return ISO 8601 formatted timestamps', () => {
      // Arrange
      const userId = 'user-123';
      const sessionId = 'session-abc-123';

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.expiresAt).toMatch(isoRegex);
      expect(result.createdAt).toMatch(isoRegex);
    });
  });

  describe('Custom expiry duration', () => {
    it('should accept custom expiry duration in seconds', () => {
      // Arrange
      const userId = 'user-123';
      const sessionId = 'session-abc-123';
      const customDuration = 3600; // 1 hour
      const beforeCreation = Date.now();

      // Act
      const result = createSessionData(userId, sessionId, customDuration);

      // Assert
      const expiresAtDate = new Date(result.expiresAt);
      const expectedExpiry = new Date(beforeCreation + customDuration * 1000);
      const timeDiff = Math.abs(expiresAtDate.getTime() - expectedExpiry.getTime());

      // Allow 1 second tolerance
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should use default duration from spec when duration is not provided', async () => {
      // Arrange
      const serverSpec = await loadSharedSpec<ServerSpec>('server');
      const maxAge = serverSpec.security.session_max_age;
      const userId = 'user-123';
      const sessionId = 'session-abc-123';
      const beforeCreation = Date.now();

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      const expiresAtDate = new Date(result.expiresAt);
      const expectedExpiry = new Date(beforeCreation + maxAge * 1000);
      const timeDiff = Math.abs(expiresAtDate.getTime() - expectedExpiry.getTime());

      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('Edge Cases: Different input values', () => {
    it('should handle empty userId and sessionId', () => {
      // Arrange
      const userId = '';
      const sessionId = '';

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      expect(result.userId).toBe('');
      expect(result.sessionId).toBe('');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('createdAt');
    });

    it('should handle very long userId and sessionId strings', () => {
      // Arrange
      const userId = 'u'.repeat(1000);
      const sessionId = 's'.repeat(1000);

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      expect(result.userId).toBe(userId);
      expect(result.sessionId).toBe(sessionId);
    });

    it('should handle special characters in userId and sessionId', () => {
      // Arrange
      const userId = 'user@123!#$%';
      const sessionId = 'session-<>?/\\';

      // Act
      const result = createSessionData(userId, sessionId);

      // Assert
      expect(result.userId).toBe(userId);
      expect(result.sessionId).toBe(sessionId);
    });
  });
});
