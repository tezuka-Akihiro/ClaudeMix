/**
 * checkOtpRateLimit.server.ts
 * Purpose: Check and enforce OTP send rate limiting via Cloudflare KV
 *
 * @layer 副作用層 (data-io)
 * @responsibility KVでメールアドレス単位のレート制限チェック
 */

import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountAuthenticationSpec } from '~/specs/account/types';

interface CloudflareEnv {
  KV: KVNamespace;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

export interface RateLimitResult {
  allowed: boolean;
}

/**
 * Check OTP send rate limit for a given email address
 *
 * @param email - Email address to check rate limit for
 * @param context - Cloudflare context with KV namespace
 * @returns RateLimitResult indicating whether the request is allowed
 *
 * Security:
 * - Fail-safe: denies on KV error
 * - Uses spec-defined window and max requests
 */
export async function checkOtpRateLimit(
  email: string,
  context: CloudflareLoadContext
): Promise<RateLimitResult> {
  const spec = loadSpec<AccountAuthenticationSpec>('account/authentication');
  const { kv_key_prefix, max_requests, window_seconds } = spec.rate_limit.otp_send;
  const key = `${kv_key_prefix}:${email}`;

  try {
    const kv = context.env.KV;
    const currentCount = await kv.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= max_requests) {
      return { allowed: false };
    }

    await kv.put(key, String(count + 1), { expirationTtl: window_seconds });

    return { allowed: true };
  } catch (error) {
    console.error('OTP rate limit check failed:', error);
    return { allowed: false };
  }
}
