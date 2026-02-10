import { describe, it, expect, vi } from 'vitest';
import { generateMagicToken, generateOtp } from './generateAuthToken';

describe('generateAuthToken', () => {
  describe('generateMagicToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateMagicToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateMagicToken();
      const token2 = generateMagicToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric string', () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should pad with zeros if necessary', () => {
      // Mock crypto.getRandomValues to return a small value
      const mockGetRandomValues = vi.fn().mockImplementation((arr: Uint32Array) => {
        arr[0] = 123; // Should become "000123"
        return arr;
      });
      vi.stubGlobal('crypto', { getRandomValues: mockGetRandomValues });

      const otp = generateOtp();
      expect(otp).toBe('000123');

      vi.unstubAllGlobals();
    });
  });
});
