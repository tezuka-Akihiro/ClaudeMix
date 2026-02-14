/**
 * softDeleteUser.server.test.ts
 * Unit tests for softDeleteUser function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { softDeleteUser } from './softDeleteUser.server';

describe('softDeleteUser', () => {
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

  describe('successful user soft deletion', () => {
    it('should update user deleted_at successfully', async () => {
      const result = await softDeleteUser('user-123', mockContext);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET deleted_at = DATETIME(\'now\')'));
      expect(mockDB.bind).toHaveBeenCalledWith('user-123');
      expect(mockDB.run).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should return false for empty userId', async () => {
      const result = await softDeleteUser('', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return false when DB.prepare throws error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await softDeleteUser('user-123', mockContext);

      expect(result).toBe(false);
    });

    it('should return false when DB.run fails', async () => {
      mockDB.run.mockRejectedValue(new Error('Run failed'));

      const result = await softDeleteUser('user-123', mockContext);

      expect(result).toBe(false);
    });
  });
});
