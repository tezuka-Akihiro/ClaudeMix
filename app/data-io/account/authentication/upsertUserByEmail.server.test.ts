/**
 * Unit tests for upsertUserByEmail.server.ts
 * Purpose: Verify user upsert (create or return existing) by email for OTP auth
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { upsertUserByEmail } from './upsertUserByEmail.server';

describe('upsertUserByEmail.server', () => {
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

  describe('Happy Path: Existing user', () => {
    it('should return existing user when email exists', async () => {
      // Arrange
      const email = 'existing@example.com';
      const mockUser = {
        id: 'user-123',
        email: 'existing@example.com',
        subscriptionStatus: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const mockSelectStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };
      mockDB.prepare.mockReturnValue(mockSelectStmt);

      // Act
      const result = await upsertUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeTruthy();
      expect(result!.email).toBe(email);
    });
  });

  describe('Happy Path: New user creation', () => {
    it('should create new user when email does not exist', async () => {
      // Arrange
      const email = 'new@example.com';

      // First call (SELECT): no user found
      const mockSelectStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      // Second call (INSERT): success
      const mockInsertStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };

      // Third call (SELECT after INSERT): return new user
      const mockSelectAfterStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'new-user-uuid',
          email: 'new@example.com',
          subscriptionStatus: 'inactive',
          createdAt: '2026-02-10T00:00:00.000Z',
          updatedAt: '2026-02-10T00:00:00.000Z',
        }),
      };

      mockDB.prepare
        .mockReturnValueOnce(mockSelectStmt)
        .mockReturnValueOnce(mockInsertStmt)
        .mockReturnValueOnce(mockSelectAfterStmt);

      // Act
      const result = await upsertUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeTruthy();
      expect(result!.email).toBe(email);
      // INSERT should have been called
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users')
      );
    });

    it('should create user with null password_hash for OTP users', async () => {
      // Arrange
      const email = 'otp-user@example.com';

      const mockSelectStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };

      const mockSelectAfterStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'new-uuid',
          email: 'otp-user@example.com',
          subscriptionStatus: 'inactive',
        }),
      };

      mockDB.prepare
        .mockReturnValueOnce(mockSelectStmt)
        .mockReturnValueOnce(mockInsertStmt)
        .mockReturnValueOnce(mockSelectAfterStmt);

      // Act
      await upsertUserByEmail(email, mockContext);

      // Assert - verify null password_hash is passed
      const insertBindArgs = mockInsertStmt.bind.mock.calls[0];
      // insertBindArgs: [id, email, null(password_hash), 'inactive', now, now]
      expect(insertBindArgs[2]).toBeNull(); // password_hash should be null
    });
  });

  describe('Error Case: Database errors', () => {
    it('should return null when SELECT fails', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      // Act
      const result = await upsertUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when INSERT fails', async () => {
      // Arrange
      const email = 'user@example.com';

      const mockSelectStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const mockInsertStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error('INSERT error')),
      };

      mockDB.prepare
        .mockReturnValueOnce(mockSelectStmt)
        .mockReturnValueOnce(mockInsertStmt);

      // Act
      const result = await upsertUserByEmail(email, mockContext);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Edge Case: Empty email', () => {
    it('should return null for empty email', async () => {
      // Act
      const result = await upsertUserByEmail('', mockContext);

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

      const mockInsertStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };

      const mockSelectAfterStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: 'x', email: maliciousEmail }),
      };

      mockDB.prepare
        .mockReturnValueOnce(mockStmt)
        .mockReturnValueOnce(mockInsertStmt)
        .mockReturnValueOnce(mockSelectAfterStmt);

      // Act
      await upsertUserByEmail(maliciousEmail, mockContext);

      // Assert - email is passed through bind, not interpolated
      expect(mockStmt.bind).toHaveBeenCalledWith(maliciousEmail);
    });
  });
});
