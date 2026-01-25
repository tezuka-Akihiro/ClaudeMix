/**
 * Unit tests for getUserById.server.ts
 * Purpose: Verify user information retrieval from Cloudflare D1 database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserById } from './getUserById.server';
import type { User } from '~/specs/account/types';

describe('getUserById.server', () => {
  // Mock Cloudflare D1 database
  const mockD1 = {
    prepare: vi.fn(),
  };

  // Mock prepared statement
  const mockStatement = {
    bind: vi.fn(),
    first: vi.fn(),
  };

  // Mock context with D1 binding
  const mockContext = {
    env: {
      DB: mockD1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock chain
    mockD1.prepare.mockReturnValue(mockStatement);
    mockStatement.bind.mockReturnValue(mockStatement);
  });

  describe('Happy Path: User exists in database', () => {
    it('should retrieve user data from D1 when user exists', async () => {
      // Arrange
      const userId = 'user-123';
      const userData: User = {
        id: userId,
        email: 'test@example.com',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockStatement.first.mockResolvedValueOnce(userData);

      // Act
      const result = await getUserById(userId, mockContext as any);

      // Assert
      expect(mockD1.prepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(userId);
      expect(mockStatement.first).toHaveBeenCalled();
      expect(result).toEqual(userData);
    });

    it('should handle users with different subscription statuses', async () => {
      // Arrange
      const testCases: Array<User['subscriptionStatus']> = [
        'active',
        'inactive',
      ];

      for (const status of testCases) {
        vi.clearAllMocks();
        mockD1.prepare.mockReturnValue(mockStatement);
        mockStatement.bind.mockReturnValue(mockStatement);

        const userData: User = {
          id: `user-${status}`,
          email: `${status}@example.com`,
          subscriptionStatus: status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockStatement.first.mockResolvedValueOnce(userData);

        // Act
        const result = await getUserById(userData.id, mockContext as any);

        // Assert
        expect(result?.subscriptionStatus).toBe(status);
      }
    });
  });

  describe('Error Case: User not found', () => {
    it('should return null when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockStatement.first.mockResolvedValueOnce(null);

      // Act
      const result = await getUserById(userId, mockContext as any);

      // Assert
      expect(mockD1.prepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should return null when user ID is empty', async () => {
      // Arrange
      const userId = '';
      mockStatement.first.mockResolvedValueOnce(null);

      // Act
      const result = await getUserById(userId, mockContext as any);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Error Case: Database query fails', () => {
    it('should return null when D1 query throws error', async () => {
      // Arrange
      const userId = 'user-456';
      mockStatement.first.mockRejectedValueOnce(new Error('D1 query error'));

      // Act
      const result = await getUserById(userId, mockContext as any);

      // Assert
      expect(mockD1.prepare).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const userId = 'user-789';
      mockD1.prepare.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      // Act
      const result = await getUserById(userId, mockContext as any);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('SQL Injection Protection', () => {
    it('should safely handle user IDs with special characters', async () => {
      // Arrange
      const maliciousUserId = "user'; DROP TABLE users; --";
      mockStatement.first.mockResolvedValueOnce(null);

      // Act
      const result = await getUserById(maliciousUserId, mockContext as any);

      // Assert
      // Verify that bind was called with the raw user ID (parameterized query protects against SQL injection)
      expect(mockStatement.bind).toHaveBeenCalledWith(maliciousUserId);
      expect(result).toBeNull();
    });
  });
});
