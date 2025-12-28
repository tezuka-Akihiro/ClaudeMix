/**
 * Unit tests for createUser.server.ts
 * Purpose: Verify user creation in D1 database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUser } from './createUser.server';

describe('createUser.server', () => {
  let mockContext: any;
  let mockDB: any;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn(),
    };

    mockContext = {
      env: {
        DB: mockDB,
      },
    };
  });

  describe('Happy Path: User creation', () => {
    it('should create user successfully', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const passwordHash = 'hashed-password-123';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await createUser(email, passwordHash, mockContext);

      // Assert
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
      expect(mockStmt.bind).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Error Case: Database errors', () => {
    it('should return false when INSERT fails', async () => {
      // Arrange
      const email = 'user@example.com';
      const passwordHash = 'hashed-password';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await createUser(email, passwordHash, mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when email already exists (unique constraint)', async () => {
      // Arrange
      const email = 'existing@example.com';
      const passwordHash = 'hashed-password';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed')),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await createUser(email, passwordHash, mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases: Invalid inputs', () => {
    it('should return false for empty email', async () => {
      // Arrange
      const email = '';
      const passwordHash = 'hashed-password';

      // Act
      const result = await createUser(email, passwordHash, mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty password hash', async () => {
      // Arrange
      const email = 'user@example.com';
      const passwordHash = '';

      // Act
      const result = await createUser(email, passwordHash, mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Security: SQL injection protection', () => {
    it('should safely handle email with SQL injection attempt', async () => {
      // Arrange
      const maliciousEmail = "'; DROP TABLE users; --";
      const passwordHash = 'hashed-password';

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      await createUser(maliciousEmail, passwordHash, mockContext);

      // Assert
      expect(mockStmt.bind).toHaveBeenCalledWith(
        expect.any(String), // id
        maliciousEmail, // email (safely bound)
        passwordHash,
        expect.any(String), // createdAt
        expect.any(String) // updatedAt
      );
    });
  });
});
