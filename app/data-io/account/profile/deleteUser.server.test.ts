/**
 * deleteUser.server.test.ts
 * Unit tests for deleteUser function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteUser } from './deleteUser.server';

describe('deleteUser', () => {
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

  describe('successful user deletion', () => {
    it('should delete user successfully', async () => {
      const result = await deleteUser('user-123', mockContext);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?');
      expect(mockDB.bind).toHaveBeenCalledWith('user-123');
      expect(mockDB.run).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should return false for empty userId', async () => {
      const result = await deleteUser('', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return false when DB.prepare throws error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await deleteUser('user-123', mockContext);

      expect(result).toBe(false);
    });

    it('should return false when DB.run fails', async () => {
      mockDB.run.mockRejectedValue(new Error('Run failed'));

      const result = await deleteUser('user-123', mockContext);

      expect(result).toBe(false);
    });

    it('should handle foreign key constraint violations', async () => {
      mockDB.run.mockRejectedValue(new Error('FOREIGN KEY constraint failed'));

      const result = await deleteUser('user-123', mockContext);

      expect(result).toBe(false);
    });
  });
});
