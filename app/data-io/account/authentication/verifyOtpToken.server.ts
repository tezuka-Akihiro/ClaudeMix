/**
 * verifyOtpToken.server.ts
 * Purpose: Verify OTP code against KV-stored token with attempt tracking
 *
 * @layer 副作用層 (data-io)
 * @responsibility KVからのOTPトークン検証、試行回数管理
 */

import { loadSpec } from '~/spec-utils/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

interface CloudflareEnv {
  KV: KVNamespace;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

export interface OtpVerifyResult {
  valid: boolean;
  error?: 'invalid_code' | 'expired' | 'max_attempts';
}

interface OtpStoredData {
  code: string;
  attempts: number;
}

/**
 * Verify OTP code against stored token
 *
 * @param email - Email address the OTP belongs to
 * @param otpCode - The OTP code to verify
 * @param context - Cloudflare context with KV namespace
 * @returns OtpVerifyResult indicating success or failure reason
 *
 * Security:
 * - Fail-safe: returns expired on KV error
 * - Tracks and limits verification attempts
 * - Deletes token on success or max attempts exceeded
 */
export async function verifyOtpToken(
  email: string,
  otpCode: string,
  context: CloudflareLoadContext
): Promise<OtpVerifyResult> {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { kv_key_prefix, max_attempts, ttl_seconds } = spec.otp_config;
  const key = `${kv_key_prefix}:${email}`;

  try {
    const kv = context.env.KV;
    const stored = await kv.get(key);

    if (!stored) {
      return { valid: false, error: 'expired' };
    }

    const data: OtpStoredData = JSON.parse(stored);

    // Check if OTP code matches
    if (data.code === otpCode) {
      // Success: delete the token
      await kv.delete(key);
      return { valid: true };
    }

    // Wrong code: increment attempts
    const newAttempts = data.attempts + 1;

    if (newAttempts >= max_attempts) {
      // Max attempts reached: delete the token
      await kv.delete(key);
      return { valid: false, error: 'max_attempts' };
    }

    // Update attempts count
    await kv.put(
      key,
      JSON.stringify({ code: data.code, attempts: newAttempts }),
      { expirationTtl: ttl_seconds }
    );

    return { valid: false, error: 'invalid_code' };
  } catch (error) {
    console.error('OTP verification failed:', error);
    return { valid: false, error: 'expired' };
  }
}
