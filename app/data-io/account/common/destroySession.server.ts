/**
 * destroySession.server.ts
 * Purpose: Delete session from Cloudflare Workers KV and invalidate Cookie
 *
 * @layer 副作用層 (Data-IO)
 * @responsibility Cloudflare Workers KV削除、Cookie無効化
 */

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
 * Delete session from Cloudflare Workers KV and generate Cookie deletion header
 *
 * @param sessionId - Session ID to delete
 * @param context - Cloudflare Workers load context with KV binding
 * @returns Set-Cookie header string for cookie deletion (Max-Age=0)
 * @throws Error if KV deletion fails
 */
export async function destroySession(
  sessionId: string,
  context: CloudflareLoadContext
): Promise<string> {
  const commonSpec = loadSpec<AccountCommonSpec>('account/common');

  try {
    // Delete session from KV
    const kv = context.env.SESSION_KV;
    const kvKey = `${commonSpec.session.kv.key_prefix}${sessionId}`;
    await kv.delete(kvKey);

    // Generate cookie deletion header
    const setCookieHeader = generateCookieDeletionHeader(commonSpec);

    return setCookieHeader;
  } catch (error) {
    console.error('Error destroying session:', error);
    throw new Error('Failed to destroy session');
  }
}

/**
 * Generate Set-Cookie header to invalidate the session cookie
 * Sets Max-Age=0 to expire the cookie immediately
 *
 * @param commonSpec - Account common specification
 * @returns Set-Cookie header string for cookie deletion
 */
function generateCookieDeletionHeader(commonSpec: AccountCommonSpec): string {
  const { cookie } = commonSpec.session;

  const cookieParts = [
    `${cookie.name}=`, // Empty value
    'Max-Age=0', // Expire immediately
    `Path=${cookie.path}`,
    cookie.http_only ? 'HttpOnly' : '',
    cookie.secure ? 'Secure' : '',
    `SameSite=${cookie.same_site}`,
  ].filter(Boolean);

  return cookieParts.join('; ');
}
