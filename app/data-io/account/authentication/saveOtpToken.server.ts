/**
 * saveOtpToken.server.ts
 * Purpose: Store OTP token in Cloudflare KV with TTL
 *
 * @layer 副作用層 (data-io)
 * @responsibility KVへのOTPトークン保存（TTL付き）
 */

import { loadSpec } from '~/spec-utils/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

interface CloudflareEnv {
  KV: KVNamespace;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Save OTP token to KV store
 *
 * @param email - Email address the OTP belongs to
 * @param otpCode - The generated OTP code
 * @param context - Cloudflare context with KV namespace
 * @returns true if saved successfully, false otherwise
 */
export async function saveOtpToken(
  email: string,
  otpCode: string,
  context: CloudflareLoadContext
): Promise<boolean> {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { kv_key_prefix, ttl_seconds } = spec.otp_config;
  const key = `${kv_key_prefix}:${email}`;

  try {
    const value = JSON.stringify({
      code: otpCode,
      attempts: 0,
    });

    await context.env.KV.put(key, value, { expirationTtl: ttl_seconds });

    return true;
  } catch (error) {
    console.error('Failed to save OTP token:', error);
    return false;
  }
}
