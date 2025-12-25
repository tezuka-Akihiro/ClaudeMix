/**
 * updateUserEmail.server.test.ts
 * Unit tests for updateUserEmail function
 *
 * @layer Data-IO層 (副作用層)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CloudflareLoadContext } from '~/types/cloudflare';
import { updateUserEmail } from './updateUserEmail.server';

describe('updateUserEmail', () => {
  let mockContext: CloudflareLoadContext;
  let mockDB: any;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    };

    mockContext = {
      cloudflare: {
        env: {
          DB: mockDB,
        },
      },
    } as any;
  });

  describe('successful email update', () => {
    it('should update user email successfully', async () => {
      const result = await updateUserEmail('user-123', 'newemail@example.com', mockContext);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        'UPDATE users SET email = ?, updatedAt = ? WHERE id = ?'
      );
      expect(mockDB.bind).toHaveBeenCalledWith(
        'newemail@example.com',
        expect.any(String),
        'user-123'
      );
      expect(mockDB.run).toHaveBeenCalled();
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      await updateUserEmail('user-123', 'newemail@example.com', mockContext);

      const bindCall = mockDB.bind.mock.calls[0];
      const updatedAt = new Date(bindCall[1]);

      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('validation', () => {
    it('should return false for empty userId', async () => {
      const result = await updateUserEmail('', 'newemail@example.com', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });

    it('should return false for empty email', async () => {
      const result = await updateUserEmail('user-123', '', mockContext);

      expect(result).toBe(false);
      expect(mockDB.prepare).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return false when DB.prepare throws error', async () => {
      mockDB.prepare.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await updateUserEmail('user-123', 'newemail@example.com', mockContext);

      expect(result).toBe(false);
    });

    it('should return false when DB.run fails', async () => {
      mockDB.run.mockRejectedValue(new Error('Run failed'));

      const result = await updateUserEmail('user-123', 'newemail@example.com', mockContext);

      expect(result).toBe(false);
    });

    it('should handle database constraint violations', async () => {
      mockDB.run.mockRejectedValue(new Error('UNIQUE constraint failed'));

      const result = await updateUserEmail('user-123', 'duplicate@example.com', mockContext);

      expect(result).toBe(false);
    });
  });
});
