/**
 * Unit tests for verifyOtpToken.server.ts
 * Purpose: Verify OTP code verification against KV-stored token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSpec } from 'tests/utils/loadSpec';
import type { AccountAuthenticationSpec } from '~/specs/account/types';
import { verifyOtpToken } from './verifyOtpToken.server';

describe('verifyOtpToken.server', () => {
  let mockContext: any;
  let mockKV: any;
  let spec: AccountAuthenticationSpec;

  beforeEach(async () => {
    spec = await loadSpec<AccountAuthenticationSpec>('account', 'authentication');

    mockKV = {
      get: vi.fn(),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      env: {
        KV: mockKV,
      },
    };
  });

  describe('Happy Path: Valid OTP', () => {
    it('should return valid when OTP code matches', async () => {
      // Arrange
      const email = 'user@example.com';
      const otpCode = '123456';
      mockKV.get.mockResolvedValue(JSON.stringify({ code: otpCode, attempts: 0 }));

      // Act
      const result = await verifyOtpToken(email, otpCode, mockContext);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should delete KV entry on successful verification', async () => {
      // Arrange
      const email = 'user@example.com';
      const otpCode = '123456';
      mockKV.get.mockResolvedValue(JSON.stringify({ code: otpCode, attempts: 0 }));

      // Act
      await verifyOtpToken(email, otpCode, mockContext);

      // Assert
      const expectedKey = `${spec.otp_config.kv_key_prefix}:${email}`;
      expect(mockKV.delete).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('Error Case: Invalid OTP', () => {
    it('should return invalid when OTP code does not match', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(JSON.stringify({ code: '123456', attempts: 0 }));

      // Act
      const result = await verifyOtpToken(email, '999999', mockContext);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should increment attempts on wrong code', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(JSON.stringify({ code: '123456', attempts: 0 }));

      // Act
      await verifyOtpToken(email, '999999', mockContext);

      // Assert
      const updatedValue = JSON.parse(mockKV.put.mock.calls[0][1]);
      expect(updatedValue.attempts).toBe(1);
    });
  });

  describe('Error Case: Expired OTP', () => {
    it('should return expired when no KV entry exists', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockResolvedValue(null);

      // Act
      const result = await verifyOtpToken(email, '123456', mockContext);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('expired');
    });
  });

  describe('Error Case: Max attempts exceeded', () => {
    it('should return max_attempts when attempts reach limit', async () => {
      // Arrange
      const email = 'user@example.com';
      const maxAttempts = spec.otp_config.max_attempts;
      mockKV.get.mockResolvedValue(JSON.stringify({ code: '123456', attempts: maxAttempts - 1 }));

      // Act
      const result = await verifyOtpToken(email, '999999', mockContext);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('max_attempts');
      // Should delete the entry when max attempts reached
      expect(mockKV.delete).toHaveBeenCalled();
    });
  });

  describe('Error Case: KV failure', () => {
    it('should return expired when KV get fails (fail-safe)', async () => {
      // Arrange
      const email = 'user@example.com';
      mockKV.get.mockRejectedValue(new Error('KV error'));

      // Act
      const result = await verifyOtpToken(email, '123456', mockContext);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('expired');
    });
  });

  describe('KV key format', () => {
    it('should use correct KV key prefix from spec', async () => {
      // Arrange
      const email = 'test@example.com';
      mockKV.get.mockResolvedValue(JSON.stringify({ code: '123456', attempts: 0 }));

      // Act
      await verifyOtpToken(email, '123456', mockContext);

      // Assert
      const expectedKey = `${spec.otp_config.kv_key_prefix}:${email}`;
      expect(mockKV.get).toHaveBeenCalledWith(expectedKey);
    });
  });
});
