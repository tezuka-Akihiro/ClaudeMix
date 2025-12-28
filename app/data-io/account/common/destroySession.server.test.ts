/**
 * Unit tests for destroySession.server.ts
 * Purpose: Verify session deletion from Cloudflare Workers KV and Cookie invalidation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { destroySession } from './destroySession.server';

describe('destroySession.server', () => {
  // Mock Cloudflare Workers KV
  const mockKV = {
    delete: vi.fn(),
  };

  // Mock context with KV binding
  const mockContext = {
    cloudflare: {
      env: {
        SESSION_KV: mockKV,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Delete session from KV and invalidate Cookie', () => {
    it('should delete session from KV and return cookie deletion header', async () => {
      // Arrange
      const sessionId = 'test-session-id-123';

      // Act
      const setCookieHeader = await destroySession(sessionId, mockContext as any);

      // Assert
      // Verify KV.delete was called with correct key
      expect(mockKV.delete).toHaveBeenCalledWith(`session:${sessionId}`);

      // Verify Set-Cookie header invalidates the cookie
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('session_id=');
      expect(setCookieHeader).toContain('Max-Age=0'); // Immediate expiration
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });

    it('should handle multiple session deletions independently', async () => {
      // Arrange
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';

      // Act
      await destroySession(sessionId1, mockContext as any);
      await destroySession(sessionId2, mockContext as any);

      // Assert
      expect(mockKV.delete).toHaveBeenCalledTimes(2);
      expect(mockKV.delete).toHaveBeenNthCalledWith(1, 'session:session-1');
      expect(mockKV.delete).toHaveBeenNthCalledWith(2, 'session:session-2');
    });
  });

  describe('Error Case: KV deletion fails', () => {
    it('should throw error when KV.delete fails', async () => {
      // Arrange
      const sessionId = 'test-session-id-789';
      mockKV.delete.mockRejectedValueOnce(new Error('KV delete error'));

      // Act & Assert
      await expect(destroySession(sessionId, mockContext as any)).rejects.toThrow(
        'Failed to destroy session'
      );
    });
  });

  describe('Cookie invalidation', () => {
    it('should generate cookie deletion header with Max-Age=0', async () => {
      // Arrange
      const sessionId = 'session-to-delete';

      // Act
      const setCookieHeader = await destroySession(sessionId, mockContext as any);

      // Assert - Verify cookie is set to expire immediately
      const cookieParts = setCookieHeader.split('; ');
      expect(cookieParts).toContain('Max-Age=0');

      // Verify all security attributes are still present
      expect(cookieParts).toContain('HttpOnly');
      expect(cookieParts).toContain('Secure');
      expect(cookieParts).toContain('SameSite=Lax');
      expect(cookieParts).toContain('Path=/');

      // Verify cookie name is correct (value can be empty for deletion)
      expect(cookieParts[0]).toMatch(/^session_id=/);
    });
  });

  describe('Edge Case: Empty or invalid session ID', () => {
    it('should still attempt to delete even with empty session ID', async () => {
      // Arrange
      const sessionId = '';

      // Act
      await destroySession(sessionId, mockContext as any);

      // Assert
      expect(mockKV.delete).toHaveBeenCalledWith('session:');
    });
  });
});
