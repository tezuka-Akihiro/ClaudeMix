/**
 * restoreUser.server.test.ts
 * Unit tests for restoreUser function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { restoreUser } from './restoreUser.server';

describe('restoreUser', () => {
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

  describe('successful user restoration', () => {
    it('should clear user deleted_at successfully', async () => {
      const result = await restoreUser('user-123', mockContext);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET deleted_at = NULL'));
      expect(mockDB.bind).toHaveBeenCalledWith('user-123');
      expect(mockDB.run).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should return false for empty userId', async () => {
      const result = await restoreUser('', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return false when DB.run fails', async () => {
      mockDB.run.mockRejectedValue(new Error('Run failed'));

      const result = await restoreUser('user-123', mockContext);

      expect(result).toBe(false);
    });
  });
});
