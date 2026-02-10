/**
 * Unit tests for checkOtpRateLimit.server.ts
 * Purpose: Verify OTP send rate limiting via KV
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import { checkOtpRateLimit } from './checkOtpRateLimit.server';

describe('checkOtpRateLimit.server', () => {
  let mockContext: any;
  let mockKV: any;
  let spec: AccountAuthenticationSpec;

  beforeEach(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');

    mockKV = {
      get: vi.fn(),
      put: vi.fn(),
    };

    mockContext = {
      env: {
        KV: mockKV,
      },
    };
  });

  describe('Happy Path: Within rate limit', () => {
    it('should allow when no previous requests exist', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(null);

      // Act
      const result = await checkOtpRateLimit(email, mockContext);

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringContaining(spec.rate_limit.otp_send.kv_key_prefix),
        '1',
        { expirationTtl: spec.rate_limit.otp_send.window_seconds }
      );
    });

    it('should allow when request count is below max', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue('1');

      // Act
      const result = await checkOtpRateLimit(email, mockContext);

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringContaining(spec.rate_limit.otp_send.kv_key_prefix),
        '2',
        { expirationTtl: spec.rate_limit.otp_send.window_seconds }
      );
    });
  });

  describe('Error Case: Rate limit exceeded', () => {
    it('should deny when request count reaches max', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(String(spec.rate_limit.otp_send.max_requests));

      // Act
      const result = await checkOtpRateLimit(email, mockContext);

      // Assert
      expect(result.allowed).toBe(false);
      expect(mockKV.put).not.toHaveBeenCalled();
    });

    it('should deny when request count exceeds max', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(String(spec.rate_limit.otp_send.max_requests + 1));

      // Act
      const result = await checkOtpRateLimit(email, mockContext);

      // Assert
      expect(result.allowed).toBe(false);
    });
  });

  describe('KV key format', () => {
    it('should use correct KV key prefix from spec', async () => {
      // Arrange
      const email = 'test@example.com';
      mockKV.get.mockResolvedValue(null);

      // Act
      await checkOtpRateLimit(email, mockContext);

      // Assert
      const expectedKey = `${spec.rate_limit.otp_send.kv_key_prefix}:${email}`;
      expect(mockKV.get).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('Error Case: KV failure', () => {
    it('should deny when KV get fails (fail-safe)', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockRejectedValue(new Error('KV error'));

      // Act
      const result = await checkOtpRateLimit(email, mockContext);

      // Assert
      expect(result.allowed).toBe(false);
    });
  });
});
