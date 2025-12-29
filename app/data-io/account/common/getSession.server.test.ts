/**
 * Unit tests for getSession.server.ts
 * Purpose: Verify session retrieval from Cloudflare Workers KV using Cookie
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession } from './getSession.server';
import type { SessionData } from '~/specs/account/types';

describe('getSession.server', () => {
  // Mock Cloudflare Workers KV
  const mockKV = {
    get: vi.fn(),
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

  describe('Happy Path: Session exists in Cookie and KV', () => {
    it('should retrieve SessionData from KV when valid session cookie exists', async () => {
      // Arrange
      const sessionId = 'test-session-id-123';
      const sessionData: SessionData = {
        sessionId,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        createdAt: new Date().toISOString(),
      };

      const request = new Request('https://example.com/account', {
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      });

      mockKV.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(result).toEqual(sessionData);
    });
  });

  describe('Error Case: No session cookie', () => {
    it('should return null when Cookie header is missing', async () => {
      // Arrange
      const request = new Request('https://example.com/account');

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when session_id cookie is not present', async () => {
      // Arrange
      const request = new Request('https://example.com/account', {
        headers: {
          Cookie: 'other_cookie=value',
        },
      });

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('Error Case: Session not found in KV', () => {
    it('should return null when KV returns null', async () => {
      // Arrange
      const sessionId = 'non-existent-session-id';
      const request = new Request('https://example.com/account', {
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      });

      mockKV.get.mockResolvedValueOnce(null);

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(result).toBeNull();
    });
  });

  describe('Error Case: Invalid JSON in KV', () => {
    it('should return null when KV contains invalid JSON', async () => {
      // Arrange
      const sessionId = 'test-session-id-456';
      const request = new Request('https://example.com/account', {
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      });

      mockKV.get.mockResolvedValueOnce('invalid json data');

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(result).toBeNull();
    });
  });

  describe('Error Case: KV throws error', () => {
    it('should return null when KV.get throws an error', async () => {
      // Arrange
      const sessionId = 'test-session-id-789';
      const request = new Request('https://example.com/account', {
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      });

      mockKV.get.mockRejectedValueOnce(new Error('KV read error'));

      // Act
      const result = await getSession(request, mockContext as any);

      // Assert
      expect(mockKV.get).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(result).toBeNull();
    });
  });
});
