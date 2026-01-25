/**
 * Unit tests for getUserByEmail.server.ts
 * Purpose: Verify user retrieval by email from D1 database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserByEmail } from './getUserByEmail.server';

describe('getUserByEmail.server', () => {
  // Mock context
  let mockContext: any;
  let mockDB: any;

  beforeEach(() => {
    // Reset mocks
    mockDB = {
      prepare: vi.fn(),
    };

    mockContext = {
      env: {
        DB: mockDB,
      },
    };
  });

  describe('Happy Path: User retrieval', () => {
    it('should retrieve user when email exists', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        subscriptionStatus: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(mockDB.prepare).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?'
      );
      expect(mockStmt.bind).toHaveBeenCalledWith(email);
      expect(result).toEqual(mockUser);
    });

    it('should handle different subscription statuses', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const mockUser = {
        id: 'user-456',
        email: 'inactive@example.com',
        passwordHash: 'hashed-password',
        subscriptionStatus: 'inactive',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(result?.subscriptionStatus).toBe('inactive');
    });
  });

  describe('Error Case: User not found', () => {
    it('should return null when user does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when email is empty', async () => {
      // Arrange
      const email = '';

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Error Case: Database errors', () => {
    it('should return null when D1 query fails', async () => {
      // Arrange
      const email = 'user@example.com';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when database connection fails', async () => {
      // Arrange
      const email = 'user@example.com';
      mockDB.prepare.mockImplementation(() => {
        throw new Error('Connection error');
      });

      // Act
      const result = await getUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Security: SQL injection protection', () => {
    it('should safely handle email with SQL injection attempt', async () => {
      // Arrange
      const maliciousEmail = "'; DROP TABLE users; --";

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await getUserByEmail(maliciousEmail, mockContext);

      // Assert
      expect(mockStmt.bind).toHaveBeenCalledWith(maliciousEmail);
      expect(result).toBeNull();
    });
  });
});
