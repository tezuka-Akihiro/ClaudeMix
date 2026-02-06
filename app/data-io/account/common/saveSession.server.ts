/**
 * saveSession.server.ts
 * Purpose: Save session data to Cloudflare Workers KV and generate Set-Cookie header
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare Workers KV書き込み、Cookie生成
 */

import type { SessionData } from '~/specs/account/types';
import { loadSpec } from '~/spec-loader/specLoader.server';
import type { AccountCommonSpec } from '~/specs/account/types';

/**
 * AppLoadContext type for Cloudflare Workers environment
 */
interface CloudflareEnv {
  SESSION_KV: KVNamespace;
}

interface CloudflareLoadContext {
  env: CloudflareEnv;
}

/**
 * Save session data to Cloudflare Workers KV and generate Set-Cookie header
 *
 * @param sessionData - Session data to save
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Set-Cookie header string
 * @throws Error if KV save fails
 */
export async function saveSession(
  sessionData: SessionData,
  context: CloudflareLoadContext
): Promise<string> {
  const commonSpec = loadSpec<AccountCommonSpec>('account/common');

  try {
    // Calculate TTL from expiresAt
    const expiresAt = new Date(sessionData.expiresAt);
    const now = new Date();
    const ttlSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Save session to KV with TTL
    const kv = context.env.SESSION_KV;
    const kvKey = `${commonSpec.session.kv.key_prefix}${sessionData.sessionId}`;
    await kv.put(kvKey, JSON.stringify(sessionData), {
      expirationTtl: ttlSeconds,
    });

    // Generate Set-Cookie header
    const setCookieHeader = generateSetCookieHeader(
      sessionData.sessionId,
      ttlSeconds,
      commonSpec
    );

    return setCookieHeader;
  } catch (error) {
    console.error('Error saving session:', error);
    throw new Error('Failed to save session');
  }
}

/**
 * Generate Set-Cookie header string with security attributes
 *
 * @param sessionId - Session ID to set in cookie
 * @param maxAge - Cookie max age in seconds
 * @param commonSpec - Account common specification
 * @returns Set-Cookie header string
 */
function generateSetCookieHeader(
  sessionId: string,
  maxAge: number,
  commonSpec: AccountCommonSpec
): string {
  const { cookie } = commonSpec.session;

  const cookieParts = [
    `${cookie.name}=${sessionId}`,
    `Max-Age=${maxAge}`,
    `Path=${cookie.path}`,
    cookie.http_only ? 'HttpOnly' : '',
    cookie.secure ? 'Secure' : '',
    `SameSite=${cookie.same_site}`,
  ].filter(Boolean);

  return cookieParts.join('; ');
}
