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
    env: {
      SESSION_KV: mockKV,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path: Save session to KV and generate Cookie', () => {
    it('should save session to KV with correct TTL and return Set-Cookie header', async () => {
      // Arrange
      const now = Date.now();
      const sessionData: SessionData = {
        sessionId: 'test-session-id-123',
        userId: 'user-123',
        expiresAt: new Date(now + 604800000).toISOString(), // 7 days from now
        createdAt: new Date(now).toISOString(),
      };

      // Act
      const setCookieHeader = await saveSession(sessionData, mockContext as any);

      // Assert
      // Verify KV.put was called with TTL (allow 1 second tolerance for timing)
      const kvPutCall = mockKV.put.mock.calls[0];
      expect(kvPutCall[0]).toBe(`session:${sessionData.sessionId}`);
      expect(kvPutCall[1]).toBe(JSON.stringify(sessionData));
      expect(kvPutCall[2].expirationTtl).toBeGreaterThanOrEqual(604799);
      expect(kvPutCall[2].expirationTtl).toBeLessThanOrEqual(604800);

      // Verify Set-Cookie header is returned
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('session_id=test-session-id-123');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toMatch(/Max-Age=(604799|604800)/);
    });

    it('should handle session with custom expiration', async () => {
      // Arrange
      const now = Date.now();
      const sessionData: SessionData = {
        sessionId: 'short-lived-session',
        userId: 'user-456',
        expiresAt: new Date(now + 86400000).toISOString(), // 1 day from now
        createdAt: new Date(now).toISOString(),
      };

      // Act
      const setCookieHeader = await saveSession(sessionData, mockContext as any);

      // Assert
      const kvPutCall = mockKV.put.mock.calls[0];
      expect(kvPutCall[0]).toBe(`session:${sessionData.sessionId}`);
      expect(kvPutCall[1]).toBe(JSON.stringify(sessionData));
      expect(kvPutCall[2].expirationTtl).toBeGreaterThanOrEqual(86399);
      expect(kvPutCall[2].expirationTtl).toBeLessThanOrEqual(86400);
      expect(setCookieHeader).toContain('session_id=short-lived-session');
      expect(setCookieHeader).toMatch(/Max-Age=(86399|86400)/);
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
