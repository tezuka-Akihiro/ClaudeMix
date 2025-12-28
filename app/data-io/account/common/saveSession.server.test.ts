/**
 * Unit tests for saveSession.server.ts
 * Purpose: Verify session saving to Cloudflare Workers KV and Cookie generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSession } from './saveSession.server';
import type { SessionData } from '~/specs/account/types';

describe('saveSession.server', () => {
  // Mock Cloudflare Workers KV
  const mockKV = {
    put: vi.fn(),
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

  describe('Happy Path: Save session to KV and generate Cookie', () => {
    it('should save session to KV with correct TTL and return Set-Cookie header', async () => {
      // Arrange
      const sessionData: SessionData = {
        sessionId: 'test-session-id-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        createdAt: new Date().toISOString(),
      };
      const ttlSeconds = 604800; // 7 days

      // Act
      const setCookieHeader = await saveSession(sessionData, mockContext as any);

      // Assert
      // Verify KV.put was called with correct key, value, and TTL
      expect(mockKV.put).toHaveBeenCalledWith(
        `session:${sessionData.sessionId}`,
        JSON.stringify(sessionData),
        { expirationTtl: ttlSeconds }
      );

      // Verify Set-Cookie header is returned
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('session_id=test-session-id-123');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('Max-Age=604800');
    });

    it('should handle session with custom expiration', async () => {
      // Arrange
      const customExpiryDate = new Date(Date.now() + 86400000); // 1 day from now
      const sessionData: SessionData = {
        sessionId: 'short-lived-session',
        userId: 'user-456',
        expiresAt: customExpiryDate.toISOString(),
        createdAt: new Date().toISOString(),
      };
      const expectedTtl = 86400; // 1 day in seconds

      // Act
      const setCookieHeader = await saveSession(sessionData, mockContext as any);

      // Assert
      expect(mockKV.put).toHaveBeenCalledWith(
        `session:${sessionData.sessionId}`,
        JSON.stringify(sessionData),
        { expirationTtl: expectedTtl }
      );
      expect(setCookieHeader).toContain('session_id=short-lived-session');
      expect(setCookieHeader).toContain('Max-Age=86400');
    });
  });

  describe('Error Case: KV save fails', () => {
    it('should throw error when KV.put fails', async () => {
      // Arrange
      const sessionData: SessionData = {
        sessionId: 'test-session-id-789',
        userId: 'user-789',
        expiresAt: new Date(Date.now() + 604800000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      mockKV.put.mockRejectedValueOnce(new Error('KV write error'));

      // Act & Assert
      await expect(saveSession(sessionData, mockContext as any)).rejects.toThrow(
        'Failed to save session'
      );
    });
  });

  describe('Cookie generation', () => {
    it('should generate Cookie with all security attributes', async () => {
      // Arrange
      const sessionData: SessionData = {
        sessionId: 'secure-session-123',
        userId: 'user-secure',
        expiresAt: new Date(Date.now() + 604800000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Act
      const setCookieHeader = await saveSession(sessionData, mockContext as any);

      // Assert - Verify all security attributes are present
      const cookieParts = setCookieHeader.split('; ');
      expect(cookieParts).toContain('HttpOnly');
      expect(cookieParts).toContain('Secure');
      expect(cookieParts).toContain('SameSite=Lax');
      expect(cookieParts).toContain('Path=/');

      // Verify cookie name and value
      expect(cookieParts[0]).toMatch(/^session_id=secure-session-123/);
    });
  });
});
