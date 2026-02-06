/**
 * updateUserPassword.server.test.ts
 * Unit tests for updateUserPassword function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateUserPassword } from './updateUserPassword.server';

describe('updateUserPassword', () => {
  let mockContext: any;
  let mockDB: any;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    };

    mockContext = {
      env: {
        DB: mockDB,
      },
    } as any;
  });

  describe('successful password update', () => {
    it('should update user password successfully', async () => {
      const result = await updateUserPassword('user-123', 'new-hash-value', mockContext);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
      );
      expect(mockDB.bind).toHaveBeenCalledWith(
        'new-hash-value',
        expect.any(String),
        'user-123'
      );
      expect(mockDB.run).toHaveBeenCalled();
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      await updateUserPassword('user-123', 'new-hash-value', mockContext);

      const bindCall = mockDB.bind.mock.calls[0];
      const updatedAt = new Date(bindCall[1]);

      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('validation', () => {
    it('should return false for empty userId', async () => {
      const result = await updateUserPassword('', 'new-hash-value', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });

    it('should return false for empty passwordHash', async () => {
      const result = await updateUserPassword('user-123', '', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return false when DB.prepare throws error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await updateUserPassword('user-123', 'new-hash-value', mockContext);

      expect(result).toBe(false);
    });

    it('should return false when DB.run fails', async () => {
      mockDB.run.mockRejectedValue(new Error('Run failed'));

      const result = await updateUserPassword('user-123', 'new-hash-value', mockContext);

      expect(result).toBe(false);
    });
  });
});
