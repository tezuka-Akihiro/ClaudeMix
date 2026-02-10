/**
 * Unit tests for saveOtpToken.server.ts
 * Purpose: Verify OTP token storage in KV with TTL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import { saveOtpToken } from './saveOtpToken.server';

describe('saveOtpToken.server', () => {
  let mockContext: any;
  let mockKV: any;
  let spec: AccountAuthenticationSpec;

  beforeEach(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');

    mockKV = {
      put: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      env: {
        KV: mockKV,
      },
    };
  });

  describe('Happy Path: Token storage', () => {
    it('should store OTP token in KV with spec-defined TTL', async () => {
      // Arrange
      const email = 'user@example.com';
      const otpCode = '123456';

      // Act
      const result = await saveOtpToken(email, otpCode, mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringContaining(spec.otp_config.kv_key_prefix),
        expect.any(String),
        { expirationTtl: spec.otp_config.ttl_seconds }
      );
    });

    it('should use correct KV key format with prefix and email', async () => {
      // Arrange
      const email = 'test@example.com';
      const otpCode = '654321';

      // Act
      await saveOtpToken(email, otpCode, mockContext);

      // Assert
      const expectedKey = `${spec.otp_config.kv_key_prefix}:${email}`;
      expect(mockKV.put).toHaveBeenCalledWith(
        expectedKey,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should store OTP code and attempts count in value', async () => {
      // Arrange
      const email = 'user@example.com';
      const otpCode = '123456';

      // Act
      await saveOtpToken(email, otpCode, mockContext);

      // Assert
      const storedValue = JSON.parse(mockKV.put.mock.calls[0][1]);
      expect(storedValue.code).toBe(otpCode);
      expect(storedValue.attempts).toBe(0);
    });
  });

  describe('Error Case: KV failure', () => {
    it('should return false when KV put fails', async () => {
      // Arrange
      const email = 'user@example.com';
      const otpCode = '123456';
      mockKV.put.mockRejectedValue(new Error('KV error'));

      // Act
      const result = await saveOtpToken(email, otpCode, mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});
